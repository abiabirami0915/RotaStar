import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
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
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function AdminPointRequests() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [points, setPoints] = useState({});

  // =====================================================
  // LOAD PENDING REQUESTS
  // =====================================================

  useEffect(() => {
    const requestsQuery = query(
      collection(db, "pointRequests"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsList = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }));

        requestsList.sort((a, b) => {
          const timeA =
            a.requestedAt?.toMillis?.() || 0;

          const timeB =
            b.requestedAt?.toMillis?.() || 0;

          return timeB - timeA;
        });

        setRequests(requestsList);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Error loading point requests:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =====================================================
  // APPROVE REQUEST
  // =====================================================

  const approveRequest = async (request) => {
    const enteredPoints = Number(points[request.id]);

    if (!enteredPoints || enteredPoints <= 0) {
      alert("Please enter a valid number of points.");
      return;
    }

    if (!Number.isInteger(enteredPoints)) {
      alert("Points must be a whole number.");
      return;
    }

    if (!currentUser) {
      alert("You are not logged in.");
      return;
    }

    try {
      setProcessingId(request.id);

      await runTransaction(db, async (transaction) => {
        const requestRef = doc(
          db,
          "pointRequests",
          request.id
        );

        const userRef = doc(
          db,
          "users",
          request.userId
        );

        const requestSnapshot =
          await transaction.get(requestRef);

        const userSnapshot =
          await transaction.get(userRef);

        if (!requestSnapshot.exists()) {
          throw new Error(
            "This point request no longer exists."
          );
        }

        if (!userSnapshot.exists()) {
          throw new Error(
            "The member account could not be found."
          );
        }

        const requestData =
          requestSnapshot.data();

        if (requestData.status !== "pending") {
          throw new Error(
            "This request has already been processed."
          );
        }

        const currentPoints =
          userSnapshot.data().totalPoints || 0;

        const newTotalPoints =
          currentPoints + enteredPoints;

        // Add points to member
        transaction.update(userRef, {
          totalPoints: newTotalPoints,
          lastPointUpdateAt: serverTimestamp(),
        });

        // Mark request as approved
        transaction.update(requestRef, {
          status: "approved",
          pointsAwarded: enteredPoints,
          reviewedBy: currentUser.uid,
          reviewedAt: serverTimestamp(),
        });
      });

      alert(
        `${enteredPoints} points successfully awarded to ${request.memberName}.`
      );

      setPoints((previous) => {
        const updated = { ...previous };
        delete updated[request.id];
        return updated;
      });
    } catch (error) {
      console.error(
        "Error approving request:",
        error
      );

      alert(
        error.message ||
          "Unable to approve this request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // REJECT REQUEST
  // =====================================================

  const rejectRequest = async (request) => {
    const confirmed = window.confirm(
      `Are you sure you want to reject the request from ${request.memberName}?`
    );

    if (!confirmed) {
      return;
    }

    if (!currentUser) {
      alert("You are not logged in.");
      return;
    }

    try {
      setProcessingId(request.id);

      await runTransaction(db, async (transaction) => {
        const requestRef = doc(
          db,
          "pointRequests",
          request.id
        );

        const requestSnapshot =
          await transaction.get(requestRef);

        if (!requestSnapshot.exists()) {
          throw new Error(
            "This point request no longer exists."
          );
        }

        const requestData =
          requestSnapshot.data();

        if (requestData.status !== "pending") {
          throw new Error(
            "This request has already been processed."
          );
        }

        transaction.update(requestRef, {
          status: "rejected",
          pointsAwarded: 0,
          reviewedBy: currentUser.uid,
          reviewedAt: serverTimestamp(),
        });
      });

      alert("Point request rejected.");
    } catch (error) {
      console.error(
        "Error rejecting request:",
        error
      );

      alert(
        error.message ||
          "Unable to reject this request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return "Just now";
    }

    return timestamp
      .toDate()
      .toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">

        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />

            <span>
              Back to Admin Panel
            </span>
          </button>

          <div className="text-xl font-black tracking-tight">
            <span className="text-rose-500">
              Rota
            </span>

            <span className="text-white">
              Star
            </span>
          </div>

        </div>

      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* HEADER */}

        <div className="mb-8">

          <div className="flex items-center gap-3 mb-2">

            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">

              <Clock
                size={20}
                className="text-rose-400"
              />

            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
              Admin Control
            </span>

          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Point Requests
          </h1>

          <p className="text-slate-400 mt-2">
            Review member activities and award
            points.
          </p>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">

            <div className="text-slate-400">
              Loading point requests...
            </div>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading && requests.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">

            <CheckCircle
              size={48}
              className="mx-auto mb-4 text-emerald-500"
            />

            <h2 className="text-xl font-bold text-white">
              No Pending Requests
            </h2>

            <p className="text-slate-500 mt-2">
              All point requests have been
              processed.
            </p>

          </div>
        )}

        {/* =================================================
            REQUEST LIST
        ================================================= */}

        {!loading && requests.length > 0 && (
          <div className="space-y-5">

            {requests.map((request) => {

              const isProcessing =
                processingId === request.id;

              return (
                <div
                  key={request.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                >

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

                    {/* =====================================
                        REQUEST INFORMATION
                    ===================================== */}

                    <div className="flex-1">

                      {/* STATUS */}

                      <div className="mb-4">

                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">

                          <Clock size={14} />

                          PENDING

                        </span>

                      </div>

                      {/* ACTIVITY */}

                      <h2 className="text-2xl font-bold text-white">
                        {request.activityName}
                      </h2>

                      {/* MEMBER */}

                      <div className="mt-4">

                        <p className="text-sm text-slate-400">
                          Requested by
                        </p>

                        <p className="text-lg font-semibold text-white">
                          {request.memberName}
                        </p>

                        {request.memberEmail && (
                          <p className="text-sm text-slate-500">
                            {request.memberEmail}
                          </p>
                        )}

                      </div>

                      {/* REASON */}

                      {request.reason && (
                        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">

                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Member's Reason
                          </p>

                          <p className="text-slate-300 leading-relaxed">
                            {request.reason}
                          </p>

                        </div>
                      )}

                      {/* DATE */}

                      <p className="text-xs text-slate-600 mt-4">
                        Submitted:{" "}
                        {formatDate(
                          request.requestedAt
                        )}
                      </p>

                    </div>

                    {/* =====================================
                        ADMIN ACTIONS
                    ===================================== */}

                    <div className="w-full lg:w-80">

                      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">

                        <p className="text-sm font-bold text-white mb-4">
                          Award Points
                        </p>

                        {/* POINT INPUT */}

                        <label className="block text-xs font-semibold text-slate-400 mb-2">
                          Points to award
                        </label>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Example: 50"
                          value={
                            points[request.id] ||
                            ""
                          }
                          onChange={(e) =>
                            setPoints({
                              ...points,
                              [request.id]:
                                e.target.value,
                            })
                          }
                          disabled={isProcessing}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 outline-none focus:border-rose-500 disabled:opacity-50"
                        />

                        {/* APPROVE */}

                        <button
                          onClick={() =>
                            approveRequest(
                              request
                            )
                          }
                          disabled={isProcessing}
                          className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 transition-colors"
                        >

                          <CheckCircle
                            size={18}
                          />

                          {isProcessing
                            ? "Processing..."
                            : "Approve & Award Points"}

                        </button>

                        {/* REJECT */}

                        <button
                          onClick={() =>
                            rejectRequest(
                              request
                            )
                          }
                          disabled={isProcessing}
                          className="w-full mt-3 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 transition-colors"
                        >

                          <XCircle
                            size={18}
                          />

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