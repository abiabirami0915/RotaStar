import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ArrowLeft,
  Mail,
  Award,
  Crown,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Shield,
  CreditCard,
  X,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  calculateLevelProgress,
  getMemberBadges,
  calculateMonthlyStreak,
} from "../utils/gamification";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [allUserActivities, setAllUserActivities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  const points = userData?.totalPoints || 0;
  const levelData = calculateLevelProgress(points);
  const monthlyStreak = calculateMonthlyStreak(allUserActivities);
  const memberBadges = getMemberBadges(points, allUserActivities, monthlyStreak);
  const unlockedBadges = memberBadges.filter((b) => b.unlocked);

  useEffect(() => {
    if (userData) {
      setName(userData.name || currentUser?.displayName || "");
      setUsername(userData.username || "");
      setPhotoURL(userData.photoURL || currentUser?.photoURL || "");
    }
  }, [userData, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "activities"), where("userId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllUserActivities(snapshot.docs.map((d) => d.data()));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
        photoURL: photoURL.trim(),
      });
      showToast("Profile details updated successfully!");
    } catch (err) {
      console.error("Profile save error:", err);
      showToast("Failed to save profile changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderBadgeIcon = (iconName) => {
    switch (iconName) {
      case "Crown":
        return <Crown size={18} className="text-amber-400" />;
      case "Award":
        return <Award size={18} className="text-amber-400" />;
      case "Trophy":
        return <Trophy size={18} className="text-amber-400" />;
      case "Flame":
        return <Flame size={18} className="text-amber-400" />;
      case "Shield":
        return <Shield size={18} className="text-amber-400" />;
      case "Zap":
        return <Zap size={18} className="text-amber-400" />;
      default:
        return <Sparkles size={18} className="text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
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

      {/* MAIN CONTAINER */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* PROFILE HEADER & ID CARD TRIGGER */}
        <div className="bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-500/30 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-amber-400/60 bg-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={38} className="text-violet-400" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Sparkles size={13} />
                <span>Member Profile</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {userData?.name || currentUser?.displayName || "Member"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="capitalize text-violet-300 font-semibold">{userData?.role || "Member"}</span>
                {userData?.username && ` • @${userData.username}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowIdCardModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition shrink-0 cursor-pointer"
          >
            <CreditCard size={18} />
            <span>View Digital ID</span>
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
            {toast.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* EDIT PROFILE FORM */}
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Edit Profile Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-500 text-sm">@</span>
                <input
                  type="text"
                  placeholder="rotarian_id"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                Profile Photo Direct URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                Registered Email
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ""}
                className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <span>Save Profile Updates</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* 🚀 DIGITAL MEMBER ID CARD MODAL */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full relative">
            <button
              onClick={() => setShowIdCardModal(false)}
              className="absolute -top-12 right-0 p-2 rounded-full text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>

            {/* THE PASS CARD */}
            <div className="w-full bg-gradient-to-br from-violet-950 via-slate-950 to-slate-900 border-2 border-amber-400/70 rounded-3xl p-7 shadow-2xl shadow-violet-900/50 relative overflow-hidden text-center select-none">
              {/* CARD ACCENT GLOW */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

              {/* ROTARACT BADGE HEADER */}
              <div className="flex items-center justify-between border-b border-violet-900/60 pb-4 mb-5">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Crown size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white tracking-wide">ROTASTAR</h3>
                    <p className="text-[9px] text-amber-300/90 uppercase font-semibold">RAC PSVPEC</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
                    {levelData.levelTitle}
                  </span>
                </div>
              </div>

              {/* MEMBER AVATAR */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-3xl overflow-hidden border-2 border-amber-400 bg-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/20">
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={44} className="text-violet-400" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full shadow-md font-black text-[10px]">
                  ★
                </div>
              </div>

              {/* MEMBER IDENTITY */}
              <h2 className="text-xl font-black text-white">{name || "Club Member"}</h2>
              <p className="text-xs text-amber-400 font-semibold mt-0.5 capitalize">
                {userData?.role || "Active Member"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {username ? `@${username}` : currentUser?.email}
              </p>

              {/* CARD METRICS */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 border border-violet-900/50 rounded-2xl p-3 my-5">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Pts</span>
                  <span className="text-base font-black text-amber-400">{points}</span>
                </div>
                <div className="border-x border-violet-900/40">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Level</span>
                  <span className="text-base font-black text-white">{levelData.currentLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Streak</span>
                  <span className="text-base font-black text-amber-400">{monthlyStreak}m</span>
                </div>
              </div>

              {/* UNLOCKED BADGE ICONS SHOWCASE */}
              <div className="mb-5">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
                  Earned Milestone Badges
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {unlockedBadges.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No badges unlocked yet</span>
                  ) : (
                    unlockedBadges.slice(0, 5).map((badge) => (
                      <div
                        key={badge.id}
                        title={badge.title}
                        className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-sm"
                      >
                        {renderBadgeIcon(badge.icon)}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* FOOTER VERIFICATION */}
              <div className="pt-3 border-t border-violet-900/50 text-[9px] text-slate-500 font-medium">
                Official Digital Member Card • Rotaract Club of PSVPEC
              </div>
            </div>

            <p className="text-center text-slate-400 text-xs mt-3">
              Take a screenshot to share on LinkedIn, Instagram, or WhatsApp! 🌟
            </p>
          </div>
        </div>
      )}
    </div>
  );
}