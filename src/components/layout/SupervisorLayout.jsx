
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  Files,
  Bell,
  UserRound,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import {
  clearSupervisorSession,
  getSupervisorSession,
} from "../../utils/supervisorAuth";
import "./SupervisorLayout.css";

const NOTIFICATIONS_KEY = "gradtrack-notifications";

function readSupervisorNotifications(supervisor) {
  if (!supervisor?.id) return [];

  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (notification) =>
        String(notification.recipientId) ===
        String(supervisor.id)
    );
  } catch {
    return [];
  }
}

function SupervisorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [supervisor, setSupervisor] = useState(
    getSupervisorSession
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const [notifications, setNotifications] = useState(() =>
    readSupervisorNotifications(getSupervisorSession())
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  useEffect(() => {
    function refreshNotifications() {
      setNotifications(
        readSupervisorNotifications(getSupervisorSession())
      );
    }

    function handleStorage(event) {
      if (
        !event.key ||
        event.key === NOTIFICATIONS_KEY
      ) {
        refreshNotifications();
      }
    }

    function handleSupervisorUpdate(event) {
      setSupervisor(
        event.detail || getSupervisorSession()
      );
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshNotifications);

    window.addEventListener(
      "gradtrack-notifications-updated",
      refreshNotifications
    );

    window.addEventListener(
      "gradtrack-supervisor-updated",
      handleSupervisorUpdate
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshNotifications);

      window.removeEventListener(
        "gradtrack-notifications-updated",
        refreshNotifications
      );

      window.removeEventListener(
        "gradtrack-supervisor-updated",
        handleSupervisorUpdate
      );
    };
  }, []);

  // Close expanded menus after navigating to another page.
  useEffect(() => {
    setMobileMenuOpen(false);
    setReviewsOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    clearSupervisorSession();
    setMobileMenuOpen(false);
    navigate("/supervisor/login", { replace: true });
  }

  function closeMenus() {
    setMobileMenuOpen(false);
    setReviewsOpen(false);
  }

  const reviewRoutes = [
    "/supervisor/proposals",
    "/supervisor/submissions",
  ];

  const isReviewRoute = reviewRoutes.includes(
    location.pathname
  );

  return (
    <div className="supervisor-layout">
      <header className="supervisor-topbar">
        <Link
          to="/supervisor/dashboard"
          className="supervisor-brand"
          onClick={closeMenus}
          aria-label="GradTrack Supervisor Dashboard"
        >
          <span className="supervisor-brand-icon">
            <GraduationCap size={25} strokeWidth={1.8} />
          </span>

          <span className="supervisor-brand-name">
  <span className="supervisor-brand-grad">Grad</span><span className="supervisor-brand-track">Track</span>
</span>
        </Link>

        <nav
          className={`supervisor-navigation ${
            mobileMenuOpen ? "is-mobile-open" : ""
          }`}
          aria-label="Supervisor navigation"
        >
          <NavLink
            to="/supervisor/dashboard"
            end
            onClick={closeMenus}
            className={({ isActive }) =>
              `supervisor-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <LayoutDashboard
              className="supervisor-mobile-nav-icon"
              size={17}
            />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/supervisor/projects"
            onClick={closeMenus}
            className={({ isActive }) =>
              `supervisor-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FolderKanban
              className="supervisor-mobile-nav-icon"
              size={17}
            />
            <span>Projects</span>
          </NavLink>

          <NavLink to="/supervisor/assignments" onClick={closeMenus} className={({ isActive }) => `supervisor-nav-link ${isActive ? "active" : ""}`}>
            <ClipboardList className="supervisor-mobile-nav-icon" size={17} />
            <span>Requests</span>
          </NavLink>

          <div
            className={`supervisor-nav-dropdown ${
              reviewsOpen ? "is-open" : ""
            } ${isReviewRoute ? "has-active-route" : ""}`}
          >
            <button
              type="button"
              className={`supervisor-nav-link supervisor-nav-dropdown-trigger ${
                isReviewRoute ? "active" : ""
              }`}
              onClick={() =>
                setReviewsOpen((current) => !current)
              }
              aria-expanded={reviewsOpen}
              aria-haspopup="true"
            >
              <FileCheck2
                className="supervisor-mobile-nav-icon"
                size={17}
              />
              <span>Reviews</span>
              <ChevronDown
                className="supervisor-nav-chevron"
                size={14}
              />
            </button>

            <div className="supervisor-nav-dropdown-panel">
              <NavLink
                to="/supervisor/proposals"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `supervisor-dropdown-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <FileCheck2 size={17} />
                <span>Review Proposals</span>
              </NavLink>

              <NavLink
                to="/supervisor/submissions"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `supervisor-dropdown-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Files size={17} />
                <span>Submissions &amp; Feedback</span>
              </NavLink>
            </div>
          </div>

          {/* These links remain available in the mobile menu too. */}
          <NavLink
            to="/supervisor/notifications"
            onClick={closeMenus}
            className={({ isActive }) =>
              `supervisor-nav-link supervisor-mobile-extra-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <Bell
              className="supervisor-mobile-nav-icon"
              size={17}
            />
            <span>Notifications</span>

            {unreadCount > 0 && (
              <span className="supervisor-mobile-unread-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/supervisor/profile"
            onClick={closeMenus}
            className={({ isActive }) =>
              `supervisor-nav-link supervisor-mobile-extra-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <UserRound
              className="supervisor-mobile-nav-icon"
              size={17}
            />
            <span>Profile</span>
          </NavLink>

          <button
            type="button"
            className="supervisor-nav-link supervisor-mobile-logout"
            onClick={handleLogout}
          >
            <LogOut
              className="supervisor-mobile-nav-icon"
              size={17}
            />
            <span>Log Out</span>
          </button>
        </nav>

        <div className="supervisor-topbar-actions">
         


<div className="supervisor-bell-clean">
  <NavLink
    to="/supervisor/notifications"
    className="supervisor-bell-clean__link"
    aria-label="Notifications"
    title={
      unreadCount > 0
        ? `${unreadCount} unread notifications`
        : "Notifications"
    }
  >
    <span
      className={`supervisor-bell-clean__orb ${
        unreadCount > 0 ? "has-unread" : ""
      }`}
    >
      {unreadCount > 0 && (
        <span
          className="supervisor-bell-clean__aura"
          aria-hidden="true"
        />
      )}

      <Bell
        className="supervisor-bell-clean__icon"
        size={19}
        strokeWidth={2}
      />
    </span>
  </NavLink>

  {unreadCount > 0 && (
    <span className="supervisor-bell-clean__badge">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</div>



          <NavLink
            to="/supervisor/profile"
            className={({ isActive }) =>
              `supervisor-action-button ${
                isActive ? "active" : ""
              }`
            }
            aria-label="Profile"
            title={supervisor?.name || "Supervisor Profile"}
          >
            <UserRound size={19} />
          </NavLink>

          <button
            type="button"
            className="supervisor-action-button supervisor-logout-action"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={19} />
          </button>
        </div>

        <button
          type="button"
          className="supervisor-menu-toggle"
          onClick={() =>
            setMobileMenuOpen((current) => !current)
          }
          aria-label={
            mobileMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </header>

      <main className="supervisor-main">
        <div className="supervisor-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default SupervisorLayout;
