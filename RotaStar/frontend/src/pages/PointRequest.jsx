import React, { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

import {
  Send,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Crown
} from "lucide-react";

export default function PointRequest() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [activityName, setActivityName] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!activityName.trim()) {
      setError("Please enter the activity name.");
      return;
    }

    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "pointRequests"), {
        userId: currentUser.uid,
        memberName:
          userData?.name ||
          currentUser.displayName ||
          "Member",
        memberEmail: currentUser.email || "",
        activityName: activityName.trim(),
        reason: reason.trim() || "",
        status: "pending",
        requestedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        pointsAwarded: 0
      });

      setActivityName("");
      setReason("");

      setSuccess(
        "Point request submitted successfully! An admin will review it."
      );
    } catch (error) {
      console.error("Point request error:", error);
      setError("Unable to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* Navbar */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-violet-300 hover:text-amber-300 transition-colors text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>

          <div className="font-black text-xl">
            <span className="text-violet-400">Rota</span>
            <span className="text-amber-400">Star</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Crown size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              Request Points
              <Sparkles size={18} className="text-amber-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Submit your community contribution for imperial admin approval.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-violet-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/50">
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex gap-3 items-center text-sm">
              <CheckCircle size={20} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Activity */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                Activity Name *
              </label>

              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="Example: Mega Health Camp"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-violet-900/40 text-white outline-none focus:border-amber-400 transition text-sm"
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                Reason{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain what you contributed..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-violet-900/40 text-white outline-none focus:border-amber-400 transition text-sm resize-none"
              />
            </div>

            {/* Important note */}
            <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 text-violet-200 text-xs leading-relaxed">
              <strong className="text-amber-400">Imperial Note:</strong> You cannot assign points yourself. An Admin or Super Admin will review your submission and grant the appropriate points.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 via-purple-600 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-violet-950 transition disabled:opacity-50 border border-amber-400/20"
            >
              <Send size={18} />
              {loading ? "Submitting Request..." : "Submit Point Request"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}