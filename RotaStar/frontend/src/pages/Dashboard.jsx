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
  Crown,
  Sparkles,
  X,
  Target,
  Users,
  Zap,
  PartyPopper,
  Calendar,
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
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
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

// Safe dynamic asset resolution for Vite + Vercel
const getAssetUrl = (name) => new URL(`../assets/${name}`, import.meta.url).href;

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin, logout } = useAuth();

  const [allUserActivities, setAllUserActivities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [userRank, setUserRank] = useState("-");

  // Announcement Modal States
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announceType, setAnnounceType] = useState("urgent");
  const [announceSubmitting, setAnnounceSubmitting] = useState(false);

  // Popups & Modal States
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ oldLevel: 1, newLevel: 1, quote: "" });
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState(null);
  const [hasInitializedBadges, setHasInitializedBadges] = useState(false);

  // Image load fallback states
  const [clubLogoError, setClubLogoError] = useState(false);
  const [auraLogoError, setAuraLogoError] = useState(false);
  const [districtLogoError, setDistrictLogoError] = useState(false);

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

  // Level-Up detection
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

  // Badge Unlock detection
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
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Leaderboard Rank Sync
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        points: docSnap.data().totalPoints || 0,
      }));

      allUsers.sort((a, b) => b.points - a.points);
      const rankIndex = allUsers.findIndex((u) => u.id === currentUser?.uid);
      setUserRank(rankIndex !== -1 ? `#${rankIndex + 1}` : "-");
    });

    return () => unsubUsers();
  }, [currentUser]);

  // Activities Sync
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
      case "Crown":
        return <Crown size={22} className={color} />;
      case "Award":
        return <Award size={22} className={color} />;
      case "Trophy":
        return <Trophy size={22} className={color} />;
      case "Flame":
        return <Flame size={22} className={color} />;
      case "Shield":
        return <Shield size={22} className={color} />;
      case "Zap":
        return <Zap size={22} className={color} />;
      default:
        return <Sparkles size={22} className={color} />;
    }
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-violet-900/50 shadow-lg">
              {!clubLogoError ? (
                <img
                  src={getAssetUrl("club-logo.png")}
                  alt="RAC PSVPEC"
                  className="h-8 w-auto object-contain rounded-lg"
                  onError={() => setClubLogoError(true)}
                />
              ) : (
                <span className="text-[10px] font-bold text-amber-400 px-1">PSV</span>
              )}

              <div className="h-5 w-px bg-violet-900/60" />

              {!auraLogoError ? (
                <img
                  src={getAssetUrl("aura-logo.png")}
                  alt="AURA"
                  className="h-7 w-auto object-contain rounded-lg"
                  onError={() => setAuraLogoError(true)}
                />
              ) : (
                <span className="text-[10px] font-bold text-violet-400 px-1">AURA</span>
              )}

              <div className="h-5 w-px bg-violet-900/60" />

              {!districtLogoError ? (
                <img
                  src={getAssetUrl("district-logo.png")}
                  alt="District"
                  className="h-6 w-auto object-contain rounded-lg"
                  onError={() => setDistrictLogoError(true)}
                />
              ) : (
                <span className="text-[10px] font-bold text-amber-400 px-1">RID</span>
              )}
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-1">
                <span className="font-black text-xl text-violet-400">Rota</span>
                <span className="font-black text-xl text-amber-400">Star</span>
              </div>
              <p className="text-[10px] text-amber-300/80 tracking-tight font-semibold uppercase">
                RAC PSVPEC • AURA • RID 3234
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/events")}
              className="text-xs font-semibold text-violet-200/80 hover:text-amber-300 transition"
            >
              Events
            </button>

            <button
              onClick={() => navigate("/event-ideas")}
              className="text-xs font-semibold text-violet-200/80 hover:text-amber-300 transition"
            >
              Ideas
            </button>

            <button
              onClick={() => navigate("/leaderboard")}
              className="text-xs font-semibold text-violet-200/80 hover:text-amber-300 transition"
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
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition ml-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* LIVE URGENT BROADCAST BANNERS */}
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
                        <span className="text-[10px] text-slate-400">
                          by {ann.publishedBy || "Executive Board"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {ann.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {showAdminPanel && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(ann.id)}
                      className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white transition"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* HERO STATUS CARD */}
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
                  className="px-4 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-2 transition shadow-lg shrink-0"
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

        {/* PRIMARY ACTIONS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <button
            onClick={() => navigate("/events")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group"
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
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group"
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
            className="p-4 rounded-2xl bg-gradient-to-r from-violet-700 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-left transition shadow-xl flex items-center justify-between group col-span-2 sm:col-span-1"
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
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group"
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
            className="p-4 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group"
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

        {/* INSTITUTIONAL SHOWCASE (CARDS) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Sparkles size={20} className="text-amber-400" />
                Our Institutional Identity
              </h2>
              <p className="text-xs text-slate-400">
                The governing pillars behind the Rotaract Club of PSVPEC
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. CLUB CARD */}
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-amber-400/60 transition-all">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-950 p-2 border border-amber-400/40 mb-4 shadow-lg shadow-amber-500/10 flex items-center justify-center">
                  {!clubLogoError ? (
                    <img
                      src={getAssetUrl("club-logo.png")}
                      alt="RAC PSVPEC Club Logo"
                      className="w-full h-full object-contain"
                      onError={() => setClubLogoError(true)}
                    />
                  ) : (
                    <span className="font-black text-amber-400 text-xs text-center">PSVPEC</span>
                  )}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase mb-2">
                  Institutional Club
                </div>
                <h3 className="text-lg font-black text-white mb-2">
                  RAC PSVPEC
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College is dedicated to youth leadership, community upliftment, and empowering students through service above self.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-violet-900/40 text-[11px] text-amber-400/90 font-bold flex items-center gap-1">
                <span>College Club Charter</span>
              </div>
            </div>

            {/* 2. AURA CARD */}
            <div className="bg-gradient-to-b from-violet-950/60 to-slate-950 border border-violet-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-violet-400/70 transition-all">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-950 p-2 border border-violet-400/40 mb-4 shadow-lg shadow-violet-500/20 flex items-center justify-center">
                  {!auraLogoError ? (
                    <img
                      src={getAssetUrl("aura-logo.png")}
                      alt="AURA Theme Logo"
                      className="w-full h-full object-contain"
                      onError={() => setAuraLogoError(true)}
                    />
                  ) : (
                    <span className="font-black text-violet-400 text-xs text-center">AURA</span>
                  )}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase mb-2">
                  Presidential Theme
                </div>
                <h3 className="text-lg font-black text-white mb-2">
                  Theme AURA
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Symbolizing radiance, positive energy, and purposeful action. AURA inspires each member to shine brightly through community service, high ethical standards, and fellowship.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-violet-900/40 text-[11px] text-violet-300 font-bold flex items-center gap-1">
                <span>Radiance in Leadership</span>
              </div>
            </div>

            {/* 3. DISTRICT CARD */}
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-amber-400/60 transition-all">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-950 p-2 border border-amber-400/40 mb-4 shadow-lg shadow-amber-500/10 flex items-center justify-center">
                  {!districtLogoError ? (
                    <img
                      src={getAssetUrl("district-logo.png")}
                      alt="Rotaract District Logo"
                      className="w-full h-full object-contain"
                      onError={() => setDistrictLogoError(true)}
                    />
                  ) : (
                    <span className="font-black text-amber-400 text-xs text-center">RID 3234</span>
                  )}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase mb-2">
                  Rotary International District
                </div>
                <h3 className="text-lg font-black text-white mb-2">
                  District Network (RID)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connecting our club with hundreds of Rotaract bodies across the district, fostering multi-district projects, conferences, and global youth engagement initiatives.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-violet-900/40 text-[11px] text-amber-400/90 font-bold flex items-center gap-1">
                <span>Rotary International Partner</span>
              </div>
            </div>
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
                  <h4
                    className={`text-xs font-bold ${
                      badge.unlocked ? "text-white" : "text-slate-500"
                    }`}
                  >
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
                  <p className="text-xs text-slate-400">
                    Oversee points ledger, submissions, member directory, and feedback
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Point Management
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Award or deduct
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>

                <button
                  onClick={() => navigate("/admin/requests")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Point Requests
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Approve/Reject
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>

                <button
                  onClick={() => navigate("/admin/members")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-500 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <Users size={14} className="text-amber-400" />
                      View Members
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Roster & Delete
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>

                <button
                  onClick={() => navigate("/admin/feedback")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-amber-400" />
                      Feedback Ledger
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review ideas
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* RECENT POINT ACTIVITY */}
        <section className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 shadow-xl mb-8">
          <h2 className="font-extrabold text-base mb-4 text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Recent Point Activity
          </h2>

          {recentActivities.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">
              No recent activity recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-violet-950/80">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {act.activityName || "Activity"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {act.createdAt?.toDate
                        ? act.createdAt.toDate().toLocaleDateString()
                        : "Recent"}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      (act.points || 0) >= 0 ? "text-amber-400" : "text-rose-400"
                    }`}
                  >
                    {(act.points || 0) >= 0 ? `+${act.points}` : act.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CREATOR FOOTER CARD */}
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
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Why RotaStar Was Created
                </h2>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                RotaStar was initiated by the President and Secretary of RAC PSVPEC with a singular goal:{" "}
                <strong className="text-amber-400 font-semibold">
                  to inspire active member involvement and celebrate impactful service.
                </strong>
              </p>

              <div className="pt-4 border-t border-violet-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
                    <Code size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Developed & Designed with pride by:
                    </p>
                    <p className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      👑 Rtr. Abirami G <span className="text-slate-400 font-normal">| Secretary (2026–2027)</span>
                    </p>
                    <p className="text-xs text-violet-300 font-medium">
                      Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                  <Heart size={14} className="text-rose-400 shrink-0" />
                  <span>RAC PSVPEC • AURA</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ANNOUNCEMENT MODAL */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowAnnounceModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
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
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 text-white font-bold transition shadow-xl"
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
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 text-white font-bold transition shadow-xl text-sm"
            >
              Claim Badge & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}