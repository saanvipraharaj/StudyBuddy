const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const pool = require("../config/db");


// ============================================
// UPLOAD MATERIAL
// ============================================

const uploadMaterial = async (req, res) => {
    try {
        const {
            chapter_id,
            title
        } = req.body;


        // ----------------------------------------
        // VALIDATION
        // ----------------------------------------

        if (!chapter_id) {
            return res.status(400).json({
                status: "error",
                message: "Chapter is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "PDF file is required"
            });
        }


        // ----------------------------------------
        // VERIFY CHAPTER OWNERSHIP
        // ----------------------------------------

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
                chapter_id,
                req.user.userId
            ]
        );


        if (chapterCheck.rows.length === 0) {

            // Delete uploaded file if user
            // does not own this chapter
            if (
                req.file.path &&
                fs.existsSync(req.file.path)
            ) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this chapter"
            });
        }


        const subjectId =
            chapterCheck.rows[0].subject_id;


        // ----------------------------------------
        // FILE INFORMATION
        // ----------------------------------------

        const fileName =
            req.file.originalname;

        const storedFileName =
            req.file.filename;

        const fileType =
            "pdf";

        const fileUrl =
            `/uploads/${storedFileName}`;


        // ----------------------------------------
        // MATERIAL TITLE
        // ----------------------------------------

        const materialTitle =
            title?.trim() ||
            fileName.replace(/\.pdf$/i, "");


        // ============================================
        // EXTRACT PDF TEXT
        // ============================================

        let extractedText = "";

        let parser = null;


        try {

            const pdfBuffer =
                fs.readFileSync(
                    req.file.path
                );


            parser = new PDFParse({
                data: pdfBuffer
            });


            const pdfResult =
                await parser.getText();


            extractedText =
                pdfResult?.text?.trim() || "";


            console.log(
                "PDF text extracted:",
                {
                    file: fileName,
                    characters:
                        extractedText.length
                }
            );


        } catch (pdfError) {

            console.error(
                "PDF extraction error:",
                pdfError
            );


            /*
                Do not fail the whole upload.

                Some PDFs may contain scanned
                images instead of selectable text.

                In that situation the PDF can
                still be stored and OCR can be
                added later.
            */

            extractedText = "";


        } finally {

            if (parser) {

                try {

                    await parser.destroy();

                } catch (destroyError) {

                    console.error(
                        "PDF parser cleanup error:",
                        destroyError
                    );
                }
            }
        }


        // ============================================
        // SAVE MATERIAL
        // ============================================

        const result = await pool.query(
            `INSERT INTO study_materials
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
                uploaded_at`,
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


        // ============================================
        // SUCCESS RESPONSE
        // ============================================

        res.status(201).json({
            status: "success",

            message:
                extractedText.length > 0
                    ? "PDF uploaded and processed successfully"
                    : "PDF uploaded successfully, but no text could be extracted",

            material: result.rows[0]
        });


    } catch (error) {

        console.error(
            "Upload material error:",
            error
        );


        // ----------------------------------------
        // REMOVE ORPHANED FILE
        // ----------------------------------------

        try {

            if (
                req.file &&
                req.file.path &&
                fs.existsSync(req.file.path)
            ) {

                fs.unlinkSync(
                    req.file.path
                );
            }

        } catch (fileError) {

            console.error(
                "Failed to remove uploaded file:",
                fileError
            );
        }


        res.status(500).json({
            status: "error",
            message:
                "Unable to upload study material"
        });
    }
};


// ============================================
// GET MATERIALS BY CHAPTER
// ============================================

const getMaterialsByChapter = async (req, res) => {
    try {

        const { chapterId } =
            req.params;


        // ----------------------------------------
        // VERIFY CHAPTER OWNERSHIP
        // ----------------------------------------

        const chapterCheck =
            await pool.query(
                `SELECT
                    chapters.id
                 FROM chapters
                 INNER JOIN subjects
                    ON chapters.subject_id = subjects.id
                 WHERE chapters.id = $1
                 AND subjects.user_id = $2`,
                [
                    chapterId,
                    req.user.userId
                ]
            );


        if (
            chapterCheck.rows.length === 0
        ) {

            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this chapter"
            });
        }


        // ----------------------------------------
        // GET MATERIALS
        // ----------------------------------------

        const result =
            await pool.query(
                `SELECT
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
                 ORDER BY uploaded_at ASC`,
                [
                    chapterId,
                    req.user.userId
                ]
            );


        res.status(200).json({
            status: "success",
            count:
                result.rows.length,
            materials:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get chapter materials error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to fetch study materials"
        });
    }
};


// ============================================
// GET COMBINED TEXT FOR CHAPTER
// ============================================

