const pool = require("../config/db");

// ============================================
// LOAD PDF PARSER ONLY WHEN REQUIRED
// ============================================

const extractPdfText = async (buffer) => {
    let parser = null;

    try {
        // Lazy import prevents pdf-parse from loading
        // during Vercel server startup.
        const {
            PDFParse
        } = require("pdf-parse");

        parser = new PDFParse({
            data: buffer
        });

        const result =
            await parser.getText();

        return (
            result?.text?.trim() ||
            ""
        );

    } catch (error) {
        console.error(
            "PDF extraction error:",
            error
        );

        return "";

    } finally {
        if (parser) {
            try {
                await parser.destroy();
            } catch (error) {
                console.error(
                    "PDF parser cleanup error:",
                    error
                );
            }
        }
    }
};

// ============================================
// UPLOAD MATERIAL
// ============================================

const uploadMaterial = async (
    req,
    res
) => {
    try {
        const {
            chapter_id,
            title
        } = req.body;

        // ========================================
        // VALIDATION
        // ========================================

        if (!chapter_id) {
            return res
                .status(400)
                .json({
                    status: "error",
                    message:
                        "Chapter is required"
                });
        }

        if (!req.file) {
            return res
                .status(400)
                .json({
                    status: "error",
                    message:
                        "PDF file is required"
                });
        }

        // ========================================
        // VERIFY CHAPTER OWNERSHIP
        // ========================================

        const chapterCheck =
            await pool.query(
                `
                SELECT
                    chapters.id,
                    chapters.subject_id
                FROM chapters
                INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id
                WHERE chapters.id = $1
                AND subjects.user_id = $2
                `,
                [
                    chapter_id,
                    req.user.userId
                ]
            );

        if (
            chapterCheck.rows.length ===
            0
        ) {
            return res
                .status(403)
                .json({
                    status: "error",
                    message:
                        "You do not have access to this chapter"
                });
        }

        const subjectId =
            chapterCheck
                .rows[0]
                .subject_id;

        // ========================================
        // FILE INFORMATION
        // ========================================

        const fileName =
            req.file.originalname;

        const fileType =
            "pdf";

        /*
            We are intentionally not storing
            a local Vercel filesystem path.

            Vercel filesystem storage is
            temporary.

            The extracted PDF text is stored
            permanently inside PostgreSQL.
        */

        const fileUrl = null;

        const materialTitle =
            title?.trim() ||
            fileName.replace(
                /\.pdf$/i,
                ""
            );

        // ========================================
        // EXTRACT PDF TEXT
        // ========================================

        let extractedText = "";

        if (req.file.buffer) {
            extractedText =
                await extractPdfText(
                    req.file.buffer
                );
        }

        console.log(
            "PDF processed:",
            {
                file:
                    fileName,

                characters:
                    extractedText.length
            }
        );

        // ========================================
        // SAVE MATERIAL
        // ========================================

        const result =
            await pool.query(
                `
                INSERT INTO study_materials
                (
                    user_id,
                    subject_id,
                    chapter_id,
                    topic_id,
                    title,
                    file_name,
                    file_type,
                    file_url,
                    extracted_text,
                    ai_summary
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    NULL,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    NULL
                )
                RETURNING
                    id,
                    user_id,
                    subject_id,
                    chapter_id,
                    topic_id,
                    title,
                    file_name,
                    file_type,
                    file_url,
                    extracted_text,
                    ai_summary,
                    uploaded_at
                `,
                [
                    req.user.userId,
                    subjectId,
                    chapter_id,
                    materialTitle,
                    fileName,
                    fileType,
                    fileUrl,
                    extractedText
                ]
            );

        return res
            .status(201)
            .json({
                status:
                    "success",

                message:
                    extractedText.length > 0
                        ? "PDF uploaded and processed successfully"
                        : "PDF uploaded successfully, but no text could be extracted",

                material:
                    result.rows[0]
            });

    } catch (error) {
        console.error(
            "Upload material error:",
            error
        );

        return res
            .status(500)
            .json({
                status:
                    "error",

                message:
                    "Unable to upload study material"
            });
    }
};

// ============================================
// GET MATERIALS BY CHAPTER
// ============================================

