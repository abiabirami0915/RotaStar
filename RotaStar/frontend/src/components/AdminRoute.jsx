
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AdminRoute({ children }) {
  const {
    currentUser,
    userData,
    isAdmin,
    isSuperAdmin,
  } = useAuth();

  // User is not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Still loading user information
  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-rose-500 text-xl font-bold mb-2">
            RotaStar
          </div>

          <p className="text-slate-400 text-sm">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Only admin and superadmin can access
  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
