
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import createTestApp from "./testApp.js";

import {
    connectTestDB,
    clearTestDB,
    disconnectTestDB
} from "./testSetup.js";

import User from "../models/user.model.js";
import { studentData } from "./testData.js";

const app = createTestApp();

let server;
let baseURL;

before(async () => {
    await connectTestDB();

    server = app.listen(0);

    const address = server.address();
    baseURL = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
    await clearTestDB();
});

after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    await disconnectTestDB();
});

test("Student can register successfully", async () => {
    const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData)
    });

    assert.equal(response.status, 201);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(body.user.fullName, studentData.fullName);
    assert.equal(body.user.universityId, studentData.universityId);
    assert.equal(body.user.role, "student");

    assert.equal(body.user.password, undefined);
    assert.equal(body.user.tokenVersion, undefined);

    const savedUser = await User.findOne({
        universityId: studentData.universityId
    }).select("+password");

    assert.ok(savedUser);
    assert.notEqual(savedUser.password, studentData.password);

    assert.equal(
        await savedUser.comparePassword(studentData.password),
        true
    );
});

test("Student cannot register with an existing university ID", async () => {
    const firstResponse = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData)
    });

    assert.equal(firstResponse.status, 201);

    const secondResponse = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...studentData,
            email: "another.student@example.com"
        })
    });

    assert.equal(secondResponse.status, 409);

    const body = await secondResponse.json();

    assert.equal(body.success, false);
});



test("Student can login with correct credentials", async () => {
    await User.create(studentData);

    const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: studentData.universityId,
            password: studentData.password,
            role: "student"
        })
    });

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.equal(body.user.universityId, studentData.universityId);
    assert.equal(body.user.role, "student");
    assert.equal(body.user.password, undefined);
});




test("Student cannot login with incorrect password", async () => {
    await User.create(studentData);

    const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: studentData.universityId,
            password: "WrongPassword123!",
            role: "student"
        })
    });

    assert.equal(response.status, 401);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid credentials.");
    assert.equal(body.token, undefined);
});



test("Student cannot login with an unknown university ID", async () => {
    const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: "9999999999",
            password: studentData.password,
            role: "student"
        })
    });

    assert.equal(response.status, 401);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid credentials.");
    assert.equal(body.token, undefined);
});
