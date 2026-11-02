import { useCallback, useEffect, useState } from "react";
import { UserRound, Save, RefreshCw } from "lucide-react";
import { apiRequest } from "./api";
import "./Profile.css";

const initialProfile = {
  name: "",
  email: "",
  current_password: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest("/profile/me");

      const name = data.name || "";
      const email = data.email || "";

      setProfile({
        name,
        email,
        current_password: "",
      });

      setOriginalEmail(email);
    } catch (error) {
      setMessage(error.message || "Could not load profile.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function updateField(field, value) {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
  }

  async function saveProfile(event) {
    event.preventDefault();

    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();
    const emailChanged = email !== originalEmail.toLowerCase();

    if (!name || !email) {
      setMessage("Please enter your name and email address.");
      setMessageType("error");
      return;
    }

    if (emailChanged && !profile.current_password) {
      setMessage("Enter your current password to change your email.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const data = await apiRequest("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          name,
          email,
          current_password: profile.current_password,
        }),
      });

      const updatedUser = data.user || data;

      const updatedName = updatedUser.name || name;
      const updatedEmail = updatedUser.email || email;

      setProfile({
        name: updatedName,
        email: updatedEmail,
        current_password: "",
      });

      setOriginalEmail(updatedEmail);

      const storedUser = JSON.parse(
        localStorage.getItem("dermalytixUser") || "{}"
      );

      localStorage.setItem(
        "dermalytixUser",
        JSON.stringify({
          ...storedUser,
          ...updatedUser,
          name: updatedName,
          email: updatedEmail,
        })
      );

      setMessage(data.message || "Profile updated successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Profile update failed.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="profile-message" role="status">
        Loading profile...
      </p>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div>
          <h2>My Profile</h2>
          <p>Manage your personal account information.</p>
        </div>

        <div className="profile-avatar">
          <UserRound size={30} />
        </div>
      </div>

      <form className="profile-card" onSubmit={saveProfile}>
        <h3>Personal Information</h3>

        <p className="profile-description">
          Update the name and email associated with your account.
        </p>

        <label htmlFor="profile-name">Full Name</label>

        <input
          id="profile-name"
          type="text"
          value={profile.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
          placeholder="Enter your full name"
          maxLength={100}
          autoComplete="name"
          required
          disabled={saving}
        />

        <label htmlFor="profile-email">Email Address</label>

        <input
          id="profile-email"
          type="email"
          value={profile.email}
          onChange={(event) =>
            updateField("email", event.target.value)
          }
          placeholder="Enter your email"
          maxLength={255}
          autoComplete="email"
          required
          disabled={saving}
        />

        <label htmlFor="profile-password">
          Current Password
          {profile.email.trim().toLowerCase() !==
            originalEmail.toLowerCase() && (
            <span> (required to change email)</span>
          )}
        </label>

        <input
          id="profile-password"
          type="password"
          value={profile.current_password}
          onChange={(event) =>
            updateField("current_password", event.target.value)
          }
          placeholder="Enter current password"
          autoComplete="current-password"
          disabled={saving}
        />

        {message && (
          <p
            className={`profile-message ${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <button
          className="profile-save"
          type="submit"
          disabled={saving}
        >
          {saving ? (
            <RefreshCw size={17} className="profile-spinner" />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </section>
  );
}