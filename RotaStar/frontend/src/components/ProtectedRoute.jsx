import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Wait until Firebase finishes checking login
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#020617",
          color: "white",
          fontSize: "20px",
        }}
      >
        Loading RotaStar...
      </div>
    );
  }

  // If user is not logged in, go to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in
  return children;
}

export default ProtectedRoute;