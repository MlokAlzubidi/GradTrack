import express from "express";
import {
    getMe,
    updateMe,
    changePassword
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get current user's profile
router.get("/me", protect, getMe);

router.patch("/me", protect, updateMe);

router.patch("/me/password", protect, changePassword);

export default router;