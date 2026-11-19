
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Protect routes and verify authenticated users
export const protect = async (req, res, next) => {
    try {
        // 1. Check JWT configuration
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Server configuration error."
            });
        }

        // 2. Get Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // 3. Extract token
        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // 4. Verify JWT using HS256 only
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // 5. Find user in database
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account is inactive or no longer exists."
            });
        }

        // 6. Verify role consistency
        if (user.role !== decoded.role) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // 7. Verify token version
        const currentTokenVersion = user.tokenVersion ?? 0;
        const tokenVersion = decoded.tokenVersion ?? 0;

        if (tokenVersion !== currentTokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }

        // 8. Attach authenticated user to request
        req.user = {
            userId: user._id.toString(),
            role: user.role,
            fullName: user.fullName
        };

        next();

    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "CastError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token."
            });
        }

        console.error("Authentication error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};
