import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  runTransaction,
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
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPointRequests() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [points, setPoints] = useState({});

  useEffect(() => {
    const requestsQuery = query(collection(db, "pointRequests"));

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsList = snapshot.docs
          .map((requestDoc) => ({
            id: requestDoc.id,
            ...requestDoc.data(),
          }))
          .filter((req) => (req.status || "pending") === "pending");

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

        // Auto-populate points state with the member's requested points
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
      alert("Please enter a valid number of points.");
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
        const userRef = doc(db, "users", request.userId);
        const activityRef = doc(collection(db, "activities"));

        const requestSnapshot = await transaction.get(requestRef);
        const userSnapshot = await transaction.get(userRef);

        if (!requestSnapshot.exists()) {
          throw new Error("This point request no longer exists.");
        }

        if (!userSnapshot.exists()) {
          throw new Error("The member account could not be found.");
        }

        const requestData = requestSnapshot.data();
        if (requestData.status === "approved") {
          throw new Error("This request has already been processed.");
        }

        const currentPoints = Number(userSnapshot.data().totalPoints) || 0;
        const newTotalPoints = currentPoints + enteredPoints;

        // 1. Update member points balance
        transaction.update(userRef, {
          totalPoints: newTotalPoints,
          lastPointUpdateAt: serverTimestamp(),
        });

        // 2. Mark request approved
        transaction.update(requestRef, {
          status: "approved",
          pointsAwarded: enteredPoints,
          reviewedBy: userData?.name || currentUser?.displayName || "Admin",
          reviewedAt: serverTimestamp(),
        });

        // 3. Log activity entry for Member Dashboard Recent Activity
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

      alert(`${enteredPoints} points successfully awarded to ${request.userName || request.memberName || "Member"}.`);

      setPoints((prev) => {
        const updated = { ...prev };
        delete updated[request.id];
        return updated;
      });
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.message || "Unable to approve this request.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (request) => {
    const memberDisplayName = request.userName || request.memberName || "this member";
    if (!window.confirm(`Are you sure you want to reject the request from ${memberDisplayName}?`)) {
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

      alert("Point request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.message || "Unable to reject this request.");
    } finally {
      setProcessingId(null);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
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

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Clock size={20} className="text-rose-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
              Admin Control
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold">Point Requests</h1>
          <p className="text-slate-400 mt-2">Review member activities and award points.</p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-rose-500" />
            <div className="text-slate-400">Loading point requests...</div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && requests.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-bold text-white">No Pending Requests</h2>
            <p className="text-slate-500 mt-2">All point requests have been processed.</p>
          </div>
        )}

        {/* REQUEST LIST */}
        {!loading && requests.length > 0 && (
          <div className="space-y-5">
            {requests.map((request) => {
              const isProcessing = processingId === request.id;
              const displayName = request.userName || request.memberName || "Member";
              const displayEmail = request.userEmail || request.memberEmail || "";
              const displayDate = request.createdAt || request.requestedAt;

              return (
                <div
                  key={request.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                          <Clock size={14} />
                          PENDING
                        </span>

                        {request.category && (
                          <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                            {request.category}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold text-white">{request.activityName}</h2>

                      <div className="mt-4">
                        <p className="text-sm text-slate-400">Requested by</p>
                        <p className="text-lg font-semibold text-white">{displayName}</p>
                        {displayEmail && (
                          <p className="text-sm text-slate-500">{displayEmail}</p>
                        )}
                      </div>

                      {(request.reason || request.description) && (
                        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Member's Description / Reason
                          </p>
                          <p className="text-slate-300 leading-relaxed text-sm">
                            {request.reason || request.description}
                          </p>
                        </div>
                      )}

                      {request.proofUrl && (
                        <a
                          href={request.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline mt-4 font-bold"
                        >
                          <span>View Proof / Evidence Link</span>
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <p className="text-xs text-slate-600 mt-4">
                        Submitted: {formatDate(displayDate)}
                      </p>
                    </div>

                    <div className="w-full lg:w-80 shrink-0">
                      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                        <p className="text-sm font-bold text-white mb-4">Award Points</p>

                        <label className="block text-xs font-semibold text-slate-400 mb-2">
                          Points to award
                        </label>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Example: 50"
                          value={points[request.id] ?? ""}
                          onChange={(e) =>
                            setPoints({
                              ...points,
                              [request.id]: e.target.value,
                            })
                          }
                          disabled={isProcessing}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 outline-none focus:border-rose-500 disabled:opacity-50 font-bold"
                        />

                        <button
                          onClick={() => approveRequest(request)}
                          disabled={isProcessing}
                          className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <CheckCircle size={18} />
                          {isProcessing ? "Processing..." : "Approve & Award Points"}
                        </button>

                        <button
                          onClick={() => rejectRequest(request)}
                          disabled={isProcessing}
                          className="w-full mt-3 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <XCircle size={18} />
                          Reject Request
                        </button>
                      </div>
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