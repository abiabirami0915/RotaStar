import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  GraduationCap,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Sparkles,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";

// Official RAC PSVPEC Roles (Including Green Rotaractor)
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

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Profile Form States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");
  const [role, setRole] = useState("General Member");
  const [photoURL, setPhotoURL] = useState("");
  const [totalPoints, setTotalPoints] = useState(0);

  // Sync profile data directly from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setName(data.name || currentUser.displayName || "");
        setUsername(data.username || "");
        setEmail(data.email || currentUser.email || "");
        setPhone(data.phone || "");
        setDepartment(data.department || "");
        setYearOfStudy(data.yearOfStudy || "1st Year");
        setRole(data.role || "General Member");
        setPhotoURL(data.photoURL || currentUser.photoURL || "");
        setTotalPoints(data.totalPoints || 0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Client-side image compression & conversion to Base64
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select an image file." });
      return;
    }

    setImageUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
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

        // Compress image to JPEG at 80% quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setPhotoURL(compressedBase64);
        setImageUploading(false);
      };
      img.src = event.target.result;
    };

    reader.onerror = () => {
      setImageUploading(false);
      setStatusMessage({ type: "error", text: "Failed to process selected image." });
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoURL("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      // 1. Update Auth display name
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
      });

      // 2. Update Firestore User Document
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
        phone: phone.trim(),
        department: department.trim(),
        yearOfStudy: yearOfStudy,
        role: role,
        photoURL: photoURL.trim(),
      });

      setStatusMessage({
        type: "success",
        text: "Your profile and role have been saved successfully!",
      });

      setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 4000);
    } catch (err) {
      console.error("Profile update error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
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
            <span className="text-violet-400">My</span>
            <span className="text-amber-400">Profile</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* STATUS BANNER */}
        {statusMessage.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-rose-950/80 border-rose-500 text-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* HERO MEMBER SUMMARY CARD */}
        <div className="bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-amber-950/40 border border-violet-500/30 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                {photoURL ? (
                  <img src={photoURL} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-amber-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-amber-500 text-slate-950 shadow-lg hover:bg-amber-400 transition cursor-pointer"
                title="Upload Photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
                <Sparkles size={11} />
                <span>{role}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{name || "Member Name"}</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {department ? `${department} • ` : ""}{yearOfStudy} • {email}
              </p>
            </div>
          </div>

          <div className="px-6 py-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Points</span>
            <span className="text-2xl font-black text-amber-400">{totalPoints} pts</span>
          </div>
        </div>

        {/* EDIT PROFILE & ROLE FORM */}
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-violet-950">
            <div>
              <h2 className="text-lg font-black text-white">Edit Profile Details</h2>
              <p className="text-xs text-slate-400">Update your name, club role, photo, and study details</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* 📷 PROFILE PHOTO UPLOADER SECTION */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-violet-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 flex items-center justify-center shrink-0">
                  {photoURL ? (
                    <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-slate-500" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-0.5">Profile Photo</label>
                  <p className="text-[11px] text-slate-400">Upload a JPG, PNG or WEBP from your device</p>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {imageUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} className="text-amber-400" />
                  )}
                  <span>{imageUploading ? "Processing..." : "Upload Image"}</span>
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FULL NAME */}
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

              {/* USERNAME */}
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

              {/* CLUB ROLE */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Briefcase size={14} />
                  <span>Update Club Role *</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border-2 border-amber-500/50 hover:border-amber-400 rounded-xl text-amber-200 text-sm font-bold outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  {CLUB_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-slate-950 text-white py-1">
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Change your position if you recently became a Green Rotaractor, Board Director, or General Member.
                </p>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address (Linked to Account)
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-600" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* PHONE NUMBER */}
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

              {/* DEPARTMENT */}
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Information Technology / CSE"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* YEAR OF STUDY */}
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-slate-950" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile & Role Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}