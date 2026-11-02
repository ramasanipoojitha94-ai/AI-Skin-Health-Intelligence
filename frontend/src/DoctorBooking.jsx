import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CheckCircle,
  Stethoscope,
} from "lucide-react";
import { apiRequest } from "./api";
import "./DoctorBooking.css";

const doctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    image: "/doctor-ananya.png",
    specialty: "General Dermatology",
    experience: "8 years",
    fee: 700,
    qualification: "MD Dermatology",
    about: "Focuses on general skin conditions and personalized skin care.",
  },
  {
    id: 2,
    name: "Dr. Rahul Mehta",
    image: "/doctor-rahul.png",
    specialty: "Acne & Acne Scars",
    experience: "10 years",
    fee: 900,
    qualification: "MD Dermatology",
    about: "Specializes in acne management, acne scars and skin treatments.",
  },
  {
    id: 3,
    name: "Dr. Priya Rao",
    image: "/doctor-priya.png",
    specialty: "Cosmetic Dermatology",
    experience: "7 years",
    fee: 800,
    qualification: "MD Dermatology",
    about: "Focuses on cosmetic skin care and skin rejuvenation.",
  },
  {
    id: 4,
    name: "Dr. Neha Reddy",
    image: "/doctor-neha.png",
    specialty: "Hair & Scalp Disorders",
    experience: "9 years",
    fee: 750,
    qualification: "MD Dermatology",
    about: "Focuses on hair loss, scalp conditions and hair health.",
  },
];

const timeSlots = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

export default function DoctorBooking() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);

  const today = (() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  })();

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty =
      specialty === "All" || doctor.specialty === specialty;

    return matchesSearch && matchesSpecialty;
  });

  function goBack() {
    setSelectedDoctor(null);
    setDate("");
    setTime("");
    setError("");
    setConfirmed(null);
    setBooking(false);
  }

  async function confirmBooking(e) {
    e.preventDefault();

    if (!selectedDoctor || !date || !time) {
      setError("Please select a doctor, date and time.");
      return;
    }

    if (date < today) {
      setError("Please select today or a future date.");
      return;
    }

    setError("");
    setBooking(true);

    try {
      const data = await apiRequest("/appointments/", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          doctor_name: selectedDoctor.name,
          specialty: selectedDoctor.specialty,
          appointment_date: date,
          appointment_time: time,
          consultation_fee: selectedDoctor.fee,
        }),
      });

      const appointment = data.appointment || data;

      setConfirmed({
        id: appointment.id,
        doctor: appointment.doctor_name || selectedDoctor.name,
        specialty: appointment.specialty || selectedDoctor.specialty,
        fee: appointment.consultation_fee ?? selectedDoctor.fee,
        date:
          appointment.date ||
          appointment.appointment_date ||
          date,
        time:
          appointment.time ||
          appointment.appointment_time ||
          time,
        status: appointment.status || "Booked",
      });
    } catch (err) {
      setError(err.message || "Unable to book appointment. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <section className="doctor-booking">
        <div className="booking-success">
          <CheckCircle size={65} />

          <h2>Appointment Confirmed!</h2>

          <p>Your appointment has been saved successfully.</p>

          <div className="confirmation-details">
            <h3>{confirmed.doctor}</h3>
            <p>{confirmed.specialty}</p>

            <p>
              <CalendarDays size={17} />
              {confirmed.date}
            </p>

            <p>
              <Clock size={17} />
              {confirmed.time}
            </p>

            <strong>Consultation fee: ₹{confirmed.fee}</strong>

            {confirmed.id && (
              <p>Appointment ID: {confirmed.id}</p>
            )}
          </div>

          <button type="button" onClick={goBack}>
            Back to Doctors
          </button>
        </div>

        <p className="demo-note">
          Demonstration doctor profiles and time slots only. No real clinic
          appointment is being made.
        </p>
      </section>
    );
  }

  if (selectedDoctor) {
    return (
      <section className="doctor-booking">
        <button
          type="button"
          className="doctor-back"
          onClick={goBack}
        >
          <ArrowLeft size={18} />
          Back to Doctors
        </button>

        <div className="doctor-profile">
          <div className="doctor-profile-top">
            <div className="doctor-avatar doctor-avatar-large">
              <img
                src={selectedDoctor.image}
                alt={selectedDoctor.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <span className="doctor-verified">
              Dermatology Specialist
            </span>
          </div>

          <h2>{selectedDoctor.name}</h2>
          <h3>{selectedDoctor.specialty}</h3>
          <p>{selectedDoctor.qualification}</p>
          <p>{selectedDoctor.experience} of experience</p>
          <p>{selectedDoctor.about}</p>

          <div className="profile-fee">
            Consultation Fee: ₹{selectedDoctor.fee}
          </div>
        </div>

        <form
          className="appointment-form"
          onSubmit={confirmBooking}
        >
          <h2>Book Your Appointment</h2>

          <label htmlFor="appointment-date">
            <CalendarDays size={18} />
            Select Appointment Date
          </label>

          <input
            id="appointment-date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <label htmlFor="appointment-time">
            <Clock size={18} />
            Select Appointment Time
          </label>

          <select
            id="appointment-time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          >
            <option value="">Choose a time slot</option>

            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>

          {error && (
            <p className="booking-message" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={booking}>
            {booking ? "Booking..." : "Confirm Booking"}
          </button>
        </form>

        <p className="demo-note">
          Demo profiles and time slots only. No real clinic appointment is
          being made.
        </p>
      </section>
    );
  }

  return (
    <section className="doctor-booking">
      <div className="doctor-heading">
        <span>EXPERT SKIN CARE</span>

        <h2>Find Your Dermatologist</h2>

        <p>
          Choose a specialist to view their profile and book a consultation.
        </p>
      </div>

      <input
        className="doctor-search"
        type="search"
        placeholder="Search doctors or specializations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search doctors"
      />

      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        aria-label="Filter by specialization"
      >
        <option value="All">All Specializations</option>

        {[...new Set(doctors.map((doctor) => doctor.specialty))].map(
          (item) => (
            <option key={item} value={item}>
              {item}
            </option>
          )
        )}
      </select>

      <div className="doctor-grid">
        {filteredDoctors.map((doctor) => (
          <article className="doctor-card" key={doctor.id}>
            <div className="doctor-avatar">
              <img
                src={doctor.image}
                alt={doctor.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <h3>{doctor.name}</h3>

            <p>{doctor.specialty}</p>

            <p>{doctor.experience} experience</p>

            <strong>Consultation fee: ₹{doctor.fee}</strong>

            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(doctor);
                setError("");
              }}
            >
              <Stethoscope size={16} />
              View Profile & Book
            </button>
          </article>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <p className="booking-message">
          No matching doctors found. Try another search.
        </p>
      )}

      <p className="demo-note">
        Demonstration doctor profiles and time slots only. Verify a
        doctor's credentials and availability before any real consultation.
      </p>
    </section>
  );
}