import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Search,
  Trash2,
  Crown,
  Shield,
  User,
  AlertTriangle,
  Loader2,
  Check,
  Mail,
  Trophy,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  calculateLevelProgress,
  getMemberBadges,
  calculateMonthlyStreak,
} from "../utils/gamification";

export default function AdminMembers() {
  const navigate = useNavigate();
  const { userData, isAdmin, isSuperAdmin } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Deletion States
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });

  const roleString = (userData?.role || "").toLowerCase();
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    roleString.includes("admin") ||
    roleString.includes("president") ||
    roleString.includes("secretary");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setMembers(list);
        setLoading(false);
      },
      (err) => {
        console.error("Members sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 4000);
  };

  // ONE-CLICK CSV EXPORT FUNCTION
  const handleExportCSV = async () => {
    if (members.length === 0) {
      showToast("No members available to export", "error");
      return;
    }

    setExportLoading(true);
    try {
      // 1. Fetch all activities to calculate badges & streak for export accurately
      const activitiesSnapshot = await getDocs(collection(db, "activities"));
      const activitiesByUser = {};

      activitiesSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId) {
          if (!activitiesByUser[data.userId]) {
            activitiesByUser[data.userId] = [];
          }
          activitiesByUser[data.userId].push(data);
        }
      });

      // 2. Build CSV header rows
      const headers = [
        "Rank",
        "Full Name",
        "Email",
        "Role / Designation",
        "Total Points",
        "Current Level",
        "Monthly Streak (Months)",
        "Badges Unlocked",
        "Account Created Date",
      ];

      const csvRows = [];
      csvRows.push(headers.join(","));

      // 3. Map member data
      members.forEach((member, index) => {
        const userActivities = activitiesByUser[member.id] || [];
        const userPoints = member.totalPoints || 0;
        const levelInfo = calculateLevelProgress(userPoints);
        const streak = calculateMonthlyStreak(userActivities);
        const badges = getMemberBadges(userPoints, userActivities, streak);
        const unlockedBadges = badges.filter((b) => b.unlocked).length;

        const joinedDate = member.createdAt?.toDate
          ? member.createdAt.toDate().toLocaleDateString()
          : "N/A";

        // Escape fields to prevent comma conflicts
        const escapeCSV = (field) => `"${String(field || "").replace(/"/g, '""')}"`;

        const row = [
          index + 1,
          escapeCSV(member.name || member.displayName || "Member"),
          escapeCSV(member.email || "N/A"),
          escapeCSV(member.role || "Member"),
          userPoints,
          escapeCSV(`Level ${levelInfo.currentLevel}`),
          streak,
          escapeCSV(`${unlockedBadges} / ${badges.length}`),
          escapeCSV(joinedDate),
        ];

        csvRows.push(row.join(","));
      });

      // 4. Create Blob & Trigger Download
      const csvString = "\uFEFF" + csvRows.join("\n"); // UTF-8 BOM for Excel support
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];

      link.setAttribute("href", url);
      link.setAttribute("download", `RAC_PSVPEC_RotaStar_Roster_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Roster CSV exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to generate CSV export", "error");
    } finally {
      setExportLoading(false);
    }
  };

  // Delete Member Handler
  const handleDeleteMember = async () => {
    if (!memberToDelete || !canManage) return;

    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "users", memberToDelete.id));
      showToast(`Member profile "${memberToDelete.name || "User"}" deleted.`);
      setMemberToDelete(null);
    } catch (err) {
      console.error("Delete user error:", err);
      showToast("Failed to delete member", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.role?.toLowerCase().includes(term);

    const matchesRole =
      roleFilter === "all" ||
      (m.role || "").toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-violet-300 hover:text-amber-300 transition text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Crown size={18} />
            <span>Member Directory</span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Users size={13} className="text-amber-400" />
              <span>Administrative Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Manage Club Members
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              View official point standings, ranks, and export reports for RAC PSVPEC.
            </p>
          </div>

          {/* EXPORT CSV BUTTON */}
          <button
            onClick={handleExportCSV}
            disabled={exportLoading || loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-950 transition border border-emerald-400/30 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {exportLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Export Roster (CSV)</span>
              </>
            )}
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {toast.text && (
          <div
            className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm border ${
              toast.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {toast.type === "error" ? (
              <AlertTriangle size={18} className="shrink-0" />
            ) : (
              <Check size={18} className="shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Search member by name, email, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400 transition"
            />
            <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-violet-900/40 rounded-xl text-white text-sm outline-none focus:border-amber-400 transition"
            >
              <option value="all">All Roles</option>
              <option value="President">President</option>
              <option value="Secretary">Secretary</option>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
            </select>
          </div>
        </div>

        {/* ROSTER TABLE */}
        <div className="bg-slate-900/90 border border-violet-900/40 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading member records...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No matching members found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-violet-900/50 bg-slate-950/70 text-violet-300 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Rank</th>
                    <th className="py-4 px-6">Member</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Level</th>
                    <th className="py-4 px-6">Total Points</th>
                    {canManage && <th className="py-4 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-950/60 text-sm">
                  {filteredMembers.map((member, index) => {
                    const levelData = calculateLevelProgress(member.totalPoints || 0);

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-violet-950/20 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-amber-400">
                          #{index + 1}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/30 bg-slate-950 flex items-center justify-center shrink-0">
                              {member.photoURL ? (
                                <img
                                  src={member.photoURL}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={18} className="text-violet-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white">
                                {member.name || member.displayName || "Member"}
                              </p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail size={12} />
                                <span>{member.email || "No email registered"}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              (member.role || "").toLowerCase().includes("president") ||
                              (member.role || "").toLowerCase().includes("secretary") ||
                              (member.role || "").toLowerCase().includes("admin")
                                ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                                : "bg-violet-500/10 border border-violet-500/30 text-violet-300"
                            }`}
                          >
                            {member.role || "Member"}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold text-slate-300">
                            {levelData.levelTitle}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-black text-amber-400">
                          {member.totalPoints || 0} pts
                        </td>

                        {canManage && (
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => setMemberToDelete(member)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                              title="Delete Member"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Delete Member?</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-white">
                {memberToDelete.name || memberToDelete.email}
              </strong>{" "}
              from the RotaStar ledger?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}