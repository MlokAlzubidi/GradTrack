
import mongoose from "mongoose";

import User from "../models/user.model.js";
import ApprovedSupervisor from "../models/approvedSupervisor.model.js";
import generateToken from "../utils/generateToken.js";

// Prepare safe user response
const createUserResponse = (user) => {
    const userResponse = user.toObject();

    delete userResponse.password;
    delete userResponse.tokenVersion;
    delete userResponse.isActive;
    delete userResponse.__v;

    return userResponse;
};

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
        } = req.body;

        const userData = {
            fullName: fullName.trim(),
            password,
            role
        };

        if (email?.trim()) {
            userData.email = email.trim().toLowerCase();
        }

        let newUser;

        // Student Registration
        if (role === "student") {
            userData.universityId = universityId.trim();

            newUser = await User.create(userData);
        }

        // Supervisor Registration
        else {
            userData.staffId = staffId.trim().toUpperCase();

            session = await mongoose.startSession();

            await session.withTransaction(async () => {
                // Reserve approved Staff ID
                const approvedSupervisor =
                    await ApprovedSupervisor.findOneAndUpdate(
                        {
                            staffId: userData.staffId,
                            isUsed: false
                        },
                        {
                            $set: {
                                isUsed: true,
                                usedAt: new Date()
                            }
                        },
                        {
                            returnDocument: "after",
                            session
                        }
                    );

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

                // Link approved Staff ID to supervisor
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

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: createUserResponse(newUser)
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This ID or email is already registered."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Invalid registration data.",
                errors: Object.values(error.errors).map((item) => ({
                    field: item.path,
                    message: item.message
                }))
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
        const { identifier, password, role } = req.body;

        const searchField =
            role === "student" ? "universityId" : "staffId";

        const normalizedIdentifier =
            role === "supervisor"
                ? identifier.trim().toUpperCase()
                : identifier.trim();

        const user = await User.findOne({
            [searchField]: normalizedIdentifier,
            role
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Verify password before checking account status
        const isPasswordCorrect =
            await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Check account status after password verification
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: createUserResponse(user)
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
};


// Logout from all devices
export const logout = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $inc: { tokenVersion: 1 }
            },
            {
                returnDocument: "after"
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices successfully."
        });

    } catch (error) {
        console.error("Logout error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Logout failed. Please try again."
        });
    }
};
