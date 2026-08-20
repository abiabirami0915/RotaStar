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
  AlertCircle,
  Upload,
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Profile Form Fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Photo State
  const [newImageBase64, setNewImageBase64] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  // Form Status
  const [savingForm, setSavingForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Username Cooldown
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [canChangeUsername, setCanChangeUsername] = useState(true);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setFullName(userData?.name || currentUser.displayName || "");
      setUsername(userData?.username || userData?.name || "");
      setPhoneNumber(userData?.phoneNumber || "");
      setCurrentPhoto(userData?.photoURL || currentUser.photoURL || "");

      // 14-day check
      if (userData?.lastUsernameChange) {
        try {
          const lastDate =
            typeof userData.lastUsernameChange.toDate === "function"
              ? userData.lastUsernameChange.toDate()
              : new Date(userData.lastUsernameChange);

          if (lastDate instanceof Date && !isNaN(lastDate)) {
            const diffDays =
              (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

            if (diffDays < 14) {
              setCanChangeUsername(false);
              setDaysRemaining(Math.ceil(14 - diffDays));
            } else {
              setCanChangeUsername(true);
              setDaysRemaining(0);
            }
          }
        } catch (e) {
          setCanChangeUsername(true);
        }
      } else {
        setCanChangeUsername(true);
      }
    }
  }, [userData, currentUser]);

  // Robust client-side resize & compression to < 20KB Base64
  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onerror = () => reject(new Error("Invalid image format."));
        image.onload = () => {
          const targetSize = 200; // 200x200 square avatar
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");

          // Calculate center crop
          const minDim = Math.min(image.width, image.height);
          const startX = (image.width - minDim) / 2;
          const startY = (image.height - minDim) / 2;

          ctx.drawImage(
            image,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          // Return lightweight compressed JPEG string
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        };
        image.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection from gallery/camera
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const compressedDataUrl = await processImageFile(file);
      setNewImageBase64(compressedDataUrl);
      setCurrentPhoto(compressedDataUrl);
    } catch (err) {
      console.error("Image processing error:", err);
      setErrorMsg("Could not process this image. Please choose another one.");
    }
  };

  // Save photo directly
  const handleSavePhotoOnly = async () => {
    if (!newImageBase64 || !currentUser) return;

    setPhotoUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { photoURL: newImageBase64 }, { merge: true });

      try {
        await updateProfile(currentUser, { photoURL: newImageBase64 });
      } catch (authErr) {
        console.warn("Auth photo sync notice:", authErr);
      }

      setSuccessMsg("Profile picture updated successfully!");
      setNewImageBase64(null);
    } catch (err) {
      console.error("Photo upload error:", err);
      setErrorMsg(err.message || "Failed to save photo to database.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Set Full Name as Username helper
  const handleUseFullName = () => {
    if (!canChangeUsername) return;
    const formatted = fullName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .trim();
    setUsername(formatted || fullName);
  };

  // Save text details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setErrorMsg("");
    setSuccessMsg("");
    setSavingForm(true);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const updates = {
        name: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      };

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
        updates.lastUsernameChange = serverTimestamp();
      }

      if (newImageBase64) {
        updates.photoURL = newImageBase64;
      }

      await setDoc(userDocRef, updates, { merge: true });

      try {
        await updateProfile(currentUser, {
          displayName: fullName.trim(),
        });
      } catch (authErr) {
        console.warn("Auth displayName update notice:", authErr);
      }

      setSuccessMsg("Profile updated successfully!");
      setNewImageBase64(null);
    } catch (err) {
      console.error("Profile save error:", err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-semibold"
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

          {/* AVATAR SECTION */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 mb-3">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-rose-500/30 bg-slate-950 flex items-center justify-center shadow-lg">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={56} className="text-slate-600" />
                )}
              </div>

              <input
                type="file"
                id="galleryInput"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={photoUploading || savingForm}
              />

              <label
                htmlFor="galleryInput"
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg transition hover:scale-105 active:scale-95"
                title="Choose from Gallery"
              >
                <Camera size={16} />
              </label>
            </div>

            {/* QUICK SAVE PHOTO BUTTON WHEN A NEW PHOTO IS SELECTED */}
            {newImageBase64 && (
              <button
                type="button"
                onClick={handleSavePhotoOnly}
                disabled={photoUploading}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition animate-pulse"
              >
                {photoUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Photo...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Confirm & Save Photo</span>
                  </>
                )}
              </button>
            )}

            <div className="mt-3">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
                {userData?.role || "Member"}
              </span>
            </div>
          </div>

          {/* STATUS NOTICES */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MAIN PROFILE FORM */}
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
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 transition text-sm"
              />
            </div>

            {/* USERNAME */}
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
                    onClick={handleUseFullName}
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
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm outline-none transition ${
                  canChangeUsername
                    ? "border-slate-800 focus:border-rose-500 text-white"
                    : "border-slate-800/60 bg-slate-950/50 text-slate-500 cursor-not-allowed"
                }`}
              />

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
                Phone Number{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 transition text-sm"
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

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={savingForm || photoUploading}
              className="w-full !mt-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              {savingForm ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving Changes...</span>
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