import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User, Loader2, Check } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    userData?.photoURL || currentUser?.photoURL || ""
  );
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, JPEG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size must be less than 5MB.");
      return;
    }

    setErrorMsg("");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!imageFile || !currentUser) return;

    try {
      setUploading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const storageRef = ref(
        storage,
        `profile_pictures/${currentUser.uid}`
      );
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(currentUser, {
        photoURL: downloadURL,
      });

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
      });

      setSuccessMsg("Profile photo updated successfully!");
      setImageFile(null);
    } catch (err) {
      console.error("Error uploading profile photo:", err);
      setErrorMsg("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
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
      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center">
          <h1 className="text-2xl font-black mb-1">Your Profile</h1>
          <p className="text-sm text-slate-400 mb-8">
            Upload or change your profile picture
          </p>

          <div className="relative w-36 h-36 mx-auto mb-6">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-rose-500/30 bg-slate-950 flex items-center justify-center shadow-lg">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} className="text-slate-600" />
              )}
            </div>

            <input
              type="file"
              id="profileInput"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={uploading}
            />

            <label
              htmlFor="profileInput"
              className="absolute bottom-0 right-0 p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Camera size={18} />
            </label>
          </div>

          <h2 className="text-xl font-bold">
            {userData?.name || currentUser?.displayName || "Member"}
          </h2>
          <p className="text-sm text-slate-400">{currentUser?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
            {userData?.role || "Member"}
          </span>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-2">
              <Check size={16} /> {successMsg}
            </div>
          )}

          {imageFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Uploading Image...</span>
                </>
              ) : (
                <span>Save New Picture</span>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}