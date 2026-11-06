
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

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

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
