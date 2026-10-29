import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ArrowUpRight,
  Users,
  FileText,
  ListTodo,
  Inbox,
  Check,
  Circle,
  AlertCircle,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./Notifications.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const NOTIFICATIONS_STORAGE_KEY = "gradtrack-notifications";

// إرسال حدث حتى يتحدّث عداد الجرس مباشرة.
function notifyNavbarToRefresh() {
  window.dispatchEvent(
    new Event("gradtrack-notifications-updated")
  );
}

function readCurrentStudent() {
  try {
    const saved = sessionStorage.getItem(CURRENT_STUDENT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function readLocalArray(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getTeamStatus(student) {
  if (!student?.universityId) return "no-team";

  const teams = readLocalArray(TEAMS_STORAGE_KEY);

  const team =
    teams.find((item) => item.id === student.teamId) ||
    teams.find((item) => {
      const memberIds = [
        item.leaderId,
        ...(Array.isArray(item.memberIds) ? item.memberIds : []),
        ...(Array.isArray(item.members)
          ? item.members.map(
              (member) => member.universityId || member.id
            )
          : []),
      ].filter(Boolean);

      return memberIds.some(
        (id) => String(id) === String(student.universityId)
      );
    });

  if (!team) return "no-team";

  return String(team.leaderId) === String(student.universityId)
    ? "leader"
    : "member";
}

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getNotificationIcon(type) {
  switch (type) {
    case "invitation":
      return Users;
    case "proposal":
      return FileText;
    case "task":
      return ListTodo;
    default:
      return Bell;
  }
}

function Notifications() {
  const navigate = useNavigate();
  const student = readCurrentStudent();
  const studentId = student?.universityId;

  const [notifications, setNotifications] = useState(() => {
    if (!studentId) return [];

    return readLocalArray(NOTIFICATIONS_STORAGE_KEY).filter(
      (notification) =>
        String(notification.recipientId) === String(studentId)
    );
  });

  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  const teamStatus = getTeamStatus(student);

  // عند فتح صفحة Notifications، نعلّم إشعارات الحساب الحالي كمقروءة.
  useEffect(() => {
    if (!studentId) {
      setNotifications([]);
      return;
    }

    try {
      const allNotifications = readLocalArray(
        NOTIFICATIONS_STORAGE_KEY
      );

      let hasChanges = false;

      const updatedAllNotifications = allNotifications.map(
        (notification) => {
          const belongsToCurrentStudent =
            String(notification.recipientId) === String(studentId);

          if (
            belongsToCurrentStudent &&
            notification.isRead !== true
          ) {
            hasChanges = true;

            return {
              ...notification,
              isRead: true,
            };
          }

          return notification;
        }
      );

      if (hasChanges) {
        localStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify(updatedAllNotifications)
        );
      }

      // تحديث إشعارات الصفحة حسب الحساب الحالي فقط.
      const currentNotifications = updatedAllNotifications.filter(
        (notification) =>
          String(notification.recipientId) === String(studentId)
      );

      setNotifications(currentNotifications);

      // تحديث عداد الجرس مباشرة بعد تعليم الإشعارات كمقروءة.
      if (hasChanges) {
        notifyNavbarToRefresh();
      }
    } catch {
      setMessage(
        "Could not update notification read status. Please try again."
      );
    }
  }, [studentId]);

  // متابعة التغييرات القادمة من تبويبات أخرى في المتصفح نفسه.
  useEffect(() => {
    if (!studentId) return;

    function syncNotifications() {
      const currentNotifications = readLocalArray(
        NOTIFICATIONS_STORAGE_KEY
      ).filter(
        (notification) =>
          String(notification.recipientId) === String(studentId)
      );

      setNotifications(currentNotifications);
    }

    window.addEventListener("storage", syncNotifications);

    return () => {
      window.removeEventListener("storage", syncNotifications);
    };
  }, [studentId]);

  const unreadCount = notifications.filter(
    (notification) => notification.isRead !== true
  ).length;

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = notifications.filter(
    (notification) => {
      if (filter === "Unread") {
        return notification.isRead !== true;
      }

      if (filter === "Read") {
        return notification.isRead === true;
      }

      return true;
    }
  );

  // حفظ إشعارات الحساب الحالي دون تغيير إشعارات الحسابات الأخرى.
  function saveCurrentNotifications(updatedNotifications) {
    if (!studentId) return false;

    try {
      const allNotifications = readLocalArray(
        NOTIFICATIONS_STORAGE_KEY
      );

      const currentNotificationIds = new Set(
        notifications.map((notification) => notification.id)
      );

      const updatedById = new Map(
        updatedNotifications.map((notification) => [
          notification.id,
          notification,
        ])
      );

      const updatedAllNotifications = allNotifications.map(
        (notification) => {
          const belongsToCurrentStudent =
            String(notification.recipientId) === String(studentId);

          const isCurrentNotification =
            currentNotificationIds.has(notification.id);

          if (
            belongsToCurrentStudent &&
            isCurrentNotification &&
            updatedById.has(notification.id)
          ) {
            return updatedById.get(notification.id);
          }

          return notification;
        }
      );

      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedAllNotifications)
      );

      setNotifications(updatedNotifications);
      setMessage("");

      // تحديث عداد الجرس في التبويب الحالي.
      notifyNavbarToRefresh();

      return true;
    } catch {
      setMessage(
        "Could not save your changes. Please try again."
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

    saveCurrentNotifications(updatedNotifications);
  }

  function markAllAsRead() {
    const updatedNotifications = notifications.map(
      (notification) => ({
        ...notification,
        isRead: true,
      })
    );

    saveCurrentNotifications(updatedNotifications);
  }

  function handleOpenNotification(notification) {
    if (!notification.isRead) {
      const updatedNotifications = notifications.map(
        (item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
      );

      if (!saveCurrentNotifications(updatedNotifications)) {
        return;
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <div className="notifications-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="notifications-content">
        <header className="notifications-header notifications-reveal">
          <div className="notifications-heading-copy">
            <p className="notifications-eyebrow">
              YOUR WORKSPACE
            </p>

            <h1>Notifications</h1>

            <p>
              Important updates about your team and graduation project,
              all in one place.
            </p>
          </div>

          <div
            className="notifications-header-icon"
            aria-hidden="true"
          >
            <Bell size={28} />
            {unreadCount > 0 && (
              <span className="notifications-header-dot" />
            )}
          </div>
        </header>

        {!student ? (
          <section className="notifications-empty notifications-reveal">
            <div className="notifications-empty-icon">
              <Inbox size={28} />
            </div>

            <h2>Please sign in first</h2>

            <p>
              Sign in to view the notifications for your account.
            </p>
          </section>
        ) : (
          <>
            <section className="notifications-summary notifications-reveal">
              <article className="notifications-summary-card">
                <div className="notifications-summary-icon unread-icon">
                  <Bell size={20} />
                </div>

                <div>
                  <span>Unread</span>
                  <strong>{unreadCount}</strong>
                </div>
              </article>

              <article className="notifications-summary-card">
                <div className="notifications-summary-icon read-icon">
                  <CheckCheck size={20} />
                </div>

                <div>
                  <span>Read</span>
                  <strong>{readCount}</strong>
                </div>
              </article>

              <article className="notifications-summary-card">
                <div className="notifications-summary-icon total-icon">
                  <Inbox size={20} />
                </div>

                <div>
                  <span>Total</span>
                  <strong>{notifications.length}</strong>
                </div>
              </article>
            </section>

            <section className="notifications-panel notifications-reveal">
              <div className="notifications-panel-header">
                <div>
                  <span className="notifications-section-kicker">
                    UPDATES
                  </span>

                  <h2>Your Activity</h2>

                  <p>
                    Review updates and mark notifications as read.
                  </p>
                </div>

                <button
                  className="notifications-mark-all"
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={16} />
                  Mark all as read
                </button>
              </div>

              <div className="notifications-toolbar">
                <div
                  className="notifications-filters"
                  aria-label="Filter notifications"
                >
                  {["All", "Unread", "Read"].map((item) => {
                    const count =
                      item === "All"
                        ? notifications.length
                        : item === "Unread"
                          ? unreadCount
                          : readCount;

                    return (
                      <button
                        key={item}
                        type="button"
                        className={
                          filter === item
                            ? "notifications-filter active"
                            : "notifications-filter"
                        }
                        onClick={() => setFilter(item)}
                        aria-pressed={filter === item}
                      >
                        {item}
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {message && (
                <p className="notifications-message" role="alert">
                  <AlertCircle size={16} />
                  {message}
                </p>
              )}

              {filteredNotifications.length === 0 ? (
                <div className="notifications-empty">
                  <div className="notifications-empty-icon">
                    {filter === "Unread" ? (
                      <Check size={28} />
                    ) : (
                      <Inbox size={28} />
                    )}
                  </div>

                  <h2>
                    {filter === "Unread"
                      ? "You're all caught up"
                      : filter === "Read"
                        ? "No read notifications"
                        : "No notifications yet"}
                  </h2>

                  <p>
                    {filter === "Unread"
                      ? "There are no unread notifications for your account."
                      : filter === "Read"
                        ? "Notifications you have read will appear here."
                        : "When updates are generated for your account, they will appear here."}
                  </p>
                </div>
              ) : (
                <div className="notifications-list">
                  {filteredNotifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type);

                    return (
                      <article
                        key={notification.id}
                        className={
                          notification.isRead
                            ? "notification-card read"
                            : "notification-card unread"
                        }
                        style={{ "--notification-index": index }}
                      >
                        <div className="notification-read-indicator">
                          {!notification.isRead && (
                            <span title="Unread notification" />
                          )}
                        </div>

                        <div
                          className={`notification-icon ${
                            notification.type || "general"
                          }`}
                        >
                          <Icon size={21} />
                        </div>

                        <div className="notification-details">
                          <div className="notification-heading">
                            <h3>{notification.title}</h3>

                            {!notification.isRead && (
                              <span className="notification-new-label">
                                New
                              </span>
                            )}
                          </div>

                          <p>{notification.message}</p>

                          <time dateTime={notification.createdAt || ""}>
                            {formatDate(notification.createdAt)}
                          </time>

                          <div className="notification-actions">
                            {notification.link ? (
                              <button
                                type="button"
                                className="notification-open-link"
                                onClick={() =>
                                  handleOpenNotification(notification)
                                }
                              >
                                View details
                                <ArrowUpRight size={15} />
                              </button>
                            ) : !notification.isRead ? (
                              <button
                                type="button"
                                className="notification-open-link"
                                onClick={() =>
                                  markAsRead(notification.id)
                                }
                              >
                                Mark as read
                                <Check size={15} />
                              </button>
                            ) : (
                              <span className="notification-read-label">
                                <Check size={14} />
                                Read
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="notification-card-status">
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
          </>
        )}

      </main>
    </div>
  );
}

export default Notifications;
