import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Trophy,
  Flame,
  CheckCircle,
  Award,
  FileText,
  ChevronRight,
  Shield,
  LogOut,
  User,
  Crown,
  Sparkles,
  Gift,
  X,
  Target,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin, logout } = useAuth();

  const [recentActivities, setRecentActivities] = useState([]);
  const [userRank, setUserRank] = useState("-");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Level Logic: 0-100: Level 1, 101-200: Level 2, 201-300: Level 3...
  const points = userData?.totalPoints || 0;
  const currentLevelNumber =
    points <= 0 ? 1 : Math.floor((points - 1) / 100) + 1;
  const levelTitle = `Level ${currentLevelNumber}`;

  // Check for one-time welcome bonus popup
  useEffect(() => {
    const isNewUser = sessionStorage.getItem("showWelcomeReward");
    if (isNewUser === "true") {
      setShowWelcomeModal(true);
      sessionStorage.removeItem("showWelcomeReward");
    }
  }, []);

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

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "activities"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubActivities = onSnapshot(
      q,
      (snapshot) => {
        const acts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setRecentActivities(acts);
      },
      (err) => console.log("Activities listener notice:", err)
    );

    return () => unsubActivities();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-violet-600/30 shrink-0">
              <Crown size={20} className="text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-lg text-violet-400">
                  Rota
                </span>
                <span className="font-extrabold tracking-tight text-lg text-amber-400">
                  Star
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 tracking-tight font-medium">
                Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
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
        {/* HERO STATUS CARD */}
        <div
          onClick={() => navigate("/profile")}
          className="cursor-pointer bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-500/30 hover:border-amber-500/60 rounded-3xl p-6 sm:p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl transition-all group hover:shadow-violet-900/20"
        >
          <div className="flex items-center gap-4">
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
                Role: <span className="capitalize text-violet-300 font-semibold">{userData?.role || "Member"}</span>
                {userData?.username && ` • @${userData.username}`}
                <span className="text-amber-400 font-medium ml-2 underline">Edit Profile →</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 sm:px-6 flex items-center gap-4 shadow-lg shadow-amber-500/5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider">
                Current Level
              </p>
              <p className="text-lg font-black text-amber-400 tracking-wide">
                {levelTitle}
              </p>
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

          <div className="bg-slate-900/90 border border-violet-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Attendance Rate</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
          </div>

          <div className="bg-slate-900/90 border border-violet-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
              <Award size={16} className="text-amber-400" />
              <span>Badges Earned</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {currentLevelNumber > 1 ? currentLevelNumber - 1 : 0}
            </p>
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate("/request-points")}
            className="p-6 rounded-2xl bg-gradient-to-r from-violet-700 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-left transition shadow-xl shadow-violet-950 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/15 rounded-xl text-amber-200">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Request Points
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Submit your activity and claim club points
                </p>
              </div>
            </div>
            <ChevronRight size={22} className="text-amber-200 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="p-6 rounded-2xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-left transition shadow-xl flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-600/10 text-amber-400 rounded-xl border border-violet-500/20">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Royal Leaderboard
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View standings, tiers, and top ranks
                </p>
              </div>
            </div>
            <ChevronRight size={22} className="text-violet-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* VISION & MISSION SECTION */}
        <section className="bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Target size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Sparkles size={13} />
                <span>Our Vision & Purpose</span>
              </div>
              <h2 className="text-xl font-black text-white mb-2">
                "Engage in impactful service, earn rightful recognition"
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                RotaStar empowers the members of the{" "}
                <strong className="text-white font-semibold">
                  Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College
                </strong>{" "}
                by providing a transparent, merit-driven system. Every community initiative, meeting attendance, and leadership contribution is celebrated and recognized.
              </p>
            </div>
          </div>
        </section>

        {/* ADMIN PANEL */}
        {(isAdmin || isSuperAdmin) && (
          <section className="mb-6">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Shield size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Controls</h2>
                  <p className="text-xs text-slate-400">
                    Oversee points ledger, submissions, and member privileges
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-violet-900/40 hover:border-amber-500/40 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Point Management
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Award or deduct points
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
                      Approve/Reject requests
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
                      <Crown size={14} className="text-amber-400" />
                      View Members
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Roster & Super Admin delete
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* RECENT POINT ACTIVITY */}
        <section className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 shadow-xl">
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
      </main>

      {/* 50 STARTER POINTS WELCOME REWARD POPUP MODAL */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-violet-950 relative text-center animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/10">
              <Gift size={32} />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              Welcome to RotaStar!
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Congratulations! You have received{" "}
              <strong className="text-amber-400 font-bold">+50 Bonus Points</strong>{" "}
              as a welcome reward for joining the{" "}
              <strong className="text-white">
                Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College
              </strong>.
            </p>

            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-700 via-purple-600 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold transition shadow-xl shadow-violet-950 border border-amber-400/30"
            >
              Claim & Explore Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}