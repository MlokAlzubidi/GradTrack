
import { z } from "zod";
import { passwordSchema } from "./auth.validator.js";

// Update Profile Validation

export const updateProfileSchema = z.object({
    fullName: z.string()
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name cannot exceed 100 characters")
        .optional(),

    email: z.union([
        z.email("Invalid email address").max(254, "Email cannot exceed 254 characters"),
        z.literal("")
    ]).optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field must be provided for update"
    }
);


// Change Password Validation
export const changePasswordSchema = z.object({
    currentPassword: passwordSchema,

    newPassword: passwordSchema
        .refine(
            (password) => password.length >= 8,
            "New password must be at least 8 characters"
        )
}).strict();
