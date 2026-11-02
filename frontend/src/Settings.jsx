import { useEffect, useState } from "react";
import { ShieldCheck, Bell, Palette, LogOut, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./api";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [changingPassword, setChangingPassword] = useState(false);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("dermalytixTheme") === "dark"
  );

  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("dermalytixNotifications") !== "false"
  );

  useEffect(() => {
    document.body.classList.toggle("dermalytix-dark", darkMode);
    localStorage.setItem("dermalytixTheme", darkMode ? "dark" : "light");

    return () => {
      document.body.classList.remove("dermalytix-dark");
    };
  }, [darkMode]);

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  async function changePassword(e) {
    e.preventDefault();
    setMessage("");

    if (passwords.new_password.length < 8) {
      showMessage("New password must contain at least 8 characters.", "error");
      return;
    }

    if (passwords.new_password.length > 72) {
      showMessage("New password is too long.", "error");
      return;
    }

    setChangingPassword(true);

    try {
      const data = await apiRequest("/profile/change-password", {
        method: "PUT",
        body: JSON.stringify(passwords),
      });

      showMessage(data.message || "Password changed successfully.");

      setPasswords({
        current_password: "",
        new_password: "",
      });
    } catch (error) {
      showMessage(error.message || "Password update failed.", "error");
    } finally {
      setChangingPassword(false);
    }
  }

  function toggleTheme() {
    setDarkMode((previous) => !previous);
  }

  function toggleNotifications() {
    setNotifications((previous) => {
      const next = !previous;
      localStorage.setItem("dermalytixNotifications", String(next));
      return next;
    });
  }

  function logout() {
    if (!window.confirm("Are you sure you want to log out?")) return;

    localStorage.removeItem("dermalytixUser");
    localStorage.removeItem("dermalytixToken");
    navigate("/login", { replace: true });
  }

  async function deleteAccount() {
    if (!deletePassword.trim()) {
      showMessage("Enter your password to delete your account.", "error");
      return;
    }

    if (
      !window.confirm(
        "This permanently deletes your account and associated data. This action cannot be undone. Continue?"
      )
    ) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      await apiRequest("/profile/me", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });

      localStorage.removeItem("dermalytixUser");
      localStorage.removeItem("dermalytixToken");
      navigate("/login", { replace: true });
    } catch (error) {
      showMessage(error.message || "Account deletion failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="settings-container">
      <h2>Settings</h2>

      <p className="settings-subtitle">
        Manage your account preferences and security.
      </p>

      {message && (
        <p
          className={`settings-message ${messageType}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      <div className="settings-card">
        <h3>
          <ShieldCheck /> Account Security
        </h3>

        <form onSubmit={changePassword}>
          <label htmlFor="current-password">Current Password</label>

          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={passwords.current_password}
            onChange={(e) =>
              setPasswords((previous) => ({
                ...previous,
                current_password: e.target.value,
              }))
            }
          />

          <label htmlFor="new-password">New Password</label>

          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            value={passwords.new_password}
            onChange={(e) =>
              setPasswords((previous) => ({
                ...previous,
                new_password: e.target.value,
              }))
            }
          />

          <button type="submit" disabled={changingPassword}>
            {changingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>

      <div className="settings-card">
        <h3>
          <Bell /> Notifications
        </h3>

        <p>Manage your notification preference.</p>

        <label className="settings-toggle">
          <span>Notifications enabled</span>

          <input
            type="checkbox"
            checked={notifications}
            onChange={toggleNotifications}
          />
        </label>
      </div>

      <div className="settings-card">
        <h3>
          <Palette /> Appearance
        </h3>

        <p>Choose your preferred appearance.</p>

        <label className="settings-toggle">
          <span>Dark mode</span>

          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
          />
        </label>
      </div>

      <div className="settings-card">
        <h3>
          <Trash2 /> Delete Account
        </h3>

        <p>
          Permanently delete your account and associated data. This action
          cannot be undone.
        </p>

        <label htmlFor="delete-password">Confirm Your Password</label>

        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />

        <button
          type="button"
          className="logout-button"
          onClick={deleteAccount}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>

      <div className="settings-card account-logout">
        <h3>
          <LogOut /> Account Management
        </h3>

        <p>Sign out of your DermaLytix account.</p>

        <button type="button" className="logout-button" onClick={logout}>
          Log Out
        </button>
      </div>
    </section>
  );
}