const express =
    require("express");

const passport =
    require("../config/passport");

const {
    registerUser,
    verifyEmail,
    loginUser,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    logoutUser,
    googleLoginSuccess
} = require(
    "../controllers/authController"
);

const authMiddleware =
    require(
        "../middleware/authMiddleware"
    );

const router =
    express.Router();


// ============================================
// REGISTER
// ============================================

router.post(
    "/register",
    registerUser
);


// ============================================
// LOGIN
// ============================================

router.post(
    "/login",
    loginUser
);


// ============================================
// GOOGLE LOGIN
// ============================================

router.get(
    "/google",
    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ],
            session: false
        }
    )
);


// ============================================
// GOOGLE CALLBACK
// ============================================

router.get(
    "/google/callback",

    passport.authenticate(
        "google",
        {
            session: false,

            failureRedirect:
                `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?google_error=authentication_failed`
        }
    ),

    googleLoginSuccess
);


// ============================================
// VERIFY EMAIL
// ============================================

router.get(
    "/verify-email/:token",
    verifyEmail
);


// ============================================
// FORGOT PASSWORD
// ============================================

router.post(
    "/forgot-password",
    forgotPassword
);


// ============================================
// RESET PASSWORD
// ============================================

router.post(
    "/reset-password",
    resetPassword
);


// ============================================
// CURRENT USER
// ============================================

router.get(
    "/me",
    authMiddleware,
    getCurrentUser
);


// ============================================
// LOGOUT
// ============================================

router.post(
    "/logout",
    authMiddleware,
    logoutUser
);


module.exports =
    router;