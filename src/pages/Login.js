import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      const data = res.data;
      const token = data?.access_token;

      if (!token) {
        throw new Error("Missing token from backend");
      }

      // Save token
      localStorage.setItem("token", token);

      // Decode token (optional fallback)
      const decoded = jwtDecode(token);

      // Get role from token or backend response
      const rawRole =
        decoded?.authorities?.[0] ||
        decoded?.role ||
        data?.role ||
        "STUDENT";

      // Convert ROLE_ADMIN -> admin, ADMIN -> admin
      const cleanRole = rawRole.replace("ROLE_", "").toLowerCase();

      // Save normalized role
      localStorage.setItem("role", cleanRole);

      // Save user id if needed
      if (data?.userId) {
        localStorage.setItem("userId", data.userId);
      }

      console.log("Logged in role:", cleanRole);

      // Route based on normalized role
      if (cleanRole === "admin") {
        navigate("/");
      } else {
        navigate("/students");
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Logging in..." />;
  }

  return (
    <div style={styles.page}>
      <form onSubmit={submit} style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <Link to="/register" style={styles.link}>
          Register
        </Link>
      </form>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
    fontFamily: "Arial",
  },

  card: {
    width: 320,
    padding: 20,
    borderRadius: 10,
    background: "white",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  title: {
    marginBottom: 10,
    textAlign: "center",
    color: "#1e293b",
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },

  button: {
    background: "#2563eb",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },

  error: {
    color: "red",
    fontSize: 12,
    textAlign: "center",
  },

  link: {
    color: "#2563eb",
    textDecoration: "none",
    textAlign: "center",
    marginTop: 8,
  },
};