
// Import Node.js testing tools
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Import Mongoose to work with MongoDB and create ObjectIds
import mongoose from "mongoose";

// Import notification controllers for testing
import {
    createNotificationController,
    getNotificationsController,
    markNotificationAsReadController,
    deleteNotificationController
} from "../controllers/notification.controller.js";

// Import Notification model to create and inspect test notifications
import Notification from "../models/notification.model.js";

// Import test database setup functions
import {
    connectTestDB,
    clearTestDB,
    disconnectTestDB
} from "./testSetup.js";

// Connect to the test database before running tests
before(async () => {
    await connectTestDB();
});

// Clear the database before every test
beforeEach(async () => {
    await clearTestDB();
});

// Disconnect after all tests finish
after(async () => {
    await disconnectTestDB();
});

// Test 1: Create notification and return HTTP 201
test("should create notification and return 201", async () => {

    // Prepare valid notification data
    const notificationData = {
        recipient: new mongoose.Types.ObjectId(),
        type: "general",
        title: "Welcome",
        message: "Welcome to GradTrack",
        source: "system"
    };

    // Mock the HTTP request
    const req = {
        body: notificationData
    };

    // Mock the HTTP response
    const res = {
        statusCode: null,
        responseBody: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.responseBody = data;
            return this;
        }
    };

    // Mock the next function
    const next = (error) => {
        throw error;
    };

    // Call the controller
    await createNotificationController(req, res, next);

    // Verify the HTTP status code
    assert.equal(res.statusCode, 201);

    // Verify the response indicates success
    assert.equal(res.responseBody.success, true);

    // Verify the returned notification title
    assert.equal(res.responseBody.data.title, "Welcome");

    // Verify the notification was saved in MongoDB
    const count = await Notification.countDocuments();
    assert.equal(count, 1);
});


// Test 2: Forward validation errors to Express error handler
test("should forward validation error to next", async () => {

    // Prepare invalid notification data
    const notificationData = {
        recipient: new mongoose.Types.ObjectId(),
        type: "invalid_type",
        title: "Welcome",
        message: "Welcome to GradTrack",
        source: "system"
    };

    // Mock the HTTP request
    const req = {
        body: notificationData
    };

    // Mock the HTTP response
    const res = {
        status() {
            return this;
        },

        json() {
            return this;
        }
    };

    // Capture the error passed to next
    let receivedError = null;

    const next = (error) => {
        receivedError = error;
    };

    // Call the controller
    await createNotificationController(req, res, next);

    // Verify that the controller forwarded a validation error
    assert.equal(receivedError.name, "ValidationError");

    // Verify that no notification was saved
    const count = await Notification.countDocuments();
    assert.equal(count, 0);
});
// Test 3: Get notifications for the authenticated user
test("should return notifications for authenticated user", async () => {

    // Create two different user IDs
    const userId = new mongoose.Types.ObjectId();
    const anotherUserId = new mongoose.Types.ObjectId();

    // Create a notification for the authenticated user
    await Notification.create({
        recipient: userId,
        type: "general",
        title: "My Notification",
        message: "This notification belongs to me",
        source: "system"
    });

    // Create a notification for another user
    await Notification.create({
        recipient: anotherUserId,
        type: "general",
        title: "Other Notification",
        message: "This notification belongs to another user",
        source: "system"
    });

    // Mock the authenticated user's request
    const req = {
        user: {
            userId: userId.toString()
        }
    };

    // Mock the HTTP response
    const res = {
        statusCode: null,
        responseBody: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.responseBody = data;
            return this;
        }
    };

    // Mock the next function
    const next = (error) => {
        throw error;
    };

    // Call the controller
    await getNotificationsController(req, res, next);

    // Verify the HTTP status code
    assert.equal(res.statusCode, 200);

    // Verify that the request was successful
    assert.equal(res.responseBody.success, true);

    // Verify that only one notification was returned
    assert.equal(res.responseBody.data.length, 1);

    // Verify that the returned notification belongs to the authenticated user
    assert.equal(
        res.responseBody.data[0].recipient.toString(),
        userId.toString()
    );

    // Verify the notification title
    assert.equal(
        res.responseBody.data[0].title,
        "My Notification"
    );
});
test("should delete a notification successfully", async () => {
    // Create a user ID for the notification owner
    const userId = new mongoose.Types.ObjectId();

    // Create a notification in the database
    const notification = await Notification.create({
        recipient: userId,
        type: "general",
        title: "Test Notification",
        message: "This notification will be deleted.",
        source: "system"
    });

    // Mock the request with the notification ID and authenticated user ID
    const req = {
        params: {
            notificationId: notification._id.toString()
        },
        user: {
            userId: userId.toString()
        }
    };

    // Mock the response to capture the status code and response body
    const res = {
        statusCode: null,
        responseBody: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.responseBody = data;
            return this;
        }
    };

    // Mock next to capture any errors passed by the controller
    let receivedError = null;
    const next = (error) => {
        receivedError = error;
    };

    // Call the delete controller
    await deleteNotificationController(req, res, next);

    // Verify that no error was passed
    assert.equal(receivedError, null);

    // Verify that the controller returned HTTP 200
    assert.equal(res.statusCode, 200);

    // Verify that the response indicates success
    assert.equal(res.responseBody.success, true);

    // Verify that the notification was actually deleted from the database
    const deletedNotification = await Notification.findById(notification._id);
    assert.equal(deletedNotification, null);
});
test("should not delete another user's notification", async () => {
    // Create two different user IDs
    const ownerId = new mongoose.Types.ObjectId();
    const anotherUserId = new mongoose.Types.ObjectId();

    // Create a notification owned by the first user
    const notification = await Notification.create({
        recipient: ownerId,
        type: "general",
        title: "Private Notification",
        message: "This belongs to another user.",
        source: "system"
    });

    // Simulate the second user trying to delete the notification
    const req = {
        params: {
            notificationId: notification._id.toString()
        },
        user: {
            userId: anotherUserId.toString()
        }
    };

    // Mock the response
    const res = {
        statusCode: null,
        responseBody: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.responseBody = data;
            return this;
        }
    };

    // Mock next to capture errors
    let receivedError = null;
    const next = (error) => {
        receivedError = error;
    };

    // Call the delete controller
    await deleteNotificationController(req, res, next);

    // Verify that no error occurred
    assert.equal(receivedError, null);

    // Verify that the controller returned HTTP 404
    assert.equal(res.statusCode, 404);

    // Verify that the response indicates failure
    assert.equal(res.responseBody.success, false);

    // Verify that the original notification still exists
    const existingNotification = await Notification.findById(notification._id);
    assert.notEqual(existingNotification, null);
});