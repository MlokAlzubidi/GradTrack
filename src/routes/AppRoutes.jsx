import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RoleSelection from "../pages/auth/RoleSelection";
import SupervisorLogin from "../pages/auth/SupervisorLogin";

import StudentDashboard from "../pages/student/StudentDashboard";
import CreateTeam from "../pages/student/CreateTeam";
import MyTeam from "../pages/student/MyTeam";
import Invitations from "../pages/student/Invitations";
import ManageTeam from "../pages/student/ManageTeam";

import MyTasks from "../pages/student/MyTasks";
import ManageTasks from "../pages/student/ManageTasks";
import TeamTasks from "../pages/student/TeamTasks";
import TasksProgress from "../pages/student/TasksProgress";

import ProjectRegistration from "../pages/student/ProjectRegistration";
import SubmitProposal from "../pages/student/SubmitProposal";
import ProposalStatus from "../pages/student/ProposalStatus";

import Profile from "../pages/student/Profile";
import Notifications from "../pages/student/Notifications";

import PlaceholderPage from "../components/common/PlaceholderPage";

import "../styles/shared.css";

function AppRoutes() {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="gradtrack-route-shell"
    >
      <Routes>
        {/* Main account selection */}
        <Route path="/" element={<RoleSelection />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<PlaceholderPage title="Forgot Password" />}
        />

        <Route
          path="/supervisor/login"
          element={<SupervisorLogin />}
        />

        {/* Student Dashboard */}
        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />

        {/* Team Management */}
        <Route
          path="/student/create-team"
          element={<CreateTeam />}
        />

        <Route
          path="/student/team"
          element={<MyTeam />}
        />

        <Route
          path="/student/invitations"
          element={<Invitations />}
        />

        <Route
          path="/student/manage-team"
          element={<ManageTeam />}
        />

        {/* Student Profile and Notifications */}
        <Route
          path="/student/profile"
          element={<Profile />}
        />

        <Route
          path="/student/notifications"
          element={<Notifications />}
        />

        {/* Tasks */}
        <Route
          path="/student/tasks"
          element={<MyTasks />}
        />

        <Route
          path="/student/manage-tasks"
          element={<ManageTasks />}
        />

        <Route
          path="/student/team-tasks"
          element={<TeamTasks />}
        />

        <Route
          path="/student/tasks-progress"
          element={<TasksProgress />}
        />

        {/* Project and Proposal */}
        <Route
          path="/student/project-registration"
          element={<ProjectRegistration />}
        />

        <Route
          path="/student/submit-proposal"
          element={<SubmitProposal />}
        />

        <Route
          path="/student/proposal-status"
          element={<ProposalStatus />}
        />

        {/* Supervisor */}
        <Route
          path="/supervisor/dashboard"
          element={<PlaceholderPage title="Supervisor Dashboard" />}
        />

        <Route
          path="/supervisor/projects"
          element={<PlaceholderPage title="Assigned Projects" />}
        />

        <Route
          path="/supervisor/proposals"
          element={<PlaceholderPage title="Proposal Reviews" />}
        />

        <Route
          path="/supervisor/submissions"
          element={
            <PlaceholderPage title="Submissions and Feedback" />
          }
        />

        <Route
          path="/supervisor/notifications"
          element={
            <PlaceholderPage title="Supervisor Notifications" />
          }
        />

        <Route
          path="/supervisor/profile"
          element={<PlaceholderPage title="Supervisor Profile" />}
        />

        {/* Compatibility with the previous dashboard URL */}
        <Route
          path="/team-leader/dashboard"
          element={
            <Navigate to="/student/dashboard" replace />
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<PlaceholderPage title="Page Not Found" />}
        />
      </Routes>
    </div>
  );
}

export default AppRoutes;