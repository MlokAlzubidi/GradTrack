
import {
    createNotification,
    getNotifications,
    markNotificationAsRead,
    deleteNotification
} from "../services/notification.service.js";

// Create a new notification
const createNotificationController = async (req, res, next) => {
    try {
        const notificationData = req.body;

        const notification = await createNotification(notificationData);

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });

    } catch (error) {
        return next(error);
    }
};

// Get notifications for the authenticated user
const getNotificationsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const notifications = await getNotifications(userId);

        return res.status(200).json({
            success: true,
            data: notifications
        });

    } catch (error) {
        return next(error);
    }
};

// Mark a notification as read
const markNotificationAsReadController = async (req, res, next) => {
    try {
        // Get the notification ID from the URL
        const notificationId = req.params.notificationId;

        // Get the authenticated user's ID
        const userId = req.user.userId;

        // Mark the notification as read
        const notification = await markNotificationAsRead(
            notificationId,
            userId
        );

        // Check if the notification exists
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        // Return the updated notification
        return res.status(200).json({
            success: true,
            message: "Notification marked as read.",
            data: notification
        });

    } catch (error) {
        return next(error);
    }
};

// Delete a notification
const deleteNotificationController = async (req, res, next) => {
    try {
        // Get the notification ID from the URL
        const notificationId = req.params.notificationId;

        // Get the authenticated user's ID
        const userId = req.user.userId;

        // Delete the notification
        const notification = await deleteNotification(
            notificationId,
            userId
        );

        // Check if the notification exists
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        // Return a successful response
        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully."
        });

    } catch (error) {
        return next(error);
    }
};

export {
    createNotificationController,
    getNotificationsController,
    markNotificationAsReadController,
    deleteNotificationController
};
