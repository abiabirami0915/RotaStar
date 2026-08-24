import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";
import { AuthProvider, useAuth } from "./AuthContext";

// Existing Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import {
  User,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Phone,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";

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
];

// INLINE SIGNUP COMPONENT
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
        totalPoints: 10,
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
                  <span>Register & Claim 10 Points</span>
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

// SAFE FALLBACK ROUTE
function SafeModule({ title }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-slate-900 border border-violet-900/50 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-amber-400 mb-2">{title}</h1>
        <p className="text-xs text-slate-400 mb-6">
          This portal module is being synchronized with the live server.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 text-white font-bold text-xs shadow-lg hover:opacity-90 transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

// ROUTE GUARDS
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
        Verifying...
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Access */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupComponent />} />
        <Route path="/register" element={<SignupComponent />} />

        {/* Member Area */}
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

        {/* Feature Hubs */}
        <Route path="/leaderboard" element={<ProtectedRoute><SafeModule title="Leaderboard Standings" /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><SafeModule title="Club Events & Calendar" /></ProtectedRoute>} />
        <Route path="/event-ideas" element={<ProtectedRoute><SafeModule title="Propose Event Ideas" /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><SafeModule title="Member Feedback Hub" /></ProtectedRoute>} />
        <Route path="/request-points" element={<ProtectedRoute><SafeModule title="Submit Activity Points" /></ProtectedRoute>} />

        {/* Admin Hubs */}
        <Route path="/admin" element={<AdminRoute><SafeModule title="Admin Point Ledger" /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><SafeModule title="Admin Point Approvals" /></AdminRoute>} />
        <Route path="/admin/members" element={<AdminRoute><SafeModule title="Member Directory Management" /></AdminRoute>} />
        <Route path="/admin/feedback" element={<AdminRoute><SafeModule title="Executive Feedback Roster" /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}