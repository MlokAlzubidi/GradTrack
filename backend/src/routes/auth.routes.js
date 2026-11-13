
import express from "express";

import {
    register,
    login,
    logout
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import {
    loginLimiter,
    registerLimiter
} from "../middleware/rateLimit.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
    loginSchema,
    registerSchema
} from "../validators/auth.validator.js";

const router = express.Router();

// Register
router.post(
    "/register",
    registerLimiter,
    validate(registerSchema),
    register
);

// Login
router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    login
);

// Logout
router.post(
    "/logout",
    protect,
    logout
);

export default router;
