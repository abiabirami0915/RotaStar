import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquarePlus,
  Send,
  Star,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

const CATEGORIES = [
  "General Feedback",
  "Feature Request",
  "Bug / Issue Report",
  "Point System Suggestion",
  "Event / Activity Ideas",
];

export default function Feedback() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [category, setCategory] = useState("General Feedback");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write your feedback message.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, "feedbacks"), {
        userId: currentUser?.uid || "anonymous",
        userName: userData?.name || currentUser?.displayName || "Member",
        userEmail: currentUser?.email || "",
        userRole: userData?.role || "Member",
        userPhoto: userData?.photoURL || currentUser?.photoURL || "",
        category,
        rating,
        subject: subject.trim() || "No Subject",
        message: message.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setSubject("");
      setMessage("");
      setRating(5);
    } catch (err) {
      console.error("Feedback submit error:", err);
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-violet-300 hover:text-amber-300 transition text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-violet-400">Rota</span>
            <span className="font-extrabold text-lg text-amber-400">Star</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-slate-900/90 border border-violet-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <MessageSquarePlus size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles size={12} />
                <span>Share Your Voice</span>
              </div>
              <h1 className="text-2xl font-black text-white">Platform Feedback</h1>
              <p className="text-xs text-slate-400 mt-1">
                Help us improve RotaStar for RAC PSVPEC.
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} />
                <span>Thank you! Your feedback has been sent to club leaders.</span>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs font-bold underline hover:text-emerald-300"
              >
                Send Another
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                Platform Rating
              </label>
              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-violet-900/40">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400"
                  >
                    <Star
                      size={24}
                      fill={(hoverRating || rating) >= star ? "#fbbf24" : "none"}
                      className={(hoverRating || rating) >= star ? "text-amber-400" : "text-slate-600"}
                    />
                  </button>
                ))}
                <span className="text-xs text-amber-300/80 font-bold ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Leaderboard suggestion"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                Message
              </label>
              <textarea
                rows={4}
                required
                placeholder="Share your suggestions or report issues..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}