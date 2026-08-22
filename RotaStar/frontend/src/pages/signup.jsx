import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { Loader2, AlertCircle, Crown } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      const user = userCredential.user;

      const defaultUsername = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_");

      try {
        await updateProfile(user, { displayName: name.trim() });
      } catch (pErr) {
        console.warn("Display name update notice:", pErr);
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        username: defaultUsername,
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || "",
        role: "Member",
        totalPoints: 50,
        photoURL: "",
        createdAt: serverTimestamp(),
        lastUsernameChange: null,
      });

      await addDoc(collection(db, "activities"), {
        userId: user.uid,
        memberName: name.trim(),
        activityName: "Welcome Starter Bonus",
        points: 50,
        createdAt: serverTimestamp(),
        awardedBy: "System",
      });

      sessionStorage.setItem("showWelcomeReward", "true");
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error details:", err);
      let message = `Error (${err.code || "unknown"}): ${err.message}`;
      if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered. Please sign in.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters long.";
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center p-4">
      <div className="bg-slate-900/90 border border-violet-900/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-violet-950/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-md shadow-amber-500/5">
            <Crown size={14} className="text-amber-400" />
            <span>Join RotaStar</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black">
            Create an <span className="text-violet-400">Account</span>
          </h1>

          <p className="text-[11px] text-amber-400/90 font-semibold tracking-wide uppercase mt-1">
            "Service with Purpose, Recognition with Merit."
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College
          </p>

          <p className="text-xs text-amber-300/90 mt-2 font-medium">
            Sign up to claim your instant <strong className="text-amber-400 font-bold">50 point</strong> starter reward!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 break-words">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white outline-none focus:border-amber-400 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="member@rotary.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white outline-none focus:border-amber-400 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
              Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white outline-none focus:border-amber-400 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-violet-900/40 rounded-xl text-white outline-none focus:border-amber-400 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full !mt-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-700 via-purple-600 to-amber-600 hover:from-violet-600 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-violet-950 transition disabled:opacity-50 border border-amber-400/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account (+50 Pts)</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-amber-400 hover:text-amber-300 font-bold underline transition"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}