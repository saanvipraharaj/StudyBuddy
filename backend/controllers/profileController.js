const pool = require("../config/db");


// ============================================
// GET PROFILE
// ============================================

const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                email,
                course,
                college,
                study_hours_per_day,
                email_verified,
                auth_provider,
                account_status,
                created_at,
                updated_at
             FROM users
             WHERE id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to fetch profile"
        });
    }
};


// ============================================
// UPDATE PROFILE
// ============================================

const updateProfile = async (req, res) => {
    try {
        const {
            name,
            course,
            college,
            study_hours_per_day
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Name is required"
            });
        }

        let studyHours = null;

        if (
            study_hours_per_day !== undefined &&
            study_hours_per_day !== null &&
            study_hours_per_day !== ""
        ) {
            studyHours = Number(study_hours_per_day);

            if (
                Number.isNaN(studyHours) ||
                studyHours < 0 ||
                studyHours > 24
            ) {
                return res.status(400).json({
                    status: "error",
                    message:
                        "Study hours must be between 0 and 24"
                });
            }
        }

        const result = await pool.query(
            `UPDATE users
             SET
                name = $1,
                course = $2,
                college = $3,
                study_hours_per_day = $4,
                updated_at = NOW()
             WHERE id = $5
             RETURNING
                id,
                name,
                email,
                course,
                college,
                study_hours_per_day,
                email_verified,
                auth_provider,
                account_status,
                created_at,
                updated_at`,
            [
                name.trim(),
                course?.trim() || null,
                college?.trim() || null,
                studyHours,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Update profile error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to update profile"
        });
    }
};


module.exports = {
    getProfile,
    updateProfile
};