
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
    connectTestDB,
    clearTestDB,
    disconnectTestDB
} from "./testSetup.js";

test("Test setup connects only to gradtrack_test", async () => {
    try {
        await connectTestDB();

        assert.equal(mongoose.connection.name, "gradtrack_test");

        // Verify test collections can be cleaned safely
        await clearTestDB();

        assert.equal(mongoose.connection.readyState, 1);
    } finally {
        await disconnectTestDB();
    }

    assert.equal(mongoose.connection.readyState, 0);
});
