import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Calendar,
  User,
  Users,
  MapPin,
  Laptop,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  ArrowLeft,
  FileText,
  HelpCircle,
  Tag,
  Check,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

const AVENUES = [
  "Community Service",
  "Club Service",
  "Professional Development",
  "International Service",
  "Multi-Avenue",
  "General Body Meeting",
  "Special Initiative",
];

const STATUS_CONFIG = {
  submitted: { label: "Under Review", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  reviewed: { label: "In Discussion", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  approved: { label: "Approved for Calendar", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  archived: { label: "Archived", color: "bg-slate-800 text-slate-400 border-slate-700" },
};

export default function EventIdeas() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin } = useAuth();

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAvenue, setSelectedAvenue] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingIdea, setViewingIdea] = useState(null);
  const [ideaToDelete, setIdeaToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });

  // Form Fields
  const [title, setTitle] = useState("");
  const [avenue, setAvenue] = useState(AVENUES[0]);
  const [mode, setMode] = useState("Offline");
  const [tentativeDate, setTentativeDate] = useState("");
  const [chairperson, setChairperson] = useState("");
  const [secretary, setSecretary] = useState("");
  const [description, setDescription] = useState("");
  const [resourcesNeeded, setResourcesNeeded] = useState("");
  const [seekingFeedback, setSeekingFeedback] = useState("Yes");

  const roleString = (userData?.role || "").toLowerCase();
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    roleString.includes("admin") ||
    roleString.includes("president") ||
    roleString.includes("secretary");

  useEffect(() => {
    const q = query(collection(db, "eventIdeas"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setIdeas(list);
        setLoading(false);
      },
      (err) => {
        console.error("Event ideas sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 4000);
  };

  const resetForm = () => {
    setTitle("");
    setAvenue(AVENUES[0]);
    setMode("Offline");
    setTentativeDate("");
    setChairperson("");
    setSecretary("");
    setDescription("");
    setResourcesNeeded("");
    setSeekingFeedback("Yes");
  };

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast("Please provide event title and concept description", "error");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "eventIdeas"), {
        title: title.trim(),
        avenue,
        mode,
        tentativeDate: tentativeDate.trim() || "To be decided",
        chairperson: chairperson.trim() || "Open / Volunteer",
        secretary: secretary.trim() || "None / Open",
        description: description.trim(),
        resourcesNeeded: resourcesNeeded.trim() || "Standard venue/materials",
        seekingFeedback,
        submittedBy: userData?.name || currentUser?.displayName || "Member",
        submittedByEmail: currentUser?.email || "",
        submittedByPhoto: userData?.photoURL || currentUser?.photoURL || "",
        submittedByRole: userData?.role || "Member",
        userId: currentUser?.uid || "anonymous",
        status: "submitted",
        createdAt: serverTimestamp(),
      });

      showToast("Idea pitched successfully! Club leaders will review it.");
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Submit idea error:", err);
      showToast("Failed to post event idea", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, "eventIdeas", id), { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      if (viewingIdea?.id === id) {
        setViewingIdea((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteIdea = async () => {
    if (!ideaToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "eventIdeas", ideaToDelete.id));
      showToast("Idea removed successfully");
      setIdeaToDelete(null);
      if (viewingIdea?.id === ideaToDelete.id) {
        setViewingIdea(null);
      }
    } catch (err) {
      showToast("Failed to delete idea", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredIdeas = ideas.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.title?.toLowerCase().includes(term) ||
      item.submittedBy?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.chairperson?.toLowerCase().includes(term);

    const matchesAvenue = selectedAvenue === "all" || item.avenue === selectedAvenue;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesAvenue && matchesStatus;
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
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-violet-400">Rota</span>
            <span className="font-extrabold text-lg text-amber-400">Star</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Lightbulb size={13} className="text-amber-400" />
              <span>Brainstorming & Proposals</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Event Ideas & Suggestions
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Have a visionary project in mind? Pitch it here for RAC PSVPEC!
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-700 via-purple-600 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-violet-950 transition border border-amber-400/30"
          >
            <Plus size={18} />
            <span>Pitch an Event Idea</span>
          </button>
        </div>

        {/* TOAST ALERT */}
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by title, proposer, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400 transition"
            />
            <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
          </div>

          <div>
            <select
              value={selectedAvenue}
              onChange={(e) => setSelectedAvenue(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
            >
              <option value="all">All Avenues</option>
              {AVENUES.map((av) => (
                <option key={av} value={av}>{av}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Under Review</option>
              <option value="reviewed">In Discussion</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* IDEAS GRID */}
        {loading ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            Loading pitched ideas...
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            No event suggestions found. Be the first to pitch one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => {
              const statusInfo = STATUS_CONFIG[idea.status] || STATUS_CONFIG.submitted;
              const isAuthor = currentUser?.uid === idea.userId;

              return (
                <div
                  key={idea.id}
                  className="bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                        {idea.avenue === "Multi-Avenue" && <Layers size={12} className="text-amber-400" />}
                        {idea.avenue || "General"}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h3
                      onClick={() => setViewingIdea(idea)}
                      className="text-lg font-black text-white mb-2 cursor-pointer hover:text-amber-300 transition-colors"
                    >
                      {idea.title}
                    </h3>

                    <p className="text-xs text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-2xl border border-violet-900/40 text-xs text-slate-400 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Calendar size={13} className="text-amber-400" />
                          <span>Start: {idea.tentativeDate || "TBD"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-violet-300 font-medium">
                          {idea.mode === "Online" ? <Laptop size={12} /> : <MapPin size={12} />}
                          {idea.mode}
                        </span>
                      </div>

                      {(idea.chairperson || idea.secretary) && (
                        <div className="pt-1.5 border-t border-violet-950 text-[11px] flex flex-col gap-0.5 text-slate-400">
                          {idea.chairperson && <span>Chair: <strong className="text-slate-200">{idea.chairperson}</strong></span>}
                          {idea.secretary && <span>Sec: <strong className="text-slate-200">{idea.secretary}</strong></span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-violet-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-amber-500/30 flex items-center justify-center text-[10px] text-amber-300 font-bold overflow-hidden">
                        {idea.submittedByPhoto ? (
                          <img src={idea.submittedByPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          idea.submittedBy?.charAt(0) || "M"
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                        {idea.submittedBy}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingIdea(idea)}
                        className="px-3 py-1 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-200 text-xs font-semibold transition"
                      >
                        Details
                      </button>

                      {(canManage || isAuthor) && (
                        <button
                          onClick={() => setIdeaToDelete(idea)}
                          className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                          title="Delete Idea"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 1. VIEW FULL IDEA MODAL */}
      {viewingIdea && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-violet-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setViewingIdea(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
                <Lightbulb size={24} />
              </div>
              <div className="pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold">
                    {viewingIdea.avenue}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[viewingIdea.status]?.color || ""}`}>
                    {STATUS_CONFIG[viewingIdea.status]?.label || "Under Review"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {viewingIdea.title}
                </h2>
              </div>
            </div>

            {/* QUICK METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-4 rounded-2xl border border-violet-900/40 mb-4 text-xs">
              <div>
                <span className="text-slate-500 block">Tentative Date</span>
                <strong className="text-slate-200">{viewingIdea.tentativeDate}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Execution Mode</span>
                <strong className="text-amber-400">{viewingIdea.mode}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Proposed By</span>
                <strong className="text-violet-300">{viewingIdea.submittedBy}</strong>
              </div>
            </div>

            {/* FULL DETAILS SCROLLABLE */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-5 rounded-2xl border border-violet-900/30">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Full Project Concept
                </h4>
                <p className="whitespace-pre-wrap">{viewingIdea.description}</p>
              </div>

              {viewingIdea.resourcesNeeded && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Requirements & Logistics
                  </h4>
                  <p className="whitespace-pre-wrap">{viewingIdea.resourcesNeeded}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-violet-900/40 text-xs">
                <div>
                  <span className="text-slate-500 block">Chairperson</span>
                  <span className="text-white font-medium">{viewingIdea.chairperson || "None / Open"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Secretary</span>
                  <span className="text-white font-medium">{viewingIdea.secretary || "None / Open"}</span>
                </div>
              </div>
            </div>

            {/* ADMIN ACTIONS */}
            {canManage && (
              <div className="pt-3 border-t border-violet-900/40 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-semibold">Change Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(viewingIdea.id, "reviewed")}
                    className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold"
                  >
                    Discuss
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingIdea.id, "approved")}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingIdea.id, "archived")}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs"
                  >
                    Archive
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PITCH EVENT IDEA MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-violet-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Lightbulb size={22} />
              </div>
              <h2 className="text-xl font-bold text-white">Pitch an Event Idea</h2>
            </div>

            <form onSubmit={handleAddIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Blood Drive 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Avenue
                  </label>
                  <select
                    value={avenue}
                    onChange={(e) => setAvenue(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  >
                    {AVENUES.map((av) => (
                      <option key={av} value={av}>{av}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  >
                    <option value="Offline">Offline (Campus / Field)</option>
                    <option value="Online">Online (Meet / Zoom)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Tentative Date / Month
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid September 2026 or 2026-09-15"
                  value={tentativeDate}
                  onChange={(e) => setTentativeDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Chairperson</span>
                    <span className="text-[10px] text-slate-500 lowercase">(opt)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rtr. Rahul"
                    value={chairperson}
                    onChange={(e) => setChairperson(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Secretary</span>
                    <span className="text-[10px] text-slate-500 lowercase">(opt)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rtr. Priya"
                    value={secretary}
                    onChange={(e) => setSecretary(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Concept, Objectives & Plan
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what the event is, target audience, and expected impact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  What All is Needed? (Materials, Venue, Budget)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Seminar hall, audio setup, mementos, doctor team..."
                  value={resourcesNeeded}
                  onChange={(e) => setResourcesNeeded(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Proposal...</span>
                  </>
                ) : (
                  <span>Submit Event Idea</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE CONFIRMATION */}
      {ideaToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-white mb-2">Delete Idea?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Remove "{ideaToDelete.title}" from the suggestion board?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIdeaToDelete(null)}
                className="px-4 py-2 text-slate-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIdea}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}