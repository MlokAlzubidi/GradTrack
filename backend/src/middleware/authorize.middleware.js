// Authorize users based on their roles
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        // 1. Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        // 2. Check if user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission."
            });
        }

        // 3. Allow access
        next();
    };
};