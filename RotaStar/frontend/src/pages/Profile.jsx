import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  User,
  Loader2,
  Check,
  Phone,
  Calendar,
  Lock,
  Sparkles,
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Photo State
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Status & Feedback
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Cooldown Calculation (14 Days)
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [canChangeUsername, setCanChangeUsername] = useState(true);

  // Sync initial values from userData
  useEffect(() => {
    if (userData) {
      setFullName(userData.name || currentUser?.displayName || "");
      setUsername(userData.username || userData.name || "");
      setPhoneNumber(userData.phoneNumber || "");
      setPreviewUrl(userData.photoURL || currentUser?.photoURL || "");

      // Check last username update timestamp
      if (userData.lastUsernameChange) {
        const lastChangeDate = userData.lastUsernameChange.toDate
          ? userData.lastUsernameChange.toDate()
          : new Date(userData.lastUsernameChange);

        const now = new Date();
        const diffInMs = now.getTime() - lastChangeDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays < 14) {
          setCanChangeUsername(false);
          setDaysRemaining(Math.ceil(14 - diffInDays));
        } else {
          setCanChangeUsername(true);
          setDaysRemaining(0);
        }
      } else {
        setCanChangeUsername(true);
      }
    }
  }, [userData, currentUser]);

  // Compress & resize image to lightweight base64
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, JPEG).");
      return;
    }

    try {
      setErrorMsg("");
      const compressedBase64 = await compressImage(file);
      setImageFile(compressedBase64);
      setPreviewUrl(compressedBase64);
    } catch (err) {
      console.error("Compression error:", err);
      setErrorMsg("Failed to process image. Try another photo.");
    }
  };

  // Option to automatically set Username to Full Name
  const handleUseFullNameAsUsername = () => {
    if (!canChangeUsername) return;
    const cleanUsername = fullName.toLowerCase().replace(/\s+/g, "_").trim();
    setUsername(cleanUsername || fullName);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const updates = {
        name: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      };

      // Check if username was modified
      const currentStoredUsername = userData?.username || userData?.name;
      const isUsernameModified =
        username.trim() !== currentStoredUsername && username.trim().length > 0;

      if (isUsernameModified) {
        if (!canChangeUsername) {
          throw new Error(
            `You can only change your username once every 14 days. Please wait ${daysRemaining} more day(s).`
          );
        }
        updates.username = username.trim();
        updates.lastUsernameChange = Timestamp.now();
      }

      // If photo was changed
      if (imageFile) {
        updates.photoURL = imageFile;
      }

      // 1. Update Firestore User Document
      await updateDoc(userDocRef, updates);

      // 2. Update Firebase Auth Profile Display Name
      try {
        await updateProfile(currentUser, {
          displayName: fullName.trim(),
          ...(imageFile ? { photoURL: imageFile } : {}),
        });
      } catch (authErr) {
        console.warn("Auth profile sync warning:", authErr);
      }

      setSuccessMsg("Profile updated successfully!");
      setImageFile(null);
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
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
      <main className="max-w-xl mx-auto px-6 py-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black">Account Profile</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your personal info, avatar, and contact details
            </p>
          </div>

          {/* AVATAR PICKER */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-rose-500/30 bg-slate-950 flex items-center justify-center shadow-lg">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={56} className="text-slate-600" />
              )}
            </div>

            <input
              type="file"
              id="profileInput"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={saving}
            />

            <label
              htmlFor="profileInput"
              className="absolute bottom-0 right-0 p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
              title="Upload picture"
            >
              <Camera size={16} />
            </label>
          </div>

          {/* ROLE BADGE */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              {userData?.role || "Member"}
            </span>
          </div>

          {/* FORM */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 transition-colors text-sm"
              />
            </div>

            {/* USERNAME & 14-DAY COOLDOWN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  Username
                  {!canChangeUsername && (
                    <Lock size={12} className="text-amber-400" />
                  )}
                </label>

                {canChangeUsername && (
                  <button
                    type="button"
                    onClick={handleUseFullNameAsUsername}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <Sparkles size={12} />
                    Use Full Name
                  </button>
                )}
              </div>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                disabled={!canChangeUsername}
                required
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm outline-none transition-colors ${
                  canChangeUsername
                    ? "border-slate-800 focus:border-rose-500 text-white"
                    : "border-slate-800/60 bg-slate-950/50 text-slate-500 cursor-not-allowed"
                }`}
              />

              {/* COOLDOWN HELPER TEXT */}
              {!canChangeUsername ? (
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
                  <Calendar size={12} />
                  Username is locked. You can change it again in {daysRemaining}{" "}
                  day{daysRemaining > 1 ? "s" : ""}.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Note: Usernames can only be updated once every 14 days.
                </p>
              )}
            </div>

            {/* PHONE NUMBER (OPTIONAL) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 transition-colors text-sm"
                />
                <Phone
                  size={16}
                  className="absolute left-3.5 top-3.5 text-slate-500"
                />
              </div>
            </div>

            {/* EMAIL (READ-ONLY) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={currentUser?.email || ""}
                disabled
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800/60 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            {/* FEEDBACK MESSAGES */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-2">
                <Check size={16} /> {successMsg}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={saving}
              className="w-full !mt-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}