import { useEffect, useMemo, useState } from "react";
import { Camera, Trash2, TrendingUp } from "lucide-react";
import "./ProgressTracker.css";

const STORAGE_KEY = "dermalytixProgress";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function loadEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Unable to read the selected image."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Invalid image file."));

      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to process this image."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

export default function ProgressTracker() {
  const [entries, setEntries] = useState(loadEntries);
  const [condition, setCondition] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState(null);
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [timeFilter, setTimeFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      setError(
        "Your progress could not be saved. Browser storage may be full. Delete older entries and try again."
      );
    }
  }, [entries]);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Please select an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setSavingImage(true);
      const compressedImage = await compressImage(file);
      setImage(compressedImage);
    } catch (err) {
      setError(err.message || "Unable to process the selected image.");
      setImage(null);
    } finally {
      setSavingImage(false);
    }
  };

  const saveEntry = () => {
    setError("");
    setSuccess("");

    if (!image) {
      setError("Please upload a skin photo first.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      condition,
      notes: notes.trim(),
      image,
    };

    const updatedEntries = [newEntry, ...entries];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      setCondition("Normal");
      setNotes("");
      setImage(null);
      setSuccess("Your skin progress has been saved successfully.");
    } catch {
      setError("Unable to save your progress. Browser storage may be full.");
    }
  };

  const deleteEntry = (id) => {
    if (!window.confirm("Are you sure you want to delete this progress entry?")) {
      return;
    }

    const updatedEntries = entries.filter((entry) => entry.id !== id);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);

      if (String(id) === beforeId) setBeforeId("");
      if (String(id) === afterId) setAfterId("");

      setError("");
      setSuccess("Progress entry deleted.");
    } catch {
      setError("Unable to delete this entry.");
    }
  };

  const filteredEntries = useMemo(() => {
    const now = Date.now();

    return entries
      .filter((entry) => {
        const entryTime = Number(entry.id);
        const daysAgo = (now - entryTime) / (1000 * 60 * 60 * 24);

        const matchesTime =
          timeFilter === "All" ||
          (timeFilter === "Week" && daysAgo >= 0 && daysAgo <= 7) ||
          (timeFilter === "Month" && daysAgo >= 0 && daysAgo <= 30);

        const matchesCondition =
          conditionFilter === "All" ||
          entry.condition === conditionFilter;

        return matchesTime && matchesCondition;
      })
      .sort((a, b) =>
        sortOrder === "Newest"
          ? Number(b.id) - Number(a.id)
          : Number(a.id) - Number(b.id)
      );
  }, [entries, timeFilter, conditionFilter, sortOrder]);

  const conditionCounts = ["Improving", "Normal", "Unchanged", "Getting worse"].map(
    (status) => ({
      condition: status,
      count: entries.filter((entry) => entry.condition === status).length,
    })
  );

  const maxCount = Math.max(
    1,
    ...conditionCounts.map((item) => item.count)
  );

  const totalUpdates = entries.length;

  const improvingCount = entries.filter(
    (entry) => entry.condition === "Improving"
  ).length;

  const improvementPercentage =
    totalUpdates > 0
      ? Math.round((improvingCount / totalUpdates) * 100)
      : 0;

  const recentUpdates = entries.filter((entry) => {
    const days = (Date.now() - Number(entry.id)) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }).length;

  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    const count = entries.filter((entry) => {
      return new Date(Number(entry.id)).toDateString() === date.toDateString();
    }).length;

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    };
  });

  const maxWeeklyCount = Math.max(
    1,
    ...weeklyActivity.map((item) => item.count)
  );

  const monthlyActivity = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const count = entries.filter((entry) => {
      const entryDate = new Date(Number(entry.id));

      return (
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    }).length;

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      count,
    };
  });

  const maxMonthlyCount = Math.max(
    1,
    ...monthlyActivity.map((item) => item.count)
  );

  const beforeEntry = entries.find(
    (entry) => String(entry.id) === beforeId
  );

  const afterEntry = entries.find(
    (entry) => String(entry.id) === afterId
  );

  return (
    <div className="progress-tracker">
      <div className="progress-heading">
        <h1>My Skin Progress</h1>
        <p>Track your skin journey with regular photo updates.</p>
      </div>

      {error && (
        <div className="progress-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="progress-success" role="status">
          {success}
        </div>
      )}

      <div className="progress-form">
        <h2>
          <Camera size={22} />
          Add Today's Update
        </h2>

        <label htmlFor="progress-photo">Upload Skin Photo</label>
        <input
          id="progress-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImage}
        />

        {savingImage && <p>Processing image...</p>}

        {image && (
          <img
            className="progress-preview"
            src={image}
            alt="Skin progress preview"
          />
        )}

        <label htmlFor="progress-condition">Current Skin Condition</label>
        <select
          id="progress-condition"
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
        >
          <option>Normal</option>
          <option>Improving</option>
          <option>Getting worse</option>
          <option>Unchanged</option>
        </select>

        <label htmlFor="progress-notes">Notes</label>
        <textarea
          id="progress-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Describe any changes in your skin..."
          maxLength={1000}
        />

        <button
          type="button"
          onClick={saveEntry}
          disabled={savingImage}
        >
          Save Progress
        </button>
      </div>

      <div className="comparison-section">
        <h2>Before & After Comparison</h2>

        <label htmlFor="before-photo">Before Photo</label>
        <select
          id="before-photo"
          value={beforeId}
          onChange={(event) => setBeforeId(event.target.value)}
        >
          <option value="">Select before photo</option>
          {entries.map((entry) => (
            <option
              key={entry.id}
              value={entry.id}
              disabled={String(entry.id) === afterId}
            >
              {entry.date}
            </option>
          ))}
        </select>

        <label htmlFor="after-photo">After Photo</label>
        <select
          id="after-photo"
          value={afterId}
          onChange={(event) => setAfterId(event.target.value)}
        >
          <option value="">Select after photo</option>
          {entries.map((entry) => (
            <option
              key={entry.id}
              value={entry.id}
              disabled={String(entry.id) === beforeId}
            >
              {entry.date}
            </option>
          ))}
        </select>

        {beforeEntry && afterEntry && (
          <div className="comparison-images">
            <div>
              <h3>Before</h3>
              <img
                src={beforeEntry.image}
                alt="Before skin progress"
                className="comparison-photo"
                onClick={() =>
                  window.open(
                    beforeEntry.image,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                title="Click to view full-size"
              />
              <p className="comparison-date">
                Before photo date: {beforeEntry.date}
              </p>
            </div>

            <div>
              <h3>After</h3>
              <img
                src={afterEntry.image}
                alt="After skin progress"
                className="comparison-photo"
                onClick={() =>
                  window.open(
                    afterEntry.image,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                title="Click to view full-size"
              />
              <p className="comparison-date">
                After photo date: {afterEntry.date}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="analytics-cards">
        <div className="analytics-card">
          <h3>Total Updates</h3>
          <strong>{totalUpdates}</strong>
          <p>Photos recorded</p>
        </div>

        <div className="analytics-card">
          <h3>Improvement Rate</h3>
          <strong>{improvementPercentage}%</strong>
          <p>Updates marked improving</p>
        </div>

        <div className="analytics-card">
          <h3>Last 7 Days</h3>
          <strong>{recentUpdates}</strong>
          <p>Recent updates</p>
        </div>
      </div>

      <div className="monthly-summary">
        <h2>Monthly Progress Summary</h2>

        <div className="monthly-bars">
          {monthlyActivity.map((item, index) => (
            <div className="monthly-bar-item" key={`${item.month}-${index}`}>
              <strong>{item.count}</strong>
              <div className="monthly-bar-track">
                <div
                  className="monthly-bar-fill"
                  style={{
                    height: `${(item.count / maxMonthlyCount) * 100}%`,
                  }}
                />
              </div>
              <span>{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="weekly-activity">
        <h2>Weekly Skin Activity</h2>

        <div className="weekly-bars">
          {weeklyActivity.map((item) => (
            <div className="weekly-bar-item" key={item.day}>
              <strong>{item.count}</strong>
              <div className="weekly-bar-track">
                <div
                  className="weekly-bar-fill"
                  style={{
                    height: `${(item.count / maxWeeklyCount) * 100}%`,
                  }}
                />
              </div>
              <span>{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="progress-chart">
        <h2>Skin Improvement Overview</h2>

        {conditionCounts.map((item) => (
          <div className="chart-row" key={item.condition}>
            <span>{item.condition}</span>

            <div className="chart-track">
              <div
                className="chart-bar"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                }}
              />
            </div>

            <strong>{item.count}</strong>
          </div>
        ))}
      </div>

      <div className="progress-history">
        <div className="progress-filters">
          <select
            value={timeFilter}
            onChange={(event) => setTimeFilter(event.target.value)}
            aria-label="Filter by date"
          >
            <option value="All">All Time</option>
            <option value="Week">Last 7 Days</option>
            <option value="Month">Last 30 Days</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(event) => setConditionFilter(event.target.value)}
            aria-label="Filter by condition"
          >
            <option value="All">All Conditions</option>
            <option value="Normal">Normal</option>
            <option value="Improving">Improving</option>
            <option value="Unchanged">Unchanged</option>
            <option value="Getting worse">Getting worse</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            aria-label="Sort progress history"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>

        <button
          type="button"
          className="export-report"
          onClick={() => window.print()}
        >
          Download Progress Report (PDF)
        </button>

        <h2>
          <TrendingUp size={23} />
          Progress History
        </h2>

        {filteredEntries.length === 0 ? (
          <p>No matching progress updates found.</p>
        ) : (
          filteredEntries.map((entry) => (
            <div className="progress-entry" key={entry.id}>
              <img src={entry.image} alt="Skin progress" />

              <div>
                <h3>{entry.date}</h3>
                <p>Condition: {entry.condition}</p>
                <p>{entry.notes || "No additional notes."}</p>

                <button
                  type="button"
                  className="delete-progress"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="progress-disclaimer">
        Progress photos and condition labels are for personal tracking only.
        They do not provide a medical diagnosis.
      </p>
    </div>
  );
}