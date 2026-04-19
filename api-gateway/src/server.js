require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Service URLs (injected by docker-compose) ─────────────────
const AUTH_SERVICE    = process.env.AUTH_SERVICE_URL    || "http://localhost:5001";
const PROFILE_SERVICE = process.env.PROFILE_SERVICE_URL || "http://localhost:5002";

// ─── Global Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(morgan("dev")); // logs every request: METHOD /path STATUS ms

// ─── Rate Limiters ────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: (req, res) => {
    const retryAfterSeconds = req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 900;
    res.status(429).json({ 
      success: false, 
      message: 'Too many requests from this IP address.',
      retryAfterSeconds: retryAfterSeconds,
      retryAt: new Date(req.rateLimit.resetTime || Date.now() + 15 * 60 * 1000).toISOString(),
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    const retryAfterSeconds = req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 900;
    res.status(429).json({ 
      success: false, 
      message: 'Too many authentication attempts.',
      retryAfterSeconds: retryAfterSeconds,
      retryAt: new Date(req.rateLimit.resetTime || Date.now() + 15 * 60 * 1000).toISOString(),
    });
  },
});

app.use(globalLimiter);

// ─── JWT Auth Middleware ───────────────────────────────────────
// Attach this to any route that requires a logged-in user.
// It reads the Bearer token, verifies it, and puts the payload
// on req.user so downstream services can trust it.
const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers["x-user-id"] = decoded.id;
    req.headers["x-user-role"] = decoded.role || "user";
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      auth:    AUTH_SERVICE,
      profile: PROFILE_SERVICE,
    },
  });
});

// ─── Proxy: Auth Service (public routes, no auth required) ────
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/refresh-token
// POST /api/auth/forgot-password
// PATCH /api/auth/reset-password/:token
app.use(
  "/api/auth",
  authLimiter,
  createProxyMiddleware({
    target: AUTH_SERVICE,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Gateway] Auth service error:", err.message);
        res.status(502).json({ success: false, message: "Auth service unavailable." });
      },
    },
  })
);

// ─── Proxy: Profile Service (protected routes) ────────────────
// All /api/profile routes require a valid JWT.
// The gateway verifies the token here so profile-service
// doesn't need to — it just trusts x-user-id header.
app.use(
  "/api/profile",
  requireAuth,
  createProxyMiddleware({
    target: PROFILE_SERVICE,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Gateway] Profile service error:", err.message);
        res.status(502).json({ success: false, message: "Profile service unavailable." });
      },
    },
  })
);

// Public static files (avatars) served by profile-service
app.use(
  "/uploads",
  createProxyMiddleware({
    target: PROFILE_SERVICE,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Gateway] Profile uploads proxy error:", err.message);
        res.status(502).json({ success: false, message: "Profile service unavailable." });
      },
    },
  })
);

// ─── 404 for unknown routes ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Auth Service:    ${AUTH_SERVICE}`);
  console.log(`Profile Service: ${PROFILE_SERVICE}`);
});
