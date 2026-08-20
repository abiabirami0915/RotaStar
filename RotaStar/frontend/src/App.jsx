import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// AUTH PAGES
import Login from "./pages/Login";
import Signup from "./pages/signup";

// MEMBER PAGES
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import PointRequest from "./pages/PointRequest";
import Profile from "./pages/Profile";

// ADMIN PAGES
import AdminPoints from "./pages/AdminPoints";
import AdminPointRequests from "./pages/AdminPointRequests";
import AdminMembers from "./pages/AdminMembers";

// ROUTE GUARDS
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* MEMBER ROUTES */}
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
        path="/request-points"
        element={
          <ProtectedRoute>
            <PointRequest />
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPoints />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/requests"
        element={
          <AdminRoute>
            <AdminPointRequests />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/members"
        element={
          <AdminRoute>
            <AdminMembers />
          </AdminRoute>
        }
      />

      {/* DEFAULT FALLBACKS */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}