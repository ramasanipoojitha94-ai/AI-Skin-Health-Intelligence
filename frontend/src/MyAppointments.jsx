import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  UserRound,
  RefreshCw,
  XCircle,
  CheckCircle,
  Edit,
} from "lucide-react";
import { apiRequest } from "./api";
import "./MyAppointments.css";

const doctorImages = {
  1: "/doctor-ananya.png",
  2: "/doctor-rahul.png",
  3: "/doctor-priya.png",
  4: "/doctor-neha.png",
};

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const today = getLocalDate();

  const fetchAppointments = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const data = await apiRequest("/appointments/me");

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function cancelAppointment(id) {
    if (
      !window.confirm(
        "Are you sure you want to cancel this appointment?"
      )
    ) {
      return;
    }

    setCancellingId(id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/appointments/${id}/cancel`, {
        method: "PATCH",
      });

      setMessage("Appointment cancelled successfully.");
      await fetchAppointments(false);
    } catch (err) {
      setError(err.message || "Cancellation failed.");
    } finally {
      setCancellingId(null);
    }
  }

  function startReschedule(appointment) {
    setEditingId(appointment.id);
    setNewDate(appointment.date || "");
    setNewTime(appointment.time || "");
    setError("");
    setMessage("");
  }

  async function rescheduleAppointment(id) {
    if (!newDate || !newTime) {
      setError("Please select a date and time.");
      return;
    }

    if (newDate < today) {
      setError("Please select today or a future date.");
      return;
    }

    setSavingId(id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/appointments/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({
          appointment_date: newDate,
          appointment_time: newTime,
        }),
      });

      setEditingId(null);
      setNewDate("");
      setNewTime("");
      setMessage("Appointment rescheduled successfully.");

      await fetchAppointments(false);
    } catch (err) {
      setError(err.message || "Rescheduling failed.");
    } finally {
      setSavingId(null);
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setNewDate("");
    setNewTime("");
    setError("");
  }

  const filteredAppointments = appointments.filter(
    (appointment) =>
      filter === "All" || appointment.status === filter
  );

  const bookedCount = appointments.filter(
    (appointment) => appointment.status === "Booked"
  ).length;

  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === "Cancelled"
  ).length;

  if (loading) {
    return (
      <section className="my-appointments">
        <p className="appointment-loading">
          Loading your appointments...
        </p>
      </section>
    );
  }

  return (
    <section className="my-appointments">
      <header className="my-appointments-heading">
        <span>YOUR SKIN HEALTH JOURNEY</span>
        <h2>My Appointments</h2>
        <p>
          Manage and review your dermatologist appointments.
        </p>
      </header>

      <div className="appointment-summary">
        <div>
          <span>Total</span>
          <strong>{appointments.length}</strong>
        </div>

        <div>
          <span>Booked</span>
          <strong>{bookedCount}</strong>
        </div>

        <div>
          <span>Cancelled</span>
          <strong>{cancelledCount}</strong>
        </div>
      </div>

      <div className="appointment-toolbar">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter appointments"
        >
          <option value="All">All Appointments</option>
          <option value="Booked">Booked</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          className="appointment-refresh"
          onClick={() => fetchAppointments(false)}
          disabled={refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="appointment-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="appointment-success" role="status">
          {message}
        </p>
      )}

      {filteredAppointments.length === 0 ? (
        <div className="appointment-empty">
          <CalendarDays size={48} />
          <h3>No appointments found</h3>
          <p>
            Your appointments will appear here after you book a doctor.
          </p>
        </div>
      ) : (
        <div className="appointment-list">
          {filteredAppointments.map((appointment) => (
            <article
              className="appointment-card"
              key={appointment.id}
            >
              <div className="appointment-doctor">
                <img
                  src={
                    doctorImages[appointment.doctor_id] ||
                    "/doctor-ananya.png"
                  }
                  alt={appointment.doctor_name || "Doctor"}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <h3>{appointment.doctor_name}</h3>
                  <p>{appointment.specialty}</p>
                </div>

                <span
                  className={`appointment-status ${
                    appointment.status === "Cancelled"
                      ? "cancelled"
                      : "booked"
                  }`}
                >
                  {appointment.status === "Cancelled" ? (
                    <XCircle size={15} />
                  ) : (
                    <CheckCircle size={15} />
                  )}

                  {appointment.status}
                </span>
              </div>

              <div className="appointment-information">
                <p>
                  <CalendarDays size={17} />
                  {appointment.date}
                </p>

                <p>
                  <Clock size={17} />
                  {appointment.time}
                </p>

                <p>
                  <UserRound size={17} />
                  Booking ID: {appointment.id}
                </p>

                <strong>
                  Consultation fee: ₹{appointment.fee ?? "N/A"}
                </strong>
              </div>

              {editingId === appointment.id && (
                <div className="reschedule-panel">
                  <h3>Reschedule Appointment</h3>

                  <label htmlFor={`date-${appointment.id}`}>
                    New appointment date
                  </label>

                  <input
                    id={`date-${appointment.id}`}
                    type="date"
                    min={today}
                    value={newDate}
                    onChange={(event) =>
                      setNewDate(event.target.value)
                    }
                    disabled={savingId === appointment.id}
                  />

                  <label htmlFor={`time-${appointment.id}`}>
                    New appointment time
                  </label>

                  <select
                    id={`time-${appointment.id}`}
                    value={newTime}
                    onChange={(event) =>
                      setNewTime(event.target.value)
                    }
                    disabled={savingId === appointment.id}
                  >
                    <option value="">Choose a time slot</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>

                  <div className="reschedule-actions">
                    <button
                      type="button"
                      onClick={() =>
                        rescheduleAppointment(appointment.id)
                      }
                      disabled={savingId === appointment.id}
                    >
                      {savingId === appointment.id
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={savingId === appointment.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {appointment.status === "Booked" &&
                editingId !== appointment.id && (
                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="reschedule-appointment"
                      onClick={() => startReschedule(appointment)}
                    >
                      <Edit size={16} />
                      Reschedule
                    </button>

                    <button
                      type="button"
                      className="cancel-appointment"
                      onClick={() =>
                        cancelAppointment(appointment.id)
                      }
                      disabled={cancellingId === appointment.id}
                    >
                      {cancellingId === appointment.id
                        ? "Cancelling..."
                        : "Cancel Appointment"}
                    </button>
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}