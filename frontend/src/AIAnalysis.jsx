import React, { useEffect, useState } from "react";
import {
  Upload,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Stethoscope,
  RefreshCw,
  Download,
  CheckCircle2,
  HeartPulse,
  Trash2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { apiRequest } from "./api";
import "./AIAnalysis.css";

const explainCondition = (name = "") => {
  const explanations = {
    "Seborrheic Keratoses and other Benign Tumors":
      "Usually non-cancerous skin growths.",
    "Vascular Tumors":
      "Conditions involving blood vessels in the skin.",
    "Light Diseases and Disorders of Pigmentation":
      "Conditions that affect skin pigmentation.",
    Melanoma:
      "A potentially serious skin cancer requiring medical assessment.",
    "Melanocytic Nevi":
      "Commonly known as moles or pigmented spots.",
    "Basal Cell Carcinoma":
      "A type of skin cancer requiring medical assessment.",
    "Actinic Keratoses":
      "Rough or scaly skin changes that should be checked by a dermatologist.",
    Dermatofibroma:
      "A usually harmless, firm skin growth.",
  };

  return explanations[name] || name.replaceAll("_", " ");
};

const getConfidenceMessage = (confidence) => {
  if (confidence < 40)
    return "The image did not provide enough information for a reliable result.";

  if (confidence < 70)
    return "The result is uncertain. A dermatologist can assess your skin more accurately.";

  return "The model found a stronger match, but this is not a confirmed diagnosis.";
};

export default function AIAnalysis() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [concern, setConcern] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const [concerns, setConcerns] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");

  const token = localStorage.getItem("dermalytixToken");

  useEffect(() => {
    loadConcerns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function loadConcerns() {
    if (!token) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);

    try {
      const data = await apiRequest("/skin-concerns/me");
      setConcerns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Please select a JPG or PNG image.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      e.target.value = "";
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setSaveStatus("");
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError("Please upload a skin image first.");
      return;
    }

    if (!token) {
      setError("Please log in before submitting your skin analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setSaveStatus("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const data = await apiRequest("/predict/analyze", {
        method: "POST",
        body: formData,
      });

      setResult(data);

      const saveTasks = [
        apiRequest("/reports/", {
          method: "POST",
          body: JSON.stringify({
            analysis_type: "AI Skin Analysis",
            result: String(
              data.prediction || "Uncertain / Unclassified"
            ),
            confidence: Number(data.confidence ?? 0),
          }),
        }),
      ];

      if (concern.trim()) {
        saveTasks.push(
          apiRequest("/skin-concerns/", {
            method: "POST",
            body: JSON.stringify({
              message: concern.trim(),
            }),
          })
        );
      }

      const outcomes = await Promise.allSettled(saveTasks);

      const failures = outcomes.filter(
        (item) => item.status === "rejected"
      );

      if (failures.length === 0) {
        setSaveStatus(
          concern.trim()
            ? "Analysis report and personal skin concern saved successfully."
            : "Your analysis report has been saved successfully."
        );
      } else {
        setSaveStatus(
          "Analysis completed. Some information could not be saved: " +
            failures.map((item) => item.reason.message).join(" ")
        );
      }

      if (concern.trim()) {
        await loadConcerns();
      }
    } catch (err) {
      setError(err.message || "Unable to complete analysis.");
    } finally {
      setLoading(false);
    }
  };

  async function updateConcern(id) {
    if (!editMessage.trim()) {
      setError("Please enter your concern.");
      return;
    }

    try {
      await apiRequest(`/skin-concerns/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          message: editMessage.trim(),
        }),
      });

      setEditingId(null);
      setEditMessage("");
      setSaveStatus("Your concern was updated.");
      await loadConcerns();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteConcern(id) {
    if (!window.confirm("Are you sure you want to delete this concern?")) {
      return;
    }

    try {
      await apiRequest(`/skin-concerns/${id}`, {
        method: "DELETE",
      });

      setSaveStatus("Your concern was deleted.");
      await loadConcerns();
    } catch (err) {
      setError(err.message);
    }
  }

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setConcern("");
    setResult(null);
    setError("");
    setSaveStatus("");
  };

  const confidence = Number(result?.confidence ?? 0);
  const uncertain = Boolean(result?.uncertain) || confidence < 60;
  const topPredictions = result?.top_predictions || [];

  const downloadResult = () => {
    if (!result) return;

    const report = [
      "DERMALYTIX - SKIN ANALYSIS REPORT",
      "--------------------------------",
      `Result: ${result.prediction || "Uncertain / Unclassified"}`,
      `Confidence: ${confidence.toFixed(2)}%`,
      "",
      "User's Skin Concern:",
      concern || "Not provided",
      "",
      "Possible matches:",
      ...topPredictions.map(
        (item) =>
          `${explainCondition(item.prediction)} - ${Number(
            item.confidence || 0
          ).toFixed(2)}%`
      ),
      "",
      "This AI result is experimental and educational. It is not a medical diagnosis.",
      "Consult a qualified dermatologist for medical assessment.",
    ].join("\n");

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "DermaLytix-Skin-Analysis.txt";
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="analysis-page">
      <div className="analysis-heading">
        <div>
          <h1>AI Skin Analysis</h1>
          <p>
            Upload your skin image and describe what you are experiencing.
          </p>
        </div>
        <Sparkles size={32} />
      </div>

      <div className="upload-box">
        {preview ? (
          <img
            className="analysis-preview"
            src={preview}
            alt="Selected skin image"
          />
        ) : (
          <Upload size={45} />
        )}

        <h3>Upload Your Skin Image</h3>
        <p>Choose a clear, well-lit JPG or PNG image.</p>

        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleImage}
        />

        {image && <p>Selected image: {image.name}</p>}
      </div>

      <div className="skin-concern-box">
        <div className="concern-title">
          <HeartPulse size={25} />
          <h3>Describe Your Skin Concerns</h3>
        </div>

        <p>
          Tell us about your symptoms, skin changes or questions related to
          the uploaded image.
        </p>

        <textarea
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          placeholder="Example: I have acne on my cheeks, itching, redness, dryness or dark spots. I have noticed these changes for two weeks..."
          maxLength={1000}
          rows={6}
        />

        <small>{concern.length}/1000 characters</small>
      </div>

      <button
        className="analyze-button"
        onClick={handleAnalyze}
        disabled={!image || loading}
      >
        {loading ? "Submitting..." : "Submit Image & Skin Concerns"}
      </button>

      {loading && (
        <p className="analysis-loading">
          <Sparkles size={18} />
          Please wait while we analyze your image and save your concern.
        </p>
      )}

      {error && (
        <div className="analysis-error">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {saveStatus && (
        <div className="analysis-save-status">
          <CheckCircle2 size={18} />
          {saveStatus}
        </div>
      )}

      {result && (
        <section className="analysis-result">
          <div className="result-title">
            <Sparkles size={25} />
            <h2>Your Skin Analysis</h2>
          </div>

          {concern.trim() && (
            <div className="result-section">
              <h3>Your Submitted Concern</h3>
              <p>{concern}</p>
            </div>
          )}

          <div className={`result-status ${uncertain ? "uncertain" : "review"}`}>
            <AlertCircle size={21} />
            <div>
              <strong>
                {uncertain ? "Uncertain result" : "Preliminary result"}
              </strong>
              <p>
                {uncertain
                  ? "We couldn't confidently identify this skin condition."
                  : "The image produced a possible match, but it is not a confirmed diagnosis."}
              </p>
            </div>
          </div>

          <div className="result-section">
            <h3>What We Found</h3>
            <p>
              {uncertain
                ? "The uploaded image did not provide enough information for a reliable classification."
                : explainCondition(result.prediction)}
            </p>
          </div>

          <div className="confidence-card">
            <h3>How Confident Is This Result?</h3>
            <div className="confidence-number">
              {confidence.toFixed(2)}%
            </div>

            <div className="confidence-track">
              <div
                className="confidence-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, confidence))}%`,
                }}
              />
            </div>

            <p>{getConfidenceMessage(confidence)}</p>
            <small>
              This percentage represents the model's confidence in its top
              suggested category. It is not the probability that you have a disease.
            </small>
          </div>

          {topPredictions.length > 0 && (
            <div className="result-section">
              <h3>Possible Matches</h3>
              <p className="result-helper">
                These are suggestions from the AI model, not confirmed conditions.
              </p>

              <div className="possible-matches">
                {topPredictions.slice(0, 3).map((item, index) => (
                  <div className="match-card" key={index}>
                    <div>
                      <strong>{explainCondition(item.prediction)}</strong>
                      <span>Possible match {index + 1}</span>
                    </div>
                    <strong>
                      {Number(item.confidence || 0).toFixed(2)}%
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-section next-steps">
            <h3>What Should You Do Next?</h3>
            <ul>
              <li>Use clear, well-lit images for better image quality.</li>
              <li>Do not use this AI result to make medical decisions.</li>
              <li>
                Consult a dermatologist if your skin concern persists,
                changes or worries you.
              </li>
            </ul>
          </div>

          {result.specialist && (
            <div className="specialist-card">
              <Stethoscope size={23} />
              <div>
                <strong>Suggested specialist</strong>
                <p>{result.specialist}</p>
              </div>
            </div>
          )}

          {result.precautions?.length > 0 && (
            <div className="result-section">
              <h3>General Precautions</h3>
              <ul>
                {result.precautions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="medical-disclaimer">
            <ShieldCheck size={21} />
            <p>
              This is an experimental AI tool for educational purposes only.
              It cannot diagnose skin conditions or replace a dermatologist.
            </p>
          </div>

          <div className="result-actions">
            <button onClick={handleReset} className="secondary-result-button">
              <RefreshCw size={17} /> Analyze Another Image
            </button>

            <button onClick={downloadResult} className="download-result-button">
              <Download size={17} /> Download Result
            </button>
          </div>
        </section>
      )}

      <section className="saved-concerns-section">
        <div className="concern-title">
          <HeartPulse size={25} />
          <h2>Your Saved Skin Concerns</h2>
        </div>

        <p>Review the concerns you previously submitted.</p>

        {!token ? (
          <p>Please log in to view your saved concerns.</p>
        ) : historyLoading ? (
          <p>Loading your saved concerns...</p>
        ) : concerns.length === 0 ? (
          <div className="concern-empty">
            <p>You haven't saved any skin concerns yet.</p>
          </div>
        ) : (
          concerns.map((item) => (
            <article className="saved-concern-card" key={item.id}>
              {editingId === item.id ? (
                <>
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    maxLength={1000}
                    rows={4}
                  />

                  <button onClick={() => updateConcern(item.id)}>
                    <Save size={16} /> Save Changes
                  </button>

                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditMessage("");
                    }}
                  >
                    <X size={16} /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <p>{item.message}</p>

                  <small>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Saved concern"}
                  </small>

                  <div className="concern-history-actions">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditMessage(item.message);
                      }}
                    >
                      <Pencil size={16} /> Edit
                    </button>

                    <button onClick={() => deleteConcern(item.id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </section>

      <p className="analysis-note">
        Your skin health matters. When in doubt, seek advice from a qualified dermatologist.
      </p>
    </div>
  );
}