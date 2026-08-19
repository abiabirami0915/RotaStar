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
  CheckCircle
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

        memberEmail:
          currentUser.email || "",

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

      setError(
        "Unable to submit request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="font-black text-xl">
            <span className="text-rose-500">Rota</span>
            <span className="text-white">Star</span>
          </div>

        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Request Points
          </h1>

          <p className="text-slate-400 mt-2">
            Submit your activity for admin approval.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Activity */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Activity Name *
              </label>

              <input
                type="text"
                value={activityName}
                onChange={(e) =>
                  setActivityName(e.target.value)
                }
                placeholder="Example: Mega Health Camp"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-rose-500"
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Reason
                <span className="text-slate-500 font-normal">
                  {" "} (Optional)
                </span>
              </label>

              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                placeholder="Explain what you contributed..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Important note */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
              <strong>Note:</strong> You cannot assign points
              yourself. An Admin or Super Admin will review
              your request and decide the points.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
            >
              <Send size={18} />

              {loading
                ? "Submitting..."
                : "Submit Point Request"}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}