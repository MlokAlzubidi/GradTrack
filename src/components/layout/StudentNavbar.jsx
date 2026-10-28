import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  UserRound,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import "./StudentNavbar.css";

const NOTIFICATIONS_STORAGE_KEY = "gradtrack-notifications";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";

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
      { label: "Proposal Status", to: "/student/proposal-status" },
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
      { label: "Tasks & Progress", to: "/student/tasks-progress" },
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

function getUnreadNotificationsCount() {
  try {
    const savedStudent = sessionStorage.getItem(
      CURRENT_STUDENT_KEY
    );

    const student = savedStudent
      ? JSON.parse(savedStudent)
      : null;

    if (!student?.universityId) return 0;

    const saved = localStorage.getItem(
      NOTIFICATIONS_STORAGE_KEY
    );

    const notifications = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(notifications)) return 0;

    return notifications.filter(
      (notification) =>
        String(notification.recipientId) ===
          String(student.universityId) &&
        notification.isRead !== true
    ).length;
  } catch {
    return 0;
  }
}

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
  onNavigate,
}) {
  if (items.length === 0) return null;

  const isOpen = openGroup === groupKey;

  function handleToggle(event) {
    event.preventDefault();
    setOpenGroup(isOpen ? null : groupKey);
  }

  function closeGroup() {
    setOpenGroup(null);
    onNavigate?.();
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

  const [openGroup, setOpenGroup] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(
    getUnreadNotificationsCount
  );

  useEffect(() => {
    function syncUnreadCount() {
      setUnreadCount(getUnreadNotificationsCount());
    }

    syncUnreadCount();

    window.addEventListener("storage", syncUnreadCount);
    window.addEventListener(
      "gradtrack-notifications-updated",
      syncUnreadCount
    );

    return () => {
      window.removeEventListener("storage", syncUnreadCount);
      window.removeEventListener(
        "gradtrack-notifications-updated",
        syncUnreadCount
      );
    };
  }, []);

  const navigation =
    navigationByTeamStatus[teamStatus] ??
    navigationByTeamStatus["no-team"];

  function closeMenu() {
    setOpenGroup(null);
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    if (mobileMenuOpen) {
      setOpenGroup(null);
    }

    setMobileMenuOpen(!mobileMenuOpen);
  }

  function handleLogout() {
    sessionStorage.removeItem(CURRENT_STUDENT_KEY);
    navigate("/");
  }

  return (
    <aside
      className={`student-sidebar ${
        mobileMenuOpen ? "mobile-menu-open" : ""
      }`}
    >
      {/* Brand */}
      <Link
        to="/student/dashboard"
        className="student-sidebar-brand"
        onClick={closeMenu}
      >
        <span className="student-brand-icon">
  <GraduationCap size={25} strokeWidth={1.8} />
</span>

        <span className="student-sidebar-brand-text">
          Grad<span>Track</span>
        </span>
      </Link>

      {/* Mobile menu toggle */}
      <button
        type="button"
        className="student-mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label={
          mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
        }
        aria-expanded={mobileMenuOpen}
        aria-controls="student-navigation"
      >
        {mobileMenuOpen ? (
          <X size={21} />
        ) : (
          <Menu size={21} />
        )}
      </button>

      {/* Main navigation */}
      <nav
        id="student-navigation"
        className={`student-sidebar-navigation ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
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
          onNavigate={closeMenu}
        />

        <NavigationGroup
          title="Tasks"
          groupKey="tasks"
          items={navigation.tasks}
          openGroup={openGroup}
          setOpenGroup={setOpenGroup}
          onNavigate={closeMenu}
        />

        <NavigationGroup
          title="Project & Proposal"
          groupKey="project"
          items={navigation.project}
          openGroup={openGroup}
          setOpenGroup={setOpenGroup}
          onNavigate={closeMenu}
        />
      </nav>

      {/* Notifications, profile and logout */}
      <div className="student-sidebar-bottom">
        <NavLink
          to="/student/notifications"
          onClick={closeMenu}
          className={({ isActive }) =>
            `student-nav-icon student-notification-link ${
              isActive ? "active" : ""
            }`
          }
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          title={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <span
            className={`student-notification-orb ${
              unreadCount > 0 ? "has-unread" : ""
            }`}
          >
            <span className="student-notification-aura" />

            <Bell
              className="student-notification-icon"
              size={19}
              strokeWidth={1.8}
            />

            {unreadCount > 0 && (
              <span className="student-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
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