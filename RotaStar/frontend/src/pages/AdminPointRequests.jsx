import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  runTransaction,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../AuthContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  Trash2,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPointRequests() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [points, setPoints] = useState({});

  useEffect(() => {
    const requestsQuery = query(collection(db, "pointRequests"));

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsList = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }));

        // Sort by submission date (newest first)
        requestsList.sort((a, b) => {
          const timeA =
            a.createdAt?.toMillis?.() ||
            a.requestedAt?.toMillis?.() ||
            new Date(a.createdAt || a.requestedAt || 0).getTime();
          const timeB =
            b.createdAt?.toMillis?.() ||
            b.requestedAt?.toMillis?.() ||
            new Date(b.createdAt || b.requestedAt || 0).getTime();
          return timeB - timeA;
        });

        // Pre-fill points input with member's requested amount
        const initialPoints = {};
        requestsList.forEach((req) => {
          initialPoints[req.id] = req.pointsRequested || req.points || 25;
        });
        setPoints((prev) => ({ ...initialPoints, ...prev }));

        setRequests(requestsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading point requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const approveRequest = async (request) => {
    const rawValue = points[request.id] ?? request.pointsRequested ?? request.points ?? 25;
    const enteredPoints = Number(rawValue);

    if (!enteredPoints || enteredPoints <= 0) {
      alert("Please enter a valid positive number of points.");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in as an Admin to approve.");
      return;
    }

    try {
      setProcessingId(request.id);

      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, "pointRequests", request.id);
        const userRef = doc(db, "users", request.userId);
        const activityRef = doc(collection(db, "activities"));

        const requestSnapshot = await transaction.get(requestRef);
        const userSnapshot = await transaction.get(userRef);

        if (!requestSnapshot.exists()) {
          throw new Error("This point request no longer exists.");
        }

        if (!userSnapshot.exists()) {
          throw new Error("Target member profile was not found.");
        }

        const requestData = requestSnapshot.data();
        if (requestData.status === "approved") {
          throw new Error("This request has already been approved.");
        }

        const currentPoints = Number(userSnapshot.data().totalPoints) || 0;
        const newTotalPoints = currentPoints + enteredPoints;

        // 1. Credit member totalPoints
        transaction.update(userRef, {
          totalPoints: newTotalPoints,
          lastPointUpdateAt: serverTimestamp(),
        });

        // 2. Mark request as approved
        transaction.update(requestRef, {
          status: "approved",
          pointsAwarded: enteredPoints,
          reviewedBy: userData?.name || currentUser?.displayName || "Admin",
          reviewedAt: serverTimestamp(),
        });

        // 3. Write into activities collection for real-time member dashboard sync
        transaction.set(activityRef, {
          userId: request.userId,
          userName: request.userName || request.memberName || "Member",
          activityName: request.activityName || "Point Claim Approved",
          category: request.category || "Community Service",
          points: enteredPoints,
          type: "request_approved",
          status: "approved",
          adminName: userData?.name || currentUser?.displayName || "Executive Board",
          createdAt: serverTimestamp(),
        });
      });

      alert(`✅ ${enteredPoints} points successfully awarded to ${request.userName || request.memberName || "Member"}!`);

      setPoints((prev) => {
        const updated = { ...prev };
        delete updated[request.id];
        return updated;
      });
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.message || "Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (request) => {
    const memberName = request.userName || request.memberName || "this member";
    if (!window.confirm(`Reject point claim from ${memberName}?`)) {
      return;
    }

    if (!currentUser) {
      alert("You are not logged in.");
      return;
    }

    try {
      setProcessingId(request.id);

      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, "pointRequests", request.id);
        const requestSnapshot = await transaction.get(requestRef);

        if (!requestSnapshot.exists()) {
          throw new Error("This point request no longer exists.");
        }

        transaction.update(requestRef, {
          status: "rejected",
          pointsAwarded: 0,
          reviewedBy: userData?.name || currentUser?.displayName || "Admin",
          reviewedAt: serverTimestamp(),
        });
      });

      alert("Point request marked as rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.message || "Failed to reject request.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteRequestRecord = async (requestId) => {
    if (!window.confirm("Permanently delete this claim record?")) return;
    try {
      await deleteDoc(doc(db, "pointRequests", requestId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return (r.status || "pending") === filter;
  });

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-violet-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 font-black text-lg">
            <FileCheck2 size={18} className="text-amber-400" />
            <span className="text-white">Point Claim</span>
            <span className="text-amber-400">Verification Desk</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Admin Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Review Member Claims</h1>
            <p className="text-xs text-slate-400 mt-1">Verify submitted attendance proof and credit merit points</p>
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-violet-900/40">
            {["pending", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  filter === f
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-slate-900/60 border border-violet-900/40 rounded-3xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-amber-400" />
            <span>Loading point requests...</span>
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredRequests.length === 0 && (
          <div className="bg-slate-900/60 border border-violet-900/40 rounded-3xl p-12 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">No {filter !== "all" ? filter : ""} requests found</h2>
            <p className="text-xs text-slate-500 mt-1">All member claims are up to date.</p>
          </div>
        )}

        {/* REQUESTS LIST */}
        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const isProcessing = processingId === request.id;
              const isPending = (request.status || "pending") === "pending";
              const isApproved = request.status === "approved";
              const displayName = request.userName || request.memberName || "Member";
              const displayEmail = request.userEmail || request.memberEmail || "";
              const displayDate = request.createdAt || request.requestedAt;

              return (
                <div
                  key={request.id}
                  className="bg-slate-900/90 border border-violet-900/40 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isApproved
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : request.status === "rejected"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}
                      >
                        <Clock size={11} />
                        {request.status || "pending"}
                      </span>

                      {request.category && (
                        <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                          {request.category}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-extrabold text-white">{request.activityName}</h2>

                    <div className="mt-2 text-xs text-slate-300">
                      <span>Submitted by: </span>
                      <strong className="text-white">{displayName}</strong>
                      {displayEmail && <span className="text-slate-500"> ({displayEmail})</span>}
                    </div>

                    {(request.reason || request.description) && (
                      <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-violet-950 text-xs text-slate-300 leading-relaxed">
                        {request.reason || request.description}
                      </div>
                    )}

                    {request.proofUrl && (
                      <a
                        href={request.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold mt-3"
                      >
                        <span>View Evidence / Proof Link</span>
                        <ExternalLink size={12} />
                      </a>
                    )}

                    <p className="text-[11px] text-slate-500 mt-3">
                      Submitted: {formatDate(displayDate)}
                    </p>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="w-full lg:w-72 bg-slate-950/80 p-4 rounded-2xl border border-violet-900/40 flex flex-col justify-between shrink-0">
                    <div>
                      <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">
                        Points to Award
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        disabled={!isPending || isProcessing}
                        value={points[request.id] ?? ""}
                        onChange={(e) =>
                          setPoints({
                            ...points,
                            [request.id]: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 bg-slate-900 border border-violet-900/50 rounded-xl text-white font-bold text-sm outline-none focus:border-amber-400 disabled:opacity-50"
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => approveRequest(request)}
                            disabled={isProcessing}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle size={15} />
                            <span>{isProcessing ? "Processing..." : "Approve & Credit Points"}</span>
                          </button>

                          <button
                            onClick={() => rejectRequest(request)}
                            disabled={isProcessing}
                            className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            <span>Reject Request</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-400 font-medium">
                            Awarded: <strong className="text-amber-400 font-bold">{request.pointsAwarded || 0} pts</strong>
                          </span>
                          <button
                            onClick={() => deleteRequestRecord(request.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Delete log"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}