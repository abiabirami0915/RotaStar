import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Trophy,
  CheckCircle,
  Award,
  FileText,
  ChevronRight,
  Shield,
  LogOut,
  Clock,
  XCircle,
  User,
} from "lucide-react";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    currentUser,
    userData,
    logout,
    isAdmin,
    isSuperAdmin,
  } = useAuth();

  const [rank, setRank] = useState("-");
  const [loadingRank, setLoadingRank] = useState(true);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // GET CURRENT USER RANK
  useEffect(() => {
    if (!currentUser) return;

    const usersQuery = query(collection(db, "users"));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        users.sort(
          (a, b) =>
            (b.totalPoints || 0) - (a.totalPoints || 0)
        );

        const currentIndex = users.findIndex(
          (user) => user.id === currentUser.uid
        );

        if (currentIndex !== -1) {
          setRank(currentIndex + 1);
        } else {
          setRank("-");
        }

        setLoadingRank(false);
      },
      (error) => {
        console.error("Rank error:", error);
        setLoadingRank(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // GET RECENT ACTIVITIES
  useEffect(() => {
    if (!currentUser) return;

    const activitiesQuery = query(
      collection(db, "activities"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activityList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        activityList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setActivities(activityList);
        setLoadingActivities(false);
      },
      (error) => {
        console.error("Activities error:", error);
        setLoadingActivities(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const getLevel = (points = 0) => {
    if (points >= 1000) return "RotaStar Elite";
    if (points >= 600) return "Gold Rotaractor";
    if (points >= 300) return "Active Rotaractor";
    if (points >= 100) return "Rising Star";
    return "Green Rotaractor";
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Just now";
    return timestamp.toDate().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const totalPoints = userData?.totalPoints || 0;
  const userName = userData?.name || currentUser?.displayName || "Rotaractor";
  const userRole = userData?.role || "Member";
  const profilePic = userData?.photoURL || currentUser?.photoURL;
  const level = getLevel(totalPoints);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-black text-white text-lg">
                R
              </div>
              <div>
                <div className="text-xl font-black">
                  Rota<span className="text-rose-500">Star</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  PSVPEC
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/leaderboard")}
                className="hidden sm:flex px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Leaderboard
              </button>

              {(isAdmin || isSuperAdmin) && (
                <button
                  onClick={() => navigate("/admin")}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition text-sm"
                >
                  <Shield size={16} />
                  Admin Panel
                </button>
              )}

              {/* PROFILE BUTTON */}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-rose-500 transition"
                title="View Profile"
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                    <User size={18} />
                  </div>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <LogOut size={17} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* WELCOME BANNER */}
        <section className="rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 p-6 sm:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                onClick={() => navigate("/profile")}
                className="cursor-pointer group relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-rose-500/40 bg-slate-950 flex items-center justify-center shrink-0"
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={30} className="text-slate-500" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <Trophy size={14} />
                  Current Status
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white">
                  Hello, {userName}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Role: <span className="text-white font-semibold">{userRole}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-xl px-5 py-4 self-start lg:self-auto">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Trophy size={25} className="text-rose-400" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">
                  Level
                </div>
                <div className="text-lg font-bold text-rose-400">{level}</div>
              </div>
            </div>
          </div>
        </section>

        {/* STAT CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Flame size={25} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Points</p>
                <p className="text-3xl font-black text-white">{totalPoints}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Trophy size={25} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Current Rank</p>
                <p className="text-3xl font-black text-white">
                  {loadingRank ? "..." : `#${rank}`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={25} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Attendance Rate</p>
                <p className="text-3xl font-black text-white">
                  {userData?.attendanceRate || 100}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Award size={25} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Badges Earned</p>
                <p className="text-3xl font-black text-white">
                  {userData?.badges?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* IMPORTANT ACTIONS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <button
            onClick={() => navigate("/request-points")}
            className="text-left group bg-gradient-to-r from-rose-600 to-orange-500 rounded-2xl p-6 shadow-xl hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
                  <FileText size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Request Points</h2>
                  <p className="text-white/75 text-sm mt-1">
                    Submit your activity and request points
                  </p>
                </div>
              </div>
              <ChevronRight
                size={25}
                className="text-white group-hover:translate-x-1 transition"
              />
            </div>
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="text-left group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-rose-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Trophy size={28} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">View Leaderboard</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Check your position and club rankings
                  </p>
                </div>
              </div>
              <ChevronRight
                size={25}
                className="text-slate-500 group-hover:translate-x-1 transition"
              />
            </div>
          </button>
        </section>

        {/* ADMIN SECTION */}
        {(isAdmin || isSuperAdmin) && (
          <section className="mb-6">
            <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Shield size={21} className="text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Controls</h2>
                  <p className="text-sm text-slate-400">
                    Manage member points and requests
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition"
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">Point Management</p>
                    <p className="text-xs text-slate-500 mt-1">Add or deduct points</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500" />
                </button>

                <button
                  onClick={() => navigate("/admin/requests")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition"
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">Point Requests</p>
                    <p className="text-xs text-slate-500 mt-1">Review member requests</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* RECENT ACTIVITY */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Recent Point Activity</h2>
          </div>

          <div className="p-6 space-y-3">
            {loadingActivities && (
              <div className="text-slate-500 text-sm py-4 text-center">
                Loading recent activities...
              </div>
            )}

            {!loadingActivities && activities.length === 0 && (
              <div className="text-slate-500 text-sm py-4 text-center">
                No recent activity recorded yet.
              </div>
            )}

            {!loadingActivities &&
              activities.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {item.activityName || "Activity"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <Clock size={13} />
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  {item.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold">
                      <XCircle size={14} /> Rejected
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold">
                      +{item.points || 0} pts
                    </span>
                  )}
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}