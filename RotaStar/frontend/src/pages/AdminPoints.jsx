import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
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
  Loader2,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPoints() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("award"); // "award" | "deduct"
  const [eventName, setEventName] = useState("");
  const [category, setCategory] = useState("Club Meeting");
  const [pointsAmount, setPointsAmount] = useState(25);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

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
    { name: "Special Recognition", points: 20 },
    { name: "Custom / Penalty", points: 0 },
  ];

  // Sync members in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const memberList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        memberList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setMembers(memberList);

        if (memberList.length > 0 && !selectedMemberId) {
          setSelectedMemberId(memberList[0].id);
        }
      },
      (error) => {
        console.error("Error fetching members:", error);
        setStatusMessage({
          type: "error",
          text: "Unable to load members list.",
        });
      }
    );

    return () => unsubscribe();
  }, [selectedMemberId]);

  const handleCategoryChange = (categoryName) => {
    setCategory(categoryName);
    const selected = defaultCategories.find((item) => item.name === categoryName);
    if (selected && selected.points > 0) {
      setPointsAmount(selected.points);
    } else {
      setPointsAmount("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (!selectedMemberId) {
      setStatusMessage({ type: "error", text: "Please select a member." });
      return;
    }

    if (!eventName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the Event/Activity Name." });
      return;
    }

    const numericPoints = Number(pointsAmount);
    if (Number.isNaN(numericPoints) || numericPoints <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid point value greater than 0." });
      return;
    }

    if (!reason.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a reason or remarks." });
      return;
    }

    const finalPoints = actionType === "award" ? Math.abs(numericPoints) : -Math.abs(numericPoints);
    setLoading(true);

    try {
      const selectedMember = members.find((m) => m.id === selectedMemberId);
      if (!selectedMember) throw new Error("Selected member not found.");

      const batch = writeBatch(db);

      // 1. Update user totalPoints
      const userRef = doc(db, "users", selectedMemberId);
      batch.update(userRef, {
        totalPoints: increment(finalPoints),
        lastPointUpdateAt: serverTimestamp(),
      });

      // 2. Add to activities collection for live updates to dashboard streaks and logs
      const activityRef = doc(collection(db, "activities"));
      batch.set(activityRef, {
        userId: selectedMemberId,
        userName: selectedMember.name || "Member",
        activityName: eventName.trim(),
        category: category,
        points: finalPoints,
        reason: reason.trim(),
        adminName: userData?.name || currentUser?.displayName || "Executive Board",
        createdAt: serverTimestamp(),
      });

      // 3. Log into points ledger
      const pointHistoryRef = doc(collection(db, "points"));
      batch.set(pointHistoryRef, {
        userId: selectedMemberId,
        memberName: selectedMember.name || "Member",
        eventName: eventName.trim(),
        points: finalPoints,
        category: category,
        reason: reason.trim(),
        actionType: actionType,
        approvedBy: userData?.name || currentUser?.displayName || "Admin",
        adminUid: currentUser?.uid || "",
        timestamp: serverTimestamp(),
        status: "Approved",
      });

      await batch.commit();

      setStatusMessage({
        type: "success",
        text: `Successfully ${actionType === "award" ? "awarded +" : "deducted -"}${Math.abs(finalPoints)} points for ${selectedMember.name}!`,
      });

      setEventName("");
      setReason("");
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 4000);
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

  const filteredMembers = members.filter(
    (m) =>
      (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 font-black text-lg">
            <span className="text-violet-400">Point</span>
            <span className="text-amber-400">Management</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {statusMessage.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-rose-950/80 border-rose-500 text-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SELECTED MEMBER SUMMARY */}
        {selectedMember && (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 mb-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Target Member</span>
              <h2 className="text-lg font-black text-white">{selectedMember.name || "Member"}</h2>
              <p className="text-xs text-slate-400">{selectedMember.role || "Member"} • {selectedMember.email}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Balance</span>
              <span className="text-2xl font-black text-amber-400">{selectedMember.totalPoints || 0} pts</span>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* AWARD VS DEDUCT TOGGLE */}
          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
              Action Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType("award")}
                className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition cursor-pointer ${
                  actionType === "award"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400 text-slate-950 shadow-lg"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <PlusCircle size={16} />
                <span>Award Points (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType("deduct")}
                className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition cursor-pointer ${
                  actionType === "deduct"
                    ? "bg-gradient-to-r from-rose-600 to-rose-500 border-rose-400 text-white shadow-lg"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <MinusCircle size={16} />
                <span>Deduct Points (-)</span>
              </button>
            </div>
          </div>

          {/* MEMBER SELECTION */}
          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
              Select Member *
            </label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search member name or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
              />
            </div>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-violet-900/50 text-white text-xs outline-none focus:border-amber-400 cursor-pointer"
            >
              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || "Member"} ({member.role || "Member"}) — Current: {member.totalPoints || 0} pts
                </option>
              ))}
            </select>
          </div>

          {/* EVENT / ACTIVITY NAME */}
          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
              Event / Activity Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mega Tree Plantation Drive / GBM Attendance"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-violet-900/50 text-white text-xs font-bold outline-none focus:border-amber-400"
            />
          </div>

          {/* CATEGORY & POINTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-violet-900/50 text-white text-xs outline-none focus:border-amber-400 cursor-pointer"
              >
                {defaultCategories.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} {item.points > 0 ? `(${item.points} pts)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                Points Value *
              </label>
              <input
                type="number"
                min="1"
                required
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-violet-900/50 text-white text-xs font-black outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* REASON / REMARKS */}
          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
              Reason / Remarks *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Coordinated logistics and led volunteer management during the session."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-violet-900/50 text-white text-xs outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || members.length === 0}
            className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              actionType === "award"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950"
                : "bg-gradient-to-r from-rose-600 to-rose-500 text-white"
            }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <History size={16} />
                <span>
                  {actionType === "award"
                    ? `Confirm & Award +${pointsAmount || 0} Points`
                    : `Confirm & Deduct -${pointsAmount || 0} Points`}
                </span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}