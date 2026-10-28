const NOTIFICATIONS_STORAGE_KEY = "gradtrack-notifications";

// إضافة إشعار واحد إلى قائمة الإشعارات المشتركة.
export function addNotification({
  id,
  recipientId,
  type = "general",
  title,
  message,
  link = "",
  relatedId = null,
}) {
  if (!recipientId || !title || !message) {
    return false;
  }

  try {
    const savedNotifications = localStorage.getItem(
      NOTIFICATIONS_STORAGE_KEY
    );

    const parsedNotifications = savedNotifications
      ? JSON.parse(savedNotifications)
      : [];

    const notifications = Array.isArray(parsedNotifications)
      ? parsedNotifications
      : [];

    // منع إضافة الإشعار نفسه مرتين.
    if (id && notifications.some((item) => item.id === id)) {
      return true;
    }

    const notification = {
      id:
        id ||
        `notification-${recipientId}-${Date.now()}`,
      recipientId: String(recipientId),
      type,
      title,
      message,
      link,
      relatedId,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify([...notifications, notification])
    );

    return true;
  } catch {
    return false;
  }
}