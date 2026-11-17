
import mongoose from "mongoose";
import assert from "node:assert/strict";

import { connectTestDB, disconnectTestDB } from "../../tests/testSetup.js";
import User from "../../models/user.model.js";

const runTest = async () => {
    const testSuffix = Date.now().toString();

    const studentId = `9${testSuffix.slice(-10)}`;
    const supervisorId = testSuffix.slice(-5);

    let connected = false;

    try {
        // Diagnostics may only use the guarded gradtrack_test connection.
        await connectTestDB();
        connected = true;

        // Ensure database indexes are created
        await User.init();

        console.log("\n--- Testing Student Creation ---");

        // 1. Create Student
        const student = await User.create({
            fullName: "Test Student",
            universityId: studentId,
            password: "Student123",
            role: "student"
        });

        console.log("Student created:", student.fullName);

        // 2. Check password hashing
        assert.notEqual(student.password, "Student123");

        console.log("Password hashed: SUCCESS");

        // 3. Check password comparison
        const studentPasswordValid =
            await student.comparePassword("Student123");

        assert.equal(studentPasswordValid, true);

        console.log("Password comparison: SUCCESS");

        console.log("\n--- Testing Supervisor Creation ---");

        // 4. Create Supervisor
        const supervisor = await User.create({
            fullName: "Test Supervisor",
            staffId: supervisorId,
            password: "Supervisor123",
            role: "supervisor"
        });

        console.log("Supervisor created:", supervisor.fullName);

        // 5. Check supervisor password hashing
        assert.notEqual(supervisor.password, "Supervisor123");

        console.log("Supervisor password hashed: SUCCESS");

        
        // 6. Check supervisor password comparison
        const supervisorPasswordValid =
            await supervisor.comparePassword("Supervisor123");

        assert.equal(supervisorPasswordValid, true);

        console.log("Supervisor password comparison: SUCCESS");

        console.log("\n--- Testing Duplicate University ID ---");

        // 7. Try creating duplicate Student
        let duplicateRejected = false;

        try {
            await User.create({
                fullName: "Duplicate Student",
                universityId: studentId,
                password: "Student456",
                role: "student"
            });
        } catch (error) {
            if (error.code === 11000) {
                duplicateRejected = true;
            } else {
                throw error;
            }
        }

        assert.equal(duplicateRejected, true);

        console.log("Duplicate university ID rejected: SUCCESS");

        console.log("\nAll User Model tests passed successfully!");

    } catch (error) {
        console.error("\nUser Model Test Failed:", error.message);
        process.exitCode = 1;

    } finally {
        try {
            if (
                connected &&
                mongoose.connection.readyState !== 0 &&
                mongoose.connection.name === "gradtrack_test"
            ) {
                // Clean up test data
                await User.deleteMany({
                    $or: [
                        { role: "student", universityId: studentId },
                        { role: "supervisor", staffId: supervisorId }
                    ]
                });

                console.log("\nTest data cleaned up.");
            }
        } catch (cleanupError) {
            console.error(
                "Test data cleanup failed:",
                cleanupError.message
            );

            process.exitCode = 1;

        } finally {
            // Always close the database connection
            if (mongoose.connection.readyState !== 0) {
                try {
                    await disconnectTestDB();
                    console.log("MongoDB connection closed.");
                } catch (disconnectError) {
                    console.error(
                        "MongoDB disconnection failed:",
                        disconnectError.message
                    );

                    process.exitCode = 1;
                }
            }
        }
    }
};

runTest();
