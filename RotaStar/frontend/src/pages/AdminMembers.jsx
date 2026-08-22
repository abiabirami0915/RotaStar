import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Users,
  User,
  Phone,
  Mail,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  Crown,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";

export default function AdminMembers() {
  const navigate = useNavigate();
  const { userData, isAdmin, isSuperAdmin } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Flexible admin verification
  const currentRoleStr = (userData?.role || "").toLowerCase();
  const canManageMembers =
    isAdmin ||
    isSuperAdmin ||
    currentRoleStr.includes("admin") ||
    currentRoleStr.includes("president") ||
    currentRoleStr.includes("secretary");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        userList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setMembers(userList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching members:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!canManageMembers) return;
    try {
      await updateDoc(doc(db, "users", memberId), { role: newRole });
      showToast(`Role updated to ${newRole}`);
    } catch (err) {
      console.error("Error updating role:", err);
      showToast("Failed to update role", "error");
    }
  };

  const handleDeleteMember = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const memberId = userToDelete.id;

      // 1. Delete user from Firestore
      await deleteDoc(doc(db, "users", memberId));

      // 2. Cascade delete from activities
      const actQuery = query(
        collection(db, "activities"),
        where("userId", "==", memberId)
      );
      const actSnap = await getDocs(actQuery);
      const actDeletes = actSnap.docs.map((d) =>
        deleteDoc(doc(db, "activities", d.id))
      );

      // 3. Cascade delete from point requests
      const reqQuery = query(
        collection(db, "pointRequests"),
        where("userId", "==", memberId)
      );
      const reqSnap = await getDocs(reqQuery);
      const reqDeletes = reqSnap.docs.map((d) =>
        deleteDoc(doc(db, "pointRequests", d.id))
      );

      // 4. Cascade delete from point ledger
      const ptsQuery = query(
        collection(db, "points"),
        where("userId", "==", memberId)
      );
      const ptsSnap = await getDocs(ptsQuery);
      const ptsDeletes = ptsSnap.docs.map((d) =>
        deleteDoc(doc(db, "points", d.id))
      );

      await Promise.all([...actDeletes, ...reqDeletes, ...ptsDeletes]);

      showToast(
        `Member ${userToDelete.name || userToDelete.email} was permanently deleted.`
      );
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting member:", err);
      showToast(`Delete failed: ${err.message || "Check Firestore permissions"}`, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      member.name?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term) ||
      member.username?.toLowerCase().includes(term) ||
      member.phoneNumber?.includes(term);

    const normRole = (member.role || "member").toLowerCase();
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "superadmin" &&
        (normRole === "super admin" || normRole === "superadmin")) ||
      (roleFilter === "admin" && normRole === "admin") ||
      (roleFilter === "member" && normRole === "member");

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-violet-300 hover:text-amber-300 transition-colors text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Crown size={18} />
              <span>Admin Directory</span>
            </div>
            <p className="text-[10px] text-amber-300/80 tracking-tight font-medium">
              Service with Purpose, Recognition with Merit.
            </p>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2.5">
              <Users className="text-amber-400" size={26} />
              Club Directory
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Total registered users:{" "}
              <span className="text-amber-400 font-bold">{members.length}</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => navigate("/admin")}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-amber-400 text-xs font-bold transition shadow-md shadow-violet-950/50"
            >
              Points Panel
            </button>
            <button
              onClick={() => navigate("/admin/requests")}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 text-amber-400 text-xs font-bold transition shadow-md shadow-violet-950/50"
            >
              Point Requests
            </button>
          </div>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {message.type === "error" ? (
              <AlertTriangle size={18} className="shrink-0" />
            ) : (
              <Check size={18} className="shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by name, email, @username, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400 transition"
            />
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
            >
              <option value="all">All Roles</option>
              <option value="member">Members Only</option>
              <option value="admin">Admins Only</option>
              <option value="superadmin">Super Admins Only</option>
            </select>
          </div>
        </div>

        {/* MEMBERS GRID */}
        {loading ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            Loading directory...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-500">
            No matching members found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-slate-900/90 border border-violet-900/50 hover:border-amber-500/50 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/40 bg-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={22} className="text-violet-300" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <h2 className="font-bold text-white text-base truncate">
                        {member.name || "Unnamed"}
                      </h2>
                      {/* ROLE UNDER NAME */}
                      <p className="text-xs text-amber-400 font-semibold truncate">
                        {member.role || "Member"}
                      </p>
                      {member.username && (
                        <p className="text-[11px] text-slate-500 truncate">
                          @{member.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 border-t border-violet-950 pt-3 mb-4">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-slate-500 shrink-0" />
                      <span className="truncate">
                        {member.email || "No email"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-500 shrink-0" />
                      <span>{member.phoneNumber || "No phone added"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-violet-950">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-violet-900/40 text-violet-300 text-[11px] font-bold uppercase">
                    {member.role || "Member"}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400">
                        {member.totalPoints || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1 font-bold">pts</span>
                    </div>

                    {/* DELETE MEMBER BUTTON */}
                    {canManageMembers && (
                      <button
                        onClick={() => setUserToDelete(member)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                        title="Delete Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <Trash2 size={24} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Delete Member?</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">
                {userToDelete.name || userToDelete.email}
              </strong>
              ? This removes their account profile, total points, and all related records.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-2 text-sm"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Member</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}