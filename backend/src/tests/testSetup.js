
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const connectTestDB = async () => {
    const testURI = process.env.TEST_MONGO_URI;

    if (!testURI) {
        throw new Error("TEST_MONGO_URI is not configured.");
    }

    if (!testURI.includes("/gradtrack_test")) {
        throw new Error(
            "Tests can only run against gradtrack_test database."
        );
    }

    await mongoose.connect(testURI);

    if (mongoose.connection.name !== "gradtrack_test") {
        await mongoose.disconnect();
        throw new Error("Connected to an unexpected database.");
    }

    console.log("Test database connected successfully.");
};

export const clearTestDB = async () => {
    if (mongoose.connection.name !== "gradtrack_test") {
        throw new Error("Refusing to clear a non-test database.");
    }

    const collections = mongoose.connection.collections;

    for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
    }
};

export const disconnectTestDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};
