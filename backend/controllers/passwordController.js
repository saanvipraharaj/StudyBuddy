const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
    sendPasswordResetEmail
} = require("../services/emailService");


// ============================================
// FORGOT PASSWORD
// ============================================

const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "error",
                message: "Email is required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, email
             FROM users
             WHERE LOWER(email) = $1`,
            [normalizedEmail]
        );

        // Don't reveal whether account exists
        if (result.rows.length === 0) {
            return res.json({
                status: "success",
                message:
                    "A password reset link has been sent to your email."
            });
        }

        const user = result.rows[0];

        // Generate secure token
        const resetToken =
            crypto.randomBytes(32).toString("hex");

        // Token expires after 15 minutes
        const expiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await pool.query(
            `UPDATE users
             SET reset_token = $1,
                 reset_token_expires = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [
                resetToken,
                expiresAt,
                user.id
            ]
        );

        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Send actual email
        await sendPasswordResetEmail(
            user.email,
            resetUrl
        );

        console.log(
            `Password reset email sent to ${user.email}`
        );

        res.json({
            status: "success",
            message:
                "A password reset link has been sent to your email."
        });

    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        res.status(500).json({
            status: "error",
            message:
                "Unable to send password reset email. Please try again later."
        });
    }
};


// ============================================
// RESET PASSWORD
// ============================================

const resetPassword = async (req, res) => {
    try {

        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({
                status: "error",
                message: "Reset token is required"
            });
        }

        if (!password) {
            return res.status(400).json({
                status: "error",
                message:
                    "New password is required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                status: "error",
                message:
                    "Password must be at least 8 characters long"
            });
        }

        const result = await pool.query(
            `SELECT id
             FROM users
             WHERE reset_token = $1
             AND reset_token_expires > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                status: "error",
                message:
                    "Invalid or expired reset token"
            });
        }

        const userId = result.rows[0].id;

        const passwordHash =
            await bcrypt.hash(password, 12);

        await pool.query(
            `UPDATE users
             SET password_hash = $1,
                 reset_token = NULL,
                 reset_token_expires = NULL,
                 updated_at = NOW()
             WHERE id = $2`,
            [
                passwordHash,
                userId
            ]
        );

        res.json({
            status: "success",
            message:
                "Password reset successfully. You can now log in."
        });

    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );

        res.status(500).json({
            status: "error",
            message:
                "Unable to reset password. Please try again later."
        });
    }
};


module.exports = {
    forgotPassword,
    resetPassword
};