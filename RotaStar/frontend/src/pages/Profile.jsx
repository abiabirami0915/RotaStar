import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Award,
  Flame,
  Calendar,
  Save,
  ArrowLeft,
  Crown,
  CheckCircle2,
  Lock,
  Sparkles,
  Camera,
  Loader2,
  Briefcase,
  IdCard,
} from "lucide-react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  calculateLevelProgress,
  getMemberBadges,
  calculateMonthlyStreak,
} from "../utils/gamification";

const CLUB_ROLES = [
  "General Member",
  "Board Member",
  "Director - Club Service",
  "Director - Community Service",
  "Director - Professional Development",
  "Director - International Service",
  "Director - Youth Service",
  "Director - Public Relations & Media",
  "Director - Green Rotaract & Environment",
  "Director - Digital Communications",
  "Sergeant-At-Arms",
  "Treasurer",
  "Joint Secretary",
  "Vice President",
  "Secretary",
  "President",
  "Rotary - Rotaract Committee Head",
];

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [role, setRole] = useState("General Member");
  const [photoURL, setPhotoURL] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [allUserActivities, setAllUserActivities] = useState([]);

  // Live profile sync
  useEffect(() => {
    if (!userData) return;
    setName(userData.name || currentUser?.displayName || "");
    setUsername(userData.username || "");
    setPhone(userData.phone || "");
    setDepartment(userData.department || "");
    setYearOfStudy(userData.yearOfStudy || "");
    setRole(userData.role || "General Member");
    setPhotoURL(userData.photoURL || currentUser?.photoURL || "");
  }, [userData, currentUser]);

  // Sync user activities for badge calculation
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.activities) setAllUserActivities(d.activities);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Gamification Metrics
  const points = userData?.totalPoints || 0;
  const levelData = calculateLevelProgress(points);
  const monthlyStreak = calculateMonthlyStreak(allUserActivities);
  const memberBadges = getMemberBadges(points, allUserActivities, monthlyStreak);
  const unlockedBadgesCount = memberBadges.filter((b) => b.unlocked).length;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        department: department.trim(),
        yearOfStudy: yearOfStudy.trim(),
        role: role.trim(),
        photoURL: photoURL.trim(),
        updatedAt: new Date(),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-lg text-violet-400">
              Member
            </span>
            <span className="font-extrabold tracking-tight text-lg text-amber-400">
              Profile
            </span>
          </div>

          <button
            onClick={() => setShowIdCardModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <IdCard size={15} />
            <span className="hidden sm:inline">Digital ID</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* HEADER PROFILE SUMMARY CARD */}
        <div className="bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-500/30 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-amber-400/60 bg-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/10">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      setPhotoURL("");
                    }}
                  />
                ) : (
                  <User size={48} className="text-violet-400" />
                )}
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase mb-1.5">
                <Crown size={12} />
                <span>{role}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {name || "RAC PSVPEC Member"}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser?.email} {username && `• @${username}`}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 pt-4 border-t border-violet-900/50 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Merit</span>
                  <span className="font-extrabold text-amber-400">{points} pts</span>
                </div>
                <div className="h-6 w-px bg-violet-900/60" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Tier</span>
                  <span className="font-extrabold text-white">{levelData.levelTitle}</span>
                </div>
                <div className="h-6 w-px bg-violet-900/60" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Badges</span>
                  <span className="font-extrabold text-violet-300">{unlockedBadgesCount} Earned</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EDIT PROFILE FORM */}
        <form onSubmit={handleSaveProfile} className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-violet-900/50">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={18} className="text-amber-400" />
                Edit Member Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your identity, club role portfolio, and contact details
              </p>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold animate-in fade-in">
                <CheckCircle2 size={14} />
                <span>Saved successfully!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Full Name (with Initials)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rtr. Abirami G"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* USERNAME */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Username / Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 text-sm font-bold">@</span>
                <input
                  type="text"
                  placeholder="abiramig"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-violet-900/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            {/* 👑 CLUB ROLE / PORTFOLIO SELECTOR */}
            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase size={14} className="text-amber-400" />
                <span>Club Role / Board Portfolio</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-amber-500/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
              >
                {CLUB_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-slate-950 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* PHONE NUMBER */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* DEPARTMENT / BRANCH */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Department / Branch
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech IT / CSE / ECE"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* YEAR OF STUDY */}
            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            {/* AVATAR IMAGE URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Camera size={14} className="text-amber-400" />
                <span>Profile Avatar Image URL (Imgur / Cloudinary / Drive Direct Link)</span>
              </label>
              <input
                type="url"
                placeholder="https://i.imgur.com/your-image.png"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-2xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Paste any valid online image address to update your avatar across the dashboard and digital member ID card.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* DIGITAL MEMBER ID CARD MODAL */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowIdCardModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase mb-4">
              Rotaract Club of PSVPEC
            </div>

            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 mx-auto mb-3 bg-slate-950 flex items-center justify-center">
              {photoURL ? (
                <img src={photoURL} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-violet-400" />
              )}
            </div>

            <h3 className="text-lg font-black text-white">{name || "Member"}</h3>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{role}</p>
            {department && <p className="text-[11px] text-slate-400 mt-0.5">{department} • {yearOfStudy}</p>}

            <div className="mt-4 pt-4 border-t border-violet-900/50 flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Tier</span>
                <span className="font-extrabold text-white">{levelData.levelTitle}</span>
              </div>
              <div className="h-6 w-px bg-violet-900/50" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Points</span>
                <span className="font-extrabold text-amber-400">{points} pts</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}