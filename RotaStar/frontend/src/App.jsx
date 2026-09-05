import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
  getDocs,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase/firebase";
import { AuthProvider, useAuth } from "./AuthContext";

// Core Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminPoints from "./pages/AdminPoints";
import AdminPointRequests from "./pages/AdminPointRequests";

import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Phone,
  AlertCircle,
  Loader2,
  Star,
  Trophy,
  Calendar,
  Lightbulb,
  MessageSquarePlus,
  FileText,
  ThumbsUp,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  X,
  Trash2,
  Search,
  Filter,
  Users,
  Eye,
  Inbox,
  ShieldAlert,
} from "lucide-react";

// ==========================================
// CENTRAL DATE & AVATAR FORMATTERS
// ==========================================
export const formatDisplayDate = (val) => {
  if (!val) return "Recent";
  let dateObj = null;
  if (val?.toDate) {
    dateObj = val.toDate();
  } else if (typeof val === "string" || typeof val === "number") {
    dateObj = new Date(val);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return "Recent";
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDisplayTime = (timeStr) => {
  if (!timeStr || timeStr.trim().toLowerCase() === "tba") return "Time TBA";
  const clean = timeStr.replace(".", ":").trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3];
  if (!meridiem) {
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return `${hours}:${minutes} ${meridiem.toUpperCase()}`;
};

export function MemberAvatar({ photoURL, name, size = "md" }) {
  const initials = useMemo(() => {
    if (!name) return "R";
    const parts = name.replace(/^Rtr\.?\s+/i, "").trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const dimensions =
    size === "sm"
      ? "w-8 h-8 text-[11px]"
      : size === "lg"
      ? "w-16 h-16 text-lg"
      : "w-11 h-11 text-xs";

  if (photoURL && (photoURL.startsWith("data:image") || photoURL.startsWith("https://lh3.googleusercontent.com") || photoURL.startsWith("http"))) {
    return (
      <div className={`${dimensions} rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 shrink-0`}>
        <img src={photoURL} alt={name || "Member"} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${dimensions} rounded-2xl bg-gradient-to-br from-violet-900 to-slate-950 border border-amber-500/40 text-amber-300 font-black flex items-center justify-center shrink-0 tracking-wider shadow-inner`}
    >
      {initials}
    </div>
  );
}

const CLUB_ROLES = [
  "General Member",
  "Green Rotaractor",
  "President",
  "Secretary",
  "Vice President",
  "Joint Secretary",
  "Sergeant-at-Arms",
  "Treasurer",
  "Associate Secretary",
  "Associate Sergeant-at-Arms",
  "Club Service Director",
  "Community Service Director",
  "Professional Service Director",
  "International Service Director",
  "Associate Club Service Director",
  "Associate Community Service Director",
  "Associate Professional Service Director",
  "Associate International Service Director",
  "Creative Head",
  "Creative Team Member",
  "Editorial Board Head",
  "Membership Chairman",
  "Foundation Chairman",
  "Employment Cell",
  "Blood Donation Head",
  "PRO Head",
];

// ==========================================
// 1. SIGNUP COMPONENT WITH STRENGTH METER
// ==========================================
function SignupComponent() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");
  const [role, setRole] = useState("General Member");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthDetails = useMemo(() => {
    switch (passwordScore) {
      case 0:
      case 1:
        return { label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
      case 2:
        return { label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
      case 3:
        return { label: "Good", color: "bg-blue-400", text: "text-blue-300" };
      case 4:
        return { label: "Strong", color: "bg-emerald-400", text: "text-emerald-300" };
      default:
        return { label: "", color: "bg-slate-700", text: "text-slate-500" };
    }
  }, [passwordScore]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name.trim() });

      const cleanUsername = username
        ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
        : email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department: department.trim(),
        yearOfStudy,
        role,
        totalPoints: 0,
        activities: [],
        photoURL: "",
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.code === "auth/email-already-in-use" ? "An account with this email exists." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-xl shadow-violet-900/40">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Star size={22} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 font-black text-2xl">
            <span className="text-violet-400">Rota</span>
            <span className="text-amber-400">Star</span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
            RAC PSVPEC • A.U.R.A • RID 3233
          </p>
        </div>
      </div>

      <div className="w-full max-w-xl bg-slate-900/90 border border-violet-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="mb-6">
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-400">Member Registration</p>
          <h2 className="text-2xl font-black text-white mt-0.5">Create Club Account</h2>
          <p className="text-xs text-slate-400 mt-1">Join the official recognition ledger for RAC PSVPEC.</p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Rtr. Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-bold">@</span>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Department</label>
              <div className="relative">
                <GraduationCap size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. IT / CSE / ECE"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Year of Study</label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">Club Position</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-white text-sm outline-none focus:border-amber-400"
              >
                {CLUB_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-slate-950 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Security:</span>
                    <span className={`font-bold ${strengthDetails.text}`}>{strengthDetails.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all ${
                          passwordScore > step ? strengthDetails.color : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-slate-950" /> : "Complete Registration"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered? <Link to="/login" className="text-amber-400 font-bold hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 2. PROPOSE EVENT IDEAS COMPONENT
// ==========================================
function EventIdeasPage() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin } = useAuth();

  const [ideas, setIdeas] = useState([]);
  const [eventName, setEventName] = useState("");
  const [avenue, setAvenue] = useState("Community Service");
  const [eventChair, setEventChair] = useState("");
  const [eventSecretary, setEventSecretary] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [needSuggestions, setNeedSuggestions] = useState(false);
  const [suggestionNotes, setSuggestionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "eventIdeas"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setIdeas(list);
    });
    return () => unsub();
  }, []);

  const handleProposeIdea = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDescription.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "eventIdeas"), {
        eventName: eventName.trim(),
        title: eventName.trim(),
        avenue,
        eventDescription: eventDescription.trim(),
        needSuggestions,
        suggestionNotes: suggestionNotes.trim(),
        proposerName: userData?.name || currentUser?.displayName || "Member",
        proposerRole: userData?.role || "General Member",
        proposerUid: currentUser?.uid,
        chairperson: eventChair.trim() ? { name: eventChair.trim(), role: "Designated", approved: true } : null,
        secretary: eventSecretary.trim() ? { name: eventSecretary.trim(), role: "Designated", approved: true } : null,
        suggestionsList: [],
        upvotes: 1,
        upvoters: [currentUser?.uid],
        createdAt: serverTimestamp(),
      });
      setEventName("");
      setEventDescription("");
      setSuggestionNotes("");
      setNeedSuggestions(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (idea) => {
    if (!currentUser) return;
    const upvoters = idea.upvoters || [];
    const hasUpvoted = upvoters.includes(currentUser.uid);
    const ideaRef = doc(db, "eventIdeas", idea.id);

    await updateDoc(ideaRef, {
      upvotes: increment(hasUpvoted ? -1 : 1),
      upvoters: hasUpvoted ? upvoters.filter((id) => id !== currentUser.uid) : [...upvoters, currentUser.uid],
    });
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Event </span>
            <span className="text-amber-400">Ideas Hub</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl h-fit">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">Pitch Proposal</p>
            <h2 className="text-xl font-black text-white mb-4">Propose Event</h2>

            <form onSubmit={handleProposeIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Initiative Title"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Avenue *</label>
                <select
                  value={avenue}
                  onChange={(e) => setAvenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                >
                  <option value="Community Service">Community Service</option>
                  <option value="Club Service">Club Service</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="International Service">International Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Objectives and scope..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                {submitting ? "Submitting..." : "Submit Proposal"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-violet-900/40">
              <h3 className="font-bold text-sm text-white">Community Idea Ledger</h3>
              <span className="text-xs font-bold text-slate-400">{ideas.length} Ideas Active</span>
            </div>

            {ideas.map((idea) => (
              <div key={idea.id} className="p-5 rounded-2xl bg-slate-900/90 border border-violet-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-violet-300">{idea.avenue}</span>
                  <button
                    onClick={() => handleUpvote(idea)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-violet-900/50 rounded-lg text-xs font-bold text-amber-300 hover:border-amber-400 cursor-pointer"
                  >
                    <ThumbsUp size={12} />
                    <span>{idea.upvotes || 0}</span>
                  </button>
                </div>
                <h4 className="font-extrabold text-white text-base">{idea.eventName}</h4>
                <p className="text-xs text-slate-300">{idea.eventDescription}</p>
                <div className="pt-2 border-t border-violet-950 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pitched by <strong className="text-slate-200">{idea.proposerName}</strong></span>
                  <span>{formatDisplayDate(idea.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 3. EVENTS CALENDAR
// ==========================================
function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Official </span>
            <span className="text-amber-400">Calendar</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Upcoming Club Events</h1>
          <p className="text-xs text-slate-400">Meetings, training assemblies, and service initiatives</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="p-6 rounded-3xl bg-slate-900/90 border border-violet-900/40 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">{ev.avenue || "General Event"}</p>
                <h3 className="text-lg font-black text-white mb-2">{ev.title || ev.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{ev.description}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-violet-950">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-amber-400" />
                  <span className="font-semibold">{formatDisplayDate(ev.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-violet-400" />
                  <span>{formatDisplayTime(ev.time)}</span>
                </div>
                {ev.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-rose-400" />
                    <span>{ev.venue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 4. LEADERBOARD
// ==========================================
function LeaderboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      setUsers(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Member </span>
            <span className="text-amber-400">Standings</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-black text-white">Rotaract Star Leaderboard</h2>
            <p className="text-xs text-slate-400">Recognizing consistent service and attendance across all club avenues</p>
          </div>

          <div className="divide-y divide-violet-950/80">
            {users.map((u, index) => {
              const isMe = u.id === currentUser?.uid;
              return (
                <div
                  key={u.id}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-between transition ${
                    isMe ? "bg-amber-500/10 border border-amber-500/30" : "hover:bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-7 text-center font-black text-sm shrink-0 ${
                        index === 0 ? "text-amber-400 text-base" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-slate-500"
                      }`}
                    >
                      #{index + 1}
                    </span>

                    <MemberAvatar photoURL={u.photoURL} name={u.name} size="md" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{u.name || "Member"}</span>
                        {isMe && <span className="text-[10px] text-amber-400 font-bold uppercase">(You)</span>}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {u.role || "General Member"} {u.department ? `• ${u.department}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className="font-black text-sm text-amber-400 ml-3">{u.totalPoints || 0} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 5. CLAIM POINTS
// ==========================================
function RequestPointsPage() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [activityName, setActivityName] = useState("");
  const [pointsRequested, setPointsRequested] = useState("10");
  const [whatDidYouGain, setWhatDidYouGain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activityName.trim() || !pointsRequested || !currentUser) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "pointRequests"), {
        userId: currentUser.uid,
        userName: userData?.name || currentUser.displayName || "Member",
        userRole: userData?.role || "General Member",
        activityName: activityName.trim(),
        points: Number(pointsRequested),
        pointsRequested: Number(pointsRequested),
        whatDidYouGain: whatDidYouGain.trim(),
        reason: whatDidYouGain.trim() || "Active participation and initiative",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Claim </span>
            <span className="text-amber-400">Points</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-1">Submit Point Claim</h2>
          <p className="text-xs text-slate-400 mb-6">Log service projects or committee tasks for verification.</p>

          {submitted ? (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 text-sm font-bold">
              Point claim submitted. Redirecting to Dashboard...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Activity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attended General Body Meeting #4"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Points Claimed *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={pointsRequested}
                  onChange={(e) => setPointsRequested(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">What Did You Gain? (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of tasks handled or skills developed..."
                  value={whatDidYouGain}
                  onChange={(e) => setWhatDidYouGain(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Claim for Review"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 6. MEMBER FEEDBACK SUBMISSION COMPONENT
// ==========================================
function FeedbackPage() {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin, isSuperAdmin } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const isBoardAdmin =
    Boolean(isAdmin) ||
    Boolean(isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: currentUser.uid,
        userName: userData?.name || currentUser.displayName || "Member",
        userRole: userData?.role || "General Member",
        userEmail: currentUser.email || "",
        message: feedback.trim(),
        createdAt: serverTimestamp(),
      });
      setDone(true);
      setFeedback("");
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Direct </span>
            <span className="text-amber-400">Feedback</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {isBoardAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Inbox size={18} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-300">Logged in as Executive Board / Admin</span>
            </div>
            <button
              onClick={() => navigate("/admin/feedback")}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer"
            >
              Open Feedback Inbox →
            </button>
          </div>
        )}

        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-1">Feedback to Executive Board</h2>
          <p className="text-xs text-slate-400 mb-6">Send suggestions or constructive questions straight to club leadership.</p>

          {done && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Message delivered directly to the club leadership ledger.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={4}
              required
              placeholder="Write your note here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              {submitting ? "Sending..." : "Deliver Note"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 7. 📬 DEDICATED ADMIN FEEDBACK INBOX COMPONENT
// ==========================================
function AdminFeedbackPage() {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "feedback"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Client-side date sorting with null-safe handling
        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        });

        setFeedbackList(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore feedback sync error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Are you sure you want to remove this feedback record?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
    } catch (err) {
      alert("Error deleting feedback: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Executive </span>
            <span className="text-amber-400">Feedback Inbox</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Member Feedback Ledger</h1>
            <p className="text-xs text-slate-400">Review recommendations, grievances, and inquiries from club members</p>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold w-fit">
            {feedbackList.length} Total Messages
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center text-amber-400 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs font-bold">Retrieving feedback ledger...</span>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 border border-violet-900/30 rounded-3xl">
            <Inbox size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">Inbox is empty</p>
            <p className="text-xs text-slate-600 mt-0.5">No member submissions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-violet-900/40 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-xl"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <MemberAvatar photoURL={item.photoURL} name={item.userName} size="md" />
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">{item.userName || "Member"}</h3>
                      <span className="text-[10px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md">
                        {item.userRole || "General Member"}
                      </span>
                      <span className="text-[11px] text-slate-500">• {formatDisplayDate(item.createdAt)}</span>
                    </div>

                    {item.userEmail && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-500" />
                        <span>{item.userEmail}</span>
                      </p>
                    )}

                    <div className="mt-2.5 p-3.5 bg-slate-950 rounded-xl border border-violet-950 text-xs text-slate-200 leading-relaxed">
                      {item.message}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteFeedback(item.id)}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 self-end sm:self-start transition cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// 8. DIRECTORY WITH DELETE CAPABILITY
// ==========================================
function AdminMembersDirectory() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, userData, currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const canDelete = Boolean(isSuperAdmin) || Boolean(isAdmin) || rawRole.includes("president") || rawRole.includes("secretary");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setMembers(list);
    });
    return () => unsub();
  }, []);

  const handleDeleteMember = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const memberId = userToDelete.id;
      await deleteDoc(doc(db, "users", memberId));

      const actDocs = await getDocs(query(collection(db, "activities"), where("userId", "==", memberId)));
      const reqDocs = await getDocs(query(collection(db, "pointRequests"), where("userId", "==", memberId)));
      await Promise.all([
        ...actDocs.docs.map((d) => deleteDoc(doc(db, "activities", d.id))),
        ...reqDocs.docs.map((d) => deleteDoc(doc(db, "pointRequests", d.id))),
      ]);

      setUserToDelete(null);
      if (selectedMember?.id === memberId) setSelectedMember(null);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      (m.name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.role || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="font-black text-lg">
            <span>Member </span>
            <span className="text-amber-400">Directory</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">RAC PSVPEC Member Roster</h1>
            <p className="text-xs text-slate-400">{members.length} Registered Rotaractors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All">All Roles</option>
            {CLUB_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => (
            <div key={m.id} className="p-5 rounded-3xl bg-slate-900/90 border border-violet-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <MemberAvatar photoURL={m.photoURL} name={m.name} size="md" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">{m.name}</h3>
                      <p className="text-[11px] text-slate-400">{m.role || "General Member"}</p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-amber-400">{m.totalPoints || 0} pts</span>
                </div>
              </div>

              <div className="pt-3 border-t border-violet-950 flex gap-2">
                <button
                  onClick={() => setSelectedMember(m)}
                  className="flex-1 py-2 bg-slate-950 border border-violet-900/60 hover:border-amber-400 rounded-xl text-xs font-bold text-slate-200 cursor-pointer"
                >
                  View Details
                </button>
                {canDelete && currentUser?.uid !== m.id && (
                  <button
                    onClick={() => setUserToDelete(m)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MEMBER MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <MemberAvatar photoURL={selectedMember.photoURL} name={selectedMember.name} size="lg" />
              <h2 className="text-xl font-black text-white mt-3">{selectedMember.name}</h2>
              <p className="text-xs text-amber-400 font-semibold">{selectedMember.role}</p>
            </div>

            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-violet-900/40 mb-5">
              <div className="flex justify-between py-1 border-b border-violet-950">
                <span className="text-slate-400">Total Points:</span>
                <span className="font-bold text-amber-400">{selectedMember.totalPoints || 0} pts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-violet-950">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-white">{selectedMember.department || "Not Specified"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-slate-300 truncate max-w-[170px]">{selectedMember.email}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedMember(null);
                  navigate("/admin");
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Points Action
              </button>
              {canDelete && currentUser?.uid !== selectedMember.id && (
                <button
                  onClick={() => setUserToDelete(selectedMember)}
                  className="px-4 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/40 cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-base font-black text-white mb-2">Delete Member Record?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Permanently wipe <strong className="text-white">{userToDelete.name}</strong>, their points balance, and activity history?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setUserToDelete(null)} className="px-4 py-2 text-xs text-slate-400 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROUTE GUARDS & APP EXPORT
// ==========================================
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 text-xs font-bold">Verifying Session...</div>;
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { currentUser, userData, isAdmin, isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const hasAccess =
    Boolean(isAdmin) ||
    Boolean(isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary");
  return currentUser && hasAccess ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupComponent />} />
        <Route path="/register" element={<SignupComponent />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/event-ideas" element={<ProtectedRoute><EventIdeasPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/request-points" element={<ProtectedRoute><RequestPointsPage /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />

        {/* 🛠️ ADMIN ROUTES */}
        <Route path="/admin" element={<AdminRoute><AdminPoints /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><AdminPointRequests /></AdminRoute>} />
        <Route path="/admin/members" element={<AdminRoute><AdminMembersDirectory /></AdminRoute>} />
        <Route path="/admin/feedback" element={<AdminRoute><AdminFeedbackPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}