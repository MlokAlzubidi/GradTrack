
import express from "express";
import {
    getMe,
    updateMe,
    changePassword
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import { changePasswordLimiter } from "../middleware/rateLimit.middleware.js";

import {
    updateProfileSchema,
    changePasswordSchema
} from "../validators/user.validator.js";

const router = express.Router();

// Get current user's profile
router.get("/me", protect, getMe);

// Update current user's profile
router.patch(
    "/me",
    protect,
    validate(updateProfileSchema),
    updateMe
);

// Change current user's password
router.patch(
    "/me/password",
    protect,
    changePasswordLimiter,
    validate(changePasswordSchema),
    changePassword
);

export default router;
