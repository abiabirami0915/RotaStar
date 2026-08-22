import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}