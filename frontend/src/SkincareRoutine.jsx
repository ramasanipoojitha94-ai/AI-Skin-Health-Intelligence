import { useState, useEffect, useMemo } from "react";
import {
  Sun,
  Moon,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { apiRequest } from "./api";
import "./SkincareRoutine.css";

const morningTasks = [
  "Gentle cleanser",
  "Moisturizer",
  "Sunscreen SPF 30+",
];

const eveningTasks = [
  "Remove makeup / cleanse",
  "Gentle cleanser",
  "Moisturizer",
];

const defaultReminders = {
  morning: "08:00",
  evening: "20:00",
  enabled: false,
};

const emptyTasks = {
  morning: [],
  evening: [],
};

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeHistory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([date, data]) => [
      date,
      {
        morning: Array.isArray(data?.morning) ? data.morning : [],
        evening: Array.isArray(data?.evening) ? data.evening : [],
      },
    ])
  );
}

function normalizeCustomTasks(value) {
  return {
    morning: Array.isArray(value?.morning) ? value.morning : [],
    evening: Array.isArray(value?.evening) ? value.evening : [],
  };
}

function normalizeReminders(value) {
  return {
    morning: value?.morning || defaultReminders.morning,
    evening: value?.evening || defaultReminders.evening,
    enabled: Boolean(value?.enabled),
  };
}

