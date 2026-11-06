import { z } from "zod";

// Login Validation
export const loginSchema = z.object({
    identifier: z.string().trim().min(1, "Identifier is required"),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["student", "supervisor"])
});

// Register Validation
export const registerSchema = z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.email("Invalid email address").optional().or(z.literal("")),
    universityId: z.string().trim().optional(),
    staffId: z.string().trim().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
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
});