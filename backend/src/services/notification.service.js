
import Notification from "../models/notification.model.js";

// Create a new notification
const createNotification = async (notificationData) => {
    const notification = new Notification(notificationData);

    await notification.save();

    return notification;
};

// Get all notifications for a specific user
const getNotifications = async (userId) => {
    const notifications = await Notification.find({
        recipient: userId
    }).sort({ createdAt: -1 });

    return notifications;
};

// Mark a notification as read
const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient: userId
        },
        {
            isRead: true
        },
        {
            new: true,
            runValidators: true
        }
    );

    return notification;
};

// Delete a notification
const deleteNotification = async (notificationId, userId) => {
    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
    });

    return notification;
};

export {
    createNotification,
    getNotifications,
    markNotificationAsRead,
    deleteNotification
};
