import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { ArrowLeft, Trophy, Medal, User, Crown, Sparkles } from "lucide-react";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, "users"));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        usersList.sort(
          (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)
        );

        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error("Leaderboard error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return <Crown className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={26} />;
    if (index === 1) return <Medal className="text-violet-200 drop-shadow-[0_0_6px_rgba(221,214,254,0.4)]" size={24} />;
    if (index === 2) return <Medal className="text-amber-600" size={24} />;
    return <span className="font-bold text-violet-400/60 text-sm">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-violet-300 hover:text-amber-300 transition-colors text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <div className="text-xl font-black tracking-tight">
            <span className="text-violet-400">Rota</span>
            <span className="text-amber-400">Star</span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Trophy size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              Royal Leaderboard
              <Sparkles size={20} className="text-amber-400" />
            </h1>
            <p className="text-slate-400 text-sm">
              See who's leading the pack in community contribution
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-2xl p-12 text-center text-slate-500">
            Loading rankings...
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-violet-900/50 rounded-3xl overflow-hidden shadow-2xl shadow-violet-950/50">
            <div className="divide-y divide-violet-950/80">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`p-4 sm:p-5 flex items-center justify-between transition-colors ${
                    index === 0
                      ? "bg-gradient-to-r from-amber-500/15 via-violet-950/30 to-transparent hover:from-amber-500/20 border-l-4 border-l-amber-400"
                      : index === 1
                      ? "bg-gradient-to-r from-violet-500/10 via-slate-900/40 to-transparent hover:from-violet-500/15 border-l-4 border-l-violet-400"
                      : index === 2
                      ? "bg-gradient-to-r from-amber-700/10 via-slate-900/40 to-transparent hover:from-amber-700/15 border-l-4 border-l-amber-600"
                      : "hover:bg-violet-950/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {getRankBadge(index)}
                    </div>

                    <div className={`w-11 h-11 rounded-full overflow-hidden border-2 bg-slate-950 flex items-center justify-center shrink-0 shadow-md ${
                      index === 0
                        ? "border-amber-400 shadow-amber-500/20"
                        : index === 1
                        ? "border-violet-300 shadow-violet-500/20"
                        : index === 2
                        ? "border-amber-600"
                        : "border-slate-800"
                    }`}>
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name || "Member"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={20} className={index === 0 ? "text-amber-400" : "text-violet-400"} />
                      )}
                    </div>

                    <div>
                      <p className={`font-bold text-base ${index === 0 ? "text-amber-300 font-extrabold" : "text-white"}`}>
                        {user.name || "Anonymous Member"}
                      </p>
                      <p className="text-xs text-violet-300/70 capitalize">
                        {user.role || "Member"}
                        {user.username && ` • @${user.username}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-black text-lg ${index === 0 ? "text-amber-400 text-xl" : "text-amber-300"}`}>
                      {user.totalPoints || 0}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-semibold">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}