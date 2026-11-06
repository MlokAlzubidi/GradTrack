import { z } from "zod";

// Update Profile Validation
export const updateProfileSchema = z.object({
    fullName: z.string()
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .optional(),

    email: z.union([
        z.email("Invalid email address"),
        z.literal("")
    ]).optional()
}).strict();

// Change Password Validation
export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, "Current password is required"),

    newPassword: z.string()
        .min(8, "New password must be at least 8 characters")
}).strict();