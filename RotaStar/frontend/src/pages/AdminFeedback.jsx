import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Trash2,
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
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFeedbacks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
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
      item.message?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <MessageSquare className="text-amber-400" size={26} />
            Member Feedback Ledger
          </h1>
        </div>

        {toast.text && (
          <div className={`p-4 rounded-2xl mb-6 text-sm border ${toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
            {toast.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
            />
            <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No feedback found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-slate-900/90 border border-violet-900/50 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{item.userName}</h3>
                    <p className="text-xs text-amber-400">{item.userRole} • {item.userEmail}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-violet-500/10 text-amber-300 text-xs font-bold">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl mb-4 whitespace-pre-wrap">
                  {item.message}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Status: {item.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateStatus(item.id, "reviewed")} className="text-xs px-3 py-1 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/40">Review</button>
                    <button onClick={() => handleUpdateStatus(item.id, "resolved")} className="text-xs px-3 py-1 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40">Resolve</button>
                    {canManage && (
                      <button onClick={() => setFeedbackToDelete(item)} className="p-1 text-red-400">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {feedbackToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-red-500/30 text-center">
            <h2 className="text-lg font-bold text-white mb-2">Delete Feedback?</h2>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setFeedbackToDelete(null)} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
              <button onClick={handleDeleteFeedback} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}