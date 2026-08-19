import { Routes, Route, Navigate } from "react-router-dom";

// ===============================
// AUTH PAGES
// ===============================
import Login from "./pages/Login";
import Signup from "./pages/signup";

// ===============================
// MEMBER PAGES
// ===============================
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import PointRequest from "./pages/PointRequest";

// ===============================
// ADMIN PAGES
// ===============================
import AdminPoints from "./pages/AdminPoints";
import AdminPointRequests from "./pages/AdminPointRequests";

// ===============================
// ROUTE PROTECTION
// ===============================
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";


function App() {
  return (
    <Routes>

      {/* =====================================================
          LOGIN
      ===================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          SIGN UP
      ===================================================== */}

      <Route
        path="/signup"
        element={<Signup />}
      />


      {/* =====================================================
          MEMBER DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          LEADERBOARD
          All logged-in users can view
      ===================================================== */}

      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          REQUEST POINTS
          
          MEMBER:
          - Activity name
          - Requested points
          - Optional reason
          - Submit request
          - View request status
      ===================================================== */}

      <Route
        path="/request-points"
        element={
          <ProtectedRoute>
            <PointRequest />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          ADMIN POINT MANAGEMENT
          
          ADMIN + SUPER ADMIN ONLY
          
          Direct point adjustment
      ===================================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPoints />
          </AdminRoute>
        }
      />


      {/* =====================================================
          POINT REQUEST MANAGEMENT
          
          ADMIN + SUPER ADMIN ONLY
          
          Admin can:
          - View pending requests
          - Approve requests
          - Reject requests
          
          Super Admin can do everything Admin can do.
      ===================================================== */}

      <Route
        path="/admin/requests"
        element={
          <AdminRoute>
            <AdminPointRequests />
          </AdminRoute>
        }
      />


      {/* =====================================================
          DEFAULT ROUTE
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />


      {/* =====================================================
          UNKNOWN URL
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;