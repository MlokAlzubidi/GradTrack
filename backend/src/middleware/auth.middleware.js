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

        // 3. Check if token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // 4. Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // 5. Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 6. Find user in database
        const user = await User.findById(decoded.userId);

        // 7. Check if user exists and is active
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account is inactive or no longer exists."
            });
        }

        // 8. Verify role consistency
        if (user.role !== decoded.role) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // 9. Verify token version
if (decoded.tokenVersion !== user.tokenVersion) {
    return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
    });
}

        // 10. Attach authenticated user to request
        req.user = {
            userId: user._id.toString(),
            role: user.role,
            fullName: user.fullName
        };

        // 10. Continue to next middleware
        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please login again."
            });
        }

        if (error.name === "JsonWebTokenError" ||
            error.name === "CastError") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        console.error("Authentication error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};