import { useEffect, useState } from "react";
import {
  Activity,
  UploadCloud,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "./api";
import "./AcneSeverity.css";

const symptomsList = [
  "Painless pimples",
  "Painful or swollen pimples",
  "Itching or irritation",
  "Whiteheads and blackheads",
  "Pus-filled pimples",
  "Acne scars or dark spots",
];

const areasList = [
  "Forehead",
  "Cheeks",
  "Nose",
  "Chin and jawline",
  "Multiple areas",
];

const durationOptions = [
  "Less than 1 month",
  "1–3 months",
  "3–6 months",
  "More than 6 months",
];

export default function AcneSeverity() {
  const [areas, setAreas] = useState([]);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [duration, setDuration] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  function toggleSelection(value, values, setter) {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value]
    );
  }

  function handleImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSaveStatus("");
    setResult(null);

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImage(null);
      setError("Please select a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImage(null);
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setImage(file);
  }

  async function analyzeImage() {
    if (!image || !duration || !symptoms.length || !areas.length) {
      setError("Please upload an image and answer all three questions.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSaveStatus("");

    const formData = new FormData();
    formData.append("file", image);
    formData.append("duration", duration);
    formData.append("symptoms", symptoms.join(","));
    formData.append("areas", areas.join(","));
    formData.append("description", description.trim());

    try {
      const data = await apiRequest("/acne/analyze", {
        method: "POST",
        body: formData,
      });

      setResult(data);

      const token = localStorage.getItem("dermalytixToken");

      if (!token) {
        setSaveStatus("Log in to save this assessment to your reports.");
        return;
      }

      setSavingReport(true);

      try {
        await apiRequest("/reports/", {
          method: "POST",
          body: JSON.stringify({
            analysis_type: "Acne Severity Analysis",
            result: String(data.prediction ?? "Assessment completed"),
            confidence: Number(data.confidence ?? 0),
          }),
        });

        setSaveStatus("Assessment saved successfully!");
      } catch (saveError) {
        setSaveStatus(
          `Assessment completed, but report could not be saved: ${saveError.message}`
        );
      } finally {
        setSavingReport(false);
      }
    } catch (err) {
      setError(err.message || "Unable to complete analysis.");
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setImage(null);
    setDuration("");
    setSymptoms([]);
    setAreas([]);
    setDescription("");
    setResult(null);
    setError("");
    setSaveStatus("");
  }

  return (
    <div className="acne-analysis">
      <h2>
        <Activity /> Acne Severity Analysis
      </h2>

      <p>
        Upload an image and answer three simple questions for
        personalized educational skin-care insights.
      </p>

      <label className="acne-upload">
        <UploadCloud size={35} />

        <span>Choose a facial image (JPG or PNG)</span>

        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImage}
          hidden
        />
      </label>

      {preview && (
        <div className="acne-image-preview">
          <img
            src={preview}
            alt="Selected facial image for acne assessment"
            width="220"
          />

          <p>{image?.name}</p>

          <button type="button" onClick={() => setImage(null)}>
            Remove Image
          </button>
        </div>
      )}

      <div className="acne-question">
        <h3>1. How long have you been experiencing acne?</h3>

        {durationOptions.map((item) => (
          <label key={item}>
            <input
              type="radio"
              name="duration"
              value={item}
              checked={duration === item}
              onChange={() => setDuration(item)}
            />
            {item}
          </label>
        ))}
      </div>

      <div className="acne-question">
        <h3>2. What symptoms are you experiencing?</h3>

        <p>Select all that apply.</p>

        {symptomsList.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={symptoms.includes(item)}
              onChange={() =>
                toggleSelection(item, symptoms, setSymptoms)
              }
            />
            {item}
          </label>
        ))}
      </div>

      <div className="acne-question">
        <h3>Additional Information (Optional)</h3>

        <p>Tell us anything else about your skin concerns.</p>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value.slice(0, 1000))
          }
          placeholder="Example: I have small pimples on my forehead and my skin feels oily..."
          rows={5}
          maxLength={1000}
        />

        <p>{description.length}/1000 characters</p>
      </div>

      <div className="acne-question">
        <h3>3. Which areas are affected?</h3>

        <p>Select all that apply.</p>

        {areasList.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={areas.includes(item)}
              onChange={() =>
                toggleSelection(item, areas, setAreas)
              }
            />
            {item}
          </label>
        ))}
      </div>

      {error && (
        <p className="acne-error" role="alert">
          {error}
        </p>
      )}

      {saveStatus && (
        <p className="acne-success" role="status">
          {saveStatus}
        </p>
      )}

      <button
        type="button"
        onClick={analyzeImage}
        disabled={
          loading ||
          !image ||
          !duration ||
          !symptoms.length ||
          !areas.length
        }
      >
        {loading ? (
          <>
            <LoaderCircle className="acne-spinner" />
            Analyzing...
          </>
        ) : (
          "Analyze My Skin"
        )}
      </button>

      {result && (
        <div className="acne-result">
          <h3>
            <ShieldCheck /> Your Acne Assessment
          </h3>

          <h4>Image-based AI prediction</h4>

          <p>
            <strong>{result.prediction}</strong>
          </p>

          <p>
            Model confidence:{" "}
            {Number(result.confidence).toFixed(2)}%
          </p>

          {result.uncertain && (
            <p className="acne-warning">
              The model is not confident enough to provide a reliable
              classification.
            </p>
          )}

          {result.top_predictions?.length > 0 && (
            <>
              <h4>Other possible predictions</h4>

              <ul>
                {result.top_predictions.map((item, index) => (
                  <li key={`${item.prediction}-${index}`}>
                    {item.prediction} -{" "}
                    {Number(item.confidence).toFixed(2)}%
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.model_version && (
            <p>
              <strong>Model version:</strong> {result.model_version}
            </p>
          )}

          <h4>Your reported symptoms</h4>

          <p>{result.symptom_summary}</p>

          {result.user_description && (
            <>
              <h4>Additional concerns you shared</h4>
              <p>{result.user_description}</p>
            </>
          )}

          <p>
            <strong>Duration:</strong> {result.duration}
          </p>

          <h4>Recommended care</h4>

          <ul>
            {result.care_recommendations?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h4>Cautions</h4>

          <ul>
            {result.cautions?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {result.consult_dermatologist && (
            <p className="acne-warning">
              Consider consulting a qualified dermatologist.
            </p>
          )}

          {result.note && (
            <p className="acne-disclaimer">{result.note}</p>
          )}

          <button type="button" onClick={resetAnalysis}>
            Start New Assessment
          </button>
        </div>
      )}

      {savingReport && <p>Saving your assessment...</p>}
    </div>
  );
}