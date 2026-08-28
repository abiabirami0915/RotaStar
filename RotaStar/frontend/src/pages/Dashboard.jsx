import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Trophy,
  Flame,
  Award,
  FileText,
  ChevronRight,
  Shield,
  LogOut,
  User,
  Users,
  UserCheck,
  Crown,
  Sparkles,
  X,
  Zap,
  PartyPopper,
  Calendar,
  CalendarDays,
  Lock,
  Code,
  Rocket,
  Heart,
  MessageSquarePlus,
  MessageSquare,
  Lightbulb,
  Megaphone,
  AlertTriangle,
  Info,
  Trash2,
  Loader2,
  Star,
  Clock,
  MapPin,
  BellRing,
  PlusCircle,
  Layers,
  Check,
  ListFilter,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  calculateLevelProgress,
  getMemberBadges,
  calculateMonthlyStreak,
} from "../utils/gamification";

const MOTIVATIONAL_QUOTES = [
  "“The best way to find yourself is to lose yourself in the service of others.” — Mahatma Gandhi",
  "“Great things are done by a series of small things brought together.” — Vincent van Gogh",
  "“Leadership is not about a title or a designation. It's about impact, influence, and inspiration.”",
  "“Alone we can do so little; together we can do so much.” — Helen Keller",
  "“Your dedication today shapes the leaders of tomorrow. Keep shining!”",
  "“Service to others is the rent you pay for your room here on earth.” — Muhammad Ali",
];

const ANNOUNCEMENT_PRIORITIES = {
  urgent: {
    label: "Urgent Alert",
    bg: "bg-rose-950/80 border-rose-500/50 text-rose-200",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    icon: <AlertTriangle size={18} className="text-rose-400 shrink-0" />,
  },
  event: {
    label: "Event Update",
    bg: "bg-amber-950/80 border-amber-500/50 text-amber-200",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: <Calendar size={18} className="text-amber-400 shrink-0" />,
  },
  info: {
    label: "Important Notice",
    bg: "bg-violet-950/80 border-violet-500/50 text-violet-200",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    icon: <Info size={18} className="text-violet-400 shrink-0" />,
  },
};

