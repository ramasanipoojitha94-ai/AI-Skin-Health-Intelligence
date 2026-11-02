import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import {
  MessageCircle,
  ArrowRight,
  Activity,
  ShieldCheck,
  Sparkles,
  ScanFace,
  Stethoscope,
  CalendarCheck,
  BookOpen,
  HeartPulse,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  History,
  FileText,
  UserRound,
  Settings,
  LogOut,
  CalendarDays,
  TrendingUp,
  Download,
  Clock3,
  Sun,
  Moon,
  RefreshCw,
  ClipboardCheck,
  CircleCheck,
} from "lucide-react";

import AcneSeverity from "./AcneSeverity.jsx";
import MyAppointments from "./MyAppointments.jsx";
import ProgressTracker from "./ProgressTracker.jsx";
import SkincareRoutine from "./SkincareRoutine.jsx";
import AIAnalysis from "./AIAnalysis.jsx";
import DoctorBooking from "./DoctorBooking.jsx";
import PersonalSkinConcerns from "./PersonalSkinConcerns.jsx";
import Login from "./login.jsx";
import HealthReports from "./HealthReports.jsx";
import Register from "./Register.jsx";
import Profile from "./Profile.jsx";
import SettingsPage from "./Settings.jsx";
import SkinEducation from "./SkinEducation.jsx";
import ChatAssistant from "./ChatAssistant.jsx";
import { apiRequest } from "./api";

import "./App.css";

/* =====================================
   HOME PAGE
===================================== */

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: ScanFace,
      title: "AI Skin Analysis",
      description:
        "Analyze skin images using AI-powered technology and receive preliminary insights.",
    },
    {
      icon: Activity,
      title: "Skin Progress Tracker",
      description:
        "Monitor visible skin changes and maintain your skin health history.",
    },
    {
      icon: Stethoscope,
      title: "Dermatologist Booking",
      description:
        "Find skin specialists and explore consultation options.",
    },
    {
      icon: HeartPulse,
      title: "Personalized Routine",
      description:
        "Discover skincare routines based on your skin profile and concerns.",
    },
    {
      icon: BookOpen,
      title: "Skin Education",
      description:
        "Learn about skin anatomy, conditions, prevention and treatments.",
    },
    {
      icon: ShieldCheck,
      title: "Health Reports",
      description:
        "Keep your analysis history organized with downloadable reports.",
    },
  ];

  return (
    <div className="website">
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          <span>
            Derma<span className="brand-highlight">Lytix</span>
          </span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          type="button"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#home" onClick={() => setMenuOpen(false)}>
            Home
          </a>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a href="#doctors" onClick={() => setMenuOpen(false)}>
            Doctors
          </a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="login-link">
            Log in
          </Link>
          <Link to="/register" className="signup-button">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={15} />
              INTELLIGENT SKIN HEALTH PLATFORM
            </div>

            <h1>
              Understand Your Skin.
              <span> Transform Your</span>
              <span className="gradient-text"> Skin Health.</span>
            </h1>

            <p className="hero-description">
              Discover a smarter approach to skincare with AI-powered skin
              analysis, personalized guidance and access to dermatology experts.
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="primary-button">
                Explore Skin Analysis <ArrowRight size={18} />
              </Link>

              <a href="#about" className="secondary-button">
                Discover More <ChevronRight size={18} />
              </a>
            </div>

            <div className="trust-line">
              <ShieldCheck size={18} />
              Technology-assisted skin insights. Expert care matters.
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="skin-card">
              <div className="card-top">
                <span className="live-dot"></span>
                SKIN HEALTH TECHNOLOGY
                <Sparkles size={18} />
              </div>

              <div className="face-illustration">
                <div className="face-circle">
                  <ScanFace size={112} strokeWidth={0.8} />
                </div>

                <span className="scan-point point-one"></span>
                <span className="scan-point point-two"></span>
                <span className="scan-point point-three"></span>
              </div>

              <div className="visual-caption">
                <div>
                  <span className="caption-label">DERMALYTIX AI</span>
                  <h3>Skin Intelligence</h3>
                </div>

                <div className="caption-icon">
                  <Activity size={23} />
                </div>
              </div>

              <div className="visual-bottom">
                <span>ANALYZE</span>
                <span>•</span>
                <span>UNDERSTAND</span>
                <span>•</span>
                <span>CARE</span>
              </div>
            </div>

            <div className="floating-tag tag-one">
              <Sparkles size={18} />
              <span>AI Powered Insights</span>
            </div>

            <div className="floating-tag tag-two">
              <ShieldCheck size={18} />
              <span>Skin Health First</span>
            </div>
          </div>
        </section>

        <section className="feature-strip">
          <div>
            <ScanFace />
            <span>AI Skin Intelligence</span>
          </div>
          <div>
            <HeartPulse />
            <span>Personalized Skincare</span>
          </div>
          <div>
            <Stethoscope />
            <span>Expert Guidance</span>
          </div>
          <div>
            <ShieldCheck />
            <span>Health-Focused Platform</span>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="section-label">WHAT WE OFFER</span>

            <h2>
              Your Complete <span>Skin Health</span> Companion
            </h2>

            <p>
              Everything you need to understand, monitor and care for your skin
              in one place.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <article className="feature-card" key={index}>
                  <div className="feature-icon">
                    <Icon size={25} />
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>

                  <Link to="/login">
                    Explore feature <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="analysis-section" id="analysis">
          <div className="analysis-content">
            <span className="section-label">
              YOUR SKIN JOURNEY STARTS HERE
            </span>

            <h2>Make informed decisions about your skin health.</h2>

            <p>
              Explore AI-assisted skin analysis and discover educational
              resources to help you understand your skin better.
            </p>

            <Link to="/login" className="primary-button">
              Get Started <ArrowRight size={18} />
            </Link>
          </div>

          <div className="analysis-icon">
            <ScanFace size={115} strokeWidth={1} />
            <Sparkles className="analysis-sparkle" size={30} />
          </div>
        </section>

        <section className="about-section" id="about">
          <span className="section-label">ABOUT DERMALYTIX</span>

          <h2>
            Where technology meets <span>skin health.</span>
          </h2>

          <p>
            DermaLytix brings together artificial intelligence, skin health
            education and dermatology guidance to make skin care more
            accessible and understandable.
          </p>
        </section>

        <section className="doctor-section" id="doctors">
          <div>
            <span className="section-label">EXPERT CARE</span>

            <h2>
              Your skin deserves <span>expert attention.</span>
            </h2>

            <p>
              Explore dermatologist consultation options for professional
              skin evaluation and treatment.
            </p>
          </div>

          <Link to="/login" className="secondary-button">
            Explore Consultations <CalendarCheck size={18} />
          </Link>
        </section>
      </main>

      <footer className="footer">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Activity size={22} />
          </span>
          Derma<span className="brand-highlight">Lytix</span>
        </Link>

        <p>Smarter skin health starts with understanding.</p>

        <span>© 2026 DermaLytix. All rights reserved.</span>
      </footer>
    </div>
  );
}

