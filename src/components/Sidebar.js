import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
    const r = localStorage.getItem("role");
    setRole(r || "student");
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div style={styles.side}>
      <h2 style={styles.logo}>🎓 Student System</h2>

      {/* ROLE INDICATOR */}
      <div style={styles.roleBox}>
        Logged in as:{" "}
        <span style={role === "admin" ? styles.admin : styles.student}>
          {role.toUpperCase()}
        </span>
      </div>

      <Link style={styles.link} to="/">
        📊 Dashboard
      </Link>

      <Link style={styles.link} to="/courses">
        📚 Courses (1-M Assignments, M-M Students)
      </Link>

      <Link style={styles.link} to="/students">
        👨‍🎓 Students (1-1 Profile, M-M Courses)
      </Link>

      <Link style={styles.link} to="/assignments">
        📝 Assignments (M-1 Course)
      </Link>

      {/* PUSH LOGOUT TO BOTTOM */}
      <div style={{ marginTop: "auto" }}>
        <button onClick={logout} style={styles.logout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  side: {
    width: 260,
    background: "linear-gradient(180deg, #0f172a, #111827)",
    color: "white",
    minHeight: "100vh",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
  },

  logo: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: "bold",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: 10,
  },

  roleBox: {
    fontSize: 12,
    padding: "6px 10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    marginBottom: 10,
  },

  admin: {
    color: "#fbbf24",
    fontWeight: "bold",
  },

  student: {
    color: "#38bdf8",
    fontWeight: "bold",
  },

  link: {
    color: "#cbd5e1",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 8,
    transition: "0.2s",
    fontSize: 14,
    display: "block",
  },

  logout: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#ef4444",
    color: "white",
    fontWeight: "bold",
    marginTop: 20,
  },
};