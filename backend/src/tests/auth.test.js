
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import createApp from "../app.js";

import {
    connectTestDB,
    clearTestDB,
    disconnectTestDB
} from "./testSetup.js";

import User from "../models/user.model.js";
import ApprovedSupervisor from "../models/approvedSupervisor.model.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import jwt from "jsonwebtoken";
import {
    approvedStaffData,
    invalidStudentData,
    studentData,
    supervisorData
} from "./testData.js";

const app = createApp();

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
    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close(error => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }
    } finally {
        try {
            if (mongoose.connection.name === "gradtrack_test") {
                await clearTestDB();
            }
        } finally {
            await disconnectTestDB();
        }
    }
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
            identifier: "99999999999",
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

test("Login rejects student and supervisor identifiers with the wrong lengths", async () => {
    const invalidCredentials = [
        {
            identifier: "2026000001",
            password: studentData.password,
            role: "student",
            expectedMessage: "University ID must contain exactly 11 digits"
        },
        {
            identifier: "900001",
            password: supervisorData.password,
            role: "supervisor",
            expectedMessage: "Staff ID must contain exactly 5 digits"
        }
    ];

    for (const credentials of invalidCredentials) {
        const { expectedMessage, ...requestBody } = credentials;
        const response = await fetch(`${baseURL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        assert.equal(response.status, 400);
        const body = await response.json();
        assert.equal(body.success, false);
        assert.ok(body.errors.some((error) =>
            error.field === "identifier" && error.message === expectedMessage
        ));
    }
});

test("Registration rejects invalid student data", async () => {
    const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidStudentData)
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(body.errors.length > 0);
    assert.equal(await User.countDocuments(), 0);
});

test("Student registration rejects a university ID that is not exactly 11 digits", async () => {
    const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...studentData, universityId: "2026000001" })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.ok(body.errors.some((error) =>
        error.field === "universityId" &&
        error.message === "University ID must contain exactly 11 digits"
    ));
    assert.equal(await User.countDocuments(), 0);
});

test("Supervisor registration rejects a staff ID that is not exactly 5 digits", async () => {
    const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...supervisorData, staffId: "900001" })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.ok(body.errors.some((error) =>
        error.field === "staffId" &&
        error.message === "Staff ID must contain exactly 5 digits"
    ));
    assert.equal(await User.countDocuments(), 0);
});

test("Registration and login schemas require ASCII digits and exact ID lengths", async () => {
    assert.equal(registerSchema.safeParse(studentData).success, true);
    assert.equal(registerSchema.safeParse(supervisorData).success, true);
    assert.equal(loginSchema.safeParse({
        identifier: studentData.universityId,
        password: studentData.password,
        role: "student"
    }).success, true);
    assert.equal(loginSchema.safeParse({
        identifier: supervisorData.staffId,
        password: supervisorData.password,
        role: "supervisor"
    }).success, true);

    const invalidStudentIds = [
        "2026000001",
        "202600000001",
        "2026000000a",
        "2026000000!",
        "20260 00001",
        " 20260000001"
    ];
    for (const universityId of invalidStudentIds) {
        assert.equal(registerSchema.safeParse({ ...studentData, universityId }).success, false);
        assert.equal(loginSchema.safeParse({
            identifier: universityId,
            password: studentData.password,
            role: "student"
        }).success, false);
    }

    const invalidStaffIds = [
        "9001",
        "900001",
        "90a01",
        "90!01",
        "90 01",
        " 90001"
    ];
    for (const staffId of invalidStaffIds) {
        assert.equal(registerSchema.safeParse({ ...supervisorData, staffId }).success, false);
        assert.equal(loginSchema.safeParse({
            identifier: staffId,
            password: supervisorData.password,
            role: "supervisor"
        }).success, false);
    }
});

test("User and approved supervisor models reject malformed IDs", async () => {
    for (const universityId of ["2026000001", "2026000000a", "20260000001 "]) {
        const invalidStudent = new User({ ...studentData, universityId });
        await assert.rejects(
            invalidStudent.validate(),
            (error) => error.errors?.universityId?.message === "University ID must contain exactly 11 digits"
        );
    }

    for (const staffId of ["900001", "9a001", "90001 "]) {
        const invalidSupervisor = new User({ ...supervisorData, staffId });
        await assert.rejects(
            invalidSupervisor.validate(),
            (error) => error.errors?.staffId?.message === "Staff ID must contain exactly 5 digits"
        );

        const invalidApprovedId = new ApprovedSupervisor({ staffId });
        await assert.rejects(
            invalidApprovedId.validate(),
            (error) => error.errors?.staffId?.message === "Staff ID must contain exactly 5 digits"
        );
    }

    await new User(studentData).validate();
    await new User(supervisorData).validate();
    await new ApprovedSupervisor({ staffId: supervisorData.staffId }).validate();
});

test("Supervisor registration rejects an unapproved staff ID", async () => {
    const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supervisorData)
    });

    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Staff ID is not approved or has already been used.");
    assert.equal(await User.countDocuments(), 0);
});

test("Supervisor can register with an approved staff ID", async () => {
    await ApprovedSupervisor.create(approvedStaffData);

    const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supervisorData)
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.user.staffId, supervisorData.staffId);
    assert.equal(body.user.role, "supervisor");
    assert.equal(body.user.password, undefined);

    const approvedStaff = await ApprovedSupervisor.findOne({ staffId: supervisorData.staffId });
    assert.equal(approvedStaff.isUsed, true);
    assert.equal(approvedStaff.usedBy.toString(), body.user._id);
    assert.ok(approvedStaff.usedAt);
});

test("An approved staff ID cannot be reused for supervisor registration", async () => {
    await ApprovedSupervisor.create(approvedStaffData);

    const firstResponse = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supervisorData)
    });
    assert.equal(firstResponse.status, 201);

    const secondResponse = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...supervisorData, email: "another.supervisor@example.com" })
    });

    assert.equal(secondResponse.status, 403);
    const body = await secondResponse.json();
    assert.equal(body.success, false);
    assert.equal(await User.countDocuments({ role: "supervisor" }), 1);
});

test("Supervisor can login with correct credentials", async () => {
    await ApprovedSupervisor.create(approvedStaffData);
    const registration = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supervisorData)
    });
    assert.equal(registration.status, 201);

    const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: supervisorData.staffId,
            password: supervisorData.password,
            role: "supervisor"
        })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.equal(body.user.staffId, supervisorData.staffId);
    assert.equal(body.user.role, "supervisor");
});

test("Supervisor cannot login with an incorrect password", async () => {
    await User.create(supervisorData);

    const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: supervisorData.staffId,
            password: "WrongPassword123!",
            role: "supervisor"
        })
    });

    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid credentials.");
    assert.equal(body.token, undefined);
});

test("Inactive accounts cannot login", async () => {
    await User.create({ ...studentData, isActive: false });

    const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: studentData.universityId,
            password: studentData.password,
            role: "student"
        })
    });

    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Your account is inactive.");
    assert.equal(body.token, undefined);
});

test("Logout succeeds and invalidates the current JWT", async () => {
    await User.create(studentData);
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            identifier: studentData.universityId,
            password: studentData.password,
            role: "student"
        })
    });
    const loginBody = await loginResponse.json();
    assert.equal(loginResponse.status, 200);

    const logoutResponse = await fetch(`${baseURL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${loginBody.token}` }
    });
    assert.equal(logoutResponse.status, 200);
    assert.equal((await logoutResponse.json()).success, true);

    const profileResponse = await fetch(`${baseURL}/api/users/me`, {
        headers: { Authorization: `Bearer ${loginBody.token}` }
    });
    assert.equal(profileResponse.status, 401);
    const profileBody = await profileResponse.json();
    assert.equal(profileBody.success, false);
    assert.equal(profileBody.message, "Session expired. Please login again.");
});

const authenticate = (token) => ({ Authorization: `Bearer ${token}` });

test("Authenticated user can retrieve their profile", async () => {
    const user = await User.create(studentData);
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    const { token } = await loginResponse.json();
    assert.equal(loginResponse.status, 200);

    const response = await fetch(`${baseURL}/api/users/me`, { headers: authenticate(token) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.user._id, user._id.toString());
    assert.equal(body.user.universityId, studentData.universityId);
    assert.equal(body.user.password, undefined);
    assert.equal(body.user.tokenVersion, undefined);
});

test("Profile requests reject unauthenticated users", async () => {
    const response = await fetch(`${baseURL}/api/users/me`);
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Access denied. No token provided.");
});

test("Authenticated user can update their profile", async () => {
    await User.create(studentData);
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    const { token } = await loginResponse.json();

    const response = await fetch(`${baseURL}/api/users/me`, {
        method: "PATCH",
        headers: { ...authenticate(token), "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: "Updated Student", email: "UPDATED@example.com" })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.user.fullName, "Updated Student");
    assert.equal(body.user.email, "updated@example.com");

    const savedUser = await User.findById(body.user._id);
    assert.equal(savedUser.fullName, "Updated Student");
    assert.equal(savedUser.email, "updated@example.com");
});

test("Profile update rejects empty and invalid updates", async () => {
    await User.create(studentData);
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    const { token } = await loginResponse.json();

    for (const update of [{}, { fullName: "A" }, { email: "not-an-email" }, { role: "supervisor" }]) {
        const response = await fetch(`${baseURL}/api/users/me`, {
            method: "PATCH",
            headers: { ...authenticate(token), "Content-Type": "application/json" },
            body: JSON.stringify(update)
        });
        assert.equal(response.status, 400, `Expected update ${JSON.stringify(update)} to be rejected`);
        assert.equal((await response.json()).success, false);
    }

    const savedUser = await User.findOne({ universityId: studentData.universityId });
    assert.equal(savedUser.fullName, studentData.fullName);
    assert.equal(savedUser.email, studentData.email);
});

test("Authenticated user can change password and only the new password works", async () => {
    await User.create(studentData);
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    const { token: oldToken } = await loginResponse.json();

    const changeResponse = await fetch(`${baseURL}/api/users/me/password`, {
        method: "PATCH",
        headers: { ...authenticate(oldToken), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: studentData.password, newPassword: "NewStudentPass456!" })
    });
    assert.equal(changeResponse.status, 200);
    const changeBody = await changeResponse.json();
    assert.equal(changeBody.success, true);
    assert.ok(changeBody.token);

    const oldPasswordLogin = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    assert.equal(oldPasswordLogin.status, 401);

    const newPasswordLogin = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: "NewStudentPass456!", role: "student" })
    });
    assert.equal(newPasswordLogin.status, 200);
    assert.ok((await newPasswordLogin.json()).token);

    const oldTokenResponse = await fetch(`${baseURL}/api/users/me`, { headers: authenticate(oldToken) });
    assert.equal(oldTokenResponse.status, 401);
});

test("Password change rejects an incorrect current password", async () => {
    await User.create(studentData);
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    const { token } = await loginResponse.json();

    const response = await fetch(`${baseURL}/api/users/me/password`, {
        method: "PATCH",
        headers: { ...authenticate(token), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "WrongPassword123!", newPassword: "NewStudentPass456!" })
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Current password is incorrect.");

    const savedUser = await User.findOne({ universityId: studentData.universityId }).select("+password");
    assert.equal(await savedUser.comparePassword(studentData.password), true);
});

test("User routes reject malformed, invalid-signature, and role-mismatched JWTs", async () => {
    const user = await User.create(studentData);
    const invalidSignature = jwt.sign(
        { userId: user._id.toString(), role: "student", tokenVersion: 0 },
        "a-different-secret"
    );
    const mismatchedRole = jwt.sign(
        { userId: user._id.toString(), role: "supervisor", tokenVersion: 0 },
        process.env.JWT_SECRET,
        { algorithm: "HS256" }
    );

    for (const token of ["not-a-jwt", invalidSignature, mismatchedRole]) {
        const response = await fetch(`${baseURL}/api/users/me`, { headers: authenticate(token) });
        assert.equal(response.status, 401);
        assert.equal((await response.json()).success, false);
    }
});

test("A valid student token can only retrieve the authenticated profile", async () => {
    const user = await User.create(studentData);
    await User.create({
        ...studentData,
        universityId: "20260000002",
        email: "other.student@example.com"
    });
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: studentData.universityId, password: studentData.password, role: "student" })
    });
    const { token } = await loginResponse.json();

    const response = await fetch(`${baseURL}/api/users/me`, {
        headers: { ...authenticate(token), "X-User-Id": "20260000002" }
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).user._id, user._id.toString());
});
