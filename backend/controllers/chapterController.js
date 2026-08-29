const pool = require("../config/db");


// ============================================
// CREATE CHAPTER
// ============================================

const createChapter = async (req, res) => {
    try {
        const {
            subject_id,
            name,
            description,
            chapter_number
        } = req.body;

        if (!subject_id || !name || !chapter_number) {
            return res.status(400).json({
                status: "error",
                message:
                    "Subject, chapter name and chapter number are required"
            });
        }

        // Check subject ownership
        const subjectCheck = await pool.query(
            `SELECT id
             FROM subjects
             WHERE id = $1
             AND user_id = $2`,
            [
                subject_id,
                req.user.userId
            ]
        );

        if (subjectCheck.rows.length === 0) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this subject"
            });
        }

        // Prevent duplicate chapter number
        const existingChapter = await pool.query(
            `SELECT id
             FROM chapters
             WHERE subject_id = $1
             AND chapter_number = $2`,
            [
                subject_id,
                chapter_number
            ]
        );

        if (existingChapter.rows.length > 0) {
            return res.status(409).json({
                status: "error",
                message:
                    "A chapter with this number already exists"
            });
        }

        const result = await pool.query(
            `INSERT INTO chapters
            (
                subject_id,
                name,
                chapter_number,
                description
            )
            VALUES ($1, $2, $3, $4)

            RETURNING
                id,
                subject_id,
                name,
                chapter_number,
                description,
                created_at`,
            [
                subject_id,
                name.trim(),
                Number(chapter_number),
                description?.trim() || null
            ]
        );

        res.status(201).json({
            status: "success",
            message: "Chapter created successfully",
            chapter: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Create chapter error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to create chapter"
        });
    }
};


// ============================================
// GET ALL CHAPTERS FOR SUBJECT
// ============================================

const getChapters = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subjectCheck = await pool.query(
            `SELECT id, name
             FROM subjects
             WHERE id = $1
             AND user_id = $2`,
            [
                subjectId,
                req.user.userId
            ]
        );

        if (subjectCheck.rows.length === 0) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this subject"
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                subject_id,
                name,
                chapter_number,
                description,
                created_at
             FROM chapters
             WHERE subject_id = $1
             ORDER BY chapter_number ASC`,
            [subjectId]
        );

        res.status(200).json({
            status: "success",
            subject: subjectCheck.rows[0],
            count: result.rows.length,
            chapters: result.rows
        });

    } catch (error) {
        console.error(
            "Get chapters error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to fetch chapters"
        });
    }
};


// ============================================
// GET SINGLE CHAPTER
// ============================================

const getChapterById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                chapters.id,
                chapters.subject_id,
                chapters.name,
                chapters.chapter_number,
                chapters.description,
                chapters.created_at
             FROM chapters
             INNER JOIN subjects
                ON chapters.subject_id = subjects.id
             WHERE chapters.id = $1
             AND subjects.user_id = $2`,
            [
                id,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Chapter not found"
            });
        }

        res.status(200).json({
            status: "success",
            chapter: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Get chapter error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to fetch chapter"
        });
    }
};


// ============================================
// UPDATE CHAPTER
// ============================================

const updateChapter = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            chapter_number
        } = req.body;

        if (!name || !name.trim() || !chapter_number) {
            return res.status(400).json({
                status: "error",
                message:
                    "Chapter name and chapter number are required"
            });
        }

        // Get chapter + verify ownership
        const chapterCheck = await pool.query(
            `SELECT
                chapters.id,
                chapters.subject_id
             FROM chapters
             INNER JOIN subjects
                ON chapters.subject_id = subjects.id
             WHERE chapters.id = $1
             AND subjects.user_id = $2`,
            [
                id,
                req.user.userId
            ]
        );

        if (chapterCheck.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Chapter not found"
            });
        }

        const subjectId =
            chapterCheck.rows[0].subject_id;

        // Prevent duplicate chapter number
        const duplicateCheck = await pool.query(
            `SELECT id
             FROM chapters
             WHERE subject_id = $1
             AND chapter_number = $2
             AND id <> $3`,
            [
                subjectId,
                chapter_number,
                id
            ]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                status: "error",
                message:
                    "Another chapter already uses this number"
            });
        }

        const result = await pool.query(
            `UPDATE chapters
             SET
                name = $1,
                chapter_number = $2,
                description = $3
             WHERE id = $4

             RETURNING
                id,
                subject_id,
                name,
                chapter_number,
                description,
                created_at`,
            [
                name.trim(),
                Number(chapter_number),
                description?.trim() || null,
                id
            ]
        );

        res.status(200).json({
            status: "success",
            message: "Chapter updated successfully",
            chapter: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Update chapter error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to update chapter"
        });
    }
};


// ============================================
// DELETE CHAPTER
// ============================================

const deleteChapter = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM chapters
             WHERE id = $1
             AND subject_id IN (
                 SELECT id
                 FROM subjects
                 WHERE user_id = $2
             )
             RETURNING id`,
            [
                id,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Chapter not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Chapter deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete chapter error:",
            error
        );

        res.status(500).json({
            status: "error",
            message: "Unable to delete chapter"
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    createChapter,
    getChapters,
    getChapterById,
    updateChapter,
    deleteChapter
};