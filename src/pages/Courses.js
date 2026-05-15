import { useEffect, useState } from "react";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../services/courses.service";

import { getStudents } from "../services/students.service";
import { getAssignments } from "../services/assignments.service";

import "../App.css";
import { isAdmin } from "../utils/auth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [form, setForm] = useState({ title: "", code: "" });
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const normalizeCourses = (data, allStudents = [], allAssignments = []) => {
    return (data || []).map((c) => {
      const enrollments = Array.isArray(c?.enrollments)
        ? c.enrollments
        : [];

      // Build students from enrollments first
      let courseStudents = enrollments
        .map((e) => e?.student || e?.studentId || null)
        .filter(Boolean);

      // Fallback: enrich using global students list
      if (courseStudents.length === 0 && allStudents.length > 0) {
        courseStudents = allStudents.filter((s) =>
          enrollments.some(
            (e) =>
              e?.studentId === s?.id ||
              e?.student?.id === s?.id
          )
        );
      }

      // Assignments (backend or fallback linking)
      let courseAssignments = Array.isArray(c?.assignments)
        ? c.assignments
        : [];

      if (courseAssignments.length === 0 && allAssignments.length > 0) {
        courseAssignments = allAssignments.filter(
          (a) =>
            a?.course?.id === c?.id ||
            a?.courseId === c?.id
        );
      }

      return {
        ...c,
        enrollments,
        students: courseStudents,
        assignments: courseAssignments,
      };
    });
  };

  const load = async () => {
    try {
      setLoading(true);

      const [c, s, a] = await Promise.all([
        getCourses(),
        getStudents(),
        getAssignments(),
      ]);

      const safeCourses = Array.isArray(c) ? c : [];
      const safeStudents = Array.isArray(s) ? s : [];
      const safeAssignments = Array.isArray(a) ? a : [];

      setStudents(safeStudents);
      setAssignments(safeAssignments);

      setCourses(
        normalizeCourses(safeCourses, safeStudents, safeAssignments)
      );
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.error || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin()) {
      showToast("Forbidden: Admins only");
      return;
    }

    const payload = {
      title: String(form.title || "").trim(),
      code: String(form.code || "").trim(),
    };

    if (!payload.title || !payload.code) {
      showToast("Title and Code are required");
      return;
    }

    try {
      setSaving(true);

      if (editId) {
        await updateCourse(editId, payload, token);
        showToast("Course updated");
      } else {
        await createCourse(payload, token);
        showToast("Course created");
      }

      setForm({ title: "", code: "" });
      setEditId(null);
      await load();
    } catch (err) {
      console.error(err);
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin()) {
      showToast("Forbidden: Admins only");
      return;
    }

    const course = courses.find((c) => c.id === id);

    const enrolledCount =
      course?.students?.length || course?.enrollments?.length || 0;

    if (enrolledCount > 0) {
      showToast("Cannot delete: students are enrolled");
      return;
    }

    try {
      setSaving(true);
      await deleteCourse(id, token);
      showToast("Course deleted");
      await load();
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course) => {
    setEditId(course.id);
    setForm({
      title: course.title || "",
      code: course.code || "",
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  return (
    <div className="page">
      <h2>📘 Courses Page</h2>

      {toast && <div className="toast">{toast}</div>}

      {isAdmin() && (
        <div className="card">
          <input
            placeholder="Course title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <input
            placeholder="Course code"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value })
            }
          />

          <button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : editId ? "Update" : "Create"}
          </button>
        </div>
      )}

      <div className="grid">
        {courses.map((c) => (
          <div key={c.id} className="courseCard">
            <h3>{c.title}</h3>
            <p>Code: {c.code}</p>

            {/* STUDENTS */}
            <b>👨‍🎓 Students (M-M)</b>
            {(c.students || []).length > 0 ? (
              c.students.map((s) => (
                <div key={s.id}>
                  {s.firstName} {s.lastName}
                </div>
              ))
            ) : (
              <p>No students enrolled</p>
            )}

            {/* ASSIGNMENTS */}
            <b>📌 Assignments (1-M)</b>
            {(c.assignments || []).length > 0 ? (
              c.assignments.map((a) => (
                <div key={a.id}>
                  {a.title} —{" "}
                  {a.dueDate
                    ? new Date(a.dueDate).toLocaleDateString()
                    : "No date"}
                </div>
              ))
            ) : (
              <p>No assignments</p>
            )}

            {isAdmin() && (
              <div>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}