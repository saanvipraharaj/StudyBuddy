const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const pool = require("../config/db");

const {
    sendPasswordResetEmail
} = require("../services/emailService");


// ============================================
// CREATE JWT
// ============================================

const createToken = (user) => {

    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};


// ============================================
// REGISTER
// ============================================

const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            course,
            college,
            study_hours_per_day
        } = req.body;


        // ========================================
        // VALIDATION
        // ========================================

        if (
            !name ||
            !email ||
            !password
        ) {

            return res
                .status(400)
                .json({
                    status: "error",
                    message:
                        "Name, email and password are required"
                });
        }


        if (
            password.length < 8
        ) {

            return res
                .status(400)
                .json({
                    status: "error",
                    message:
                        "Password must be at least 8 characters"
                });
        }


        const normalizedEmail =
            email
                .trim()
                .toLowerCase();


        const trimmedName =
            name.trim();


        if (!trimmedName) {

            return res
                .status(400)
                .json({
                    status: "error",
                    message:
                        "Name is required"
                });
        }


        // ========================================
        // CHECK EXISTING USER
        // ========================================

        const existingUser =
            await pool.query(
                `SELECT
                    id,
                    auth_provider
                 FROM users
                 WHERE email = $1`,
                [
                    normalizedEmail
                ]
            );


        if (
            existingUser.rows.length >
            0
        ) {

            const existing =
                existingUser.rows[0];


            // ====================================
            // EXISTING GOOGLE ACCOUNT
            // ====================================

            if (
                existing.auth_provider ===
                "google"
            ) {

                return res
                    .status(409)
                    .json({
                        status: "error",

                        message:
                            "An account with this email already exists. Please continue with Google."
                    });
            }


            // ====================================
            // EXISTING EMAIL ACCOUNT
            // ====================================

            return res
                .status(409)
                .json({
                    status: "error",

                    message:
                        "An account with this email already exists. Please log in."
                });
        }


        // ========================================
        // HASH PASSWORD
        // ========================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        // ========================================
        // CREATE USER
        //
        // Email verification is disabled.
        // Local users are immediately active.
        // ========================================

        const result =
            await pool.query(
                `INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    course,
                    college,
                    study_hours_per_day,
                    auth_provider,
                    email_verified,
                    verification_token,
                    account_status
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    'local',
                    TRUE,
                    NULL,
                    'active'
                )
                RETURNING
                    id,
                    name,
                    email,
                    course,
                    college,
                    study_hours_per_day,
                    auth_provider,
                    email_verified,
                    account_status,
                    created_at`,
                [
                    trimmedName,
                    normalizedEmail,
                    passwordHash,
                    course || null,
                    college || null,
                    study_hours_per_day || null
                ]
            );


        const user =
            result.rows[0];


        // ========================================
        // ACCOUNT CREATED
        // ========================================

        return res
            .status(201)
            .json({
                status: "success",

                message:
                    "Account created successfully. You can now log in.",

                user
            });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return res
            .status(500)
            .json({
                status: "error",
                message:
                    "Unable to create account"
            });
    }
};


// ============================================
// VERIFY EMAIL
//
// Email verification is currently disabled.
// This function remains exported so the
// existing route does not break.
// ============================================

const verifyEmail =
    async (
        req,
        res
    ) => {

        return res
            .status(200)
            .json({
                status: "success",

                message:
                    "Email verification is not required."
            });
    };


// ============================================
// LOGIN
// ============================================

