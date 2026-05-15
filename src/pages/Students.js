import { isAdmin } from "../utils/auth";
import { useEffect, useState } from "react";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../services/students.service";

import { getCourses } from "../services/courses.service";
import LoadingSpinner from "../components/LoadingSpinner";
import "../App.css";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatarUrl: "",
    courseIds: [],
  });

  const token = localStorage.getItem("token");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  // ✅ MINIMAL FIX: DO NOT OVER-NORMALIZE, ONLY SAFE FALLBACKS
  const normalizeStudents = (data, allCourses = []) => {
    return (data || []).map((st) => {
      const profile = st?.profile || null;

      const enrollments = Array.isArray(st?.enrollments)
        ? st.enrollments
        : [];

      // ALWAYS try to resolve courses
      const studentCourses = enrollments
        .map((e) => {
          // CASE 1: backend sends full course
          if (e?.course) return e.course;

          // CASE 2: only courseId exists
          return allCourses.find(
            (c) => String(c.id) === String(e?.courseId || e?.course?.id)
          );
        })
        .filter(Boolean)
        .map((c) => ({
          ...c,
          assignments: Array.isArray(c?.assignments)
            ? c.assignments
            : [],
        }));

      return {
        ...st,
        profile: profile || {},
        enrollments,
        courses: studentCourses,
      };
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [s, c] = await Promise.all([
        getStudents(),
        getCourses(),
      ]);

      const studentData = Array.isArray(s) ? s : s?.data || s?.content || [];
      const courseData = Array.isArray(c) ? c : [];

      setCourses(courseData);
      setStudents(normalizeStudents(studentData, courseData));
    } catch (err) {
      console.error(err);
      showToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      bio: "",
      avatarUrl: "",
      courseIds: [],
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin()) return;

    const payload = {
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      email: form.email?.trim(),
      password: "123456",
      role: "STUDENT",
      profile: {
        bio: form.bio || "",
        avatarUrl: form.avatarUrl || "",
      },
      courseIds: (form.courseIds || []).filter(Boolean),
    };

    try {
      setSaving(true);

      if (editId) {
        await updateStudent(editId, payload, token);
        showToast("Student updated");
      } else {
        await createStudent(payload, token);
        showToast("Student created");
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin()) return;

    try {
      setSaving(true);
      await deleteStudent(id, token);
      showToast("Student deleted");
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    if (!isAdmin()) return;

    setEditId(s.id);

    setForm({
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      email: s.email || "",
      bio: s.profile?.bio || "",
      avatarUrl: s.profile?.avatarUrl || "",
      courseIds: (s.enrollments || [])
        .map((e) => String(e?.course?.id || e?.courseId))
        .filter(Boolean),
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading students..." />;
  }

  return (
    <div className="page">
      <h2>Students</h2>

      {toast && <div className="toast">{toast}</div>}

      {isAdmin() && (
        <div className="formCard">
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
          />

          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            placeholder="Bio"
            value={form.bio}
            onChange={(e) =>
              setForm({ ...form, bio: e.target.value })
            }
          />

          <input
            placeholder="Avatar URL"
            value={form.avatarUrl}
            onChange={(e) =>
              setForm({ ...form, avatarUrl: e.target.value })
            }
          />

          <div>
            <b>Courses</b>
            {courses.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={form.courseIds.includes(String(c.id))}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      courseIds: prev.courseIds.includes(String(c.id))
                        ? prev.courseIds.filter((x) => x !== String(c.id))
                        : [...prev.courseIds, String(c.id)],
                    }))
                  }
                />
                {c.title}
              </label>
            ))}
          </div>

          <button
            className="btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : editId ? "Update" : "Create"}
          </button>
        </div>
      )}

      <div className="gridSmall">
        {students.map((s) => (
          <div key={s.id} className="cardSmall">

            {/* avatar  */}
            {(s.profile?.avatarUrl || s.avatarUrl) && (
              <img
                src={s.profile?.avatarUrl || s.avatarUrl}
                className="avatarSmall"
                alt="avatar"
              />
            )}

            <h4>{s.firstName} {s.lastName}</h4>
            <p>{s.email}</p>

            {/* bio */}
            <p>{s.profile?.bio || s.bio || "No bio"}</p>

            <div style={{ fontSize: 11, color: "#888" }}>
              Profile (1-1) | Courses (M-M)
            </div>

            {/*  COURSES */}
            {s.courses?.length > 0 ? (
              s.courses.map((c) => (
                <div key={c.id} className="miniSection">
                  <p>📘 {c.title}</p>

                  {(c.assignments || []).length > 0 ? (
                    c.assignments.map((a) => (
                      <p key={a.id} style={{ marginLeft: 10, fontSize: 12 }}>
                        📝 {a.title} —{" "}
                        {a.dueDate
                          ? new Date(a.dueDate).toLocaleDateString()
                          : "No date"}
                      </p>
                    ))
                  ) : (
                    <p style={{ fontSize: 11 }}>No assignments</p>
                  )}
                </div>
              ))
            ) : (
              <p>No courses</p>
            )}

            {isAdmin() && (
              <div className="actionsSmall">
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}