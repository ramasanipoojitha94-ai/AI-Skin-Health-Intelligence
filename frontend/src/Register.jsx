import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2
} from "lucide-react";

import { apiRequest } from "./api";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password.length > 72) {
      setError("Password cannot exceed 72 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: cleanName,
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
        err.message || "Registration failed. Please try again."
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

        <h1>Create Account</h1>

        <p>Start your personalized skin health journey.</p>

        <form onSubmit={handleRegister}>

          <label htmlFor="register-name">
            Full Name
          </label>

          <input
            id="register-name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            minLength={2}
            maxLength={100}
            autoComplete="name"
            required
            disabled={loading}
          />

          <label htmlFor="register-email">
            Email Address
          </label>

          <input
            id="register-email"
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

          <label htmlFor="register-password">
            Password
          </label>

          <div className="password-field">

            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
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
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>

          <p className="auth-password-hint">
            Use at least 8 characters.
          </p>

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
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        <p className="auth-switch">
          Already registered?
          <Link to="/login"> Sign In</Link>
        </p>

      </div>
    </div>
  );
}