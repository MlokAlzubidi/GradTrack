import test from "node:test";
import assert from "node:assert/strict";

import { authorizeRoles } from "../middleware/authorize.middleware.js";

const createResponse = () => {
    const response = {
        statusCode: undefined,
        body: undefined,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };

    return response;
};

test("authorizeRoles returns 401 when req.user is missing", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("student")({}, response, () => {
        nextCalled = true;
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, {
        success: false,
        message: "Authentication required."
    });
    assert.equal(nextCalled, false);
});

test("authorizeRoles returns 403 when the user's role is disallowed", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("supervisor")(
        { user: { role: "student" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.body, {
        success: false,
        message: "Access denied. You do not have permission."
    });
    assert.equal(nextCalled, false);
});

test("authorizeRoles calls next when the user's role is allowed", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("student", "supervisor")(
        { user: { role: "supervisor" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, undefined);
    assert.equal(response.body, undefined);
});
