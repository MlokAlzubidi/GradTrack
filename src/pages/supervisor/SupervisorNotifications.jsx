
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  ArrowUpRight,
  FileCheck2,
  Files,
  Inbox,
  Search,
  RefreshCw,
  Circle,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import "./SupervisorNotifications.css";

const NOTIFICATIONS_KEY = "gradtrack-notifications";

function readNotifications() {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSupervisorNotifications() {
  const supervisor = getSupervisorSession();

  if (!supervisor?.id) return [];

  return readNotifications().filter(
    (notification) =>
      String(notification.recipientId) === String(supervisor.id)
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationIcon(type) {
  switch (type) {
    case "proposal":
      return FileCheck2;
    case "task":
      return ClipboardList;
    case "submission":
      return Files;
    default:
      return Bell;
  }
}

function getNotificationLink(notification) {
  if (notification.link?.startsWith("/supervisor/")) {
    return notification.link;
  }

  switch (notification.type) {
    case "proposal":
      return "/supervisor/proposals";
    case "task":
    case "submission":
      return "/supervisor/submissions";
    default:
      return "/supervisor/dashboard";
  }
}

function SupervisorNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(
    loadSupervisorNotifications
  );

  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function refreshNotifications() {
    setNotifications(loadSupervisorNotifications());
  }

  useEffect(() => {
    function handleStorage(event) {
      if (!event.key || event.key === NOTIFICATIONS_KEY) {
        refreshNotifications();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshNotifications);
    window.addEventListener(
      "gradtrack-notifications-updated",
      refreshNotifications
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshNotifications);
      window.removeEventListener(
        "gradtrack-notifications-updated",
        refreshNotifications
      );
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return notifications
      .filter((notification) => {
        if (filter === "Unread" && notification.isRead) {
          return false;
        }

        if (filter === "Read" && !notification.isRead) {
          return false;
        }

        const searchableText = [
          notification.title,
          notification.message,
          notification.type,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return searchableText.includes(query);
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [notifications, filter, searchTerm]);

  function saveReadStatus(updatedNotifications) {
    const supervisor = getSupervisorSession();

    if (!supervisor?.id) {
      setErrorMessage("Your supervisor session could not be found.");
      return false;
    }

    try {
      const allNotifications = readNotifications();

      const updatedById = new Map(
        updatedNotifications.map((notification) => [
          notification.id,
          notification,
        ])
      );

      const updatedAllNotifications = allNotifications.map(
        (notification) => {
          const isCurrentSupervisorNotification =
            String(notification.recipientId) ===
            String(supervisor.id);

          if (
            isCurrentSupervisorNotification &&
            updatedById.has(notification.id)
          ) {
            return updatedById.get(notification.id);
          }

          return notification;
        }
      );

      localStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(updatedAllNotifications)
      );

      setNotifications(updatedNotifications);
      setErrorMessage("");
      setMessage("");

      window.dispatchEvent(
        new Event("gradtrack-notifications-updated")
      );

      return true;
    } catch {
      setErrorMessage(
        "Could not save notification changes. Please try again."
      );

      return false;
    }
  }

  function markAsRead(notificationId) {
    const updatedNotifications = notifications.map(
      (notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
    );

    saveReadStatus(updatedNotifications);
  }

  function markAllAsRead() {
    if (unreadCount === 0) return;

    const updatedNotifications = notifications.map(
      (notification) => ({
        ...notification,
        isRead: true,
      })
    );

    if (saveReadStatus(updatedNotifications)) {
      setMessage("All supervisor notifications are marked as read.");
    }
  }

  function handleOpenNotification(notification) {
    if (!notification.isRead) {
      const updatedNotifications = notifications.map(
        (item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
      );

      if (!saveReadStatus(updatedNotifications)) {
        return;
      }
    }

    navigate(getNotificationLink(notification));
  }

  const filterOptions = [
    { label: "All", count: notifications.length },
    { label: "Unread", count: unreadCount },
    { label: "Read", count: readCount },
  ];

  return (
    <div className="supervisor-notifications-page">
      <header className="supervisor-notifications-header">
        <div>
          <span className="supervisor-notifications-eyebrow">
            SUPERVISOR INBOX
          </span>

          <h2>Notifications</h2>

          <p>
            Stay informed when teams submit proposals and task files,
            and keep track of updates in your workspace.
          </p>
        </div>

        <div className="supervisor-notifications-header-icon">
          <Bell size={28} strokeWidth={1.7} />

          {unreadCount > 0 && (
            <span className="supervisor-notifications-header-dot" />
          )}
        </div>
      </header>

      {message && (
        <div
          className="supervisor-notifications-alert success"
          role="status"
        >
          <CheckCircle2Icon />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          className="supervisor-notifications-alert error"
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <section
        className="supervisor-notifications-summary"
        aria-label="Notification summary"
      >
        <article className="supervisor-notifications-summary-card">
          <div className="supervisor-notifications-summary-icon unread">
            <Bell size={20} />
          </div>

          <div>
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </div>
        </article>

        <article className="supervisor-notifications-summary-card">
          <div className="supervisor-notifications-summary-icon read">
            <CheckCheck size={20} />
          </div>

          <div>
            <span>Read</span>
            <strong>{readCount}</strong>
          </div>
        </article>

        <article className="supervisor-notifications-summary-card">
          <div className="supervisor-notifications-summary-icon total">
            <Inbox size={20} />
          </div>

          <div>
            <span>Total</span>
            <strong>{notifications.length}</strong>
          </div>
        </article>
      </section>

      <section className="supervisor-notifications-panel">
        <div className="supervisor-notifications-panel-heading">
          <div>
            <span className="supervisor-notifications-panel-eyebrow">
              UPDATES
            </span>

            <h3>Your Activity</h3>

            <p>
              Review updates and mark notifications as read.
            </p>
          </div>

          <div className="supervisor-notifications-panel-actions">
            <button
              type="button"
              className="supervisor-notifications-refresh"
              onClick={refreshNotifications}
              title="Refresh notifications"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="supervisor-notifications-mark-all"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={15} />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="supervisor-notifications-toolbar">
          <div
            className="supervisor-notifications-filters"
            aria-label="Filter notifications"
          >
            {filterOptions.map((option) => (
              <button
                type="button"
                key={option.label}
                className={
                  filter === option.label
                    ? "supervisor-notifications-filter active"
                    : "supervisor-notifications-filter"
                }
                onClick={() => setFilter(option.label)}
                aria-pressed={filter === option.label}
              >
                {option.label}
                <span>{option.count}</span>
              </button>
            ))}
          </div>

          <label className="supervisor-notifications-search">
            <Search size={17} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search notifications..."
              aria-label="Search notifications"
            />
          </label>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="supervisor-notifications-empty">
            <div className="supervisor-notifications-empty-icon">
              <Inbox size={29} />
            </div>

            <h3>
              {notifications.length === 0
                ? "No supervisor notifications yet"
                : filter === "Unread"
                  ? "You're all caught up"
                  : "No matching notifications"}
            </h3>

            <p>
              {notifications.length === 0
                ? "When a Team Leader submits a project proposal or a student uploads a task file, the update will appear here."
                : "Try another filter or search term."}
            </p>

            {notifications.length > 0 && (
              <button
                type="button"
                className="supervisor-notifications-clear"
                onClick={() => {
                  setFilter("All");
                  setSearchTerm("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="supervisor-notifications-list">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);

              return (
                <article
                  key={notification.id}
                  className={
                    notification.isRead
                      ? "supervisor-notification-card read"
                      : "supervisor-notification-card unread"
                  }
                >
                  <div className="supervisor-notification-indicator">
                    {!notification.isRead && (
                      <span title="Unread notification" />
                    )}
                  </div>

                  <div
                    className={`supervisor-notification-icon ${notification.type || "general"}`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="supervisor-notification-details">
                    <div className="supervisor-notification-title-row">
                      <h4>{notification.title || "Workspace update"}</h4>

                      {!notification.isRead && (
                        <span className="supervisor-notification-new">
                          New
                        </span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <time dateTime={notification.createdAt || ""}>
                      {formatDate(notification.createdAt)}
                    </time>

                    <div className="supervisor-notification-actions">
                      <button
                        type="button"
                        className="supervisor-notification-open"
                        onClick={() =>
                          handleOpenNotification(notification)
                        }
                      >
                        View details
                        <ArrowUpRight size={15} />
                      </button>

                      {!notification.isRead && (
                        <button
                          type="button"
                          className="supervisor-notification-read"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="supervisor-notification-status-icon">
                    {notification.isRead ? (
                      <CheckCheck size={17} />
                    ) : (
                      <Circle size={13} />
                    )}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="supervisor-notifications-note">
        Notifications are saved in this browser for the frontend demo.
        They are not synchronized between different devices.
      </p>
    </div>
  );
}

function CheckCircle2Icon() {
  return <Check size={18} />;
}

export default SupervisorNotifications;
