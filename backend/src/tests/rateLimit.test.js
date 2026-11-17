import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import {
    changePasswordLimiter,
    loginLimiter,
    registerLimiter
} from "../middleware/rateLimit.middleware.js";

const assertLimiterBlocksAfterLimit = async ({
    limiter,
    path,
    clientIp,
    limit,
    rejectedStatus
}) => {
    // Use a distinct client key for each limiter test and clear it before and
    // after the test so attempts cannot leak into another run.
    await limiter.resetKey(clientIp);

    const app = express();
    app.set("trust proxy", 1);
    app.post(path, limiter, (_req, res) => {
        res.status(rejectedStatus).json({ success: false });
    });

    const server = app.listen(0);

    try {
        const address = server.address();
        const url = `http://127.0.0.1:${address.port}${path}`;
        const request = () => fetch(url, {
            method: "POST",
            headers: { "X-Forwarded-For": clientIp }
        });

        for (let attempt = 0; attempt < limit; attempt += 1) {
            const response = await request();
            assert.equal(response.status, rejectedStatus);
            await response.arrayBuffer();
        }

        const blockedResponse = await request();
        assert.equal(blockedResponse.status, 429);

        const body = await blockedResponse.json();
        assert.equal(body.success, false);
        assert.match(body.message, /Too many/);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
        await limiter.resetKey(clientIp);
    }
};

test("loginLimiter allows 10 failed attempts and blocks the next request", async () => {
    await assertLimiterBlocksAfterLimit({
        limiter: loginLimiter,
        path: "/api/auth/login",
        clientIp: "198.51.100.10",
        limit: 10,
        rejectedStatus: 401
    });
});

test("registerLimiter allows 15 failed attempts and blocks the next request", async () => {
    await assertLimiterBlocksAfterLimit({
        limiter: registerLimiter,
        path: "/api/auth/register",
        clientIp: "198.51.100.11",
        limit: 15,
        rejectedStatus: 400
    });
});

test("changePasswordLimiter allows 5 failed attempts and blocks the next request", async () => {
    await assertLimiterBlocksAfterLimit({
        limiter: changePasswordLimiter,
        path: "/api/users/me/password",
        clientIp: "198.51.100.12",
        limit: 5,
        rejectedStatus: 400
    });
});
