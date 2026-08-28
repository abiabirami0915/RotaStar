import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
  arrayUnion,
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
  Sparkles,
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
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Info,
  Crown,
  UserCheck,
  Check,
  MessageCircle,
  Trash2,
  Search,
  Filter,
  Users,
  Eye,
} from "lucide-react";

// RAC PSVPEC ROLES LIST
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
// 1. SIGNUP COMPONENT (0 Starting Points)
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
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
        yearOfStudy: yearOfStudy,
        role: role,
        totalPoints: 0,
        activities: [],
        photoURL: "",
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists.");
      } else {
        setErrorMessage(err.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-xl shadow-violet-900/40">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
            <Star size={22} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-black text-2xl text-violet-400">Rota</span>
            <span className="font-black text-2xl text-amber-400">Star</span>
          </div>
          <p className="text-[10px] text-amber-300/80 tracking-tight font-semibold uppercase">
            RAC PSVPEC • A.U.R.A • RID 3233
          </p>
        </div>
      </div>

      <div className="w-full max-w-xl bg-slate-900/90 border border-violet-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Join RAC PSVPEC</span>
          </div>
          <h2 className="text-2xl font-black text-white">Create Member Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track points, unlock badges, and participate in club service
          </p>
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
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Rtr. Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Username *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-bold">@</span>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <div className="relative">
                <GraduationCap size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. IT / CSE / ECE"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Briefcase size={12} />
                <span>Club Role</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
              >
                {CLUB_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-slate-950 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-slate-950" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-amber-400 font-bold hover:underline">
            Log in here
          </Link>
        </div>
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

  const [commentInputs, setCommentInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const isBoardAdmin =
    Boolean(isAdmin) ||
    Boolean(isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary") ||
    rawRole.includes("board");

  useEffect(() => {
    const q = query(collection(db, "eventIdeas"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setIdeas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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
        avenue: avenue,
        eventDescription: eventDescription.trim(),
        description: eventDescription.trim(),
        needSuggestions: needSuggestions,
        suggestionNotes: suggestionNotes.trim(),
        proposerName: userData?.name || currentUser?.displayName || "Member",
        proposerRole: userData?.role || "General Member",
        proposerUid: currentUser?.uid,
        chairperson: eventChair.trim()
          ? {
              name: eventChair.trim(),
              role: "Designated",
              uid: null,
              approved: true,
            }
          : null,
        secretary: eventSecretary.trim()
          ? {
              name: eventSecretary.trim(),
              role: "Designated",
              uid: null,
              approved: true,
            }
          : null,
        suggestionsList: [],
        upvotes: 1,
        upvoters: [currentUser?.uid],
        createdAt: serverTimestamp(),
      });

      setEventName("");
      setAvenue("Community Service");
      setEventChair("");
      setEventSecretary("");
      setEventDescription("");
      setNeedSuggestions(false);
      setSuggestionNotes("");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error("Propose idea error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (!isBoardAdmin) return;
    if (window.confirm("Are you sure you want to delete this event proposal permanently?")) {
      try {
        await deleteDoc(doc(db, "eventIdeas", ideaId));
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const handleVolunteerChair = async (idea) => {
    if (!currentUser) return;
    const ideaRef = doc(db, "eventIdeas", idea.id);

    if (idea.chairperson?.uid === currentUser.uid) {
      await updateDoc(ideaRef, { chairperson: null });
    } else if (!idea.chairperson) {
      await updateDoc(ideaRef, {
        chairperson: {
          name: userData?.name || currentUser.displayName || "Member",
          role: userData?.role || "General Member",
          uid: currentUser.uid,
          approved: isBoardAdmin,
        },
      });
    }
  };

  const handleVolunteerSecretary = async (idea) => {
    if (!currentUser) return;
    const ideaRef = doc(db, "eventIdeas", idea.id);

    if (idea.secretary?.uid === currentUser.uid) {
      await updateDoc(ideaRef, { secretary: null });
    } else if (!idea.secretary) {
      await updateDoc(ideaRef, {
        secretary: {
          name: userData?.name || currentUser.displayName || "Member",
          role: userData?.role || "General Member",
          uid: currentUser.uid,
          approved: isBoardAdmin,
        },
      });
    }
  };

  const handleApproveRole = async (ideaId, roleType) => {
    if (!isBoardAdmin) return;
    const ideaRef = doc(db, "eventIdeas", ideaId);
    await updateDoc(ideaRef, {
      [`${roleType}.approved`]: true,
    });
  };

  const handleAddSuggestionComment = async (ideaId) => {
    const text = commentInputs[ideaId]?.trim();
    if (!text || !currentUser) return;

    const ideaRef = doc(db, "eventIdeas", ideaId);
    await updateDoc(ideaRef, {
      suggestionsList: arrayUnion({
        id: Date.now().toString(),
        authorName: userData?.name || currentUser.displayName || "Member",
        authorRole: userData?.role || "General Member",
        text: text,
        timestamp: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }),
    });

    setCommentInputs((prev) => ({ ...prev, [ideaId]: "" }));
  };

  const handleUpvote = async (idea) => {
    if (!currentUser) return;
    const upvoters = idea.upvoters || [];
    const hasUpvoted = upvoters.includes(currentUser.uid);

    const ideaRef = doc(db, "eventIdeas", idea.id);
    if (hasUpvoted) {
      await updateDoc(ideaRef, {
        upvotes: increment(-1),
        upvoters: upvoters.filter((id) => id !== currentUser.uid),
      });
    } else {
      await updateDoc(ideaRef, {
        upvotes: increment(1),
        upvoters: [...upvoters, currentUser.uid],
      });
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
          <div className="flex items-center gap-1.5 font-black text-lg">
            <Lightbulb size={18} className="text-amber-400" />
            <span className="text-white">Event</span>
            <span className="text-amber-400">Ideas Hub</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PROPOSAL FORM */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl h-fit">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} />
              <span>Pitch Initiative</span>
            </div>
            <h2 className="text-xl font-black text-white mb-1">Propose New Event</h2>
            <p className="text-xs text-slate-400 mb-5">
              Submit your event details and invite volunteer leaders
            </p>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={15} />
                <span>Event idea posted successfully!</span>
              </div>
            )}

            <form onSubmit={handleProposeIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Four Avenues Mega Service Project"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Avenue of Service *
                </label>
                <select
                  value={avenue}
                  onChange={(e) => setAvenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                >
                  <option value="Community Service">Community Service</option>
                  <option value="Club Service">Club Service</option>
                  <option value="Professional Development">Professional Service</option>
                  <option value="International Service">International Service</option>
                  <option value="Multi-Avenue">Multi-Avenue</option>
                  <option value="General Event">General</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Event Chair (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rtr. Name"
                    value={eventChair}
                    onChange={(e) => setEventChair(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Event Sec (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rtr. Name"
                    value={eventSecretary}
                    onChange={(e) => setEventSecretary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                  Event Description (Explain the Event) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain event flow, target beneficiaries, and execution plan..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-violet-900/40 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-amber-300">
                  <input
                    type="checkbox"
                    checked={needSuggestions}
                    onChange={(e) => setNeedSuggestions(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>Need event suggestions from members?</span>
                </label>

                {needSuggestions && (
                  <input
                    type="text"
                    placeholder="e.g. Need ideas on venue, speakers, or sponsors..."
                    value={suggestionNotes}
                    onChange={(e) => setSuggestionNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-white text-xs outline-none focus:border-amber-400 animate-in fade-in"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Event Proposal</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COMMUNITY PROPOSALS LIST */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-violet-900/40">
              <div>
                <h3 className="font-bold text-base text-white">Community Idea Ledger</h3>
                <p className="text-xs text-slate-400">
                  Volunteer to lead, vote, and suggest ideas to make events better
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                {ideas.length} Ideas
              </span>
            </div>

            {ideas.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-violet-900/40 text-center text-slate-500 text-sm">
                No event proposals submitted yet. Be the first to pitch one!
              </div>
            ) : (
              ideas.map((idea) => {
                const isUpvoted = (idea.upvoters || []).includes(currentUser?.uid);
                const hasChair = Boolean(idea.chairperson);
                const hasSecretary = Boolean(idea.secretary);
                const isMyChairClaim = idea.chairperson?.uid === currentUser?.uid;
                const isMySecClaim = idea.secretary?.uid === currentUser?.uid;
                const suggestions = idea.suggestionsList || [];

                return (
                  <div
                    key={idea.id}
                    className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-violet-900/40 hover:border-violet-500/40 shadow-xl transition flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
                            <Tag size={10} />
                            <span>{idea.avenue || "Community Service"}</span>
                          </span>

                          {idea.needSuggestions && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                              Suggestions Welcome
                            </span>
                          )}
                        </div>

                        {isBoardAdmin && (
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="Delete this event proposal"
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>

                      <h4 className="font-extrabold text-lg text-white mb-1.5">
                        {idea.eventName || idea.title}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {idea.eventDescription || idea.description}
                      </p>

                      {idea.suggestionNotes && (
                        <div className="p-3 rounded-xl bg-violet-950/60 border border-violet-500/30 text-xs text-violet-200 mb-3">
                          <strong className="text-amber-400">Seeking Guidance On:</strong> {idea.suggestionNotes}
                        </div>
                      )}

                      {/* LEADERSHIP VOLUNTEER SLOTS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-violet-900/40 mb-4">
                        <div className="flex flex-col justify-between gap-2 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                              <Crown size={12} />
                              <span>Event Chairperson</span>
                            </span>
                            {hasChair && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  idea.chairperson.approved
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {idea.chairperson.approved ? "Appointed" : "Nominated"}
                              </span>
                            )}
                          </div>

                          {hasChair ? (
                            <div>
                              <p className="text-xs font-extrabold text-white truncate">
                                {idea.chairperson.name}
                              </p>
                              <p className="text-[10px] text-slate-400">{idea.chairperson.role}</p>

                              <div className="flex items-center gap-2 mt-2">
                                {isMyChairClaim && (
                                  <button
                                    onClick={() => handleVolunteerChair(idea)}
                                    className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                                  >
                                    Withdraw Nomination
                                  </button>
                                )}

                                {isBoardAdmin && !idea.chairperson.approved && (
                                  <button
                                    onClick={() => handleApproveRole(idea.id, "chairperson")}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check size={10} />
                                    <span>Approve</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleVolunteerChair(idea)}
                              className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <UserCheck size={12} />
                              <span>I would like to take Event Chair</span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col justify-between gap-2 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-violet-400 flex items-center gap-1">
                              <Sparkles size={12} />
                              <span>Event Secretary</span>
                            </span>
                            {hasSecretary && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  idea.secretary.approved
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {idea.secretary.approved ? "Appointed" : "Nominated"}
                              </span>
                            )}
                          </div>

                          {hasSecretary ? (
                            <div>
                              <p className="text-xs font-extrabold text-white truncate">
                                {idea.secretary.name}
                              </p>
                              <p className="text-[10px] text-slate-400">{idea.secretary.role}</p>

                              <div className="flex items-center gap-2 mt-2">
                                {isMySecClaim && (
                                  <button
                                    onClick={() => handleVolunteerSecretary(idea)}
                                    className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                                  >
                                    Withdraw Nomination
                                  </button>
                                )}

                                {isBoardAdmin && !idea.secretary.approved && (
                                  <button
                                    onClick={() => handleApproveRole(idea.id, "secretary")}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check size={10} />
                                    <span>Approve</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleVolunteerSecretary(idea)}
                              className="w-full py-1.5 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/40 text-violet-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <UserCheck size={12} />
                              <span>I would like to take Event Secretary</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 💡 SUGGESTIONS */}
                      <div className="border-t border-violet-950 pt-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                          <MessageCircle size={14} />
                          <span>Ideas to make this event better:</span>
                        </div>

                        {suggestions.length > 0 && (
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                            {suggestions.map((s) => (
                              <div
                                key={s.id}
                                className="p-2.5 rounded-xl bg-slate-950 border border-violet-900/30 text-xs"
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span className="font-bold text-violet-300">
                                    {s.authorName}{" "}
                                    <span className="text-slate-500">({s.authorRole})</span>
                                  </span>
                                  <span>{s.timestamp}</span>
                                </div>
                                <p className="text-slate-200">{s.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Suggest an idea or improvement..."
                            value={commentInputs[idea.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [idea.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSuggestionComment(idea.id);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={() => handleAddSuggestionComment(idea.id)}
                            className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-amber-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Send size={12} />
                            <span>Post</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-violet-950 flex items-center justify-between text-xs text-slate-400">
                      <div>
                        Pitched by <strong className="text-amber-300">{idea.proposerName}</strong>{" "}
                        <span className="text-[10px] text-slate-500">({idea.proposerRole})</span>
                      </div>

                      <button
                        onClick={() => handleUpvote(idea)}
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition text-xs cursor-pointer ${
                          isUpvoted
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                            : "bg-slate-950 border-violet-900/60 text-slate-300 hover:text-amber-400"
                        }`}
                      >
                        <ThumbsUp size={13} />
                        <span>{idea.upvotes || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 3. CALENDAR & EVENTS
// ==========================================
function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [expandedEventIds, setExpandedEventIds] = useState([]);
  const [selectedModalEvent, setSelectedModalEvent] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(list);
    });
    return () => unsub();
  }, []);

  const toggleExpand = (id) => {
    setExpandedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
          <div className="flex items-center gap-1.5 font-black text-lg">
            <Calendar size={18} className="text-amber-400" />
            <span className="text-white">Club</span>
            <span className="text-amber-400">Events</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Upcoming & Official Events</h1>
            <p className="text-xs text-slate-400">
              Stay updated on club meetings, community service, and fellowships
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/70 border border-violet-900/40 text-center text-slate-400 text-sm">
            No upcoming events scheduled right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((ev) => {
              const isExpanded = expandedEventIds.includes(ev.id);
              const desc = ev.description || "";
              const shouldTruncate = desc.length > 120;

              return (
                <div
                  key={ev.id}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-violet-900/40 hover:border-amber-500/40 shadow-xl transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        {ev.avenue || "General Event"}
                      </span>
                      {ev.points && (
                        <span className="text-xs font-bold text-amber-400">+{ev.points} pts</span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-white mb-2">{ev.title || ev.name}</h3>

                    <div className="text-xs text-slate-300 leading-relaxed mb-3">
                      <p>
                        {shouldTruncate && !isExpanded
                          ? `${desc.slice(0, 120)}...`
                          : desc}
                      </p>

                      {shouldTruncate && (
                        <button
                          onClick={() => toggleExpand(ev.id)}
                          className="mt-1 text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? "Read Less" : "Read More"}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="space-y-1.5 text-xs text-slate-400 py-3 border-t border-violet-950">
                      {ev.date && (
                        <div className="flex items-center gap-2 text-violet-300 font-semibold">
                          <Calendar size={13} />
                          <span>
                            {ev.date?.toDate
                              ? ev.date.toDate().toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : ev.date}
                          </span>
                        </div>
                      )}
                      {ev.time && (
                        <div className="flex items-center gap-2">
                          <Clock size={13} />
                          <span>{ev.time}</span>
                        </div>
                      )}
                      {ev.venue && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin size={13} />
                          <span>{ev.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedModalEvent(ev)}
                        className="w-full py-2.5 rounded-xl bg-violet-600/15 border border-violet-500/30 hover:bg-violet-600/25 text-violet-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Info size={14} className="text-amber-400" />
                        <span>View Full Event Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULL EVENT DETAILS MODAL */}
      {selectedModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedModalEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase mb-3">
              {selectedModalEvent.avenue || "Rotaract Event"}
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              {selectedModalEvent.title || selectedModalEvent.name}
            </h2>

            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-violet-900/40 mb-4">
              {selectedModalEvent.date && (
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Calendar size={14} />
                  <span>
                    {selectedModalEvent.date?.toDate
                      ? selectedModalEvent.date.toDate().toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : selectedModalEvent.date}
                  </span>
                </div>
              )}
              {selectedModalEvent.time && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock size={14} className="text-violet-400" />
                  <span>Time: {selectedModalEvent.time}</span>
                </div>
              )}
              {selectedModalEvent.venue && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin size={14} className="text-rose-400" />
                  <span>Venue: {selectedModalEvent.venue}</span>
                </div>
              )}
              {selectedModalEvent.points && (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Trophy size={14} />
                  <span>Points Allocated: +{selectedModalEvent.points} pts</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                Full Description & Guidelines
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2">
                {selectedModalEvent.description || "No further details provided."}
              </p>
            </div>

            {selectedModalEvent.registrationLink && (
              <a
                href={selectedModalEvent.registrationLink}
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
              >
                <span>Register / RSVP for Event</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. 🌟 LEADERBOARD COMPONENT (WITH PROFILE AVATARS)
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
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 font-black text-lg">
            <Trophy size={18} className="text-amber-400" />
            <span className="text-white">Member</span>
            <span className="text-amber-400">Standings</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-1">Rotaract Star Leaderboard</h2>
          <p className="text-xs text-slate-400 mb-6">Top performing champions across all avenues of service</p>

          <div className="divide-y divide-violet-950/80">
            {users.map((u, index) => {
              const isMe = u.id === currentUser?.uid;
              return (
                <div
                  key={u.id}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-between transition ${
                    isMe
                      ? "bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5"
                      : "hover:bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    {/* RANK POSITION */}
                    <span
                      className={`w-7 text-center font-black text-sm shrink-0 ${
                        index === 0
                          ? "text-amber-400 text-base drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : index === 1
                          ? "text-slate-300 text-base"
                          : index === 2
                          ? "text-amber-600 text-base"
                          : "text-slate-500"
                      }`}
                    >
                      #{index + 1}
                    </span>

                    {/* 👤 MEMBER PROFILE AVATAR */}
                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-amber-400" />
                      )}
                    </div>

                    {/* MEMBER DETAILS */}
                    <div>
                      <p className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>{u.name || "Member"}</span>
                        {isMe && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {u.role || "General Member"} {u.department ? `• ${u.department}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* POINTS BADGE */}
                  <span className="font-black text-base text-amber-400 shrink-0 ml-3">
                    {u.totalPoints || 0} pts
                  </span>
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
// 5. CLAIM POINTS COMPONENT (SIMPLIFIED)
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
        userId: currentUser?.uid,
        userName: userData?.name || currentUser?.displayName || "Member",
        memberName: userData?.name || currentUser?.displayName || "Member",
        userRole: userData?.role || "General Member",
        userEmail: currentUser?.email || "",
        memberEmail: currentUser?.email || "",
        activityName: activityName.trim(),
        points: Number(pointsRequested),
        pointsRequested: Number(pointsRequested),
        whatDidYouGain: whatDidYouGain.trim(),
        reason: whatDidYouGain.trim() || "Event participation and service",
        description: whatDidYouGain.trim() || "Event participation and service",
        category: "General Activity",
        status: "pending",
        createdAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
      });

      setSubmitted(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("Point request error:", err);
      alert("Failed to submit request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 font-black text-lg">
            <FileText size={18} className="text-amber-400" />
            <span className="text-white">Claim</span>
            <span className="text-amber-400">Merit Points</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-1">Submit Point Claim</h2>
          <p className="text-xs text-slate-400 mb-6">
            Log your attendance and service hours for Board verification
          </p>

          {submitted ? (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 text-sm font-bold animate-in fade-in">
              🎉 Point claim submitted successfully! Redirecting to Dashboard...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. ACTIVITY NAME */}
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attended GBM #4 / Beach Cleanup Drive"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* 2. POINTS TO CLAIM */}
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Points to Claim *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  placeholder="e.g. 10"
                  value={pointsRequested}
                  onChange={(e) => setPointsRequested(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white font-bold text-sm outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* 3. WHAT DID YOU GAIN (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  What did you gain? (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly share your experience, learning, or key takeaway..."
                  value={whatDidYouGain}
                  onChange={(e) => setWhatDidYouGain(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none transition"
                />
              </div>

              {/* 4. SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Points Claim</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 6. FEEDBACK COMPONENT
// ==========================================
function FeedbackPage() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: currentUser?.uid,
        userName: userData?.name || currentUser?.displayName || "Member",
        message: feedback.trim(),
        createdAt: serverTimestamp(),
      });
      setDone(true);
      setFeedback("");
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 font-black text-lg">
            <MessageSquarePlus size={18} className="text-amber-400" />
            <span className="text-white">Member</span>
            <span className="text-amber-400">Feedback</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-1">Your Voice Matters</h2>
          <p className="text-xs text-slate-400 mb-6">
            Share suggestions, report concerns, or propose improvements directly to club leaders.
          </p>

          {done && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Thank you! Your feedback has been forwarded to the Executive Board.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={5}
              required
              placeholder="Type your message here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <span>Send Message</span>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 7. DEDICATED ADMIN MEMBERS DIRECTORY COMPONENT
// ==========================================
function AdminMembersDirectory() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setMembers(list);
    });
    return () => unsub();
  }, []);

  const handleDeleteMember = async () => {
    if (!userToDelete || !isSuperAdmin) return;
    setDeleteLoading(true);
    try {
      const memberId = userToDelete.id;
      await deleteDoc(doc(db, "users", memberId));

      // Cascade delete activities
      const actQuery = query(collection(db, "activities"), where("userId", "==", memberId));
      const actSnapshot = await getDocs(actQuery);
      const actDeletes = actSnapshot.docs.map((d) => deleteDoc(doc(db, "activities", d.id)));

      // Cascade delete point requests
      const reqQuery = query(collection(db, "pointRequests"), where("userId", "==", memberId));
      const reqSnapshot = await getDocs(reqQuery);
      const reqDeletes = reqSnapshot.docs.map((d) => deleteDoc(doc(db, "pointRequests", d.id)));

      await Promise.all([...actDeletes, ...reqDeletes]);

      setUserToDelete(null);
      if (selectedMember?.id === memberId) setSelectedMember(null);
    } catch (err) {
      console.error("Delete member error:", err);
      alert("Failed to delete member: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const queryStr = search.toLowerCase();
    const matchesSearch =
      (m.name || "").toLowerCase().includes(queryStr) ||
      (m.email || "").toLowerCase().includes(queryStr) ||
      (m.role || "").toLowerCase().includes(queryStr) ||
      (m.department || "").toLowerCase().includes(queryStr);

    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 font-black text-lg">
            <Users size={18} className="text-amber-400" />
            <span className="text-white">Member</span>
            <span className="text-amber-400">Roster & Directory</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">RAC PSVPEC Member Directory</h1>
            <p className="text-xs text-slate-400">Browse official profiles, leadership roles, and point records</p>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold w-fit">
            {members.length} Registered Members
          </span>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search member by name, department, role, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
            />
          </div>

          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Roles ({members.length})</option>
              {CLUB_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MEMBERS GRID */}
        {filteredMembers.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-violet-900/40 text-center text-slate-500 text-sm">
            No registered members match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-3xl bg-slate-900/90 border border-violet-900/40 hover:border-amber-500/40 shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 flex items-center justify-center shrink-0">
                        {m.photoURL ? (
                          <img src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={22} className="text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-white">{m.name || "Member"}</h3>
                        <p className="text-[11px] text-amber-300 font-semibold">{m.role || "General Member"}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {m.totalPoints || 0} pts
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 bg-slate-950/70 p-3 rounded-2xl border border-violet-950">
                    <p className="truncate">
                      <strong className="text-slate-300">Dept:</strong> {m.department || "-"} ({m.yearOfStudy || "1st Year"})
                    </p>
                    <p className="truncate">
                      <strong className="text-slate-300">Email:</strong> {m.email}
                    </p>
                    {m.phone && (
                      <p className="truncate">
                        <strong className="text-slate-300">Phone:</strong> {m.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-violet-950 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedMember(m)}
                    className="flex-1 py-2 rounded-xl bg-violet-600/15 border border-violet-500/30 hover:bg-violet-600/25 text-violet-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye size={13} className="text-amber-400" />
                    <span>View Profile</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setUserToDelete(m)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition cursor-pointer"
                      title="Permanently remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FULL MEMBER PROFILE MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-amber-400 bg-slate-950 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
                {selectedMember.photoURL ? (
                  <img src={selectedMember.photoURL} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-violet-400" />
                )}
              </div>
              <h2 className="text-xl font-black text-white">{selectedMember.name}</h2>
              <p className="text-xs text-amber-300 font-bold">{selectedMember.role}</p>
              {selectedMember.username && (
                <p className="text-[11px] text-slate-400">@{selectedMember.username}</p>
              )}
            </div>

            <div className="space-y-2.5 text-xs bg-slate-950 p-4 rounded-2xl border border-violet-900/40 mb-5">
              <div className="flex items-center justify-between py-1 border-b border-violet-950">
                <span className="text-slate-400 font-medium">Total Points Balance:</span>
                <span className="font-black text-amber-400 text-sm">{selectedMember.totalPoints || 0} pts</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-violet-950">
                <span className="text-slate-400 font-medium">Department:</span>
                <span className="font-bold text-white">{selectedMember.department || "Not Specified"}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-violet-950">
                <span className="text-slate-400 font-medium">Year of Study:</span>
                <span className="font-bold text-white">{selectedMember.yearOfStudy || "1st Year"}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-violet-950">
                <span className="text-slate-400 font-medium">Email Address:</span>
                <span className="font-bold text-violet-300">{selectedMember.email}</span>
              </div>
              {selectedMember.phone && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-medium">Contact Phone:</span>
                  <span className="font-bold text-white">{selectedMember.phone}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedMember(null);
                  navigate("/admin");
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                Award / Deduct Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Delete Member Record?</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{userToDelete.name}</strong>? All their profile data, point ledgers, and submissions will be permanently wiped.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <span>Yes, Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROUTE GUARDS
// ==========================================
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        Loading RotaStar...
      </div>
    );
  }
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { currentUser, userData, isAdmin, isSuperAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        Verifying permissions...
      </div>
    );
  }
  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const hasAccess =
    Boolean(isAdmin) ||
    Boolean(isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary") ||
    rawRole.includes("board");

  return currentUser && hasAccess ? children : <Navigate to="/dashboard" replace />;
}

// ==========================================
// APP ROUTING TABLE
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupComponent />} />
        <Route path="/register" element={<SignupComponent />} />

        {/* Member Core Pages */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Functional Feature Hubs */}
        <Route
          path="/event-ideas"
          element={
            <ProtectedRoute>
              <EventIdeasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request-points"
          element={
            <ProtectedRoute>
              <RequestPointsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />

        {/* 🛠️ ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPoints />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <AdminRoute>
              <AdminPointRequests />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <AdminRoute>
              <AdminMembersDirectory />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <AdminRoute>
              <FeedbackPage />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}