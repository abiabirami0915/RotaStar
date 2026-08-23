import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Trash2,
  CheckCircle,
  Clock,
  User,
  Crown,
  Search,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function AdminFeedback() {
  const navigate = useNavigate();
  const { userData, isAdmin, isSuperAdmin } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });

  const roleString = (userData?.role || "").toLowerCase();
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    roleString.includes("admin") ||
    roleString.includes("president") ||
    roleString.includes("secretary");

  useEffect(() => {
    const q = query(
      collection(db, "feedbacks"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setFeedbacks(list);
        setLoading(false);
      },
      (err) => {
        console.error("Admin feedback sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 4000);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, "feedbacks", id), { status: newStatus });
      showToast(`Feedback status marked as ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "feedbacks", feedbackToDelete.id));
      showToast("Feedback record deleted.");
      setFeedbackToDelete(null);
    } catch (err) {
      console.error("Error deleting feedback:", err);
      showToast("Failed to delete record", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = feedbacks.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.userName?.toLowerCase().includes(term) ||
      item.subject?.toLowerCase().includes(term) ||
      item.message?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-violet-300 hover:text-amber-300 transition text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Crown size={18} />
            <span>Feedback Management</span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2.5">
              <MessageSquare className="text-amber-400" size={26} />
              Member Feedback Ledger
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Total submissions:{" "}
              <span className="text-amber-400 font-bold">{feedbacks.length}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin")}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-amber-400 text-xs font-bold transition shadow-md"
            >
              Points Panel
            </button>
            <button
              onClick={() => navigate("/admin/members")}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-amber-400 text-xs font-bold transition shadow-md"
            >
              Members Directory
            </button>
          </div>
        </div>

        {/* TOAST MESSAGE */}
        {toast.text && (
          <div
            className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm border ${
              toast.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {toast.type === "error" ? (
              <AlertTriangle size={18} className="shrink-0" />
            ) : (
              <Check size={18} className="shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search feedback by user, subject, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400 transition"
            />
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* FEEDBACK LIST */}
        {loading ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            Loading feedback records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            No feedback found matching the filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-violet-900/50 rounded-3xl p-6 shadow-xl transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  {/* USER INFO */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-500/40 bg-slate-950 flex items-center justify-center shrink-0">
                      {item.userPhoto ? (
                        <img
                          src={item.userPhoto}
                          alt={item.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-violet-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {item.userName || "Member"}
                      </h3>
                      <p className="text-xs text-amber-400 font-semibold">
                        {item.userRole || "Member"} • {item.userEmail}
                      </p>
                    </div>
                  </div>

                  {/* RATING & CATEGORY */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-violet-900/40">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={(item.rating || 5) >= s ? "#fbbf24" : "none"}
                          className={
                            (item.rating || 5) >= s
                              ? "text-amber-400"
                              : "text-slate-600"
                          }
                        />
                      ))}
                    </div>

                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold">
                      {item.category || "General"}
                    </span>
                  </div>
                </div>

                {/* SUBJECT & MESSAGE */}
                <div className="bg-slate-950/70 border border-violet-900/40 rounded-2xl p-4 mb-4">
                  <h4 className="font-bold text-white text-sm mb-1.5">
                    {item.subject}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>

                {/* STATUS CONTROLS & DATE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    Submitted on:{" "}
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString()
                      : "Recent"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(item.id, "pending")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                        item.status === "pending"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-950 text-slate-500 border-slate-800 hover:text-white"
                      }`}
                    >
                      Pending
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(item.id, "reviewed")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                        item.status === "reviewed"
                          ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                          : "bg-slate-950 text-slate-500 border-slate-800 hover:text-white"
                      }`}
                    >
                      Reviewed
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(item.id, "resolved")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                        item.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-950 text-slate-500 border-slate-800 hover:text-white"
                      }`}
                    >
                      Resolved
                    </button>

                    {canManage && (
                      <button
                        onClick={() => setFeedbackToDelete(item)}
                        className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition ml-2"
                        title="Delete Feedback"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {feedbackToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Delete Feedback?</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this feedback entry from{" "}
              <strong className="text-white">{feedbackToDelete.userName}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setFeedbackToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFeedback}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2"
              >
                {deleteLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}