const getMaterialsByChapter =
    async (
        req,
        res
    ) => {
        try {
            const {
                chapterId
            } = req.params;

            const chapterCheck =
                await pool.query(
                    `
                    SELECT
                        chapters.id
                    FROM chapters
                    INNER JOIN subjects
                        ON chapters.subject_id =
                           subjects.id
                    WHERE chapters.id = $1
                    AND subjects.user_id = $2
                    `,
                    [
                        chapterId,
                        req.user.userId
                    ]
                );

            if (
                chapterCheck
                    .rows
                    .length === 0
            ) {
                return res
                    .status(403)
                    .json({
                        status:
                            "error",

                        message:
                            "You do not have access to this chapter"
                    });
            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        user_id,
                        subject_id,
                        chapter_id,
                        topic_id,
                        title,
                        file_name,
                        file_type,
                        file_url,
                        extracted_text,
                        ai_summary,
                        uploaded_at
                    FROM study_materials
                    WHERE chapter_id = $1
                    AND user_id = $2
                    ORDER BY uploaded_at ASC
                    `,
                    [
                        chapterId,
                        req.user.userId
                    ]
                );

            return res
                .status(200)
                .json({
                    status:
                        "success",

                    count:
                        result
                            .rows
                            .length,

                    materials:
                        result.rows
                });

        } catch (error) {
            console.error(
                "Get chapter materials error:",
                error
            );

            return res
                .status(500)
                .json({
                    status:
                        "error",

                    message:
                        "Unable to fetch study materials"
                });
        }
    };

// ============================================
// GET COMBINED CHAPTER TEXT
// ============================================

const getCombinedChapterText =
    async (
        req,
        res
    ) => {
        try {
            const {
                chapterId
            } = req.params;

            const chapterCheck =
                await pool.query(
                    `
                    SELECT
                        chapters.id,
                        chapters.name,
                        chapters.subject_id
                    FROM chapters
                    INNER JOIN subjects
                        ON chapters.subject_id =
                           subjects.id
                    WHERE chapters.id = $1
                    AND subjects.user_id = $2
                    `,
                    [
                        chapterId,
                        req.user.userId
                    ]
                );

            if (
                chapterCheck
                    .rows
                    .length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        status:
                            "error",

                        message:
                            "Chapter not found or you do not have access to it"
                    });
            }

            const chapter =
                chapterCheck.rows[0];

            const materialsResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        title,
                        file_name,
                        extracted_text,
                        uploaded_at
                    FROM study_materials
                    WHERE chapter_id = $1
                    AND user_id = $2
                    AND extracted_text IS NOT NULL
                    AND LENGTH(
                        TRIM(
                            extracted_text
                        )
                    ) > 0
                    ORDER BY uploaded_at ASC
                    `,
                    [
                        chapterId,
                        req.user.userId
                    ]
                );

            const materials =
                materialsResult.rows;

            if (
                materials.length === 0
            ) {
                return res
                    .status(200)
                    .json({
                        status:
                            "success",

                        chapter: {
                            id:
                                chapter.id,

                            name:
                                chapter.name,

                            subject_id:
                                chapter.subject_id
                        },

                        material_count:
                            0,

                        materials:
                            [],

                        total_characters:
                            0,

                        combined_text:
                            "",

                        message:
                            "No extracted study material found for this chapter"
                    });
            }

            const combinedText =
                materials
                    .map(
                        (
                            material,
                            index
                        ) => {
                            return `
========================================
MATERIAL ${index + 1}
TITLE: ${material.title}
FILE: ${material.file_name}
========================================

${material.extracted_text.trim()}
`;
                        }
                    )
                    .join(
                        "\n\n"
                    );

            const materialInfo =
                materials.map(
                    (
                        material
                    ) => ({
                        id:
                            material.id,

                        title:
                            material.title,

                        file_name:
                            material.file_name,

                        characters:
                            material
                                .extracted_text
                                .length
                    })
                );

            return res
                .status(200)
                .json({
                    status:
                        "success",

                    chapter: {
                        id:
                            chapter.id,

                        name:
                            chapter.name,

                        subject_id:
                            chapter.subject_id
                    },

                    material_count:
                        materials.length,

                    materials:
                        materialInfo,

                    total_characters:
                        combinedText.length,

                    combined_text:
                        combinedText
                });

        } catch (error) {
            console.error(
                "Combine chapter text error:",
                error
            );

            return res
                .status(500)
                .json({
                    status:
                        "error",

                    message:
                        "Unable to combine chapter study materials"
                });
        }
    };

// ============================================
// GET SINGLE MATERIAL
// ============================================

const getMaterialById =
    async (
        req,
        res
    ) => {
        try {
            const {
                id
            } = req.params;

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        user_id,
                        subject_id,
                        chapter_id,
                        topic_id,
                        title,
                        file_name,
                        file_type,
                        file_url,
                        extracted_text,
                        ai_summary,
                        uploaded_at
                    FROM study_materials
                    WHERE id = $1
                    AND user_id = $2
                    `,
                    [
                        id,
                        req.user.userId
                    ]
                );

            if (
                result
                    .rows
                    .length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        status:
                            "error",

                        message:
                            "Study material not found"
                    });
            }

            return res
                .status(200)
                .json({
                    status:
                        "success",

                    material:
                        result.rows[0]
                });

        } catch (error) {
            console.error(
                "Get material error:",
                error
            );

            return res
                .status(500)
                .json({
                    status:
                        "error",

                    message:
                        "Unable to fetch study material"
                });
        }
    };

// ============================================
// DELETE MATERIAL
// ============================================

const deleteMaterial =
    async (
        req,
        res
    ) => {
        try {
            const {
                id
            } = req.params;

            const result =
                await pool.query(
                    `
                    DELETE FROM study_materials
                    WHERE id = $1
                    AND user_id = $2
                    RETURNING id
                    `,
                    [
                        id,
                        req.user.userId
                    ]
                );

            if (
                result
                    .rows
                    .length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        status:
                            "error",

                        message:
                            "Study material not found"
                    });
            }

            return res
                .status(200)
                .json({
                    status:
                        "success",

                    message:
                        "Study material deleted successfully"
                });

        } catch (error) {
            console.error(
                "Delete material error:",
                error
            );

            return res
                .status(500)
                .json({
                    status:
                        "error",

                    message:
                        "Unable to delete study material"
                });
        }
    };

// ============================================
// EXPORTS
// ============================================

module.exports = {
    uploadMaterial,
    getMaterialsByChapter,
    getCombinedChapterText,
    getMaterialById,
    deleteMaterial
};