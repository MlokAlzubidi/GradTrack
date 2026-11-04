
import mongoose from "mongoose";

const approvedSupervisorSchema = new mongoose.Schema(
    {
        staffId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        isUsed: {
            type: Boolean,
            default: false
        },

        usedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        usedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const ApprovedSupervisor = mongoose.model(
    "ApprovedSupervisor",
    approvedSupervisorSchema
);

export default ApprovedSupervisor;
