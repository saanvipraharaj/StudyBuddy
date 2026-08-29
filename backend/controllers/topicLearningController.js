const pool = require("../config/db");

const {
    generateTopicLearningContent
} = require("../services/geminiService");


// ============================================
// GET SAVED TOPIC CONTENT
// ============================================

const getTopicLearningContent = async (
    req,
    res
) => {

    try {

        const { topicId } =
            req.params;


        // ----------------------------------------
        // VERIFY TOPIC OWNERSHIP
        // ----------------------------------------

        const topicResult =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.name,
                    topics.description,
                    topics.chapter_id,
                    chapters.name
                        AS chapter_name
                 FROM topics
                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id
                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id
                 WHERE topics.id = $1
                 AND subjects.user_id = $2`,
                [
                    topicId,
                    req.user.userId
                ]
            );


        if (
            topicResult.rows.length === 0
        ) {
            return res.status(404).json({
                status: "error",
                message:
                    "Topic not found"
            });
        }


        // ----------------------------------------
        // GET CONTENT
        // ----------------------------------------

        const result =
            await pool.query(
                `SELECT
                    id,
                    topic_id,
                    notes,
                    key_concepts,
                    examples,
                    important_points,
                    generated_at,
                    updated_at
                 FROM topic_learning_content
                 WHERE topic_id = $1`,
                [topicId]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(200).json({
                status: "success",
                exists: false,
                content: null
            });
        }


        res.status(200).json({
            status: "success",
            exists: true,
            content:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Get topic learning content error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to fetch topic learning content"
        });
    }
};


// ============================================
// GENERATE TOPIC CONTENT
// ============================================

const generateLearningContent = async (
    req,
    res
) => {

    try {

        const { topicId } =
            req.params;


        // ============================================
        // GET TOPIC + VERIFY OWNERSHIP
        // ============================================

        const topicResult =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.name,
                    topics.description,
                    topics.chapter_id,
                    chapters.name
                        AS chapter_name
                 FROM topics
                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id
                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id
                 WHERE topics.id = $1
                 AND subjects.user_id = $2`,
                [
                    topicId,
                    req.user.userId
                ]
            );


        if (
            topicResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Topic not found"
            });
        }


        const topic =
            topicResult.rows[0];


        // ============================================
        // DON'T GENERATE AGAIN
        // ============================================

        const existingContent =
            await pool.query(
                `SELECT id
                 FROM topic_learning_content
                 WHERE topic_id = $1`,
                [topicId]
            );


        if (
            existingContent.rows.length > 0
        ) {

            return res.status(409).json({
                status: "error",
                message:
                    "Learning content already exists for this topic."
            });
        }


        // ============================================
        // GET ALL CHAPTER PDF TEXT
        // ============================================

        const materialsResult =
            await pool.query(
                `SELECT
                    title,
                    file_name,
                    extracted_text
                 FROM study_materials
                 WHERE chapter_id = $1
                 AND user_id = $2
                 AND extracted_text
                    IS NOT NULL
                 AND LENGTH(
                    TRIM(extracted_text)
                 ) > 0
                 ORDER BY uploaded_at ASC`,
                [
                    topic.chapter_id,
                    req.user.userId
                ]
            );


        const materials =
            materialsResult.rows;


        if (
            materials.length === 0
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "No readable study materials are available for this chapter."
            });
        }


        // ============================================
        // COMBINE MATERIALS
        // ============================================

        const combinedText =
            materials
                .map(
                    (
                        material,
                        index
                    ) => `
========================================
MATERIAL ${index + 1}
TITLE: ${material.title}
FILE: ${material.file_name}
========================================

${material.extracted_text}
`
                )
                .join("\n\n");


        console.log(
            "Generating topic learning content:",
            {
                topic:
                    topic.name,

                materials:
                    materials.length,

                characters:
                    combinedText.length
            }
        );


        // ============================================
        // GEMINI
        // ============================================

        const generated =
            await generateTopicLearningContent(
                topic,
                topic.chapter_name,
                combinedText
            );


        // ============================================
        // SAVE TO DATABASE
        // ============================================

        const result =
            await pool.query(
                `INSERT INTO topic_learning_content
                (
                    topic_id,
                    notes,
                    key_concepts,
                    examples,
                    important_points
                )
                VALUES
                (
                    $1,
                    $2,
                    $3::jsonb,
                    $4::jsonb,
                    $5::jsonb
                )
                RETURNING
                    id,
                    topic_id,
                    notes,
                    key_concepts,
                    examples,
                    important_points,
                    generated_at,
                    updated_at`,
                [
                    topicId,

                    generated.notes,

                    JSON.stringify(
                        generated.key_concepts
                    ),

                    JSON.stringify(
                        generated.examples
                    ),

                    JSON.stringify(
                        generated.important_points
                    )
                ]
            );


        res.status(201).json({
            status: "success",

            message:
                "Study notes generated successfully.",

            materials_used:
                materials.length,

            content:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Generate learning content error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to generate learning content."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    getTopicLearningContent,
    generateLearningContent
};