const loginUser =
    async (
        req,
        res
    ) => {

        try {

            const {
                email,
                password
            } =
                req.body;


            // ====================================
            // VALIDATION
            // ====================================

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "Email and password are required"
                    });
            }


            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            // ====================================
            // FIND USER
            // ====================================

            const result =
                await pool.query(
                    `SELECT *
                     FROM users
                     WHERE email = $1`,
                    [
                        normalizedEmail
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {

                return res
                    .status(401)
                    .json({
                        status: "error",

                        message:
                            "Invalid email or password"
                    });
            }


            const user =
                result.rows[0];


            // ====================================
            // ACCOUNT STATUS
            // ====================================

            if (
                user.account_status !==
                "active"
            ) {

                return res
                    .status(403)
                    .json({
                        status: "error",

                        message:
                            "This account is not active"
                    });
            }


            // ====================================
            // GOOGLE-ONLY ACCOUNT
            // ====================================

            if (
                user.auth_provider ===
                "google" &&
                !user.password_hash
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "This account uses Google login. Please continue with Google."
                    });
            }


            // ====================================
            // PASSWORD MUST EXIST
            // ====================================

            if (
                !user.password_hash
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "This account does not have a password. Please use Google login."
                    });
            }


            // ====================================
            // CHECK PASSWORD
            // ====================================

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );


            if (
                !passwordMatch
            ) {

                return res
                    .status(401)
                    .json({
                        status: "error",

                        message:
                            "Invalid email or password"
                    });
            }


            // ====================================
            // CREATE JWT
            // ====================================

            const token =
                createToken(
                    user
                );


            // ====================================
            // REMOVE PRIVATE FIELDS
            // ====================================

            delete user.password_hash;
            delete user.reset_token;
            delete user.reset_token_expires;
            delete user.verification_token;


            // ====================================
            // SUCCESS
            // ====================================

            return res
                .status(200)
                .json({
                    status: "success",

                    message:
                        "Login successful",

                    token,

                    user
                });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            return res
                .status(500)
                .json({
                    status: "error",

                    message:
                        "Unable to login"
                });
        }
    };


// ============================================
// GET CURRENT USER
// ============================================

const getCurrentUser =
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(
                    `SELECT
                        id,
                        name,
                        email,
                        course,
                        college,
                        study_hours_per_day,
                        auth_provider,
                        email_verified,
                        account_status,
                        created_at,
                        updated_at
                     FROM users
                     WHERE id = $1`,
                    [
                        req.user.userId
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        status: "error",

                        message:
                            "User not found"
                    });
            }


            return res
                .status(200)
                .json({
                    status: "success",

                    user:
                        result.rows[0]
                });


        } catch (error) {

            console.error(
                "Get current user error:",
                error
            );


            return res
                .status(500)
                .json({
                    status: "error",

                    message:
                        "Unable to retrieve user"
                });
        }
    };


// ============================================
// FORGOT PASSWORD
// ============================================

