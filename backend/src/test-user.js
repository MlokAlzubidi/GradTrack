
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/user.model.js";

const runTest = async () => {
    const testSuffix = Date.now().toString();

    const studentId = `TEST-STU-${testSuffix}`;
    const supervisorId = `TEST-STAFF-${testSuffix}`;

    try {
        // Connect to MongoDB
        await connectDB();

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
        console.log(
            "Password hashed:",
            student.password !== "Student123" ? "SUCCESS" : "FAILED"
        );

        // 3. Check password comparison
        const studentPasswordValid =
            await student.comparePassword("Student123");

        console.log(
            "Password comparison:",
            studentPasswordValid ? "SUCCESS" : "FAILED"
        );

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
        console.log(
            "Supervisor password hashed:",
            supervisor.password !== "Supervisor123" ? "SUCCESS" : "FAILED"
        );

        console.log("\n--- Testing Duplicate University ID ---");

        // 6. Try creating duplicate Student
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

        console.log(
            "Duplicate university ID rejected:",
            duplicateRejected ? "SUCCESS" : "FAILED"
        );

    } catch (error) {
        console.error("User Model Test Failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState === 1) {
            await User.deleteMany({
                $or: [
                    { role: "student", universityId: studentId },
                    { role: "supervisor", staffId: supervisorId }
                ]
            });

            console.log("\nTest data cleaned up.");

            await mongoose.disconnect();
            console.log("MongoDB connection closed.");
        }
    }
};

runTest();
