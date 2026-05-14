import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Students from "./pages/Students";
import Assignments from "./pages/Assignments";

import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const location = useLocation();

  // hide sidebar on auth pages
  const hideSidebar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div style={{ display: "flex" }}>

      {!hideSidebar && <Sidebar />}

      <div style={{ flex: 1, padding: 20 }}>
        <Routes>

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* MAIN APP */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/students" element={<Students />} />
          <Route path="/assignments" element={<Assignments />} />

        </Routes>
      </div>

    </div>
  );
}