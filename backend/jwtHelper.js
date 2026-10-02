const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "educonnect-super-secure-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

/**
 * Generate a cryptographically signed JWT token for a user
 * @param {Object} user - User object containing user_id, email, full_name, role
 * @returns {string} - Signed JWT token string
 */
function generateToken(user) {
    const payload = {
        userId: user.user_id || user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        issuer: "KL-EduConnect-Auth-Service",
        issuedAt: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token string
 * @param {string} token
 * @returns {Object} - Decoded payload
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware to verify JWT token in Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authorization header missing or invalid. Format: 'Bearer <token>'"
        });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired JWT token: " + err.message
        });
    }
}

/**
 * Role-Based Access Control (RBAC) middleware generator
 * @param {string[]} allowedRoles - List of permitted roles (e.g. ['admin', 'faculty'])
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: "Access denied. Authentication required." });
        }

        const role = req.user.role.toLowerCase();
        const allowed = allowedRoles.map(r => r.toLowerCase());

        if (!allowed.includes(role)) {
            return res.status(403).json({
                error: `Access denied. Role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(", ")}`
            });
        }

        next();
    };
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    generateToken,
    verifyToken,
    authMiddleware,
    requireRole
};
