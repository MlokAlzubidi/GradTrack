
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  UserRound,
  LogOut,
  GraduationCap,
} from "lucide-react";
import "./StudentNavbar.css";

const navigationByTeamStatus = {
  "no-team": {
    team: [
      { label: "Create Team", to: "/student/create-team" },
      { label: "Invitations", to: "/student/invitations" },
    ],
    tasks: [],
    project: [],
  },

  member: {
    team: [
      { label: "My Team", to: "/student/team" },
      { label: "Invitations", to: "/student/invitations" },
    ],
    tasks: [
      { label: "My Tasks", to: "/student/tasks" },
      { label: "Team Tasks", to: "/student/team-tasks" },
    ],
    project: [
      {
        label: "Proposal Status",
        to: "/student/proposal-status",
      },
    ],
  },

  leader: {
    team: [
      { label: "My Team", to: "/student/team" },
      { label: "Manage Team", to: "/student/manage-team" },
    ],
    tasks: [
      { label: "My Tasks", to: "/student/tasks" },
      { label: "Team Tasks", to: "/student/team-tasks" },
      { label: "Manage Tasks", to: "/student/manage-tasks" },
      {
        label: "Tasks & Progress",
        to: "/student/tasks-progress",
      },
    ],
    project: [
      {
        label: "Project Registration",
        to: "/student/project-registration",
      },
      {
        label: "Submit Proposal",
        to: "/student/submit-proposal",
      },
      {
        label: "Proposal Status & Feedback",
        to: "/student/proposal-status",
      },
    ],
  },
};

function NavigationLink({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        isActive
          ? "student-sidebar-link active"
          : "student-sidebar-link"
      }
    >
      {item.label}
    </NavLink>
  );
}

function NavigationGroup({
  title,
  groupKey,
  items,
  openGroup,
  setOpenGroup,
}) {
  if (items.length === 0) {
    return null;
  }

  const isOpen = openGroup === groupKey;

  function handleToggle(event) {
    // نتحكم بفتح القوائم وإغلاقها باستخدام React.
    event.preventDefault();
    setOpenGroup(isOpen ? null : groupKey);
  }

  function closeGroup() {
    setOpenGroup(null);
  }

  return (
    <details
      className="student-sidebar-group"
      open={isOpen}
    >
      <summary
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        {title}
      </summary>

      <div className="student-sidebar-group-links">
        {items.map((item) => (
          <NavigationLink
            key={item.to}
            item={item}
            onNavigate={closeGroup}
          />
        ))}
      </div>
    </details>
  );
}

function StudentNavbar({ teamStatus = "no-team" }) {
  const navigate = useNavigate();

  // نحتفظ باسم القائمة المفتوحة حتى لا تتداخل القوائم.
  const [openGroup, setOpenGroup] = useState(null);

  function handleLogout() {
    // حذف جلسة الطالب الحالية فقط، مع الاحتفاظ بالحسابات التجريبية.
    localStorage.removeItem("gradtrack-current-student");
    navigate("/");
  }

  const navigation =
    navigationByTeamStatus[teamStatus] ??
    navigationByTeamStatus["no-team"];

  function closeMenu() {
    setOpenGroup(null);
  }

  return (
    <aside className="student-sidebar">
      {/* GradTrack brand */}
      <Link
        to="/student/dashboard"
        className="student-sidebar-brand"
        onClick={closeMenu}
      >
        <span
          className="student-sidebar-brand-mark"
          aria-hidden="true"
        >
          <GraduationCap size={25} strokeWidth={2} />
        </span>

        <span className="student-sidebar-brand-text">
          Grad<span>Track</span>
        </span>
      </Link>

      {/* Main navigation */}
      <nav
        className="student-sidebar-navigation"
        aria-label="Student navigation"
      >
        <p className="student-sidebar-label">WORKSPACE</p>

        <NavigationLink
          item={{
            label: "Dashboard",
            to: "/student/dashboard",
          }}
          onNavigate={closeMenu}
        />

        <NavigationGroup
          title="Team"
          groupKey="team"
          items={navigation.team}
          openGroup={openGroup}
          setOpenGroup={setOpenGroup}
        />

        <NavigationGroup
          title="Tasks"
          groupKey="tasks"
          items={navigation.tasks}
          openGroup={openGroup}
          setOpenGroup={setOpenGroup}
        />

        <NavigationGroup
          title="Project & Proposal"
          groupKey="project"
          items={navigation.project}
          openGroup={openGroup}
          setOpenGroup={setOpenGroup}
        />
      </nav>

      {/* Notifications, profile and logout */}
      <div className="student-sidebar-bottom">
        <NavLink
          to="/student/notifications"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "student-nav-icon active"
              : "student-nav-icon"
          }
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
        </NavLink>

        <NavLink
          to="/student/profile"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive
              ? "student-nav-icon active"
              : "student-nav-icon"
          }
          aria-label="Profile"
          title="Profile"
        >
          <UserRound size={19} />
        </NavLink>

        <button
          type="button"
          className="student-nav-icon"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={19} />
        </button>
      </div>
    </aside>
  );
}

export default StudentNavbar;
