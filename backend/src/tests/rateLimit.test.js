
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import rateLimit from "express-rate-limit";

test("Rate limiter blocks requests after reaching the limit", async () => {
    const app = express();

    const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 3,
        standardHeaders: false,
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too many requests."
        }
    });

    app.get("/test", testLimiter, (req, res) => {
        res.status(200).json({ success: true });
    });

    const server = app.listen(0);

    try {
        const address = server.address();
        const url = `http://127.0.0.1:${address.port}/test`;

        // First 3 requests should succeed
        for (let i = 0; i < 3; i++) {
            const response = await fetch(url);
            assert.equal(response.status, 200);
        }

        // Fourth request should be blocked
        const blockedResponse = await fetch(url);

        assert.equal(blockedResponse.status, 429);

        const body = await blockedResponse.json();

        assert.equal(body.success, false);
        assert.equal(body.message, "Too many requests.");
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});
