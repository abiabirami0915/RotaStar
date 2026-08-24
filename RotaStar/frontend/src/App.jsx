import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";

// Core Functional Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

// Safe Fallback Page for other tabs to prevent build errors
function GenericPage({ title, actionText = "Back to Dashboard" }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-slate-900 border border-violet-900/50 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-amber-400 mb-2">{title}</h1>
        <p className="text-xs text-slate-400 mb-6">
          This portal module is being updated with real-time sync. Check back shortly!
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-amber-600 text-white font-bold text-xs shadow-lg hover:opacity-90 transition"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}

// Protected Route Guard for Authenticated Members
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        Loading RotaStar...
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" replace />;
}

// Protected Route Guard for Board & Admin Roles
function AdminRoute({ children }) {
  const { currentUser, userData, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        Verifying authorization...
      </div>
    );
  }

  const rawRole = (userData?.role || "").toString().toLowerCase().trim();
  const hasAccess =
    Boolean(isAdmin) ||
    Boolean(isSuperAdmin) ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary") ||
    rawRole.includes("board");

  return currentUser && hasAccess ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Access */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Signup />} />

          {/* Member Authenticated Area */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <GenericPage title="Leaderboard Standings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <GenericPage title="Club Events & Calendar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event-ideas"
            element={
              <ProtectedRoute>
                <GenericPage title="Propose Event Ideas" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <GenericPage title="Member Feedback Hub" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-points"
            element={
              <ProtectedRoute>
                <GenericPage title="Submit Activity Points" />
              </ProtectedRoute>
            }
          />

          {/* Executive & Admin Controls Area */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <GenericPage title="Admin Point Ledger" />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <AdminRoute>
                <GenericPage title="Admin Point Approvals" />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <AdminRoute>
                <GenericPage title="Member Directory Management" />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <AdminRoute>
                <GenericPage title="Executive Feedback Roster" />
              </AdminRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}