/* =====================================
   APPLICATION ROUTES
===================================== */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* =====================================
   DASHBOARD NAVIGATION
===================================== */

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "AI Skin Analysis", icon: ScanFace },
  { name: "Acne Severity Analysis", icon: Activity },
  { name: "Progress Tracker", icon: History },
  { name: "Doctor Booking", icon: Stethoscope },
  { name: "My Appointments", icon: CalendarDays },
  { name: "Skincare Routine", icon: HeartPulse },
  { name: "Skin Education", icon: BookOpen },
  { name: "Health Reports", icon: FileText },
  { name: "Chat Assistant", icon: MessageCircle },
  { name: "Personal Skin Concerns", icon: ClipboardCheck },
  { name: "My Profile", icon: UserRound },
  { name: "Settings", icon: Settings },
];

const featureDescriptions = {
  "AI Skin Analysis":
    "Upload a skin image and explore preliminary AI insights.",
  "Acne Severity Analysis":
    "Explore acne severity using image analysis.",
  "Progress Tracker": "Monitor your skin journey over time.",
  "Doctor Booking": "Explore dermatologist consultation options.",
  "My Appointments": "View and manage your appointments.",
  "Skincare Routine": "Manage your personalized skincare routine.",
  "Skin Education": "Explore skin health and educational resources.",
  "Health Reports": "Access your saved skin analysis reports.",
  "Chat Assistant": "Ask educational questions about skin health.",
  "Personal Skin Concerns": "Keep track of your personal skin concerns.",
};

const featureComponents = {
  "AI Skin Analysis": AIAnalysis,
  "Acne Severity Analysis": AcneSeverity,
  "Progress Tracker": ProgressTracker,
  "Doctor Booking": DoctorBooking,
  "My Appointments": MyAppointments,
  "Skincare Routine": SkincareRoutine,
  "Skin Education": SkinEducation,
  "Health Reports": HealthReports,
  "Chat Assistant": ChatAssistant,
  "Personal Skin Concerns": PersonalSkinConcerns,
  "My Profile": Profile,
  Settings: SettingsPage,
};

