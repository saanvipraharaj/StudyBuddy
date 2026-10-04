const pool = require("../config/db");
const { generateTopicsFromChapter } = require("../services/geminiService");


// ============================================
// GENERATE TOPICS FROM CHAPTER MATERIALS
// ============================================

const generateTopics = async (req, res) => {
    try {

        const { chapterId } = req.params;

        // ========================================
        // VALIDATE CHAPTER
        // ========================================

        if (!chapterId) {
            return res.status(400).json({
                status: "error",
                message: "Chapter ID is required"
            });
        }


        // ========================================
        // CHECK CHAPTER OWNERSHIP
        // ========================================

        const chapterCheck = await pool.query(
            `
            SELECT
                chapters.id,
                chapters.name,
                chapters.subject_id
            FROM chapters
            INNER JOIN subjects
                ON chapters.subject_id = subjects.id
            WHERE chapters.id = $1
            AND subjects.user_id = $2
            `,
            [
                chapterId,
                req.user.userId
            ]
        );


        if (chapterCheck.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message:
                    "Chapter not found or you do not have access to it"
            });
        }


        const chapter = chapterCheck.rows[0];


        // ========================================
        // GET EXTRACTED MATERIAL
        // ========================================

        const materialsResult = await pool.query(
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
            AND LENGTH(TRIM(extracted_text)) > 0
            ORDER BY uploaded_at ASC
            `,
            [
                chapterId,
                req.user.userId
            ]
        );


        const materials = materialsResult.rows;


        // ========================================
        // CHECK MATERIAL EXISTS
        // ========================================

        if (materials.length === 0) {
            return res.status(400).json({
                status: "error",
                message:
                    "No extracted study material found for this chapter"
            });
        }


        // ========================================
        // COMBINE MATERIAL TEXT
        // ========================================

        const combinedText = materials
            .map((material, index) => {
                return `
========================================
MATERIAL ${index + 1}
TITLE: ${material.title}
FILE: ${material.file_name}
========================================

${material.extracted_text.trim()}
`;
            })
            .join("\n\n");


        console.log(
            "Generating AI topics:",
            {
                chapter: chapter.name,
                chapterId: chapterId,
                materials: materials.length,
                characters: combinedText.length
            }
        );


        // ========================================
        // GENERATE TOPICS USING GEMINI
        // ========================================

        const topics =
            await generateTopicsFromChapter(
                combinedText,
                chapter.name
            );


        console.log(
            "AI topics generated:",
            topics
        );


        // ========================================
        // VALIDATE AI RESPONSE
        // ========================================

        if (
            !topics ||
            !Array.isArray(topics) ||
            topics.length === 0
        ) {

            return res.status(500).json({
                status: "error",
                message:
                    "AI did not generate any usable topics."
            });
        }


        // ========================================
        // SAVE TOPICS
        // ========================================

        const client = await pool.connect();

        try {

            await client.query("BEGIN");


            // Delete previously generated topics
            // for this chapter so regeneration
            // does not create duplicates.

            await client.query(
                `
                DELETE FROM topics
                WHERE chapter_id = $1
                `,
                [chapterId]
            );


            const savedTopics = [];


            for (let i = 0; i < topics.length; i++) {

                const topic = topics[i];


                const topicName =
                    typeof topic === "string"
                        ? topic
                        : topic.name ||
                          topic.title ||
                          topic.topic;


                if (!topicName) {
                    continue;
                }


                const result = await client.query(
                    `
                    INSERT INTO topics
                    (
                        chapter_id,
                        name
                    )
                    VALUES
                    (
                        $1,
                        $2
                    )
                    RETURNING *
                    `,
                    [
                        chapterId,
                        topicName
                    ]
                );


                savedTopics.push(
                    result.rows[0]
                );
            }


            await client.query("COMMIT");


            console.log(
                "Topics saved:",
                savedTopics.length
            );


            return res.status(200).json({
                status: "success",

                message:
                    "Learning topics generated successfully",

                chapter: {
                    id: chapter.id,
                    name: chapter.name
                },

                topics: savedTopics,

                count:
                    savedTopics.length
            });


        } catch (dbError) {

            await client.query("ROLLBACK");

            console.error(
                "Topic database error:",
                dbError.stack || dbError
            );

            return res.status(500).json({
                status: "error",
                message:
                    dbError.message ||
                    "Unable to save generated topics"
            });

        } finally {

            client.release();

        }


    } catch (error) {

        // ========================================
        // IMPORTANT:
        // SHOW THE REAL ERROR
        // ========================================

        console.error(
            "AI topic generation error:",
            error.stack || error
        );


        return res.status(500).json({
            status: "error",

            message:
                error?.message ||
                "Unable to generate topics from chapter materials.",

            error:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : String(error)
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    generateTopics
};