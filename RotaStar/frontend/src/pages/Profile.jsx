import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  User,
  Phone,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");
  const [currentRole, setCurrentRole] = useState("General Member");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || currentUser.displayName || "");
        setUsername(data.username || "");
        setPhone(data.phone || "");
        setDepartment(data.department || "");
        setYearOfStudy(data.yearOfStudy || "1st Year");
        setCurrentRole(data.role || "General Member");
        setPhotoURL(data.photoURL || currentUser.photoURL || "");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // Client-side image compression using HTML5 Canvas (<60KB for Firestore)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
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

          // Compress as JPEG at 70% quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file);
      setPhotoURL(compressedDataUrl);
      setErrorMsg("");
    } catch (err) {
      console.error("Compression error:", err);
      setErrorMsg("Could not process image file. Please try a different photo.");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg(false);

    try {
      const cleanUsername = username
        ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
        : "";

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        username: cleanUsername,
        phone: phone.trim(),
        department: department.trim(),
        yearOfStudy: yearOfStudy,
        photoURL: photoURL || "",
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
        });
      }

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

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
            <User size={18} className="text-amber-400" />
            <span className="text-white">My</span>
            <span className="text-amber-400">Profile</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* AVATAR + UPLOAD HEADER */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-violet-950/80 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-violet-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-300 text-[10px] font-bold gap-1 cursor-pointer"
              >
                <Camera size={20} />
                <span>Change</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-black text-white">{name || "Member"}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                  {currentRole}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentUser?.email}</p>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} className="text-amber-400" />
                  <span>Choose Photo from Device</span>
                </button>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
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
                <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5">
                  Image Web URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoURL.startsWith("data:") ? "" : photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-slate-950" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Save Profile Updates</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}