/* =====================================
   DASHBOARD
===================================== */
function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("dermalytixToken");

  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0,
    upcoming_appointments: [],
  });

  const [reportsLoading, setReportsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [appointmentsError, setAppointmentsError] = useState("");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dermalytixUser")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("dermalytixUser")) || {});
    } catch {
      setUser({});
    }
  }, []);

  const loadDashboardData = async () => {
    setReportsLoading(true);
    setAppointmentsLoading(true);
    setReportsError("");
    setAppointmentsError("");

    const [reportResult, appointmentResult] = await Promise.allSettled([
      apiRequest("/reports/me"),
      apiRequest("/appointments/summary"),
    ]);

    if (reportResult.status === "fulfilled") {
      setReports(
        Array.isArray(reportResult.value) ? reportResult.value : []
      );
    } else {
      setReportsError(
        reportResult.reason?.message || "Unable to load reports."
      );
    }

    if (appointmentResult.status === "fulfilled") {
      setAppointments(appointmentResult.value);
    } else {
      setAppointmentsError(
        appointmentResult.reason?.message ||
          "Unable to load appointments."
      );
    }

    setReportsLoading(false);
    setAppointmentsLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const stats = useMemo(() => {
    const skin = reports.filter(
      (report) => report.analysis_type === "AI Skin Analysis"
    ).length;

    const acne = reports.filter(
      (report) => report.analysis_type === "Acne Severity Analysis"
    ).length;

    return {
      total: reports.length,
      skin,
      acne,
    };
  }, [reports]);

  const monthlyActivity = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1
      );

      const count = reports.filter((report) => {
        if (!report.created_at) return false;

        const created = new Date(report.created_at);

        return (
          !Number.isNaN(created.getTime()) &&
          created.getFullYear() === monthDate.getFullYear() &&
          created.getMonth() === monthDate.getMonth()
        );
      }).length;

      return {
        label: monthDate.toLocaleDateString("en-US", {
          month: "short",
        }),
        count,
      };
    });
  }, [reports]);

  const maxActivity = Math.max(
    1,
    ...monthlyActivity.map((item) => item.count)
  );

  const recentReports = useMemo(() => {
    return [...reports]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 4);
  }, [reports]);

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const logout = () => {
    localStorage.removeItem("dermalytixUser");
    localStorage.removeItem("dermalytixToken");
    navigate("/login", { replace: true });
  };

  const openFeature = (name) => {
    setActive(name);
    setSidebarOpen(false);
  };

  const openReports = () => openFeature("Health Reports");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const ActiveComponent = featureComponents[active];

  return (
    <div className="dl-dashboard">
      <aside
        className={`dl-sidebar ${sidebarOpen ? "dl-sidebar-open" : ""}`}
      >
        <div className="dl-brand">
          <div className="dl-brand-icon">
            <Activity size={23} />
          </div>
          <span>
            Derma<span>Lytix</span>
          </span>
        </div>

        <p className="dl-menu-label">WORKSPACE</p>

        <nav className="dl-navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                type="button"
                className={active === item.name ? "dl-nav-active" : ""}
                onClick={() => openFeature(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="dl-sidebar-bottom">
          <div className="dl-help-card">
            <ShieldCheck size={23} />
            <strong>Your skin matters</strong>
            <p>
              Technology-assisted insights. Expert care always matters.
            </p>
          </div>

          <button className="dl-logout" onClick={logout} type="button">
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="dl-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <main className="dl-main">
        <header className="dl-topbar">
          <button
            className="dl-mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            type="button"
            aria-label="Toggle dashboard menu"
          >
            {sidebarOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          <div>
            <span className="dl-top-label">DERMALYTIX / WORKSPACE</span>
            <h2>{active}</h2>
          </div>

          <button
            type="button"
            className="dl-user"
            onClick={() => openFeature("My Profile")}
            aria-label="Open profile"
          >
            <div className="dl-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.name || "User"}</strong>
              <small>Personal Account</small>
            </div>
          </button>
        </header>

        {active === "Dashboard" ? (
          <div className="dl-overview">
            <section className="dl-welcome">
              <div>
                <span className="dl-welcome-tag">
                  <Sparkles size={15} />
                  YOUR SKIN HEALTH JOURNEY
                </span>

                <h1>Hello, {user.name || "there"}!</h1>

                <p>
                  Understand your skin better with AI-assisted insights,
                  personalized skincare and expert guidance.
                </p>

                <button
                  type="button"
                  onClick={() => openFeature("AI Skin Analysis")}
                >
                  Start Skin Analysis <ArrowRight size={17} />
                </button>
              </div>

              <div className="dl-welcome-art">
                <ScanFace size={115} strokeWidth={1.1} />
                <Sparkles className="dl-art-sparkle" size={25} />
              </div>
            </section>

            <div className="dl-date-row">
              <div>
                <Sun size={18} />
                <span>{formattedDate}</span>
              </div>

              <button
                type="button"
                onClick={loadDashboardData}
                disabled={reportsLoading || appointmentsLoading}
              >
                <RefreshCw
                  size={15}
                  className={
                    reportsLoading || appointmentsLoading
                      ? "dl-refresh-spin"
                      : ""
                  }
                />
                Refresh data
              </button>
            </div>

            {/* Dashboard statistics */}

            <section className="dl-stats-grid">
              <article className="dl-stat-card">
                <div className="dl-stat-icon">
                  <FileText size={22} />
                </div>
                <div>
                  <span>Total Reports</span>
                  <strong>
                    {reportsLoading ? "—" : stats.total}
                  </strong>
                  <small>Saved health reports</small>
                </div>
                <button
                  type="button"
                  onClick={openReports}
                  aria-label="View health reports"
                >
                  <ArrowRight size={18} />
                </button>
              </article>

              <article className="dl-stat-card">
                <div className="dl-stat-icon">
                  <ScanFace size={22} />
                </div>
                <div>
                  <span>Skin Analyses</span>
                  <strong>
                    {reportsLoading ? "—" : stats.skin}
                  </strong>
                  <small>AI skin analysis reports</small>
                </div>
                <button
                  type="button"
                  onClick={() => openFeature("AI Skin Analysis")}
                  aria-label="Open skin analysis"
                >
                  <ArrowRight size={18} />
                </button>
              </article>

              <article className="dl-stat-card">
                <div className="dl-stat-icon">
                  <Activity size={22} />
                </div>
                <div>
                  <span>Acne Analyses</span>
                  <strong>
                    {reportsLoading ? "—" : stats.acne}
                  </strong>
                  <small>Acne analysis reports</small>
                </div>
                <button
                  type="button"
                  onClick={() => openFeature("Acne Severity Analysis")}
                  aria-label="Open acne analysis"
                >
                  <ArrowRight size={18} />
                </button>
              </article>

              <article className="dl-stat-card">
                <div className="dl-stat-icon">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <span>Upcoming Appointments</span>
                  <strong>
                    {appointmentsLoading ? "—" : appointments.upcoming}
                  </strong>
                  <small>Scheduled consultations</small>
                </div>
                <button
                  type="button"
                  onClick={() => openFeature("My Appointments")}
                  aria-label="View appointments"
                >
                  <ArrowRight size={18} />
                </button>
              </article>
            </section>

            {reportsError && (
              <div className="dl-dashboard-error" role="alert">
                <span>{reportsError}</span>
                <button type="button" onClick={loadDashboardData}>
                  Retry
                </button>
              </div>
            )}

            {appointmentsError && (
              <div className="dl-dashboard-error" role="alert">
                <span>{appointmentsError}</span>
                <button type="button" onClick={loadDashboardData}>
                  Retry
                </button>
              </div>
            )}

            {/* Analytics and quick actions */}

            <section className="dl-dashboard-grid">
              <article className="dl-panel dl-activity-panel">
                <div className="dl-panel-heading">
                  <div>
                    <span>YOUR ACTIVITY</span>
                    <h3>Analysis Overview</h3>
                  </div>
                  <div className="dl-panel-heading-icon">
                    <TrendingUp size={19} />
                  </div>
                </div>

                <p className="dl-panel-description">
                  Your saved reports over the last six months.
                </p>

                <div className="dl-chart">
                  {monthlyActivity.map((item, index) => (
                    <div
                      className="dl-chart-column"
                      key={`${item.label}-${index}`}
                    >
                      <strong>{item.count}</strong>
                      <div className="dl-chart-track">
                        <div
                          className="dl-chart-bar"
                          style={{
                            height:
                              item.count === 0
                                ? "0%"
                                : `${Math.max(
                                    8,
                                    (item.count / maxActivity) * 100
                                  )}%`,
                          }}
                        />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="dl-chart-footer">
                  <span>
                    <span className="dl-chart-dot" />
                    Saved analysis reports
                  </span>
                  <strong>{stats.total} total</strong>
                </div>
              </article>

              <article className="dl-panel dl-quick-panel">
                <div className="dl-panel-heading">
                  <div>
                    <span>GET STARTED</span>
                    <h3>Quick Actions</h3>
                  </div>
                  <div className="dl-panel-heading-icon">
                    <Sparkles size={19} />
                  </div>
                </div>

                <div className="dl-quick-actions">
                  <button
                    type="button"
                    onClick={() => openFeature("AI Skin Analysis")}
                  >
                    <span className="dl-quick-icon">
                      <ScanFace size={20} />
                    </span>
                    <span>
                      <strong>Analyze Skin</strong>
                      <small>Upload a skin image</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openFeature("Doctor Booking")}
                  >
                    <span className="dl-quick-icon">
                      <Stethoscope size={20} />
                    </span>
                    <span>
                      <strong>Book a Doctor</strong>
                      <small>Explore consultation options</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={openReports}
                  >
                    <span className="dl-quick-icon">
                      <Download size={20} />
                    </span>
                    <span>
                      <strong>View Reports</strong>
                      <small>Access saved reports</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openFeature("Skincare Routine")}
                  >
                    <span className="dl-quick-icon">
                      <HeartPulse size={20} />
                    </span>
                    <span>
                      <strong>Skincare Routine</strong>
                      <small>Manage daily skincare</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </article>
            </section>

            {/* Upcoming appointments */}

            <section className="dl-panel dl-recent-panel">
              <div className="dl-panel-heading">
                <div>
                  <span>YOUR SCHEDULE</span>
                  <h3>Upcoming Appointments</h3>
                </div>

                <button
                  type="button"
                  onClick={() => openFeature("My Appointments")}
                >
                  View all <ArrowRight size={15} />
                </button>
              </div>

              {appointmentsLoading ? (
                <div className="dl-recent-empty">
                  <RefreshCw size={19} className="dl-refresh-spin" />
                  Loading appointments...
                </div>
              ) : appointments.upcoming_appointments?.length > 0 ? (
                <div className="dl-recent-list">
                  {appointments.upcoming_appointments.map((appointment) => (
                    <article
                      className="dl-recent-item"
                      key={appointment.id}
                    >
                      <div className="dl-recent-icon">
                        <Stethoscope size={20} />
                      </div>

                      <div className="dl-recent-info">
                        <strong>{appointment.doctor_name}</strong>
                        <span>{appointment.specialty}</span>
                        <small>
                          <CalendarDays size={13} />
                          {appointment.date} · {appointment.time}
                        </small>
                      </div>

                      <span className="dl-appointment-status">
                        {appointment.status}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dl-recent-empty">
                  <CalendarCheck size={30} />
                  <strong>No upcoming appointments</strong>
                  <p>Your scheduled consultations will appear here.</p>
                  <button
                    type="button"
                    onClick={() => openFeature("Doctor Booking")}
                  >
                    Book an appointment
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </section>

            {/* Recent reports */}

            <section className="dl-panel dl-recent-panel">
              <div className="dl-panel-heading">
                <div>
                  <span>YOUR HISTORY</span>
                  <h3>Recent Reports</h3>
                </div>

                <button type="button" onClick={openReports}>
                  View all <ArrowRight size={15} />
                </button>
              </div>

              {reportsLoading ? (
                <div className="dl-recent-empty">
                  <RefreshCw size={19} className="dl-refresh-spin" />
                  Loading your reports...
                </div>
              ) : recentReports.length === 0 ? (
                <div className="dl-recent-empty">
                  <ClipboardCheck size={30} />
                  <strong>No reports yet</strong>
                  <p>
                    Your saved skin analysis reports will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => openFeature("AI Skin Analysis")}
                  >
                    Start your first analysis
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="dl-recent-list">
                  {recentReports.map((report) => (
                    <article
                      className="dl-recent-item"
                      key={report.id}
                    >
                      <div className="dl-recent-icon">
                        <FileText size={20} />
                      </div>

                      <div className="dl-recent-info">
                        <strong>
                          {report.analysis_type || "Skin Analysis"}
                        </strong>
                        <span>
                          {report.result || "No prediction details available"}
                        </span>
                        <small>
                          <Clock3 size={13} />
                          {report.created_at &&
                          !Number.isNaN(
                            new Date(report.created_at).getTime()
                          )
                            ? new Date(
                                report.created_at
                              ).toLocaleDateString()
                            : "Date unavailable"}
                        </small>
                      </div>

                      <CircleCheck
                        size={19}
                        className="dl-recent-status"
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="dl-bottom-banner">
              <ShieldCheck size={30} />

              <div>
                <h3>Care for your skin with confidence.</h3>
                <p>
                  AI results are preliminary and do not replace professional
                  dermatological advice.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openFeature("Skin Education")}
              >
                Learn more <ArrowRight size={16} />
              </button>
            </section>
          </div>
        ) : (
          <section className="dl-feature-content">
            {ActiveComponent ? (
              <ActiveComponent />
            ) : (
              <p>Feature coming soon.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}