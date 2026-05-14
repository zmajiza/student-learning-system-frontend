import { useEffect, useState } from "react";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../services/assignments.service";

import { getCourses } from "../services/courses.service";
import { isAdmin } from "../utils/auth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    dueDate: "",
    courseId: "",
  });

  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const extract = (res) => {
  if (!res) return [];
};

const load = async () => {
  try {
    setLoading(true);

    const [a, c] = await Promise.all([
      getAssignments(),
      getCourses(),
    ]);

    setCourses(Array.isArray(c) ? c : []);
    setAssignments(Array.isArray(a) ? a : []);

  } catch (err) {
    console.error(err);
    showToast("Load failed");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    load();
  }, []);

  const isPastDate = (date) => {
    if (!date) return false;
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin()) {
      showToast("Forbidden: Admin only");
      return;
    }

    if (isPastDate(form.dueDate)) {
      showToast("❌ Due date cannot be in the past");
      return;
    }

    const payload = {
      title: form.title?.trim(),
      dueDate: form.dueDate,
      courseId: form.courseId ? String(form.courseId) : null,
    };

    try {
      setSaving(true);

      if (editId) {
        await updateAssignment(editId, payload, token);
        showToast("Updated successfully");
      } else {
        await createAssignment(payload, token);
        showToast("Created successfully");
      }

      setForm({
        title: "",
        dueDate: "",
        courseId: "",
      });

      setEditId(null);
      await load();
    } catch (err) {
      console.error(err);
      showToast("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin()) {
      showToast("Forbidden: Admin only");
      return;
    }

    try {
      setSaving(true);

      await deleteAssignment(id, token);
      showToast("Deleted successfully");
      await load();
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setEditId(a.id);
    setForm({
      title: a.title || "",
      dueDate: a.dueDate ? a.dueDate.split("T")[0] : "",
      courseId: a.course?.id || "",
    });
  };

  const getCourseTitle = (assignment) => {
    const found = courses.find(
      (c) => c.id === (assignment?.course?.id || assignment?.courseId)
    );
    return found?.title || "Unassigned";
  };

  // Show spinner after all hooks are declared
  if (loading) {
    return <LoadingSpinner text="Loading assignments..." />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>📚 Assignment Page</h2>

        <p style={{ fontSize: 12, color: "#94a3b8" }}>
          Logged in as: {isAdmin() ? "Admin" : "Student"}
        </p>
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}

      {/* FORM */}
      {isAdmin() && (
        <div style={styles.card}>
          <h3>Assignment Form</h3>

          <form style={styles.form} onSubmit={handleSubmit}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="date"
              value={form.dueDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setForm({ ...form, dueDate: e.target.value })
              }
              style={styles.input}
            />

            <select
              value={form.courseId}
              onChange={(e) =>
              setForm({ ...form, courseId: e.target.value })
          }
>
            <option value="">Select Course</option>

            {(Array.isArray(courses) ? courses : []).map((c) => (
            <option key={c.id} value={c.id}>
            {c.title}
            </option>
        ))}
            </select>

            <button
              type="submit"
              style={styles.button}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editId
                ? "Update"
                : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* LIST */}
      <div style={styles.grid}>
        {assignments.map((a) => (
          <div key={a.id} style={styles.cardSmall}>
            <h4>📌 {a.title}</h4>

            <p style={styles.smallText}>
              <b>Relationship:</b> M-1 (Course → Assignment)
            </p>

            <p style={styles.smallText}>
              <b>Course:</b> {getCourseTitle(a)}
            </p>

            <p style={styles.smallText}>
              <b>Due:</b>{" "}
              {a.dueDate
                ? new Date(a.dueDate).toLocaleDateString()
                : "No date"}
            </p>

            {isAdmin() && (
              <div style={styles.actions}>
                <button
                  onClick={() => handleEdit(a)}
                  style={styles.editBtn}
                  disabled={saving}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(a.id)}
                  style={styles.deleteBtn}
                  disabled={saving}
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* styles */
const styles = {
  page: {
    padding: 15,
    background: "#f4f6f8",
    fontFamily: "Arial",
  },
  header: {
    background: "#1e293b",
    color: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111827",
    color: "white",
    padding: "10px 16px",
    borderRadius: 10,
    fontSize: 13,
    zIndex: 9999,
  },
  card: {
    background: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  form: {
    display: "grid",
    gap: 8,
  },
  input: {
    padding: 8,
    fontSize: 12,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  button: {
    background: "#2563eb",
    color: "white",
    padding: 8,
    fontSize: 12,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  cardSmall: {
    background: "white",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
  },
  smallText: {
    fontSize: 11,
    margin: "4px 0",
    color: "#333",
  },
  actions: {
    display: "flex",
    gap: 6,
    marginTop: 8,
  },
  editBtn: {
    background: "#facc15",
    border: "none",
    padding: "4px 8px",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#ef4444",
    border: "none",
    padding: "4px 8px",
    borderRadius: 5,
    fontSize: 11,
    color: "white",
    cursor: "pointer",
  },
};