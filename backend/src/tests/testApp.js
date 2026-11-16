
import express from "express";
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";

const createTestApp = () => {
    const app = express();

    app.use(express.json({ limit: "10kb" }));

    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);

    return app;
};

export default createTestApp;
