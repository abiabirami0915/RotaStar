import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Users,
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

  // Determine Level / Tier
  const points = userData?.totalPoints || 0;
  let levelTitle = "Green Rotaractor";
  if (points >= 500) levelTitle = "Platinum Star";
  else if (points >= 300) levelTitle = "Gold Star";
  else if (points >= 150) levelTitle = "Silver Star";
  else if (points >= 50) levelTitle = "Bronze Star";

  // Calculate Rank
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

  // Fetch Recent Activities
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
      (err) => console.log("Activities subscription notice:", err)
    );

    return () => unsubActivities();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-black text-white shadow-lg shadow-rose-600/20">
              R
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-rose-500">
                Rota
              </span>
              <span className="font-extrabold tracking-tight text-lg text-white">
                Star
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider uppercase font-semibold">
                PSVPEC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/leaderboard")}
              className="text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Leaderboard
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center hover:border-rose-500 transition"
              title="Profile"
            >
              {userData?.photoURL || currentUser?.photoURL ? (
                <img
                  src={userData?.photoURL || currentUser?.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className="text-slate-400" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition ml-2"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN BODY */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* HERO STATUS CARD */}
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/20 rounded-3xl p-6 sm:p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              {userData?.photoURL || currentUser?.photoURL ? (
                <img
                  src={userData?.photoURL || currentUser?.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={30} className="text-slate-500" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                <Trophy size={14} />
                <span>Current Status</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                Hello, {userData?.name || currentUser?.displayName || "Member"}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Role: <span className="capitalize text-slate-300 font-semibold">{userData?.role || "Member"}</span>
                {userData?.username && ` • @${userData.username}`}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:px-6 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Level
              </p>
              <p className="text-base font-extrabold text-rose-400">
                {levelTitle}
              </p>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <Flame size={16} className="text-amber-500" />
              <span>Total Points</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{points}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <Trophy size={16} className="text-sky-400" />
              <span>Current Rank</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{userRank}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Attendance Rate</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <Award size={16} className="text-purple-400" />
              <span>Badges Earned</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {points >= 300 ? "3" : points >= 150 ? "2" : points >= 50 ? "1" : "0"}
            </p>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate("/request-points")}
            className="p-6 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-left transition shadow-lg shadow-rose-600/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/15 rounded-xl">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Request Points
                </h3>
                <p className="text-xs text-rose-100/90 mt-0.5">
                  Submit your activity and request club points
                </p>
              </div>
            </div>
            <ChevronRight size={22} className="text-white/80" />
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  View Leaderboard
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check your standing and club rankings
                </p>
              </div>
            </div>
            <ChevronRight size={22} className="text-slate-500" />
          </button>
        </div>

        {/* ADMIN PANEL SECTION */}
        {(isAdmin || isSuperAdmin) && (
          <section className="mb-6">
            <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Shield size={20} className="text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Controls</h2>
                  <p className="text-xs text-slate-400">
                    Manage points, verify submissions, and review member roster
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Point Management
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Award or deduct points
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </button>

                <button
                  onClick={() => navigate("/admin/requests")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Point Requests
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Approve/Reject requests
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </button>

                <button
                  onClick={() => navigate("/admin/members")}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-500 text-left transition"
                >
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                      <Users size={14} className="text-rose-400" />
                      View Members
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Directory & Super Admin delete
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-rose-400" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* RECENT POINT ACTIVITY */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="font-extrabold text-base mb-4 text-white">
            Recent Point Activity
          </h2>

          {recentActivities.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">
              No recent activity recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
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
                      (act.points || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
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
    </div>
  );
}