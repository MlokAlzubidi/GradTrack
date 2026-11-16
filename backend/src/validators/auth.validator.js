
import { z } from "zod";

// Shared password validation compatible with bcrypt
export const passwordSchema = z
    .string()
    .min(1, "Password is required")
    .refine(
        (password) => password.trim().length > 0,
        "Password cannot contain only spaces"
    )
    .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "Password cannot exceed 72 bytes"
    );

// Login Validation
export const loginSchema = z.object({
    identifier: z.string().min(1, "Identifier is required"),
    password: passwordSchema,
    role: z.enum(["student", "supervisor"])
}).strict().superRefine(({ identifier, role }, ctx) => {
    const isValidIdentifier = role === "student"
        ? /^\d{11}$/.test(identifier)
        : /^\d{5}$/.test(identifier);

    if (!isValidIdentifier) {
        ctx.addIssue({
            code: "custom",
            path: ["identifier"],
            message: role === "student"
                ? "University ID must contain exactly 11 digits"
                : "Staff ID must contain exactly 5 digits"
        });
    }
});

// Register Validation
export const registerSchema = z.object({
    fullName: z.string()
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name cannot exceed 100 characters"),

    email: z.union([
        z.email("Invalid email address").max(254, "Email cannot exceed 254 characters"),
        z.literal("")
    ]).optional(),

    universityId: z.string()
        .regex(/^\d{11}$/, "University ID must contain exactly 11 digits")
        .optional(),

    staffId: z.string()
        .regex(/^\d{5}$/, "Staff ID must contain exactly 5 digits")
        .optional(),

    password: passwordSchema.refine(
        (password) => password.length >= 8,
        "Password must be at least 8 characters"
    ),

    role: z.enum(["student", "supervisor"])
}).superRefine((data, ctx) => {
    if (data.role === "student" && !data.universityId) {
        ctx.addIssue({
            code: "custom",
            path: ["universityId"],
            message: "University ID is required for students"
        });
    }

    if (data.role === "supervisor" && !data.staffId) {
        ctx.addIssue({
            code: "custom",
            path: ["staffId"],
            message: "Staff ID is required for supervisors"
        });
    }
}).strict();
