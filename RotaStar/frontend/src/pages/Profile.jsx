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
  GraduationCap,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Camera,
  Upload,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { MemberAvatar } from "../App";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");
  const [role, setRole] = useState("General Member");
  const [photoURL, setPhotoURL] = useState("");
  const [totalPoints, setTotalPoints] = useState(0);

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

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select a valid image file." });
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setPhotoURL(compressedBase64);
        setImageUploading(false);
      };
      img.src = event.target.result;
    };

    reader.onerror = () => {
      setImageUploading(false);
      setStatusMessage({ type: "error", text: "Failed to process image." });
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
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
      });

      // Role is intentionally excluded from updates here; role can only be modified by admins
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
        phone: phone.trim(),
        department: department.trim(),
        yearOfStudy,
        photoURL: photoURL.trim(),
      });

      setStatusMessage({
        type: "success",
        text: "Your profile details have been saved successfully!",
      });

      setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 4000);
    } catch (err) {
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
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-xs">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading Profile...
      </div>
    );
  }

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
          <div className="font-black text-lg">
            <span>My </span>
            <span className="text-amber-400">Profile</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {statusMessage.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
              statusMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-rose-950/80 border-rose-500 text-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* HERO CARD */}
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <MemberAvatar photoURL={photoURL} name={name} size="lg" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg"
                title="Upload Photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{role}</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">{name || "Member Name"}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {department ? `${department} • ` : ""}{yearOfStudy} • {email}
              </p>
            </div>
          </div>

          <div className="px-6 py-3 rounded-2xl bg-slate-950 border border-violet-900/50 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Merit Balance</span>
            <span className="text-2xl font-black text-amber-400">{totalPoints} pts</span>
          </div>
        </div>

        {/* PROFILE DETAILS FORM */}
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 pb-3 border-b border-violet-950">
            <h2 className="text-lg font-black text-white">Edit Profile Details</h2>
            <p className="text-xs text-slate-400">Update your public name, contact details, and department</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* PHOTO UPLOADER */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-violet-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <MemberAvatar photoURL={photoURL} name={name} size="md" />
                <div>
                  <label className="block text-xs font-bold text-white">Profile Photo</label>
                  <p className="text-[11px] text-slate-400">Select a JPG or PNG from your computer or phone</p>
                </div>
              </div>

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
                  {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} className="text-amber-400" />}
                  <span>{imageUploading ? "Processing..." : "Upload Photo"}</span>
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
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name *</label>
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
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username *</label>
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

              {/* READ-ONLY ROLE BADGE */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Assigned Club Role</span>
                  <span className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                    <ShieldCheck size={13} className="text-amber-400" />
                    Admin Managed
                  </span>
                </label>
                <div className="w-full px-4 py-3 bg-slate-950/60 border border-violet-900/30 rounded-xl text-amber-300 text-xs font-bold flex items-center justify-between">
                  <span>{role}</span>
                  <span className="text-[11px] text-slate-500 font-normal">Contact Executive Board to modify role</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
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
                    placeholder="e.g. Information Technology / CSE"
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
                  className="w-full px-4 py-2.5 bg-slate-950 border border-violet-900/50 rounded-xl text-white text-sm outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-slate-950" />
                    <span>Saving Details...</span>
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
        </div>
      </main>
    </div>
  );
}