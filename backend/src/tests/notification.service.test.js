import {
    createNotification,
    getNotifications
} from "../services/notification.service.js";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";


import Notification from "../models/notification.model.js";

import {
    connectTestDB,
    clearTestDB,
    disconnectTestDB
} from "./testSetup.js";

// Connect to the test database before running tests
before(async () => {
    await connectTestDB();
});

// Clear the test database before each test
beforeEach(async () => {
    await clearTestDB();
});

// Disconnect from the test database after all tests finish
after(async () => {
    await disconnectTestDB();
});

// Test: Create a notification and save it to MongoDB
test("should create and save a notification", async () => {

    // Prepare test data for the new notification
    const notificationData = {
        recipient: new mongoose.Types.ObjectId(),
        type: "general",
        title: "Test Notification",
        message: "This is a test notification.",
        source: "system"
    };

    // Call the service function to create and save the notification
    const result = await createNotification(notificationData);

    // Verify that the notification has an ID
    assert.ok(result._id);

    // Verify that the returned notification has the correct data
    assert.equal(result.title, "Test Notification");
    assert.equal(result.message, "This is a test notification.");
    assert.equal(result.source, "system");

    // Retrieve the notification from MongoDB using its ID
    const savedNotification = await Notification.findById(result._id);

    // Verify that the notification actually exists in MongoDB
    assert.ok(savedNotification);

    // Verify that the saved notification contains the correct title
    assert.equal(savedNotification.title, "Test Notification");
});
// Test: Reject notification when the type is invalid
test("should reject notification with invalid type", async () => {

    // Prepare notification data with an invalid type
    const notificationData = {
        recipient: new mongoose.Types.ObjectId(),
        type: "invalid_type",
        title: "Test Notification",
        message: "This is a test notification.",
        source: "system"
    };

    // Verify that the service rejects the invalid notification
    await assert.rejects(
        createNotification(notificationData),
        { name: "ValidationError" }
    );

    // Verify that no notification was saved to MongoDB
    const count = await Notification.countDocuments();
    assert.equal(count, 0);
});


// Test: Reject notification when a required field is missing
test("should reject notification without title", async () => {

    // Prepare notification data without the required title
    const notificationData = {
        recipient: new mongoose.Types.ObjectId(),
        type: "general",
        message: "This is a test notification.",
        source: "system"
    };

    // Verify that the service rejects the notification
    await assert.rejects(
        createNotification(notificationData),
        { name: "ValidationError" }
    );

    // Verify that no notification was saved to MongoDB
    const count = await Notification.countDocuments();
    assert.equal(count, 0);
});
// Test: Reject user notification when sender is missing
test("should reject user notification without sender", async () => {

    // Prepare notification data without a sender
    const notificationData = {
        recipient: new mongoose.Types.ObjectId(),
        type: "general",
        title: "Test Notification",
        message: "This is a user notification.",
        source: "user"
    };

    // Verify that the service rejects the notification
    await assert.rejects(
        createNotification(notificationData),
        { name: "ValidationError" }
    );

    // Verify that no notification was saved to MongoDB
    const count = await Notification.countDocuments();
    assert.equal(count, 0);
});
// Test: Get notifications belonging to a specific user
test("should get notifications for a specific user", async () => {

    // Create two different user IDs
    const userId = new mongoose.Types.ObjectId();
    const anotherUserId = new mongoose.Types.ObjectId();

    // Create notifications for the first user
    await createNotification({
        recipient: userId,
        type: "general",
        title: "First Notification",
        message: "Notification for first user",
        source: "system"
    });

    // Create a notification for another user
    await createNotification({
        recipient: anotherUserId,
        type: "general",
        title: "Second Notification",
        message: "Notification for another user",
        source: "system"
    });

    // Get notifications for the first user
    const notifications = await getNotifications(userId);

    // Verify that only one notification was returned
    assert.equal(notifications.length, 1);

    // Verify that the returned notification belongs to the first user
    assert.equal(
        notifications[0].recipient.toString(),
        userId.toString()
    );

    // Verify the notification title
    assert.equal(notifications[0].title, "First Notification");
});