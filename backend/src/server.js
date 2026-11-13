
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import helmet from "helmet";
import cors from "cors";

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
    })
);

// Middleware
app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "GradTrack Backend is running!"
    });
});

// Handle Not Found Routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handler
app.use((error, req, res, next) => {

    // If response was already sent
    if (res.headersSent) {
        return next(error);
    }

    let statusCode = 500;
    let message = "Internal Server Error";
    let errors;

    // 1. MongoDB Duplicate Key Error
    if (error.code === 11000) {
        statusCode = 409;
        message = "This value already exists.";

        const duplicatedFields = Object.keys(error.keyPattern || {});

        if (duplicatedFields.length > 0) {
            errors = duplicatedFields.map((field) => ({
                field,
                message: `${field} already exists.`
            }));
        }
    }

    // 2. Mongoose Validation Error
    else if (error.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed.";

        errors = Object.values(error.errors || {}).map((item) => ({
            field: item.path,
            message: item.message
        }));
    }

    // 3. Mongoose Cast Error
    else if (error.name === "CastError") {
        statusCode = 400;
        message = "Invalid data format.";
    }

    // 4. Zod Validation Error
    else if (
        error.name === "ZodError" ||
        Array.isArray(error.issues)
    ) {
        statusCode = 400;
        message = "Validation failed.";

        errors = error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
        }));
    }

    // 5. Errors with explicit status code
    else if (error.statusCode || error.status) {
        const providedStatus = error.statusCode || error.status;

        if (
            Number.isInteger(providedStatus) &&
            providedStatus >= 400 &&
            providedStatus <= 599
        ) {
            statusCode = providedStatus;

            message = statusCode < 500
                ? error.message
                : "Internal Server Error";
        }
    }

    // Log unexpected server errors
    if (statusCode >= 500) {
        console.error("Server Error:", error);
    }

    const response = {
        success: false,
        message
    };

    if (errors && errors.length > 0) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
