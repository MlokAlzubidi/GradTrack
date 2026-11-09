import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

const runTest = async () => {
    try {
        await connectDB();

        const collection = mongoose.connection.collection("connection_tests");

        const testDocument = {
            message: "GradTrack database test",
            createdAt: new Date()
        };

        const insertResult = await collection.insertOne(testDocument);
        console.log("Document inserted:", insertResult.insertedId);

        const savedDocument = await collection.findOne({
            _id: insertResult.insertedId
        });

        console.log(
            "Document retrieved:",
            savedDocument ? "SUCCESS" : "FAILED"
        );

        const deleteResult = await collection.deleteOne({
            _id: insertResult.insertedId
        });

        console.log(
            "Document deleted:",
            deleteResult.deletedCount === 1 ? "SUCCESS" : "FAILED"
        );

    } catch (error) {
        console.error("Database test failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        console.log("MongoDB connection closed.");
    }
};

runTest();