import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Crown,
  Search,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
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
  "General Body Meeting",
  "Special Initiative",
];

export default function Events() {
  const navigate = useNavigate();
  const { userData, isAdmin, isSuperAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAvenue, setSelectedAvenue] = useState("all");

  // Admin Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });

  // Form Fields
  const [title, setTitle] = useState("");
  const [avenue, setAvenue] = useState(AVENUES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [pointsReward, setPointsReward] = useState("25");
  const [description, setDescription] = useState("");

  const roleString = (userData?.role || "").toLowerCase();
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    roleString.includes("admin") ||
    roleString.includes("president") ||
    roleString.includes("secretary");

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        console.error("Events sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 4000);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      showToast("Please provide event title and date", "error");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        title: title.trim(),
        avenue,
        date,
        time: time.trim() || "TBA",
        venue: venue.trim() || "College Campus",
        pointsReward: Number(pointsReward) || 0,
        description: description.trim(),
        createdBy: userData?.name || "Club Admin",
        createdAt: serverTimestamp(),
      });

      showToast("Event published successfully!");
      setShowAddModal(false);
      setTitle("");
      setDate("");
      setTime("");
      setVenue("");
      setDescription("");
      setPointsReward("25");
    } catch (err) {
      console.error("Add event error:", err);
      showToast("Failed to publish event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "events", eventToDelete.id));
      showToast("Event deleted successfully");
      setEventToDelete(null);
    } catch (err) {
      console.error("Delete event error:", err);
      showToast("Failed to delete event", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAvenue =
      selectedAvenue === "all" || ev.avenue === selectedAvenue;

    return matchesSearch && matchesAvenue;
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

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar size={13} className="text-amber-400" />
              <span>Rotaract Project Calendar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Upcoming Events & Projects
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Check out scheduled initiatives and avenues for RAC PSVPEC.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-700 via-purple-600 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-violet-950 transition border border-amber-400/30"
            >
              <Plus size={18} />
              <span>Add New Event</span>
            </button>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by event title, venue, or description..."
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
              value={selectedAvenue}
              onChange={(e) => setSelectedAvenue(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
            >
              <option value="all">All Avenues</option>
              {AVENUES.map((av) => (
                <option key={av} value={av}>
                  {av}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EVENTS LIST / GRID */}
        {loading ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            Loading events schedule...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            No scheduled events found. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold">
                      {ev.avenue || "General"}
                    </span>

                    {canManage && (
                      <button
                        onClick={() => setEventToDelete(ev)}
                        className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                        title="Delete Event"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white mb-3">
                    {ev.title}
                  </h3>

                  {ev.description && (
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed line-clamp-3">
                      {ev.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-slate-400 bg-slate-950/70 p-4 rounded-2xl border border-violet-900/40 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-amber-400 shrink-0" />
                      <span>
                        {ev.date
                          ? new Date(ev.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "TBA"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-400 shrink-0" />
                      <span>{ev.time || "TBA"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-amber-400 shrink-0" />
                      <span className="truncate">{ev.venue || "Campus"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-violet-900/50">
                  <span className="text-[11px] text-slate-500">Reward Value</span>
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                    <Award size={14} />+{ev.pointsReward || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE EVENT MODAL (ADMIN ONLY) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-violet-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Calendar size={22} />
              </div>
              <h2 className="text-xl font-bold text-white">Publish New Event</h2>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tree Plantation Drive"
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
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Points Reward
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={pointsReward}
                    onChange={(e) => setPointsReward(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auditorium / Online"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Description / Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding dress code, project lead, or objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Event</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-white mb-2">Delete Event?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to remove "{eventToDelete.title}" from the calendar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-slate-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
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
