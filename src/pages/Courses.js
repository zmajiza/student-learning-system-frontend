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

  const normalizeCourses = (data) => {
    return (data || []).map((c) => ({
      ...c,

      enrollments: Array.isArray(c?.enrollments) ? c.enrollments : [],

      students: (Array.isArray(c?.enrollments) ? c.enrollments : [])
        .map((e) =>
          e?.student ||
          e?.studentId ||
          e?.user ||
          e?.profile?.student || 
          null
        )
        .filter(Boolean),

      assignments: Array.isArray(c?.assignments)
        ? c.assignments
        : Array.isArray(c?.courseAssignments)
        ? c.courseAssignments
        : Array.isArray(c?.tasks)
        ? c.tasks
        : [],
    }));
  };

  const load = async () => {
    try {
      setLoading(true);

      const [c, s, a] = await Promise.all([
        getCourses(),
        getStudents(),
        getAssignments(),
      ]);

      setCourses(normalizeCourses(Array.isArray(c) ? c : []));
      setStudents(Array.isArray(s) ? s : []);
      setAssignments(Array.isArray(a) ? a : []);
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
              null
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