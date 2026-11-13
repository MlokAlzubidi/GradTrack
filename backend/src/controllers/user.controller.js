
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

// Get the currently authenticated user's profile
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
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
        const { fullName, email } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Update allowed fields only
        if (fullName !== undefined) {
            user.fullName = fullName;
        }

        if (email !== undefined) {
            if (email.trim() === "") {
                user.email = undefined;
            } else {
                user.email = email.trim().toLowerCase();
            }
        }

        // Save changes with Mongoose validation
        await user.save();

        const userResponse = await User.findById(user._id).select(
            "fullName email universityId staffId role isActive createdAt"
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: userResponse
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Invalid profile data."
            });
        }

        console.error("Update profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update user profile."
        });
    }
};


// Change the currently authenticated user's password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.userId).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // Prevent using the same password
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password."
            });
        }

        // Update password and invalidate old tokens
        user.password = newPassword;
        user.tokenVersion += 1;

        await user.save();

        // Generate a new token for the current session
        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
            token
        });

    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to change user password."
        });
    }
};