const forgotPassword =
    async (
        req,
        res
    ) => {

        try {

            const {
                email
            } =
                req.body;


            if (!email) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "Email is required"
                    });
            }


            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            const result =
                await pool.query(
                    `SELECT
                        id,
                        email,
                        auth_provider
                     FROM users
                     WHERE email = $1`,
                    [
                        normalizedEmail
                    ]
                );


            // ====================================
            // DON'T REVEAL WHETHER ACCOUNT EXISTS
            // ====================================

            if (
                result.rows.length ===
                0
            ) {

                return res
                    .status(200)
                    .json({
                        status: "success",

                        message:
                            "If an account exists for this email, password reset instructions will be sent."
                    });
            }


            const user =
                result.rows[0];


            // ====================================
            // GOOGLE ACCOUNT
            // ====================================

            if (
                user.auth_provider ===
                "google"
            ) {

                return res
                    .status(200)
                    .json({
                        status: "success",

                        message:
                            "If this account supports password login, password reset instructions will be sent."
                    });
            }


            // ====================================
            // CREATE RESET TOKEN
            // ====================================

            const resetToken =
                crypto
                    .randomBytes(32)
                    .toString("hex");


            const expires =
                new Date(
                    Date.now() +
                    15 *
                    60 *
                    1000
                );


            await pool.query(
                `UPDATE users
                 SET
                    reset_token = $1,
                    reset_token_expires = $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [
                    resetToken,
                    expires,
                    user.id
                ]
            );


            // ====================================
            // CREATE RESET URL
            // ====================================

            const frontendUrl =
                process.env.FRONTEND_URL ||
                "http://localhost:5173";


            const resetUrl =
                `${frontendUrl}/reset-password/${resetToken}`;


            // ====================================
            // SEND RESET EMAIL
            //
            // NOTE:
            // This still requires a working
            // email provider / verified Resend
            // domain for users other than you.
            // ====================================

            try {

                await sendPasswordResetEmail(
                    user.email,
                    resetUrl
                );

            } catch (emailError) {

                console.error(
                    "Password reset email error:",
                    emailError
                );


                await pool.query(
                    `UPDATE users
                     SET
                        reset_token = NULL,
                        reset_token_expires = NULL,
                        updated_at = NOW()
                     WHERE id = $1`,
                    [
                        user.id
                    ]
                );


                return res
                    .status(500)
                    .json({
                        status: "error",

                        message:
                            "Password reset email is currently unavailable. Please try again later."
                    });
            }


            return res
                .status(200)
                .json({
                    status: "success",

                    message:
                        "Password reset instructions have been sent to your email."
                });


        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );


            return res
                .status(500)
                .json({
                    status: "error",

                    message:
                        "Unable to process password reset"
                });
        }
    };


// ============================================
// RESET PASSWORD
// ============================================

const resetPassword =
    async (
        req,
        res
    ) => {

        try {

            const {
                token,
                new_password
            } =
                req.body;


            if (
                !token ||
                !new_password
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "Reset token and new password are required"
                    });
            }


            if (
                new_password.length <
                8
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "Password must be at least 8 characters"
                    });
            }


            const result =
                await pool.query(
                    `SELECT id
                     FROM users
                     WHERE reset_token = $1
                     AND reset_token_expires > NOW()`,
                    [
                        token
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",

                        message:
                            "Invalid or expired reset token"
                    });
            }


            const passwordHash =
                await bcrypt.hash(
                    new_password,
                    12
                );


            await pool.query(
                `UPDATE users
                 SET
                    password_hash = $1,
                    reset_token = NULL,
                    reset_token_expires = NULL,
                    updated_at = NOW()
                 WHERE id = $2`,
                [
                    passwordHash,
                    result.rows[0].id
                ]
            );


            return res
                .status(200)
                .json({
                    status: "success",

                    message:
                        "Password reset successfully. You can now log in."
                });


        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );


            return res
                .status(500)
                .json({
                    status: "error",

                    message:
                        "Unable to reset password"
                });
        }
    };


// ============================================
// LOGOUT
// ============================================

const logoutUser =
    async (
        req,
        res
    ) => {

        return res
            .status(200)
            .json({
                status: "success",

                message:
                    "Logged out successfully"
            });
    };


// ============================================
// GOOGLE LOGIN SUCCESS
// ============================================

const googleLoginSuccess =
    async (
        req,
        res
    ) => {

        try {

            const user =
                req.user;


            // ====================================
            // USER NOT FOUND
            // ====================================

            if (!user) {

                const frontendUrl =
                    process.env.FRONTEND_URL ||
                    "http://localhost:5173";


                return res.redirect(
                    `${frontendUrl}/?google_error=authentication_failed`
                );
            }


            // ====================================
            // ACCOUNT STATUS
            // ====================================

            if (
                user.account_status &&
                user.account_status !==
                "active"
            ) {

                const frontendUrl =
                    process.env.FRONTEND_URL ||
                    "http://localhost:5173";


                return res.redirect(
                    `${frontendUrl}/?google_error=account_inactive`
                );
            }


            // ====================================
            // CREATE JWT
            // ====================================

            const token =
                createToken(
                    user
                );


            // ====================================
            // DETERMINE SETUP STATUS
            // ====================================

            const setupCompleted =
                Boolean(
                    user.course &&
                    user.college &&
                    user.study_hours_per_day
                );


            // ====================================
            // FRONTEND URL
            // ====================================

            const frontendUrl =
                process.env.FRONTEND_URL ||
                "http://localhost:5173";


            // ====================================
            // QUERY PARAMETERS
            // ====================================

            const params =
                new URLSearchParams({

                    google_auth:
                        "success",

                    token,

                    id:
                        String(
                            user.id
                        ),

                    name:
                        user.name ||
                        "",

                    email:
                        user.email ||
                        "",

                    setup_completed:
                        String(
                            setupCompleted
                        )
                });


            // ====================================
            // ROOT REDIRECT FOR VERCEL
            // ====================================

            return res.redirect(
                `${frontendUrl}/?${params.toString()}`
            );


        } catch (error) {

            console.error(
                "Google login callback error:",
                error
            );


            const frontendUrl =
                process.env.FRONTEND_URL ||
                "http://localhost:5173";


            return res.redirect(
                `${frontendUrl}/?google_error=server_error`
            );
        }
    };


// ============================================
// EXPORT
// ============================================

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    logoutUser,
    googleLoginSuccess
};