export default function SkincareRoutine() {
  const today = new Date().toLocaleDateString("en-CA");

  const [history, setHistory] = useState(() =>
    normalizeHistory(
      readStorage("dermalytixRoutineHistory", {})
    )
  );

  const [customTasks, setCustomTasks] = useState(() =>
    normalizeCustomTasks(
      readStorage("dermalytixCustomRoutineTasks", emptyTasks)
    )
  );

  const [reminders, setReminders] = useState(() =>
    normalizeReminders(
      readStorage("dermalytixRoutineReminders", defaultReminders)
    )
  );

  const [newTask, setNewTask] = useState("");
  const [newTaskPeriod, setNewTaskPeriod] = useState("morning");

  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(
    "Connecting to database..."
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the logged-in user's routine from PostgreSQL.
  useEffect(() => {
    let cancelled = false;

    const loadCloudRoutine = async () => {
      try {
        const result = await apiRequest("/skincare/me");

        if (cancelled) return;

        const saved = result?.routine_data || {};

        setHistory(normalizeHistory(saved.history));
        setCustomTasks(normalizeCustomTasks(saved.customTasks));
        setReminders(normalizeReminders(saved.reminders));

        setCloudStatus("Connected to PostgreSQL");
      } catch (err) {
        if (!cancelled) {
          setCloudStatus(err.message || "Cloud sync unavailable.");
        }
      } finally {
        if (!cancelled) {
          setCloudLoaded(true);
        }
      }
    };

    if (!localStorage.getItem("dermalytixToken")) {
      setCloudStatus("Please log in to sync your routine.");
      setCloudLoaded(true);
      return;
    }

    loadCloudRoutine();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save routine changes to PostgreSQL.
  useEffect(() => {
    if (!cloudLoaded) return;

    if (!localStorage.getItem("dermalytixToken")) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setCloudStatus("Saving changes...");

        await apiRequest("/skincare/me", {
          method: "PUT",
          body: JSON.stringify({
            routine_data: {
              history,
              customTasks,
              reminders,
            },
          }),
          signal: controller.signal,
        });

        setCloudStatus("All changes saved to PostgreSQL");
      } catch (err) {
        if (err.name !== "AbortError") {
          setCloudStatus(err.message || "Could not save routine.");
        }
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [history, customTasks, reminders, cloudLoaded]);

  // Local backup.
  useEffect(() => {
    try {
      localStorage.setItem(
        "dermalytixRoutineHistory",
        JSON.stringify(history)
      );
      localStorage.setItem(
        "dermalytixCustomRoutineTasks",
        JSON.stringify(customTasks)
      );
      localStorage.setItem(
        "dermalytixRoutineReminders",
        JSON.stringify(reminders)
      );
    } catch {
      setError("Unable to save your local routine backup.");
    }
  }, [history, customTasks, reminders]);

  const todayData = history[today] || {
    morning: [],
    evening: [],
  };

  const allMorningTasks = useMemo(
    () => [...morningTasks, ...customTasks.morning],
    [customTasks.morning]
  );

  const allEveningTasks = useMemo(
    () => [...eveningTasks, ...customTasks.evening],
    [customTasks.evening]
  );

  const completed =
    todayData.morning.length + todayData.evening.length;

  const total = allMorningTasks.length + allEveningTasks.length;

  const percentage = total
    ? Math.min(100, Math.round((completed / total) * 100))
    : 0;

  const toggleTask = (period, task) => {
    setError("");
    setSuccess("");

    setHistory((previous) => {
      const current = previous[today] || {
        morning: [],
        evening: [],
      };

      const selected = current[period] || [];

      const updated = selected.includes(task)
        ? selected.filter((item) => item !== task)
        : [...selected, task];

      return {
        ...previous,
        [today]: {
          ...current,
          [period]: updated,
        },
      };
    });
  };

  const resetToday = () => {
    if (!window.confirm("Reset all completed tasks for today?")) {
      return;
    }

    setHistory((previous) => ({
      ...previous,
      [today]: {
        morning: [],
        evening: [],
      },
    }));

    setSuccess("Today's checklist has been reset.");
    setError("");
  };

  const addCustomTask = (event) => {
    event.preventDefault();

    const name = newTask.trim();

    if (!name) {
      setError("Please enter a skincare product or step.");
      return;
    }

    const existingTasks = [
      ...morningTasks,
      ...eveningTasks,
      ...customTasks.morning,
      ...customTasks.evening,
    ];

    if (
      existingTasks.some(
        (task) => task.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("This product is already in your routine.");
      return;
    }

    setCustomTasks((previous) => ({
      ...previous,
      [newTaskPeriod]: [...previous[newTaskPeriod], name],
    }));

    setNewTask("");
    setError("");
    setSuccess("New skincare step added.");
  };

  const removeCustomTask = (period, task) => {
    if (!window.confirm(`Remove "${task}" from your routine?`)) {
      return;
    }

    setCustomTasks((previous) => ({
      ...previous,
      [period]: previous[period].filter((item) => item !== task),
    }));

    setHistory((previous) => {
      const updated = { ...previous };

      Object.keys(updated).forEach((date) => {
        updated[date] = {
          ...updated[date],
          [period]: (updated[date][period] || []).filter(
            (item) => item !== task
          ),
        };
      });

      return updated;
    });

    setSuccess("Skincare step removed.");
  };

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    const day = date.getDay();

    date.setDate(date.getDate() - ((day + 6) % 7) + index);

    return date.toLocaleDateString("en-CA");
  });

  const weeklyData = weekDays.map((date) => ({
    date,
    morning: (history[date]?.morning || []).length,
    evening: (history[date]?.evening || []).length,
  }));

  const morningRate = allMorningTasks.length
    ? Math.round(
        (weeklyData.reduce((sum, day) => sum + day.morning, 0) /
          (7 * allMorningTasks.length)) *
          100
      )
    : 0;

  const eveningRate = allEveningTasks.length
    ? Math.round(
        (weeklyData.reduce((sum, day) => sum + day.evening, 0) /
          (7 * allEveningTasks.length)) *
          100
      )
    : 0;

  const weeklyCompleted = weeklyData.reduce(
    (sum, day) => sum + day.morning + day.evening,
    0
  );

  const recentDays = Object.entries(history)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  const renderTasks = (period, tasks) => {
    const completedTasks = todayData[period] || [];

    return (
      <div className="routine-card">
        <h2 className="routine-heading">
          {period === "morning" ? <Sun /> : <Moon />}

          {period === "morning"
            ? "Morning Routine"
            : "Evening Routine"}

          {tasks.length > 0 &&
            tasks.every((task) => completedTasks.includes(task)) && (
              <span className="routine-completed-badge">
                Completed
              </span>
            )}
        </h2>

        {tasks.map((task) => {
          const isCustom = customTasks[period].includes(task);

          return (
            <label className="routine-task" key={task}>
              <input
                type="checkbox"
                checked={completedTasks.includes(task)}
                onChange={() => toggleTask(period, task)}
              />

              <span>{task}</span>

              {isCustom && (
                <button
                  type="button"
                  className="routine-delete"
                  title="Remove product"
                  aria-label={`Remove ${task}`}
                  onClick={(event) => {
                    event.preventDefault();
                    removeCustomTask(period, task);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="skincare-routine">
      <h1>My Skincare Routine</h1>

      <p>
        Build consistent habits with your daily skincare checklist.
      </p>

      <p className="routine-cloud-status">
        <span className="routine-cloud-dot" />
        {cloudStatus}
      </p>

      {error && (
        <div className="routine-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="routine-success" role="status">
          {success}
        </div>
      )}

      <div className="routine-progress">
        <h2>Today's Completion</h2>

        <strong>{percentage}%</strong>

        <div
          className="routine-progress-track"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${percentage}%` }} />
        </div>

        <p>
          {completed} of {total} tasks completed
        </p>
      </div>

      <button
        type="button"
        className="routine-reset-button"
        onClick={resetToday}
      >
        <Trash2 size={16} />
        Reset Today's Checklist
      </button>

      <div className="routine-grid">
        {renderTasks("morning", allMorningTasks)}
        {renderTasks("evening", allEveningTasks)}
      </div>

      <div className="routine-card routine-custom">
        <h2>
          <Plus size={20} />
          Add Your Own Product
        </h2>

        <form onSubmit={addCustomTask} className="routine-add-form">
          <input
            type="text"
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            placeholder="Enter product or skincare step"
            maxLength={60}
          />

          <select
            value={newTaskPeriod}
            onChange={(event) =>
              setNewTaskPeriod(event.target.value)
            }
          >
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>

          <button type="submit">
            <Plus size={16} />
            Add
          </button>
        </form>
      </div>

      <div className="routine-weekly-stats">
        <h2>Weekly Statistics</h2>

        <div className="routine-stats-grid">
          <div className="routine-stat-card">
            <span>Tasks completed</span>
            <strong>{weeklyCompleted}</strong>
            <small>This week</small>
          </div>

          <div className="routine-stat-card">
            <span>Morning completion</span>
            <strong>{morningRate}%</strong>
            <small>Last 7 days</small>
          </div>

          <div className="routine-stat-card">
            <span>Evening completion</span>
            <strong>{eveningRate}%</strong>
            <small>Last 7 days</small>
          </div>
        </div>

        <h3>Daily Activity</h3>

        <div className="routine-week-bars">
          {weeklyData.map((day) => {
            const dayTotal = day.morning + day.evening;

            const dayPercentage = total
              ? Math.min(100, (dayTotal / total) * 100)
              : 0;

            return (
              <div className="routine-week-day" key={day.date}>
                <div className="routine-week-bar-track">
                  <div
                    className="routine-week-bar"
                    style={{ height: `${dayPercentage}%` }}
                  />
                </div>

                <span>
                  {new Date(day.date + "T12:00:00").toLocaleDateString(
                    "en",
                    { weekday: "short" }
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="routine-card routine-reminders">
        <h2>Daily Reminder Settings</h2>

        <p>
          Choose your preferred times for your skincare routine.
        </p>

        <label className="routine-reminder-toggle">
          <input
            type="checkbox"
            checked={reminders.enabled}
            onChange={(event) =>
              setReminders((previous) => ({
                ...previous,
                enabled: event.target.checked,
              }))
            }
          />

          Enable reminders
        </label>

        <div className="routine-reminder-times">
          <label>
            Morning reminder

            <input
              type="time"
              value={reminders.morning}
              onChange={(event) =>
                setReminders((previous) => ({
                  ...previous,
                  morning: event.target.value,
                }))
              }
              disabled={!reminders.enabled}
            />
          </label>

          <label>
            Evening reminder

            <input
              type="time"
              value={reminders.evening}
              onChange={(event) =>
                setReminders((previous) => ({
                  ...previous,
                  evening: event.target.value,
                }))
              }
              disabled={!reminders.enabled}
            />
          </label>
        </div>

        <p className="routine-note">
          Reminder times are saved, but browser notifications have not
          been implemented yet.
        </p>
      </div>

      <div className="routine-history">
        <h2>
          <CheckCircle2 />
          Recent Routine History
        </h2>

        {recentDays.length === 0 ? (
          <p>Your completed routines will appear here.</p>
        ) : (
          recentDays.map(([date, data]) => (
            <div className="routine-history-row" key={date}>
              <span>{date}</span>

              <strong>
                {(data.morning || []).length +
                  (data.evening || []).length}{" "}
                tasks completed
              </strong>
            </div>
          ))
        )}
      </div>

      <p className="routine-note">
        Add products you already use. Choose skincare products according
        to your skin needs and professional advice.
      </p>
    </div>
  );
}