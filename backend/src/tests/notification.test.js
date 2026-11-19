
import test, { before, after } from "node:test";
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

// Disconnect from the test database after all tests finish
after(async () => {
    await disconnectTestDB();
});

// Test 12: التأكد من حفظ الإشعار في MongoDB
test("Notification should be saved in database", async () => {
    await clearTestDB();

    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Save Test",
        message: "Testing notification save"
    });

    const savedNotification = await notification.save();

    assert.ok(savedNotification._id);
});


// Test 13: التأكد من إمكانية قراءة الإشعار بعد حفظه
test("Notification should be retrieved from database", async () => {
    await clearTestDB();

    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Retrieve Test",
        message: "Testing notification retrieval"
    });

    const savedNotification = await notification.save();

    const foundNotification = await Notification.findById(
        savedNotification._id
    );

    assert.ok(foundNotification);
    assert.equal(foundNotification.title, "Retrieve Test");
});


// Test 14: التأكد من تحديث حالة الإشعار إلى مقروء
test("Notification should update isRead status", async () => {
    await clearTestDB();

    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Update Test",
        message: "Testing notification update"
    });

    const savedNotification = await notification.save();

    savedNotification.isRead = true;
    await savedNotification.save();

    const updatedNotification = await Notification.findById(
        savedNotification._id
    );

    assert.equal(updatedNotification.isRead, true);
});


// Test 15: التأكد من حذف الإشعار من قاعدة البيانات
test("Notification should be deleted from database", async () => {
    await clearTestDB();

    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Delete Test",
        message: "Testing notification deletion"
    });

    const savedNotification = await notification.save();

    await Notification.deleteOne({
        _id: savedNotification._id
    });

    const deletedNotification = await Notification.findById(
        savedNotification._id
    );

    assert.equal(deletedNotification, null);
});


// Test 16: التأكد من بقاء sender و recipient و Task ID بعد الحفظ والقراءة
test("Notification should preserve sender, recipient and related entity", async () => {
    await clearTestDB();

    const senderId = new mongoose.Types.ObjectId();
    const recipientId = new mongoose.Types.ObjectId();
    const taskId = new mongoose.Types.ObjectId();

    const notification = new Notification({
        sender: senderId,
        recipient: recipientId,
        source: "user",
        type: "task_assigned",
        title: "New Task Assigned",
        message: "A new task was assigned to you",
        relatedEntity: {
            model: "Task",
            id: taskId
        }
    });

    const savedNotification = await notification.save();

    const foundNotification = await Notification.findById(
        savedNotification._id
    );

    assert.equal(
        foundNotification.sender.toString(),
        senderId.toString()
    );

    assert.equal(
        foundNotification.recipient.toString(),
        recipientId.toString()
    );

    assert.equal(
        foundNotification.relatedEntity.id.toString(),
        taskId.toString()
    );

    assert.equal(foundNotification.relatedEntity.model, "Task");
});

//Default Values
test("Notification should have default values", async () => {
    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        type: "general",
        title: "Test Notification",
        message: "This is a test notification",
        source: "system"
    });

    assert.equal(notification.isRead, false);
    assert.equal(notification.sender, null);

    await notification.validate();
});
//Required Fields

test("Notification should fail when required fields are missing", async () => {
    const notification = new Notification({
        source: "system"
    });

    await assert.rejects(
        notification.validate()
    );
});
//Invalid Type
test("Notification should reject an invalid type", async () => {
    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        type: "invalid_type",
        title: "Test Notification",
        message: "This is a test",
        source: "system"
    });

    await assert.rejects(
        notification.validate()
    );

    //source is supervisor
});test("Notification should accept a supervisor as sender", async () => {
    const supervisorId = new mongoose.Types.ObjectId();

    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        sender: supervisorId,
        source: "user",
        type: "general",
        title: "Supervisor Notification",
        message: "Message from supervisor"
    });

    await notification.validate();

    assert.equal(notification.sender.toString(), supervisorId.toString());
});

//Invalid Source
test("Notification should reject an invalid source", async () => {
    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        type: "general",
        title: "Test Notification",
        message: "This is a test",
        source: "admin"
    });

    await assert.rejects(
        notification.validate()
    );
});
//Sender and Source must match
test("Notification should reject sender when source is system", async () => {
    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        sender: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Test Notification",
        message: "Test message"
    });

    await assert.rejects(
        notification.validate()
    );
});
//Invalid Related Entity
test("Notification should reject an invalid related entity model", async () => {
    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Test Notification",
        message: "Test message",
        relatedEntity: {
            model: "Supervisor",
            id: new mongoose.Types.ObjectId()
        }
    });

    await assert.rejects(
        notification.validate()
    );
});
//Valid Related Entity
test("Notification should accept a valid related entity", async () => {
    const taskId = new mongoose.Types.ObjectId();

    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "Task Notification",
        message: "A task was created",
        relatedEntity: {
            model: "Task",
            id: taskId
        }
    });

    await notification.validate();

    assert.equal(
        notification.relatedEntity.model,
        "Task"
    );

    assert.equal(
        notification.relatedEntity.id.toString(),
        taskId.toString()
    );
});
// Test 8: التأكد من إزالة المسافات الزائدة من title
test("Notification should trim title", async () => {
    const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(),
        source: "system",
        type: "general",
        title: "   Test Notification   ",
        message: "Test message"
    });

    assert.equal(notification.title, "Test Notification");
    await notification.validate();
});
// Test 10: التأكد من قبول جميع قيم type الموجودة في enum
test("Notification should accept all allowed types", async () => {
    const allowedTypes = [
        "task_created",
        "task_assigned",
        "task_updated",
        "task_completed",
        "submission_uploaded",
        "submission_reviewed",
        "submission_rejected",
        "team_created",
        "team_member_joined",
        "team_member_removed",
        "general"
    ];

    for (const type of allowedTypes) {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            source: "system",
            type,
            title: "Test Notification",
            message: "Test message"
        });

        await notification.validate();
    }
});
// Test 11: التأكد من قبول Task وSubmission وTeam
test("Notification should accept all allowed related entity models", async () => {
    const allowedModels = ["Task", "Submission", "Team"];

    for (const model of allowedModels) {
        const notification = new Notification({
            recipient: new mongoose.Types.ObjectId(),
            source: "system",
            type: "general",
            title: "Test Notification",
            message: "Test message",
            relatedEntity: {
                model,
                id: new mongoose.Types.ObjectId()
            }
        });

        await notification.validate();
    }
});