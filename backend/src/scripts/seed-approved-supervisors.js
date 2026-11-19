
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import ApprovedSupervisor from "../models/approvedSupervisor.model.js";
import approvedStaffIds from "../data/approved-supervisors.js";

const seedApprovedSupervisors = async () => {
    try {
        await connectDB();

        const operations = approvedStaffIds.map((staffId) => ({
            updateOne: {
                filter: {
                    staffId: staffId.trim().toUpperCase()
                },
                update: {
                    $setOnInsert: {
                        staffId: staffId.trim().toUpperCase(),
                        isUsed: false,
                        usedBy: null,
                        usedAt: null
                    }
                },
                upsert: true
            }
        }));

        const result = await ApprovedSupervisor.bulkWrite(operations);

        console.log("Approved Supervisors Seed Completed!");
        console.log("Inserted:", result.upsertedCount);
        console.log("Already existed:", result.matchedCount);

    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
        console.log("MongoDB connection closed.");
    }
};

seedApprovedSupervisors();
