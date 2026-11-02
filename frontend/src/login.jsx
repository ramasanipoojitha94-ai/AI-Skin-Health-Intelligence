import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Activity,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2
} from "lucide-react";

import { apiRequest } from "./api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          password
        })
      });

      if (!data.access_token || !data.user) {
        throw new Error("Invalid server response. Please try again.");
      }

      localStorage.setItem("dermalytixToken", data.access_token);
      localStorage.setItem(
        "dermalytixUser",
        JSON.stringify(data.user)
      );

      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError(
        err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <Link to="/" className="auth-brand">
        <Activity />
        Derma<span>Lytix</span>
      </Link>

      <div className="auth-card">

        <div className="auth-icon">
          <Activity size={30} />
        </div>

        <h1>Welcome Back!</h1>

        <p>
          Sign in to continue your skin health journey.
        </p>

        <form onSubmit={handleLogin}>

          <label htmlFor="login-email">
            Email Address
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            autoComplete="email"
            required
            disabled={loading}
          />

          <label htmlFor="login-password">
            Password
          </label>

          <div className="password-field">

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showPassword}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>

          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="auth-spinner" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        <p className="auth-switch">
          Don't have an account?
          <Link to="/register"> Create Account</Link>
        </p>

      </div>
    </div>
  );
}