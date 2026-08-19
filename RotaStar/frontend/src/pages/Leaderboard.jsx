import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { Trophy, Medal, Flame, Shield, ArrowLeft, LogOut, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Helper function to resolve dynamic levels and badge styles based on total points
  const getBadgeInfo = (points = 0) => {
    if (points >= 1000) {
      return {
        level: "RotarStar Elite",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      };
    }
    if (points >= 600) {
      return {
        level: "Gold Rotaractor",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }
    if (points >= 300) {
      return {
        level: "Active Rotaractor",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    }
    if (points >= 100) {
      return {
        level: "Rising Star",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }
    return {
      level: "Green Rotaractor",
      color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    };
  };

  useEffect(() => {
    const usersQuery = query(collection(db, "users"));

    // Real-time listener for live rank updates
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort Algorithm:
      // 1. Primary: Descending Total Points
      // 2. Secondary (Tie-Breaker): Earliest timestamp of reaching the score (lastPointUpdateAt)
      usersList.sort((a, b) => {
        const pointsA = a.totalPoints || 0;
        const pointsB = b.totalPoints || 0;

        if (pointsB !== pointsA) {
          return pointsB - pointsA;
        }

        // Tie-breaker: Compare lastPointUpdateAt timestamps if available
        const timeA = a.lastPointUpdateAt?.toMillis ? a.lastPointUpdateAt.toMillis() : 0;
        const timeB = b.lastPointUpdateAt?.toMillis ? b.lastPointUpdateAt.toMillis() : 0;

        return timeA - timeB; // Earliest timestamp ranks higher
      });

      setLeaderboardData(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <Trophy size={18} />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40">
          <Medal size={18} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40">
          <Medal size={18} />
        </div>
      );
    }
    return <span className="font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-2xl font-black text-rose-500 tracking-tight">
              Rota<span className="text-white">Star</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold hover:bg-rose-500/20 transition-all"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-2xl border border-rose-500/20 shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Trophy size={16} />
              <span>Rotaract Club of PSVPEC</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Official Leaderboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Live standings automatically updated after approved activities.
            </p>
          </div>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading standings...</div>
          ) : leaderboardData.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No members found in database.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Member</th>
                    <th className="py-4 px-6">Level</th>
                    <th className="py-4 px-6 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {leaderboardData.map((member, index) => {
                    const rank = index + 1;
                    const badge = getBadgeInfo(member.totalPoints || 0);
                    const isCurrentUser = member.id === userData?.uid;

                    return (
                      <tr
                        key={member.id}
                        className={`transition-colors ${
                          isCurrentUser
                            ? "bg-rose-500/10 border-l-4 border-l-rose-500"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">{getRankBadge(rank)}</div>
                        </td>

                        {/* Name & Role Column */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{member.name || "Unknown Member"}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {member.role || "Member"}
                          </div>
                        </td>

                        {/* Level Badge Column */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                          >
                            <Award size={14} />
                            {badge.level}
                          </span>
                        </td>

                        {/* Points Column */}
                        <td className="py-4 px-6 text-right font-extrabold text-white text-base">
                          <div className="flex items-center justify-end gap-1 text-amber-400">
                            <Flame size={16} />
                            <span>{member.totalPoints || 0}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}