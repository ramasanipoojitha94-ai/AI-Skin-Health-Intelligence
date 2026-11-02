import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./PersonalSkinConcerns.css";

export default function PersonalSkinConcerns() {
  const [message, setMessage] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConcerns = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/skin-concerns/me");

      setConcerns(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.concerns)
            ? data.concerns
            : []
      );
    } catch (err) {
      setError(err.message || "Unable to load your skin concerns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConcerns();
  }, [loadConcerns]);

  async function handleSave(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter your skin concern.");
      return;
    }

    if (trimmedMessage.length > 1000) {
      setError("Your concern must be 1000 characters or fewer.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        await apiRequest(`/skin-concerns/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ message: trimmedMessage }),
        });

        setSuccess("Your concern has been updated.");
      } else {
        await apiRequest("/skin-concerns/", {
          method: "POST",
          body: JSON.stringify({ message: trimmedMessage }),
        });

        setSuccess("Your concern has been saved.");
      }

      setMessage("");
      setEditingId(null);
      await loadConcerns(false);
    } catch (err) {
      setError(err.message || "Unable to save your concern.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(concern) {
    setMessage(concern.message || "");
    setEditingId(concern.id);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this skin concern?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/skin-concerns/${id}`, {
        method: "DELETE",
      });

      setConcerns((previous) =>
        previous.filter((concern) => concern.id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setMessage("");
      }

      setSuccess("Concern deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete this concern.");
    } finally {
      setDeletingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setMessage("");
    setError("");
    setSuccess("");
  }

  return (
    <section className="concerns-page">
      <header className="concerns-heading">
        <span>YOUR PERSONAL SKIN JOURNAL</span>
        <h2>Personal Skin Concerns</h2>
        <p>
          Record your skin symptoms, changes, questions and observations.
          Your saved entries are private to your account.
        </p>
      </header>

      <form className="concern-form" onSubmit={handleSave}>
        <label htmlFor="skin-message">
          {editingId !== null
            ? "Edit your concern"
            : "Describe your skin concern"}
        </label>

        <textarea
          id="skin-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Example: I have been experiencing dryness and itching on my cheeks..."
          maxLength={1000}
          rows={6}
          required
          disabled={saving}
        />

        <div className="concern-form-bottom">
          <span>{message.length}/1000 characters</span>

          <div>
            {editingId !== null && (
              <button
                type="button"
                className="cancel-concern"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Concern"
                  : "Save Concern"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="concern-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="concern-success" role="status">
          {success}
        </p>
      )}

      <div className="saved-concerns">
        <h3>Your Saved Concerns</h3>

        {loading ? (
          <p>Loading your concerns...</p>
        ) : concerns.length === 0 ? (
          <div className="concern-empty">
            <h4>No concerns saved yet</h4>
            <p>
              Your skin observations will appear here after you save them.
            </p>
          </div>
        ) : (
          concerns.map((concern) => (
            <article className="concern-card" key={concern.id}>
              <p>{concern.message}</p>

              <small>
                {concern.created_at
                  ? new Date(concern.created_at).toLocaleString()
                  : "Saved"}
              </small>

              <div className="concern-actions">
                <button
                  type="button"
                  onClick={() => handleEdit(concern)}
                  disabled={deletingId === concern.id}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(concern.id)}
                  disabled={deletingId === concern.id}
                >
                  {deletingId === concern.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <p className="concern-disclaimer">
        This journal helps you record observations. It does not diagnose
        skin conditions or replace professional medical advice.
      </p>
    </section>
  );
}