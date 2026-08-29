const pool = require("../config/db");

// ============================================
// GET SETUP PROFILE
// ============================================

const getSetupProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                user_id,
                current_semester,
                academic_year,
                preferred_study_time,
                preferred_session_minutes,
                study_days_per_week,
                exam_date,
                learning_goal,
                difficulty_preference,
                setup_completed,
                created_at,
                updated_at
             FROM student_profiles
             WHERE user_id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                status: "success",
                profile: null
            });
        }

        res.status(200).json({
            status: "success",
            profile: result.rows[0]
        });

    } catch (error) {
        console.error("Get setup profile error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to fetch setup profile"
        });
    }
};


// ============================================
// CREATE OR UPDATE SETUP PROFILE
// ============================================

const saveSetupProfile = async (req, res) => {
    try {
        const {
            current_semester,
            academic_year,
            preferred_study_time,
            preferred_session_minutes,
            study_days_per_week,
            exam_date,
            learning_goal,
            difficulty_preference,
            setup_completed
        } = req.body;

        if (
            preferred_session_minutes !== undefined &&
            preferred_session_minutes !== null &&
            (
                Number(preferred_session_minutes) <= 0 ||
                Number(preferred_session_minutes) > 480
            )
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Study session duration must be between 1 and 480 minutes"
            });
        }

        if (
            study_days_per_week !== undefined &&
            study_days_per_week !== null &&
            (
                Number(study_days_per_week) < 1 ||
                Number(study_days_per_week) > 7
            )
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Study days per week must be between 1 and 7"
            });
        }

        const result = await pool.query(
            `INSERT INTO student_profiles
            (
                user_id,
                current_semester,
                academic_year,
                preferred_study_time,
                preferred_session_minutes,
                study_days_per_week,
                exam_date,
                learning_goal,
                difficulty_preference,
                setup_completed
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
            )

            ON CONFLICT (user_id)

            DO UPDATE SET
                current_semester = EXCLUDED.current_semester,
                academic_year = EXCLUDED.academic_year,
                preferred_study_time = EXCLUDED.preferred_study_time,
                preferred_session_minutes =
                    EXCLUDED.preferred_session_minutes,
                study_days_per_week =
                    EXCLUDED.study_days_per_week,
                exam_date = EXCLUDED.exam_date,
                learning_goal = EXCLUDED.learning_goal,
                difficulty_preference =
                    EXCLUDED.difficulty_preference,
                setup_completed =
                    EXCLUDED.setup_completed,
                updated_at = NOW()

            RETURNING *`,
            [
                req.user.userId,
                current_semester || null,
                academic_year || null,
                preferred_study_time || null,

                preferred_session_minutes === undefined ||
                preferred_session_minutes === null
                    ? 60
                    : Number(preferred_session_minutes),

                study_days_per_week === undefined ||
                study_days_per_week === null
                    ? 5
                    : Number(study_days_per_week),

                exam_date || null,
                learning_goal || null,
                difficulty_preference || "adaptive",
                Boolean(setup_completed)
            ]
        );

        res.status(200).json({
            status: "success",
            message: "Study setup saved successfully",
            profile: result.rows[0]
        });

    } catch (error) {
        console.error("Save setup profile error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to save study setup"
        });
    }
};


module.exports = {
    getSetupProfile,
    saveSetupProfile
};