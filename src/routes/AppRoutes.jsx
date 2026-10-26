import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RoleSelection from "../pages/auth/RoleSelection";
import PlaceholderPage from "../components/common/PlaceholderPage";
import SupervisorLogin from "../pages/auth/SupervisorLogin";
function AppRoutes() {
  return (
    <Routes>
      {/* Main page: choose account type */}
      <Route
        path="/"
        element={<RoleSelection />}
      />

      {/* Student and Team Leader login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Student registration */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* Password recovery */}
      <Route
        path="/forgot-password"
        element={
          <PlaceholderPage title="Forgot Password" />
        }
      />

      {/* Academic Supervisor login */}
     <Route
  path="/supervisor/login"
  element={<SupervisorLogin />}
/>

      {/* Student Dashboard */}
      <Route
        path="/student/dashboard"
        element={
          <PlaceholderPage title="Student Dashboard" />
        }
      />

      {/* Team Leader Dashboard */}
      <Route
        path="/team-leader/dashboard"
        element={
          <PlaceholderPage title="Team Leader Dashboard" />
        }
      />

      {/* Supervisor Dashboard */}
      <Route
        path="/supervisor/dashboard"
        element={
          <PlaceholderPage title="Supervisor Dashboard" />
        }
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <PlaceholderPage title="Page Not Found" />
        }
      />
    </Routes>
  );
}

export default AppRoutes;