
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
  source: {
    type: String,
    enum: ["user", "system"],
    required: true,
    validate: {
        validator: function (value) {
            if (value === "user") {
                return this.sender != null;
            }

            if (value === "system") {
                return this.sender == null;
            }

            return false;
        },
        message: "Sender must match notification source."
    }
},

        type: {
            type: String,
            enum: [
                "task_created",
                "task_assigned",
                "task_updated",
                "task_completed",
                "submission_uploaded",
                "submission_reviewed",
                "submission_rejected",
                "team_created",
                "team_member_joined",
                "team_member_removed",
                "general"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        relatedEntity: {
            model: {
                type: String,
                enum: ["Task", "Submission", "Team"],
                default: null
            },

            id: {
                type: mongoose.Schema.Types.ObjectId,
                default: null
            }
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    recipient: 1,
    createdAt: -1
});

notificationSchema.index({
    recipient: 1,
    isRead: 1
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;