const AVENUE_STYLES = {
  "Club Service": { hex: "#8B5CF6", bg: "bg-violet-500", text: "text-violet-300", border: "border-violet-500/30" },
  "Community Service": { hex: "#F59E0B", bg: "bg-amber-500", text: "text-amber-300", border: "border-amber-500/30" },
  "Professional Development": { hex: "#06B6D4", bg: "bg-cyan-500", text: "text-cyan-300", border: "border-cyan-500/30" },
  "International Service": { hex: "#10B981", bg: "bg-emerald-500", text: "text-emerald-300", border: "border-emerald-500/30" },
  "Multi-Avenue": { hex: "#D946EF", bg: "bg-fuchsia-500", text: "text-fuchsia-300", border: "border-fuchsia-500/30" },
  "General / GBM": { hex: "#94A3B8", bg: "bg-slate-500", text: "text-slate-300", border: "border-slate-700" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin, logout } = useAuth();

  const [allUserActivities, setAllUserActivities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [completedEventsList, setCompletedEventsList] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [dismissedEventReminder, setDismissedEventReminder] = useState(false);
  const [userRank, setUserRank] = useState("-");
  const [allMembers, setAllMembers] = useState([]);

  // Modal States
  const [showAddCompletedModal, setShowAddCompletedModal] = useState(false);
  const [showViewEventsModal, setShowViewEventsModal] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventAvenue, setEventAvenue] = useState("Community Service");
  const [chairperson, setChairperson] = useState("");
  const [secretary, setSecretary] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  // Announcement Modal States
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announceType, setAnnounceType] = useState("urgent");
  const [announceSubmitting, setAnnounceSubmitting] = useState(false);

  // Level & Badge States
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ oldLevel: 1, newLevel: 1, quote: "" });
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState(null);
  const [hasInitializedBadges, setHasInitializedBadges] = useState(false);

  // Gamification Calculations
  const points = userData?.totalPoints || 0;
  const levelData = useMemo(() => calculateLevelProgress(points), [points]);
  const monthlyStreak = useMemo(() => calculateMonthlyStreak(allUserActivities), [allUserActivities]);
  const memberBadges = useMemo(
    () => getMemberBadges(points, allUserActivities, monthlyStreak),
    [points, allUserActivities, monthlyStreak]
  );
  const unlockedBadgesCount = useMemo(
    () => memberBadges.filter((b) => b.unlocked).length,
    [memberBadges]
  );

  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const showAdminPanel =
    Boolean(isAdmin) ||
    Boolean(isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary") ||
    rawRole.includes("board");

  const avenueCounts = useMemo(() => {
    const counts = {
      "Club Service": 0,
      "Community Service": 0,
      "Professional Development": 0,
      "International Service": 0,
      "Multi-Avenue": 0,
      "General / GBM": 0,
    };

    completedEventsList.forEach((ev) => {
      const av = ev.avenue || "Community Service";
      if (counts[av] !== undefined) {
        counts[av] += 1;
      } else {
        counts["General / GBM"] += 1;
      }
    });

    return counts;
  }, [completedEventsList]);

  const totalCompletedCount = completedEventsList.length;

  const starRotaractor = useMemo(() => {
    if (allMembers.length === 0) return null;
    return allMembers[0];
  }, [allMembers]);

  // Live Sync: Completed Events
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "completedEvents"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const dateA = new Date(a.eventDate || a.createdAt || 0).getTime();
          const dateB = new Date(b.eventDate || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setCompletedEventsList(list);
      },
      (err) => console.error("Error reading completedEvents:", err)
    );
    return () => unsub();
  }, []);

  // Level-Up Detection
  useEffect(() => {
    if (!currentUser || !userData) return;
    const storageKey = `rotastar_seen_level_${currentUser.uid}`;
    const storedLevelStr = localStorage.getItem(storageKey);

    if (storedLevelStr !== null) {
      const prevLevel = parseInt(storedLevelStr, 10);
      if (levelData.currentLevel > prevLevel) {
        const randomQuote =
          MOTIVATIONAL_QUOTES[
            Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
          ];
        setLevelUpData({
          oldLevel: prevLevel,
          newLevel: levelData.currentLevel,
          quote: randomQuote,
        });
        setShowLevelUpModal(true);
      }
    }
    localStorage.setItem(storageKey, levelData.currentLevel.toString());
  }, [currentUser, userData, levelData.currentLevel]);

  // Badge Unlock Detection
  useEffect(() => {
    if (!currentUser || !userData || memberBadges.length === 0) return;
    const storageKey = `rotastar_seen_badges_${currentUser.uid}`;
    const rawStored = localStorage.getItem(storageKey);
    const storedBadges = rawStored ? JSON.parse(rawStored) : null;
    const currentlyUnlockedIds = memberBadges.filter((b) => b.unlocked).map((b) => b.id);

    if (!hasInitializedBadges) {
      if (!storedBadges) {
        localStorage.setItem(storageKey, JSON.stringify(currentlyUnlockedIds));
      } else {
        const merged = Array.from(new Set([...storedBadges, ...currentlyUnlockedIds]));
        localStorage.setItem(storageKey, JSON.stringify(merged));
      }
      setHasInitializedBadges(true);
      return;
    }

    if (storedBadges) {
      const brandNewBadge = memberBadges.find(
        (b) => b.unlocked && !storedBadges.includes(b.id)
      );

      if (brandNewBadge) {
        setUnlockedBadgeModal(brandNewBadge);
        const updatedList = Array.from(new Set([...storedBadges, brandNewBadge.id]));
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
      }
    }
  }, [currentUser, userData, memberBadges, hasInitializedBadges]);

  // Announcements Sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "announcements"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setAnnouncements(list);
    });
    return () => unsub();
  }, []);

  // Upcoming Events Sync
  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsub = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const eventsList = snapshot.docs
        .map((d) => {
          const data = d.data();
          let eventDateObj = null;

          if (data.date?.toDate) {
            eventDateObj = data.date.toDate();
          } else if (data.date) {
            eventDateObj = new Date(data.date);
          }

          const eventTimestamp = eventDateObj ? eventDateObj.getTime() : 0;
          const diffDays = eventDateObj ? Math.ceil((eventTimestamp - todayStart) / (1000 * 60 * 60 * 24)) : null;

          return {
            id: d.id,
            ...data,
            eventDateObj,
            eventTimestamp,
            diffDays,
          };
        })
        .filter((ev) => ev.diffDays !== null && ev.diffDays >= 0)
        .sort((a, b) => a.eventTimestamp - b.eventTimestamp);

      setUpcomingEvents(eventsList);
    });

    return () => unsub();
  }, []);

  // Leaderboard Rank Sync
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        points: docSnap.data().totalPoints || 0,
      }));

      list.sort((a, b) => b.points - a.points);
      setAllMembers(list);

      const rankIndex = list.findIndex((u) => u.id === currentUser?.uid);
      setUserRank(rankIndex !== -1 ? `#${rankIndex + 1}` : "-");
    });

    return () => unsubUsers();
  }, [currentUser]);

  // Activity Sync
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "activities"), where("userId", "==", currentUser.uid));
    const unsubActivities = onSnapshot(q, (snapshot) => {
      const acts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      acts.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setAllUserActivities(acts);
      setRecentActivities(acts.slice(0, 5));
    });

    return () => unsubActivities();
  }, [currentUser]);

  // Record Completed Event Handler
  const handleRecordCompletedEvent = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      alert("Please enter the event name and date.");
      return;
    }

    setRecordSubmitting(true);
    const newEvent = {
      eventName: eventName.trim(),
      eventDate: eventDate,
      avenue: eventAvenue || "Community Service",
      chairperson: chairperson.trim() || "-",
      secretary: secretary.trim() || "-",
      description: shortDescription.trim() || "",
      loggedBy: userData?.name || currentUser?.displayName || "Executive Board",
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "completedEvents"), newEvent);
      setCompletedEventsList((prev) => [{ id: docRef.id, ...newEvent }, ...prev]);
      setShowAddCompletedModal(false);
      setEventName("");
      setEventDate("");
      setChairperson("");
      setSecretary("");
      setShortDescription("");
    } catch (err) {
      console.error("Error logging completed event:", err);
      alert("Failed to save event: " + err.message);
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleDeleteCompletedEvent = async (id) => {
    if (!showAdminPanel) return;
    if (window.confirm("Are you sure you want to remove this conducted event record?")) {
      try {
        await deleteDoc(doc(db, "completedEvents", id));
      } catch (err) {
        console.error("Error deleting completed event:", err);
      }
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceMessage.trim()) return;

    setAnnounceSubmitting(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: announceTitle.trim(),
        message: announceMessage.trim(),
        type: announceType,
        publishedBy: userData?.name || "Executive Board",
        createdAt: serverTimestamp(),
      });
      setShowAnnounceModal(false);
      setAnnounceTitle("");
      setAnnounceMessage("");
    } catch (err) {
      console.error("Create announcement error:", err);
    } finally {
      setAnnounceSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (err) {
      console.error("Delete announcement error:", err);
    }
  };

  const handleDismiss = (id) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderBadgeIcon = (iconName, unlocked) => {
    const color = unlocked ? "text-amber-400" : "text-slate-600";
    switch (iconName) {
      case "Crown": return <Crown size={22} className={color} />;
      case "Award": return <Award size={22} className={color} />;
      case "Trophy": return <Trophy size={22} className={color} />;
      case "Flame": return <Flame size={22} className={color} />;
      case "Shield": return <Shield size={22} className={color} />;
      case "Zap": return <Zap size={22} className={color} />;
      default: return <Sparkles size={22} className={color} />;
    }
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));
  const nearestEvent = upcomingEvents.length > 0 && upcomingEvents[0].diffDays <= 7 ? upcomingEvents[0] : null;

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-amber-500/20" />
                <div className="relative z-10 flex items-center justify-center">
                  <Star size={20} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <Sparkles size={11} className="text-violet-300 absolute -top-1 -right-1.5 animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-xl text-violet-400">Rota</span>
                <span className="font-black text-xl text-amber-400">Star</span>
              </div>
              <p className="text-[10px] text-amber-300/80 tracking-tight font-semibold uppercase">
                RAC PSVPEC • A.U.R.A • RID 3233
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/events")}
              className="text-xs font-semibold text-violet-200/80 hover:text-amber-300 transition cursor-pointer"
            >
              Events
            </button>

            <button
              onClick={() => navigate("/event-ideas")}
              className="text-xs font-semibold text-violet-200/80 hover:text-amber-300 transition cursor-pointer"
            >
              Ideas
            </button>

            <button
              onClick={() => navigate("/leaderboard")}
              className="text-xs font-semibold text-violet-200/80 hover:text-amber-300 transition cursor-pointer"
            >
              Leaderboard
            </button>

            <Link
              to="/profile"
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/40 hover:border-amber-400 bg-slate-950 flex items-center justify-center transition shrink-0 cursor-pointer shadow-lg shadow-violet-900/20"
              title="Profile"
            >
              {userData?.photoURL || currentUser?.photoURL ? (
                <img
                  src={userData?.photoURL || currentUser?.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <User size={20} className="text-violet-300 pointer-events-none" />
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition ml-1 cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* UPCOMING EVENT BANNER */}
        {nearestEvent && !dismissedEventReminder && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-slate-900/90 border border-amber-500/50 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 animate-pulse">
                  <BellRing size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      nearestEvent.diffDays === 0
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : nearestEvent.diffDays === 1
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    }`}>
                      {nearestEvent.diffDays === 0 ? "Happening Today!" : nearestEvent.diffDays === 1 ? "Tomorrow" : `In ${nearestEvent.diffDays} Days`}
                    </span>
                    <span className="text-xs text-amber-200/90 font-bold">Upcoming Event Reminder</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white">
                    {nearestEvent.title || nearestEvent.name || "Club Event"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5 font-medium">
                    {nearestEvent.eventDateObj && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Calendar size={13} />
                        {nearestEvent.eventDateObj.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {nearestEvent.time && (
                      <span className="flex items-center gap-1 text-violet-300">
                        <Clock size={13} />
                        {nearestEvent.time}
                      </span>
                    )}
                    {nearestEvent.venue && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin size={13} />
                        {nearestEvent.venue}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => navigate("/events")}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Details</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => setDismissedEventReminder(true)}
                  className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BROADCAST BANNER */}
        {visibleAnnouncements.length > 0 && (
          <div className="space-y-3 mb-6">
            {visibleAnnouncements.map((ann) => {
              const style = ANNOUNCEMENT_PRIORITIES[ann.type] || ANNOUNCEMENT_PRIORITIES.info;

              return (
                <div
                  key={ann.id}
                  className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md shadow-xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${style.bg}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">{style.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] text-slate-400">by {ann.publishedBy || "Executive Board"}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">{ann.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ann.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {showAdminPanel && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(ann.id)}
                      className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 🌟 1. HELLO STATUS CARD */}
        <div className="bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-500/30 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div
              onClick={() => navigate("/profile")}
              className="flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
                {userData?.photoURL || currentUser?.photoURL ? (
                  <img
                    src={userData?.photoURL || currentUser?.photoURL}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-violet-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Current Status</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-300 transition-colors">
                  Hello, {userData?.name || currentUser?.displayName || "Member"}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Role:{" "}
                  <span className="capitalize text-violet-300 font-semibold">
                    {userData?.role || "Member"}
                  </span>
                  {userData?.username && ` • @${userData.username}`}
                  <span className="text-amber-400 font-medium ml-2 underline">
                    Edit Profile →
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showAdminPanel && (
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="px-4 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-2 transition shadow-lg shrink-0 cursor-pointer"
                >
                  <Megaphone size={16} className="text-amber-400" />
                  <span>Broadcast Notice</span>
                </button>
              )}

              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 sm:px-6 flex items-center gap-4 shadow-lg shadow-amber-500/5 shrink-0">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Trophy size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider">
                    Current Level
                  </p>
                  <p className="text-lg font-black text-amber-400 tracking-wide">
                    {levelData.levelTitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="bg-slate-950/70 border border-violet-900/40 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold mb-2.5 gap-1">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                Level {levelData.currentLevel} Progress ({levelData.percentage}%)
              </span>
              <span className="text-slate-400 font-normal text-[11px]">
                <strong className="text-amber-400 font-bold">{levelData.pointsNeeded} pts</strong> to unlock Level {levelData.nextLevel}
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-violet-900/50 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-amber-500 to-amber-300 transition-all duration-1000 ease-out shadow-lg shadow-amber-500/30"
                style={{ width: `${levelData.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-2">
              <span>{levelData.levelFloor} pts (L{levelData.currentLevel})</span>
              <span>{points} pts (Current)</span>
              <span>{levelData.levelCap} pts (L{levelData.nextLevel})</span>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/90 border border-violet-900/40 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
              <Flame size={16} className="text-amber-400" />
              <span>Total Points</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">{points}</p>
          </div>

          <div className="bg-slate-900/90 border border-violet-900/40 hover:border-violet-500/40 rounded-2xl p-5 shadow-xl transition">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
              <Trophy size={16} className="text-violet-400" />
              <span>Current Rank</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{userRank}</p>
          </div>

          <div className="bg-slate-900/90 border border-violet-900/40 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
              <Calendar size={16} className="text-amber-400" />
              <span>Monthly Streak</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 flex items-baseline gap-1">
              {monthlyStreak}{" "}
              <span className="text-xs text-slate-400 font-normal">
                {monthlyStreak === 1 ? "month" : "months"}
              </span>
            </p>
          </div>

          <div className="bg-slate-900/90 border border-violet-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
              <Award size={16} className="text-amber-400" />
              <span>Badges Unlocked</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {unlockedBadgesCount}{" "}
              <span className="text-xs text-slate-500 font-normal">
                / {memberBadges.length}
              </span>
            </p>
          </div>
        </div>

        {/* 🌟 STAR ROTARACTOR SPOTLIGHT */}
        {starRotaractor && (
          <div className="mb-6 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-950/40 to-slate-900/90 border-2 border-amber-500/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-amber-400 p-0.5 bg-slate-950 shadow-xl shadow-amber-500/20">
                    {starRotaractor.photoURL ? (
                      <img
                        src={starRotaractor.photoURL}
                        alt="Star Rotaractor"
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-amber-400">
                        <User size={36} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 p-1.5 bg-amber-400 text-slate-950 rounded-full shadow-lg animate-bounce">
                    <Crown size={14} />
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    <Sparkles size={11} />
                    <span>Star Rotaractor of the Month</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {starRotaractor.name || "Standout Rotaractor"}
                  </h3>
                  <p className="text-xs text-amber-300/90 font-medium">
                    {starRotaractor.role || "General Member"} • {starRotaractor.department || "RAC PSVPEC"}
                  </p>
                  <p className="text-xs text-slate-300 italic mt-2 max-w-md">
                    "Recognized for extraordinary leadership, steadfast meeting attendance, and leading community service impact."
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Contribution</span>
                  <p className="text-2xl font-black text-amber-400">{starRotaractor.points || starRotaractor.totalPoints || 0} pts</p>
                </div>
                <span className="text-[10px] text-amber-400/80 font-semibold">#1 Ranked Champion</span>
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY ACTIONS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <button
            onClick={() => navigate("/events")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Calendar</h3>
                <p className="text-[10px] text-slate-400">Events</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-amber-400" />
          </button>

          <button
            onClick={() => navigate("/event-ideas")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Lightbulb size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Event Ideas</h3>
                <p className="text-[10px] text-slate-400">Propose</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-amber-400" />
          </button>

          <button
            onClick={() => navigate("/request-points")}
            className="p-4 rounded-2xl bg-gradient-to-r from-violet-700 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-left transition shadow-xl flex items-center justify-between group col-span-2 sm:col-span-1 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 rounded-xl text-amber-200">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Claim Points</h3>
                <p className="text-[10px] text-amber-100/90">Submit</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-amber-200" />
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-violet-600/10 text-amber-400 rounded-xl">
                <Crown size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Leaderboard</h3>
                <p className="text-[10px] text-slate-400">Ranks</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-violet-400" />
          </button>

          <button
            onClick={() => navigate("/feedback")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <MessageSquarePlus size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Feedback</h3>
                <p className="text-[10px] text-slate-400">Voice</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-amber-400" />
          </button>
        </div>

        {/* 🌟 INSTITUTIONAL SHOWCASE */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Sparkles size={20} className="text-amber-400" />
                Our Institutional Identity
              </h2>
              <p className="text-xs text-slate-400">
                The governing pillars and leadership behind RAC PSVPEC
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. RAC PSVPEC TAB */}
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-amber-400/60 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
                    College Based Club
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-slate-950 px-2.5 py-0.5 rounded-full border border-violet-900/40">
                    <CalendarDays size={12} />
                    <span>Charter Date : 20th August 2020</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-2">
                  RAC PSVPEC
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College is dedicated to youth leadership, community impact, and empowering students through service above self.
                </p>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-violet-900/40 space-y-2.5 text-xs text-slate-300">
                  <div className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider mb-1 flex items-center gap-1">
                    <UserCheck size={12} />
                    <span>Club Leadership (2026–2027)</span>
                  </div>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">President 26-27:</span>
                    <strong className="text-amber-300 font-bold">Rtr. Jeevanaa Y</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Secretary 26-27:</span>
                    <strong className="text-amber-300 font-bold">Rtr. Abirami G</strong>
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-violet-900/40 text-[11px] text-amber-400/90 font-bold flex items-center justify-between">
                <span>College Based Club</span>
                <span>RAC PSVPEC</span>
              </div>
            </div>

            {/* 2. THEME A.U.R.A TAB */}
            <div className="bg-gradient-to-b from-violet-950/60 to-slate-950 border border-violet-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-violet-400/70 transition-all">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase mb-3">
                  Leadership Theme
                </div>

                <h3 className="text-xl font-black text-white mb-1">
                  Theme A.U.R.A
                </h3>
                <p className="text-xs font-extrabold text-amber-400 mb-3 tracking-wide">
                  A.U.R.A - Activating unity, responsibilities and action
                </p>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Symbolizing radiance, high ethical standards, and purposeful action. A.U.R.A ignites our club's commitment to community excellence, fellowship, and visionary leadership.
                </p>

                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-violet-900/40 text-xs text-slate-300 space-y-1.5">
                  <div className="text-[10px] uppercase font-extrabold text-violet-400 tracking-wider mb-1 flex items-center gap-1">
                    <Star size={12} />
                    <span>Core Pillars</span>
                  </div>
                  <p>• <strong className="text-violet-200">A</strong>ctivating Collective Purpose</p>
                  <p>• <strong className="text-violet-200">U</strong>nity in Every Initiative</p>
                  <p>• <strong className="text-violet-200">R</strong>esponsibility Toward Society</p>
                  <p>• <strong className="text-violet-200">A</strong>ction with Tangible Impact</p>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-violet-900/40 text-[11px] text-violet-300 font-bold flex items-center justify-between">
                <span>Radiance in Leadership</span>
                <span>Tenure 2026–2027</span>
              </div>
            </div>

            {/* 3. ROTARY INTERNATIONAL DISTRICT 3233 TAB */}
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-amber-400/60 transition-all">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase mb-3">
                  Rotary International District
                </div>

                <h3 className="text-xl font-black text-white mb-1">
                  Rotary International District 3233
                </h3>
                <p className="text-xs font-extrabold text-amber-400 mb-3 tracking-wide">
                  V.I.B.E - Vision.Innovate.Believe.Evolve
                </p>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Governing and inspiring Rotaract clubs across RID 3233 to deliver impactful community service and cross-district collaborations.
                </p>

                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-violet-900/40 space-y-1.5 text-xs text-slate-300">
                  <div className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider mb-1 flex items-center gap-1">
                    <Crown size={12} />
                    <span>District Leadership 26-27</span>
                  </div>
                  <p>
                    <span className="text-slate-500 font-medium">District Rotaract Representative 26-27:</span><br />
                    <strong className="text-white">Rtr. PP. PHF. HariVignesh M</strong>
                  </p>
                  <p className="pt-1">
                    <span className="text-slate-500 font-medium">District Rotaract Secretary 26-27:</span><br />
                    <strong className="text-white">Rtr. PP. Naveen Kumar A</strong>
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-violet-900/40 text-[11px] text-amber-400/90 font-bold flex items-center justify-between">
                <span>RID 3233</span>
                <span>Rotary International</span>
              </div>
            </div>
          </div>
        </section>

        {/* 🏆 2. CLEAN CONDUCTED EVENTS MILESTONE SECTION */}
        <section className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-violet-950/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
                <Layers size={12} />
                <span>RAC PSVPEC Official Record</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Events Conducted Milestone
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Official tally of successfully executed projects</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/40 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Total Completed</span>
                <span className="text-2xl font-black text-amber-400">{totalCompletedCount} Events</span>
              </div>

              {/* View Ledger Modal Trigger */}
              <button
                onClick={() => setShowViewEventsModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-violet-900/60 hover:border-amber-400 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <ListFilter size={14} className="text-amber-400" />
                <span>View Event Ledger</span>
              </button>

              {/* Record Event Trigger */}
              {showAdminPanel && (
                <button
                  onClick={() => setShowAddCompletedModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <PlusCircle size={14} />
                  <span>+ Record Event</span>
                </button>
              )}
            </div>
          </div>

          {/* AVENUE BREAKDOWN TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(AVENUE_STYLES).map(([avName, style]) => (
              <div
                key={avName}
                onClick={() => setShowViewEventsModal(true)}
                className={`p-4 rounded-2xl bg-slate-950/80 border ${style.border} flex flex-col justify-between text-center transition hover:scale-[1.02] cursor-pointer`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${style.text} mb-2`}>{avName}</span>
                <p className="text-2xl font-black text-white">{avenueCounts[avName] || 0}</p>
                <span className="text-[10px] text-slate-500 mt-1">Events</span>
              </div>
            ))}
          </div>
        </section>

        {/* ACHIEVEMENT BADGES SHOWCASE */}
        <section className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-7 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Achievement Badges
            </h2>
            <span className="text-xs font-bold text-amber-400/90 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              {unlockedBadgesCount} of {memberBadges.length} Earned
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {memberBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                  badge.unlocked
                    ? "bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-400"
                    : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-80"
                }`}
              >
                <div className="relative mb-2.5 mt-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      badge.unlocked
                        ? "bg-amber-500/15 border border-amber-500/30 shadow-md shadow-amber-500/20"
                        : "bg-slate-900 border border-slate-800"
                    }`}
                  >
                    {renderBadgeIcon(badge.icon, badge.unlocked)}
                  </div>
                  {!badge.unlocked && (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 border border-slate-800 rounded-full text-slate-500">
                      <Lock size={10} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className={`text-xs font-bold ${badge.unlocked ? "text-white" : "text-slate-500"}`}>
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ADMIN CONTROLS PANEL */}
        {showAdminPanel && (
          <section className="mb-8">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Shield size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Controls</h2>
                  <p className="text-xs text-slate-400">Oversee points ledger, submissions, member directory, and feedback</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">Point Management</p>
                    <p className="text-xs text-slate-500 mt-0.5">Award or deduct</p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>

                <button
                  onClick={() => navigate("/admin/requests")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">Point Requests</p>
                    <p className="text-xs text-slate-500 mt-0.5">Approve/Reject</p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>

                <button
                  onClick={() => navigate("/admin/members")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-500 text-left transition cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <Users size={14} className="text-amber-400" />
                      View Members
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Roster & Delete</p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>

                <button
                  onClick={() => navigate("/admin/feedback")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-amber-400" />
                      Feedback Ledger
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Review ideas</p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 🌟 3. RECENT POINT ACTIVITY (WITH REASONS & CATEGORIES) */}
        <section className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 shadow-xl mb-8">
          <h2 className="font-extrabold text-base mb-4 text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Recent Point Activity
          </h2>

          {recentActivities.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No recent activity recorded yet.</p>
          ) : (
            <div className="divide-y divide-violet-950/80">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-3.5 flex items-start justify-between text-sm gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-white text-sm">{act.activityName || "Activity"}</p>
                      {act.category && (
                        <span className="text-[10px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md">
                          {act.category}
                        </span>
                      )}
                    </div>

                    {/* REASON / REMARKS DISPLAY */}
                    {act.reason && (
                      <p className="text-xs text-amber-300/90 leading-relaxed font-medium bg-slate-950/60 p-2 rounded-xl border border-violet-950">
                        <strong className="text-slate-400">Reason:</strong> {act.reason}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500">
                      {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      }) : "Recent"}
                      {act.adminName && ` • Verified by ${act.adminName}`}
                    </p>
                  </div>

                  <span
                    className={`font-black text-sm px-3 py-1 rounded-xl shrink-0 ${
                      (act.points || 0) >= 0
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {(act.points || 0) >= 0 ? `+${act.points}` : act.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CREATOR FOOTER */}
        <section className="bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Rocket size={28} />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Crown size={13} className="text-amber-400" />
                  <span>About This Platform</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Why RotaStar Was Created</h2>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                RotaStar was initiated by the President and Secretary of RAC PSVPEC to inspire active member involvement and celebrate impactful service.
              </p>

              <div className="pt-4 border-t border-violet-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
                    <Code size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Developed & Designed with pride by:</p>
                    <p className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      👑 Rtr. Abirami G <span className="text-slate-400 font-normal">| Secretary (2026–2027)</span>
                    </p>
                    <p className="text-xs text-violet-300 font-medium">Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                  <Heart size={14} className="text-rose-400 shrink-0" />
                  <span>RAC PSVPEC • A.U.R.A • RID 3233</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 📋 DEDICATED VIEW CONDUCTED EVENTS LEDGER MODAL */}
      {showViewEventsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-violet-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowViewEventsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between gap-3 mb-5 pr-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Layers size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Conducted Events Log</h2>
                  <p className="text-xs text-slate-400">Official ledger of executed projects ({completedEventsList.length})</p>
                </div>
              </div>

              {showAdminPanel && (
                <button
                  onClick={() => {
                    setShowViewEventsModal(false);
                    setShowAddCompletedModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>+ Record</span>
                </button>
              )}
            </div>

            {completedEventsList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-violet-950 text-sm">
                No conducted events logged yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1.5">
                {completedEventsList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-violet-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {ev.avenue}
                        </span>
                        <span className="text-amber-400 font-bold">{ev.eventDate}</span>
                      </div>

                      <h5 className="font-extrabold text-sm text-white">{ev.eventName}</h5>
                      {ev.description && <p className="text-slate-300 text-[11px] mt-0.5">{ev.description}</p>}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1.5 font-medium">
                        <span>Chair: <strong className="text-amber-300">{ev.chairperson}</strong></span>
                        <span>Sec: <strong className="text-violet-300">{ev.secretary}</strong></span>
                      </div>
                    </div>

                    {showAdminPanel && (
                      <button
                        onClick={() => handleDeleteCompletedEvent(ev.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition self-end sm:self-center shrink-0 cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🛠️ ADMIN RECORD COMPLETED EVENT MODAL */}
      {showAddCompletedModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAddCompletedModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <PlusCircle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Record Completed Event</h2>
                <p className="text-xs text-slate-400">Add to official club records and auto-calculate totals</p>
              </div>
            </div>

            <form onSubmit={handleRecordCompletedEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joy of Giving Blood Donation"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                    Avenue of Service *
                  </label>
                  <select
                    value={eventAvenue}
                    onChange={(e) => setEventAvenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  >
                    <option value="Community Service">Community Service</option>
                    <option value="Club Service">Club Service</option>
                    <option value="Professional Development">Professional Development</option>
                    <option value="International Service">International Service</option>
                    <option value="Multi-Avenue">Multi-Avenue</option>
                    <option value="General / GBM">General / GBM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Event Chairperson (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rtr. John"
                    value={chairperson}
                    onChange={(e) => setChairperson(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Event Secretary (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rtr. Sarah"
                    value={secretary}
                    onChange={(e) => setSecretary(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of beneficiaries, participation, and results..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={recordSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {recordSubmitting ? (
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Record & Auto-Update Milestones</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ANNOUNCEMENT MODAL */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowAnnounceModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Megaphone size={22} />
              </div>
              <h2 className="text-xl font-bold text-white">Broadcast Urgent Notice</h2>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Notice Priority
                </label>
                <select
                  value={announceType}
                  onChange={(e) => setAnnounceType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                >
                  <option value="urgent">Urgent Alert (Red Banner)</option>
                  <option value="event">Event Update (Gold Banner)</option>
                  <option value="info">Important Notice (Violet Banner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Headline / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GBM Postponed to Friday 4:00 PM"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Detailed Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why, venue or link, and next actions..."
                  value={announceMessage}
                  onChange={(e) => setAnnounceMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={announceSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50 cursor-pointer"
              >
                {announceSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <span>Publish Notice to All Dashboards</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LEVEL-UP MODAL */}
      {showLevelUpModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowLevelUpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 mx-auto mb-4 animate-bounce">
              <PartyPopper size={40} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2">
              <Zap size={14} />
              <span>Level Up Achieved</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              Congratulations Champ! 🎉
            </h2>

            <p className="text-amber-400 font-bold text-base mb-4">
              You've officially unlocked Level {levelUpData.newLevel}!
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-violet-900/50 mb-6 text-left">
              <p className="text-xs text-amber-300/90 italic leading-relaxed">
                {levelUpData.quote}
              </p>
            </div>

            <button
              onClick={() => setShowLevelUpModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 text-white font-bold transition shadow-xl cursor-pointer"
            >
              Keep Leveling Up! 🚀
            </button>
          </div>
        </div>
      )}

      {/* BADGE MODAL */}
      {unlockedBadgeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setUnlockedBadgeModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-amber-500 border-2 border-amber-400/40 flex items-center justify-center text-white mx-auto mb-4 animate-pulse">
              {renderBadgeIcon(unlockedBadgeModal.icon, true)}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2">
              <Sparkles size={14} />
              <span>New Achievement Unlocked!</span>
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              {unlockedBadgeModal.title}
            </h2>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {unlockedBadgeModal.description}
            </p>

            <button
              onClick={() => setUnlockedBadgeModal(null)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 text-white font-bold transition shadow-xl text-sm cursor-pointer"
            >
              Claim Badge & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}