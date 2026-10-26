import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import PlaceholderPage from "../components/common/PlaceholderPage";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={
          <PlaceholderPage title="Student Registration" />
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PlaceholderPage title="Forgot Password" />
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <PlaceholderPage title="Student Dashboard" />
        }
      />

      <Route
        path="/team-leader/dashboard"
        element={
          <PlaceholderPage title="Team Leader Dashboard" />
        }
      />

      <Route
        path="/supervisor/dashboard"
        element={
          <PlaceholderPage title="Supervisor Dashboard" />
        }
      />

      <Route
        path="*"
        element={<PlaceholderPage title="Page Not Found" />}
      />
    </Routes>
  );
}

export default AppRoutes;