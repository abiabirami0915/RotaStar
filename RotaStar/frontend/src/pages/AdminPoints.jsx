import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { useAuth } from "../AuthContext";
import {
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  History,
  ArrowLeft,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPoints() {
  const { userData, currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [actionType, setActionType] = useState("award");
  const [category, setCategory] = useState("Club Meeting");
  const [pointsAmount, setPointsAmount] = useState(25);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Super Admin Delete Member State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState({
    type: "",
    text: "",
  });

  const defaultCategories = [
    { name: "Club Meeting", points: 25 },
    { name: "Club Service Offline", points: 25 },
    { name: "Community Service", points: 25 },
    { name: "Professional Development", points: 25 },
    { name: "International Service", points: 25 },
    { name: "Rotary Event", points: 50 },
    { name: "DRC", points: 75 },
    { name: "Assembly", points: 100 },
    { name: "Event Chair / Secretary", points: 50 },
    { name: "Active Bonus", points: 10 },
    { name: "Other Activity", points: 50 },
    { name: "Custom / Penalty", points: 0 },
  ];

  // Live real-time members listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const memberList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        memberList.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

        setMembers(memberList);

        if (memberList.length > 0 && !selectedMemberId) {
          setSelectedMemberId(memberList[0].id);
        }
      },
      (error) => {
        console.error("Error fetching members:", error);
        setStatusMessage({
          type: "error",
          text: "Unable to load members from Firestore.",
        });
      }
    );

    return () => unsub();
  }, []);

  const handleCategoryChange = (categoryName) => {
    setCategory(categoryName);

    const selectedCategory = defaultCategories.find(
      (item) => item.name === categoryName
    );

    if (selectedCategory && selectedCategory.points > 0) {
      setPointsAmount(selectedCategory.points);
    } else {
      setPointsAmount("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (!selectedMemberId) {
      setStatusMessage({
        type: "error",
        text: "Please select a member.",
      });
      return;
    }

    const numericPoints = Number(pointsAmount);

    if (Number.isNaN(numericPoints) || numericPoints <= 0) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid point value greater than 0.",
      });
      return;
    }

    if (!reason.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please enter a reason for this point transaction.",
      });
      return;
    }

    const finalPoints =
      actionType === "award"
        ? Math.abs(numericPoints)
        : -Math.abs(numericPoints);

    setLoading(true);

    try {
      const selectedMember = members.find(
        (member) => member.id === selectedMemberId
      );

      if (!selectedMember) {
        throw new Error("Selected member not found.");
      }

      const batch = writeBatch(db);

      // 1. Update user total points in Firestore
      const userRef = doc(db, "users", selectedMemberId);
      batch.update(userRef, {
        totalPoints: increment(finalPoints),
        lastPointUpdateAt: serverTimestamp(),
      });

      // 2. Add activity log entry so member Dashboard reflects it live
      const activityRef = doc(collection(db, "activities"));
      batch.set(activityRef, {
        userId: selectedMemberId,
        userName: selectedMember.name || "Member",
        activityName: reason.trim(),
        category: category,
        points: finalPoints,
        adminName: userData?.name || currentUser?.displayName || "Executive Board",
        createdAt: serverTimestamp(),
      });

      // 3. Create point history ledger
      const pointHistoryRef = doc(collection(db, "points"));
      batch.set(pointHistoryRef, {
        userId: selectedMemberId,
        memberName: selectedMember.name || "Member",
        points: finalPoints,
        category: category,
        reason: reason.trim(),
        approvedBy:
          userData?.name || currentUser?.displayName || currentUser?.email || "Admin",
        adminUid: currentUser?.uid || "",
        timestamp: serverTimestamp(),
        status: "Approved",
      });

      await batch.commit();

      setStatusMessage({
        type: "success",
        text:
          actionType === "award"
            ? `Successfully awarded +${Math.abs(finalPoints)} points to ${selectedMember.name}.`
            : `Successfully deducted -${Math.abs(finalPoints)} points from ${selectedMember.name}.`,
      });

      setReason("");
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 3500);
    } catch (error) {
      console.error("Error executing point transaction:", error);
      setStatusMessage({
        type: "error",
        text: error.message || "Failed to process transaction.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!userToDelete || !isSuperAdmin) return;

    setDeleteLoading(true);
    try {
      const memberId = userToDelete.id;

      await deleteDoc(doc(db, "users", memberId));

      const actQuery = query(
        collection(db, "activities"),
        where("userId", "==", memberId)
      );
      const actSnapshot = await getDocs(actQuery);
      const actDeletes = actSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "activities", docSnap.id))
      );

      const reqQuery = query(
        collection(db, "pointRequests"),
        where("userId", "==", memberId)
      );
      const reqSnapshot = await getDocs(reqQuery);
      const reqDeletes = reqSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "pointRequests", docSnap.id))
      );

      await Promise.all([...actDeletes, ...reqDeletes]);

      setStatusMessage({
        type: "success",
        text: `Member ${userToDelete.name || userToDelete.email} was permanently deleted.`,
      });
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting member:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to delete member.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedMember = members.find(
    (member) => member.id === selectedMemberId
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Admin Points</h1>
              <p className="text-xs text-slate-400">RotaStar • Points Management</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
        </div>

        {/* STATUS MESSAGE */}
        {statusMessage.text && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SELECTED MEMBER PREVIEW */}
        {selectedMember && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Selected Member
              </p>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setUserToDelete(selectedMember)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition text-xs font-bold cursor-pointer"
                  title="Permanently remove member"
                >
                  <Trash2 size={13} />
                  Delete Member
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedMember.name || "Unknown Member"}
                </h2>
                <p className="text-sm text-slate-400">
                  {selectedMember.role || "Member"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Current Points</p>
                <p className="text-2xl font-extrabold text-amber-400">
                  {selectedMember.totalPoints || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >
          {/* ACTION TYPE */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Action Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType("award")}
                className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  actionType === "award"
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <PlusCircle size={18} />
                Award Points
              </button>

              <button
                type="button"
                onClick={() => setActionType("deduct")}
                className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  actionType === "deduct"
                    ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <MinusCircle size={18} />
                Deduct Points
              </button>
            </div>
          </div>

          {/* MEMBER SELECT */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Member
            </label>

            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm cursor-pointer"
            >
              {members.length === 0 && (
                <option value="">Loading members...</option>
              )}

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || "Unknown Member"} ({member.email || "No email"}) — Current: {member.totalPoints || 0} pts
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY & POINTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Activity
              </label>

              <select
                value={category}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm cursor-pointer"
              >
                {defaultCategories.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} {item.points > 0 ? ` (${item.points} pts)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Point Value
              </label>

              <input
                type="number"
                min="1"
                required
                value={pointsAmount}
                onChange={(event) => setPointsAmount(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm font-bold"
              />
            </div>
          </div>

          {/* REASON */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Reason / Remark <span className="text-rose-500">*</span>
            </label>

            <textarea
              rows="3"
              required
              placeholder="Example: Attended and participated in club meeting."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm resize-none"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || members.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === "award"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 text-white"
                : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white"
            }`}
          >
            <History size={18} />
            {loading
              ? "Recording Transaction..."
              : actionType === "award"
              ? `Confirm & Award +${pointsAmount || 0} Points`
              : `Confirm & Deduct -${pointsAmount || 0} Points`}
          </button>
        </form>
      </div>

      {/* SUPER ADMIN CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <Trash2 size={24} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Delete Member?</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">{userToDelete.name || userToDelete.email}</strong>?
              This will erase their profile, points balance, and all associated requests.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-2 text-sm cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Member</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}