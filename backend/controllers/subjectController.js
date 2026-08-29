const pool = require("../config/db");


// ============================================
// CREATE SUBJECT
// ============================================

const createSubject = async (req, res) => {
    try {
        const {
            name,
            description
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Subject name is required"
            });
        }

        const subjectName = name.trim();
        const subjectDescription =
            description?.trim() || null;

        // Check duplicate subject name
        const existingSubject = await pool.query(
            `SELECT id
             FROM subjects
             WHERE user_id = $1
             AND LOWER(name) = LOWER($2)`,
            [
                req.user.userId,
                subjectName
            ]
        );

        if (existingSubject.rows.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "You already have this subject"
            });
        }

        const result = await pool.query(
            `INSERT INTO subjects
            (
                user_id,
                name,
                description
            )
            VALUES ($1, $2, $3)

            RETURNING
                id,
                user_id,
                name,
                description,
                created_at`,
            [
                req.user.userId,
                subjectName,
                subjectDescription
            ]
        );

        res.status(201).json({
            status: "success",
            message: "Subject created successfully",
            subject: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Create subject error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to create subject"
        });
    }
};


// ============================================
// GET ALL SUBJECTS
// ============================================

const getSubjects = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                description,
                created_at
             FROM subjects
             WHERE user_id = $1
             ORDER BY created_at ASC`,
            [req.user.userId]
        );

        res.status(200).json({
            status: "success",
            count: result.rows.length,
            subjects: result.rows
        });

    } catch (error) {
        console.error(
            "Get subjects error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to fetch subjects"
        });
    }
};


// ============================================
// GET SINGLE SUBJECT
// ============================================

const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                id,
                name,
                description,
                created_at
             FROM subjects
             WHERE id = $1
             AND user_id = $2`,
            [
                id,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Subject not found"
            });
        }

        res.status(200).json({
            status: "success",
            subject: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Get subject error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to fetch subject"
        });
    }
};


// ============================================
// UPDATE SUBJECT
// ============================================

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Subject name is required"
            });
        }

        const subjectName = name.trim();
        const subjectDescription =
            description?.trim() || null;


        // Check whether another subject
        // already uses this name
        const duplicateCheck = await pool.query(
            `SELECT id
             FROM subjects
             WHERE user_id = $1
             AND LOWER(name) = LOWER($2)
             AND id <> $3`,
            [
                req.user.userId,
                subjectName,
                id
            ]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "You already have this subject"
            });
        }


        const result = await pool.query(
            `UPDATE subjects
             SET
                name = $1,
                description = $2
             WHERE id = $3
             AND user_id = $4

             RETURNING
                id,
                name,
                description,
                created_at`,
            [
                subjectName,
                subjectDescription,
                id,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Subject not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Subject updated successfully",
            subject: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Update subject error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to update subject"
        });
    }
};


// ============================================
// DELETE SUBJECT
// ============================================

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM subjects
             WHERE id = $1
             AND user_id = $2
             RETURNING id`,
            [
                id,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Subject not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Subject deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete subject error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to delete subject"
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    createSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
};