const getCombinedChapterText = async (req, res) => {
    try {

        const { chapterId } =
            req.params;


        // ----------------------------------------
        // VERIFY CHAPTER OWNERSHIP
        // ----------------------------------------

        const chapterCheck =
            await pool.query(
                `SELECT
                    chapters.id,
                    chapters.name,
                    chapters.subject_id
                 FROM chapters
                 INNER JOIN subjects
                    ON chapters.subject_id = subjects.id
                 WHERE chapters.id = $1
                 AND subjects.user_id = $2`,
                [
                    chapterId,
                    req.user.userId
                ]
            );


        if (
            chapterCheck.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Chapter not found or you do not have access to it"
            });
        }


        const chapter =
            chapterCheck.rows[0];


        // ----------------------------------------
        // GET ALL EXTRACTED PDF TEXT
        // ----------------------------------------

        const materialsResult =
            await pool.query(
                `SELECT
                    id,
                    title,
                    file_name,
                    extracted_text,
                    uploaded_at
                 FROM study_materials
                 WHERE chapter_id = $1
                 AND user_id = $2
                 AND extracted_text IS NOT NULL
                 AND LENGTH(TRIM(extracted_text)) > 0
                 ORDER BY uploaded_at ASC`,
                [
                    chapterId,
                    req.user.userId
                ]
            );


        const materials =
            materialsResult.rows;


        // ----------------------------------------
        // NO EXTRACTED MATERIALS
        // ----------------------------------------

        if (materials.length === 0) {

            return res.status(200).json({
                status: "success",

                chapter: {
                    id:
                        chapter.id,

                    name:
                        chapter.name,

                    subject_id:
                        chapter.subject_id
                },

                material_count: 0,

                materials: [],

                total_characters: 0,

                combined_text: "",

                message:
                    "No extracted study material found for this chapter"
            });
        }


        // ============================================
        // COMBINE ALL PDF CONTENT
        // ============================================

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
                .join("\n\n");


        // ----------------------------------------
        // MATERIAL INFORMATION
        // ----------------------------------------

        const materialInfo =
            materials.map(
                (material) => ({
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


        // ----------------------------------------
        // SUCCESS RESPONSE
        // ----------------------------------------

        res.status(200).json({
            status: "success",

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


        res.status(500).json({
            status: "error",
            message:
                "Unable to combine chapter study materials"
        });
    }
};


// ============================================
// GET SINGLE MATERIAL
// ============================================

const getMaterialById = async (req, res) => {
    try {

        const { id } =
            req.params;


        const result =
            await pool.query(
                `SELECT
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
                 AND user_id = $2`,
                [
                    id,
                    req.user.userId
                ]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Study material not found"
            });
        }


        res.status(200).json({
            status: "success",
            material:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Get material error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to fetch study material"
        });
    }
};


// ============================================
// DELETE MATERIAL
// ============================================

const deleteMaterial = async (req, res) => {
    try {

        const { id } =
            req.params;


        // ----------------------------------------
        // FIND MATERIAL FIRST
        // ----------------------------------------

        const materialResult =
            await pool.query(
                `SELECT
                    id,
                    file_url
                 FROM study_materials
                 WHERE id = $1
                 AND user_id = $2`,
                [
                    id,
                    req.user.userId
                ]
            );


        if (
            materialResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Study material not found"
            });
        }


        const material =
            materialResult.rows[0];


        // ----------------------------------------
        // DELETE DATABASE RECORD
        // ----------------------------------------

        await pool.query(
            `DELETE FROM study_materials
             WHERE id = $1
             AND user_id = $2`,
            [
                id,
                req.user.userId
            ]
        );


        // ----------------------------------------
        // DELETE PHYSICAL PDF
        // ----------------------------------------

        if (material.file_url) {

            const storedFileName =
                path.basename(
                    material.file_url
                );


            const filePath =
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    storedFileName
                );


            try {

                if (
                    fs.existsSync(
                        filePath
                    )
                ) {

                    fs.unlinkSync(
                        filePath
                    );


                    console.log(
                        "Deleted PDF file:",
                        storedFileName
                    );


                } else {

                    console.log(
                        "PDF file not found on disk:",
                        storedFileName
                    );
                }


            } catch (fileError) {

                console.error(
                    "PDF file deletion error:",
                    fileError
                );
            }
        }


        // ----------------------------------------
        // SUCCESS
        // ----------------------------------------

        res.status(200).json({
            status: "success",
            message:
                "Study material deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete material error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to delete study material"
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    uploadMaterial,
    getMaterialsByChapter,
    getCombinedChapterText,
    getMaterialById,
    deleteMaterial
};