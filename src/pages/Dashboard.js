import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const extract = (res) => {
    return res?.data?.data || res?.data || res || [];
  };

  const load = async () => {
    try {
      setLoading(true);

      const s = await api.get("/students");
      const c = await api.get("/courses");
      const a = await api.get("/assignments");

      setStudents(extract(s));
      setCourses(extract(c));
      setAssignments(extract(a));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>🎓 Dashboard</h1>
        </div>
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        <Card
          title="Students"
          value={students?.length || 0}
          color="#2563eb"
          onClick={() => navigate("/students")}
        />

        <Card
          title="Courses"
          value={courses?.length || 0}
          color="#16a34a"
          onClick={() => navigate("/courses")}
        />

        <Card
          title="Assignments"
          value={assignments?.length || 0}
          color="#f59e0b"
          onClick={() => navigate("/assignments")}
        />
      </div>
    </div>
  );
}

/* ================= CARD ================= */
function Card({ title, value, onClick, color }) {
  return (
    <div
      style={{ ...styles.card, borderLeft: `5px solid ${color}` }}
      onClick={onClick}
    >
      <h4 style={styles.cardTitle}>{title}</h4>
      <p style={styles.cardValue}>{value}</p>
      <div style={styles.arrow}>→</div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    padding: 25,
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    color: "white",
    padding: 25,
    borderRadius: 14,
    marginBottom: 25,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },

  subHeader: {
    margin: 0,
    fontSize: 13,
    opacity: 0.8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  },

  card: {
    background: "white",
    padding: 18,
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "all 0.2s ease",
    position: "relative",
  },

  cardTitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },

  cardValue: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0f172a",
    margin: 0,
  },

  arrow: {
    position: "absolute",
    right: 15,
    bottom: 12,
    fontSize: 18,
    color: "#94a3b8",
  },
};