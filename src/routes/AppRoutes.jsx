import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RoleSelection from "../pages/auth/RoleSelection";
import SupervisorLogin from "../pages/auth/SupervisorLogin";

import StudentDashboard from "../pages/student/StudentDashboard";
import PlaceholderPage from "../components/common/PlaceholderPage";
import CreateTeam from "../pages/student/CreateTeam";
import MyTeam from "../pages/student/MyTeam";
import Invitations from "../pages/student/Invitations";
import ManageTeam from "../pages/student/ManageTeam";
import MyTasks from "../pages/student/MyTasks";
import ManageTasks from "../pages/student/ManageTasks";
import ProjectRegistration from "../pages/student/ProjectRegistration";
import SubmitProposal from "../pages/student/SubmitProposal";
import ProposalStatus from "../pages/student/ProposalStatus";
import TasksProgress from "../pages/student/TasksProgress";
import TeamTasks from "../pages/student/TeamTasks";

function AppRoutes() {
  return (
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

      {/* Student */}
      <Route
        path="/student/dashboard"
        element={<StudentDashboard />}
      />

      <Route
  path="/student/create-team"
  element={<CreateTeam />}
/>
      

     <Route
  path="/student/invitations"
  element={<Invitations />}
/>

      <Route
        path="/student/notifications"
        element={<PlaceholderPage title="Notifications" />}
      />

      <Route
        path="/student/profile"
        element={<PlaceholderPage title="My Profile" />}
      />

      <Route
  path="/student/team"
  element={<MyTeam />}
/>
      

      {/* Tasks */}
      <Route
  path="/student/tasks"
  element={<MyTasks />}
/>

      <Route
  path="/student/manage-team"
  element={<ManageTeam />}
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
      {/* Team management */}
      <Route
        path="/student/manage-team"
        element={<PlaceholderPage title="Manage Team" />}
      />

      {/* Project and proposal */}
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
        element={<PlaceholderPage title="Submissions and Feedback" />}
      />

      <Route
        path="/supervisor/notifications"
        element={<PlaceholderPage title="Supervisor Notifications" />}
      />

      <Route
        path="/supervisor/profile"
        element={<PlaceholderPage title="Supervisor Profile" />}
      />

      {/* Compatibility with the previous dashboard URL */}
      <Route
        path="/team-leader/dashboard"
        element={<Navigate to="/student/dashboard" replace />}
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={<PlaceholderPage title="Page Not Found" />}
      />
    </Routes>
  );
}

export default AppRoutes;