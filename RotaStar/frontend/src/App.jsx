import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";

// Core Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Events from "./pages/Events";
import EventIdeas from "./pages/EventIdeas";
import Feedback from "./pages/Feedback";
import RequestPoints from "./pages/RequestPoints";
import AdminDashboard from "./pages/AdminDashboard";

// Protected Route for Members
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

// Protected Route for Admin/Board
function AdminRoute({ children }) {
  const { currentUser, userData, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center text-amber-400 font-bold text-sm">
        Verifying access...
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

          {/* Authenticated Member Routes */}
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
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event-ideas"
            element={
              <ProtectedRoute>
                <EventIdeas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-points"
            element={
              <ProtectedRoute>
                <RequestPoints />
              </ProtectedRoute>
            }
          />

          {/* Admin Management Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}