import express from "express";
import {
    register,
    login,
    logout
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

import { authorizeRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);



// Test protected route
router.get("/me", protect, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authentication successful.",
        user: req.user
    });
});


// Student-only test route
router.get(
    "/student-test",
    protect,
    authorizeRoles("student"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Student access granted.",
            user: req.user
        });
    }
);

// Supervisor-only test route
router.get(
    "/supervisor-test",
    protect,
    authorizeRoles("supervisor"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Supervisor access granted.",
            user: req.user
        });
    }
);

export default router;