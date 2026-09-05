import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Star,
  UserPlus,
  CheckCircle2,
  X,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setErrorMessage("Invalid email or password. Please verify your credentials or reset your password.");
      } else {
        setErrorMessage(err.message || "Failed to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const cleanUsername = (user.displayName || user.email.split("@")[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "");

        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || "Rotaract Member",
          username: cleanUsername,
          email: user.email.toLowerCase(),
          phone: "",
          department: "",
          yearOfStudy: "1st Year",
          role: "General Member",
          totalPoints: 0,
          activities: [],
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
        });
      }

      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(false);
        setResetEmail("");
      }, 3500);
    } catch (err) {
      setResetError(err.message || "Failed to send reset email. Verify the address.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-violet-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* BRAND EMBLEM */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-xl shadow-violet-900/40">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
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

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-slate-900/90 border border-violet-900/50 backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-2xl relative z-10">
        <div className="mb-6">
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-400">Member Access</p>
          <h2 className="text-2xl font-black text-white mt-0.5">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to track points, view calendar schedules, and check rankings.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-slate-950" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-violet-900/50 flex-1" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">or</span>
          <div className="h-px bg-violet-900/50 flex-1" />
        </div>

        {/* GOOGLE SIGN IN */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-3 rounded-xl bg-slate-950 border border-violet-900/60 hover:border-amber-500/40 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.2C.7 9.6 0 12.3 0 15.2c0 2.9.7 5.6 1.9 8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.8 5.6 6.5 10.1 6.5z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* CREATE ACCOUNT LINK */}
        <div className="mt-6 pt-5 border-t border-violet-900/50 text-center">
          <p className="text-xs text-slate-400 mb-3">
            New to Rotaract Club of PSVPEC?
          </p>
          <Link
            to="/signup"
            className="w-full py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <UserPlus size={15} className="text-amber-400" />
            <span>Create New Member Account</span>
          </Link>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-white mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered email address to receive password recovery instructions.
            </p>

            {resetSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>Reset link dispatched. Please check your inbox.</span>
              </div>
            )}

            {resetError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-xs outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={resetLoading || resetSuccess}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {resetLoading ? <Loader2 size={15} className="animate-spin" /> : "Send Recovery Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}