import User from "../models/user.model.js";

// Get the currently authenticated user's profile
export const getMe = async (req, res) => {
    try {
        // 1. Get the user ID from the authenticated request
        const userId = req.user.userId;

        // 2. Find the user in MongoDB
        const user = await User.findById(userId).select(
            "fullName email universityId staffId role isActive createdAt"
        );

        // 3. Check if the user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // 4. Return the user's profile
        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully.",
            user
        });

    } catch (error) {
        console.error("Get profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile."
        });
    }
};




// Update the currently authenticated user's profile
export const updateMe = async (req, res) => {
    try {
        const allowedFields = ["fullName", "email"];

        // Reject fields that users are not allowed to update
        const invalidFields = Object.keys(req.body).filter(
            (field) => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You are not allowed to update these fields.",
                invalidFields
            });
        }

        const updates = {};

        // Validate and prepare fullName
        if (req.body.fullName !== undefined) {
            if (
                typeof req.body.fullName !== "string" ||
                !req.body.fullName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Full name must be a non-empty string."
                });
            }

            updates.fullName = req.body.fullName.trim();
        }

        // Validate and prepare email
        if (req.body.email !== undefined) {
            if (typeof req.body.email !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Email must be a string."
                });
            }

            const email = req.body.email.trim().toLowerCase();

            if (
                email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address."
                });
            }

            updates.email = email || undefined;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update."
            });
        }

        // Find and update the authenticated user
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        ).select(
            "fullName email universityId staffId role isActive createdAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        console.error("Update profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update user profile."
        });
    }
};


export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 1. Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }

        // 2. Validate new password length
        if (typeof newPassword !== "string" || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long."
            });
        }

        // 3. Find the authenticated user and explicitly include password
        const user = await User.findById(req.user.userId).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // 4. Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // 5. Prevent using the same password
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password."
            });
        }

        // 6. Update password and save
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to change password."
        });
    }
};
