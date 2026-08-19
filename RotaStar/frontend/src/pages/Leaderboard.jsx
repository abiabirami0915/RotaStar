import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { ArrowLeft, Trophy, Medal, User } from "lucide-react";

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
    if (index === 0) return <Medal className="text-yellow-400" size={24} />;
    if (index === 1) return <Medal className="text-slate-300" size={24} />;
    if (index === 2) return <Medal className="text-amber-600" size={24} />;
    return <span className="font-bold text-slate-500 text-sm">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <div className="text-xl font-black tracking-tight">
            <span className="text-rose-500">Rota</span>
            <span className="text-white">Star</span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Trophy size={24} className="text-rose-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Leaderboard</h1>
            <p className="text-slate-400 text-sm">
              See who's leading the pack in community contribution
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            Loading rankings...
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/60">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`p-4 sm:p-5 flex items-center justify-between hover:bg-slate-850/50 transition-colors ${
                    index === 0 ? "bg-amber-500/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {getRankBadge(index)}
                    </div>

                    <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name || "Member"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-slate-500" />
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-white text-base">
                        {user.name || "Anonymous Member"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.role || "Member"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-lg text-rose-400">
                      {user.totalPoints || 0}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">pts</span>
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