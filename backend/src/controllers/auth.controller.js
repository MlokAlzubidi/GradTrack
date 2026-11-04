
import mongoose from "mongoose";
import User from "../models/user.model.js";
import ApprovedSupervisor from "../models/approvedSupervisor.model.js";
import jwt from "jsonwebtoken";

// Register a new user
export const register = async (req, res) => {
    let session;

    try {
        const {
            fullName,
            email,
            universityId,
            staffId,
            password,
            role
        } = req.body ?? {};

        // 1. Validate required fields
        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            typeof password !== "string" ||
            !password ||
            typeof role !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name, password and role are required."
            });
        }

        // 2. Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        // 3. Validate role
        if (!["student", "supervisor"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });
        }

        // 4. Validate email type
        if (email !== undefined && typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email must be a string."
            });
        }

        // 5. Validate Student ID
        if (
            role === "student" &&
            (typeof universityId !== "string" || !universityId.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "University ID is required."
            });
        }

        // 6. Validate Supervisor ID
        if (
            role === "supervisor" &&
            (typeof staffId !== "string" || !staffId.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required."
            });
        }

        // 7. Prepare user data
        const userData = {
            fullName: fullName.trim(),
            password,
            role
        };

        if (email?.trim()) {
            userData.email = email.trim().toLowerCase();
        }

        if (role === "student") {
            userData.universityId = universityId.trim();
        } else {
            userData.staffId = staffId.trim().toUpperCase();
        }

        let newUser;

        // 8. Student registration
        if (role === "student") {
            newUser = await User.create(userData);
        }

        // 9. Supervisor registration
        else {
            session = await mongoose.startSession();

            await session.withTransaction(async () => {

                // Find and reserve an approved Staff ID
                const approvedSupervisor =
                    await ApprovedSupervisor.findOneAndUpdate(
                        {
                            staffId: staffId.trim().toUpperCase(),
                            isUsed: false
                        },
                        {
                            $set: {
                                isUsed: true,
                                usedAt: new Date()
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                // Reject unapproved or already used IDs
                if (!approvedSupervisor) {
                    const error = new Error(
                        "Staff ID is not approved or has already been used."
                    );

                    error.statusCode = 403;
                    throw error;
                }

                // Create supervisor account
                newUser = new User(userData);
                await newUser.save({ session });

                // Link approved Staff ID to the new account
                await ApprovedSupervisor.updateOne(
                    { _id: approvedSupervisor._id },
                    {
                        $set: {
                            usedBy: newUser._id
                        }
                    },
                    { session }
                );
            });
        }

        // 10. Prepare safe response
        const userResponse = newUser.toObject();

        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: userResponse
        });

    } catch (error) {

        // Handle duplicate IDs or email
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This ID or email is already registered."
            });
        }

        // Handle validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Registration failed. Please try again."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

// Login an existing user
export const login = async (req, res) => {
    try {
        const { identifier, password, role } = req.body ?? {};

        // 1. Validate required fields
        if (
            typeof identifier !== "string" ||
            !identifier.trim() ||
            typeof password !== "string" ||
            !password ||
            typeof role !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Identifier, password and role are required."
            });
        }

        // 2. Validate role
        if (!["student", "supervisor"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role."
            });
        }

        // 3. Determine the login identifier
        const searchField =
            role === "student" ? "universityId" : "staffId";

        const normalizedIdentifier =
            role === "supervisor"
                ? identifier.trim().toUpperCase()
                : identifier.trim();

        // 4. Find the user
        const user = await User.findOne({
            [searchField]: normalizedIdentifier,
            role
        }).select("+password");

        // 5. Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // 6. Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive."
            });
        }

        // 7. Compare passwords
        const isPasswordCorrect =
            await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
}

        // 8. Generate JWT Token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        // 9. Prepare safe user response
        const userResponse = user.toObject();
        delete userResponse.password;

        // 10. Send response
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
};
