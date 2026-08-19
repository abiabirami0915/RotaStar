import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPoints() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [actionType, setActionType] = useState("award");

  const [category, setCategory] = useState("Club Meeting");

  const [pointsAmount, setPointsAmount] = useState(25);

  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // RotaStar Official Point System
  // =========================================================

  const defaultCategories = [
    {
      name: "Club Meeting",
      points: 25,
    },
    {
      name: "Club Service Offline",
      points: 25,
    },
    {
      name: "Rotary Event",
      points: 50,
    },
    {
      name: "DRC",
      points: 75,
    },
    {
      name: "Assembly",
      points: 100,
    },
    {
      name: "Event Secretary",
      points: 50,
    },
    {
      name: "Active Bonus",
      points: 10,
    },
    {
      name: "Other Activity",
      points: 50,
    },
    {
      name: "Custom / Penalty",
      points: 0,
    },
  ];

  // =========================================================
  // Load members from Firestore
  // =========================================================

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "users")
        );

        const memberList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Sort alphabetically
        memberList.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

        setMembers(memberList);

        if (memberList.length > 0) {
          setSelectedMemberId(memberList[0].id);
        }
      } catch (error) {
        console.error("Error fetching members:", error);

        setStatusMessage({
          type: "error",
          text: "Unable to load members from Firestore.",
        });
      }
    };

    fetchMembers();
  }, []);

  // =========================================================
  // Category Change
  // =========================================================

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

  // =========================================================
  // Award / Deduct Points
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatusMessage({
      type: "",
      text: "",
    });

    // Check member
    if (!selectedMemberId) {
      setStatusMessage({
        type: "error",
        text: "Please select a member.",
      });

      return;
    }

    // Check points
    const numericPoints = Number(pointsAmount);

    if (
      Number.isNaN(numericPoints) ||
      numericPoints <= 0
    ) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid point value greater than 0.",
      });

      return;
    }

    // Check reason
    if (!reason.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please enter a reason for this point transaction.",
      });

      return;
    }

    // Calculate final point change
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

      // =====================================================
      // Firestore Batch
      // =====================================================

      const batch = writeBatch(db);

      // -----------------------------------------------------
      // 1. Update user's total points
      // -----------------------------------------------------

      const userRef = doc(
        db,
        "users",
        selectedMemberId
      );

      batch.update(userRef, {
        totalPoints: increment(finalPoints),
        lastPointUpdateAt: serverTimestamp(),
      });

      // -----------------------------------------------------
      // 2. Create point history
      // -----------------------------------------------------

      const pointHistoryRef = doc(
        collection(db, "points")
      );

      batch.set(pointHistoryRef, {
        userId: selectedMemberId,

        memberName:
          selectedMember.name || "Unknown Member",

        points: finalPoints,

        category: category,

        reason: reason.trim(),

        approvedBy:
          userData?.name ||
          currentUser?.email ||
          "Admin",

        adminUid: currentUser?.uid || "",

        timestamp: serverTimestamp(),

        status: "Approved",
      });

      // -----------------------------------------------------
      // 3. Create audit log
      // -----------------------------------------------------

      const auditRef = doc(
        collection(db, "audit_logs")
      );

      batch.set(auditRef, {
        adminUid: currentUser?.uid || "",

        adminName:
          userData?.name ||
          currentUser?.email ||
          "Admin",

        action:
          actionType === "award"
            ? "POINT_AWARD"
            : "POINT_DEDUCTION",

        targetUserId: selectedMemberId,

        targetMemberName:
          selectedMember.name ||
          "Unknown Member",

        pointsChange: finalPoints,

        category: category,

        reason: reason.trim(),

        timestamp: serverTimestamp(),
      });

      // =====================================================
      // Commit all Firestore changes
      // =====================================================

      await batch.commit();

      // =====================================================
      // Update local member list
      // =====================================================

      setMembers((previousMembers) =>
        previousMembers.map((member) => {
          if (member.id !== selectedMemberId) {
            return member;
          }

          return {
            ...member,
            totalPoints:
              (member.totalPoints || 0) +
              finalPoints,
          };
        })
      );

      // =====================================================
      // Success message
      // =====================================================

      setStatusMessage({
        type: "success",
        text:
          actionType === "award"
            ? `Successfully awarded ${Math.abs(
                finalPoints
              )} points to ${selectedMember.name}.`
            : `Successfully deducted ${Math.abs(
                finalPoints
              )} points from ${selectedMember.name}.`,
      });

      // Clear reason
      setReason("");

    } catch (error) {
      console.error(
        "Error executing point transaction:",
        error
      );

      setStatusMessage({
        type: "error",
        text:
          "Failed to process transaction. Check Firestore permissions and console.",
      });

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Selected member
  // =========================================================

  const selectedMember = members.find(
    (member) => member.id === selectedMemberId
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">

      <div className="max-w-3xl mx-auto space-y-6">

        {/* ===================================================
            Header
        =================================================== */}

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">

          <div className="flex items-center gap-3">

            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
              <ShieldCheck size={28} />
            </div>

            <div>

              <h1 className="text-2xl font-extrabold text-white">
                Admin Points
              </h1>

              <p className="text-xs text-slate-400">
                RotaStar • Points Management
              </p>

            </div>

          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all text-sm"
          >
            <ArrowLeft size={16} />

            Dashboard
          </button>

        </div>

        {/* ===================================================
            Status Message
        =================================================== */}

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

            <span>
              {statusMessage.text}
            </span>

          </div>

        )}

        {/* ===================================================
            Current Member Preview
        =================================================== */}

        {selectedMember && (

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
              Selected Member
            </p>

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold text-white">
                  {selectedMember.name ||
                    "Unknown Member"}
                </h2>

                <p className="text-sm text-slate-400">
                  {selectedMember.role ||
                    "Member"}
                </p>

              </div>

              <div className="text-right">

                <p className="text-xs text-slate-500">
                  Current Points
                </p>

                <p className="text-2xl font-extrabold text-amber-400">
                  {selectedMember.totalPoints || 0}
                </p>

              </div>

            </div>

          </div>

        )}

        {/* ===================================================
            Main Form
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
        >

          {/* =================================================
              Action Type
          ================================================= */}

          <div>

            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Action Type
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* Award */}

              <button
                type="button"
                onClick={() => setActionType("award")}
                className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${
                  actionType === "award"
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >

                <PlusCircle size={18} />

                Award Points

              </button>

              {/* Deduct */}

              <button
                type="button"
                onClick={() => setActionType("deduct")}
                className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${
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

          {/* =================================================
              Member Selection
          ================================================= */}

          <div>

            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Member
            </label>

            <select
              value={selectedMemberId}
              onChange={(event) =>
                setSelectedMemberId(
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm"
            >

              {members.length === 0 && (
                <option value="">
                  Loading members...
                </option>
              )}

              {members.map((member) => (

                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.name ||
                    "Unknown Member"}{" "}
                  ({member.email || "No email"}) —
                  Current:{" "}
                  {member.totalPoints || 0} pts
                </option>

              ))}

            </select>

          </div>

          {/* =================================================
              Category + Points
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Category */}

            <div>

              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Activity
              </label>

              <select
                value={category}
                onChange={(event) =>
                  handleCategoryChange(
                    event.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm"
              >

                {defaultCategories.map(
                  (item) => (

                    <option
                      key={item.name}
                      value={item.name}
                    >

                      {item.name}

                      {item.points > 0
                        ? ` (${item.points} pts)`
                        : ""}

                    </option>

                  )
                )}

              </select>

            </div>

            {/* Points */}

            <div>

              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Point Value
              </label>

              <input
                type="number"
                min="1"
                required
                value={pointsAmount}
                onChange={(event) =>
                  setPointsAmount(
                    event.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm font-bold"
              />

            </div>

          </div>

          {/* =================================================
              Reason
          ================================================= */}

          <div>

            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">

              Reason / Remark

              <span className="text-rose-500">
                {" "}*
              </span>

            </label>

            <textarea
              rows="3"
              required
              placeholder="Example: Attended and participated in club meeting."
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-sm resize-none"
            />

          </div>

          {/* =================================================
              Transaction Preview
          ================================================= */}

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Transaction Preview
            </p>

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-300">
                {selectedMember?.name ||
                  "Member"}
              </span>

              <span
                className={`font-bold ${
                  actionType === "award"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >

                {actionType === "award"
                  ? "+"
                  : "-"}

                {Math.abs(
                  Number(pointsAmount) || 0
                )}{" "}
                points

              </span>

            </div>

          </div>

          {/* =================================================
              Submit
          ================================================= */}

          <button
            type="submit"
            disabled={loading || members.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === "award"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 text-white"
                : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white"
            }`}
          >

            <History size={18} />

            {loading
              ? "Recording Transaction..."
              : actionType === "award"
              ? `Confirm & Award +${
                  pointsAmount || 0
                } Points`
              : `Confirm & Deduct -${
                  pointsAmount || 0
                } Points`}

          </button>

        </form>

      </div>

    </div>
  );
}