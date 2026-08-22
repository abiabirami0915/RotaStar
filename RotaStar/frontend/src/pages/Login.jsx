import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Unable to send reset email.");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>Rota</span>Star
        </div>

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Rotaract Club of Prince Shri Venkateshwara Padmavathy Engineering College
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot-password">
            <button
              type="button"
              onClick={handleResetPassword}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;