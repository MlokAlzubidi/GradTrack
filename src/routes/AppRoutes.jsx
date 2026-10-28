
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
import RequireSupervisor from "../components/common/RequireSupervisor";
import SupervisorLayout from "../components/layout/SupervisorLayout";
import SupervisorProjects from "../pages/supervisor/SupervisorProjects";
import SupervisorProposals from "../pages/supervisor/SupervisorProposals";

import SupervisorSubmissions from "../pages/supervisor/SupervisorSubmissions";
import SupervisorDashboard from "../pages/supervisor/SupervisorDashboard";

import SupervisorProfile from "../pages/supervisor/SupervisorProfile";
import SupervisorNotifications from "../pages/supervisor/SupervisorNotifications";

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

        {/* Supervisor login */}
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

        {/* Protected Supervisor routes */}
        <Route
          path="/supervisor"
          element={<RequireSupervisor />}
        >
          {/* Shared Supervisor Layout */}
          <Route element={<SupervisorLayout />}>
            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />

            <Route
  path="dashboard"
  element={<SupervisorDashboard />}
/>

            <Route
  path="projects"
  element={<SupervisorProjects />}
/>

    <Route
  path="proposals"
  element={<SupervisorProposals />}
/>

            <Route
  path="submissions"
  element={<SupervisorSubmissions />}
/>
<Route
  path="notifications"
  element={<SupervisorNotifications />}
/>

            <Route
  path="profile"
  element={<SupervisorProfile />}
/>
          </Route>
        </Route>

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
