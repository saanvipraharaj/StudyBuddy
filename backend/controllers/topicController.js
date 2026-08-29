const pool = require("../config/db");

const {
    generateTopicsFromChapter
} = require("../services/geminiService");


// ============================================
// CREATE TOPIC
// ============================================

const createTopic = async (req, res) => {
    try {
        const {
            chapter_id,
            name,
            description,
            topic_number,
            estimated_minutes,
            is_active
        } = req.body;

        if (
            !chapter_id ||
            !name ||
            !name.trim() ||
            !topic_number
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Chapter, topic name and topic number are required"
            });
        }


        // ============================================
        // VERIFY CHAPTER OWNERSHIP
        // ============================================

        const chapterCheck = await pool.query(
            `SELECT
                chapters.id
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
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this chapter"
            });
        }


        // ============================================
        // CHECK DUPLICATE TOPIC NUMBER
        // ============================================

        const existingTopic =
            await pool.query(
                `SELECT id
                 FROM topics
                 WHERE chapter_id = $1
                 AND topic_number = $2`,
                [
                    chapter_id,
                    topic_number
                ]
            );


        if (
            existingTopic.rows.length > 0
        ) {
            return res.status(409).json({
                status: "error",
                message:
                    "A topic with this number already exists"
            });
        }


        // ============================================
        // DETERMINE LOCK STATUS
        // ============================================

        const existingTopicCount =
            await pool.query(
                `SELECT COUNT(*)::int AS count
                 FROM topics
                 WHERE chapter_id = $1`,
                [chapter_id]
            );


        const currentCount =
            existingTopicCount.rows[0].count;


        let topicIsActive;


        if (
            is_active !== undefined
        ) {

            topicIsActive =
                Boolean(is_active);

        } else {

            // First topic unlocked.
            // Later topics locked by default.

            topicIsActive =
                currentCount === 0;
        }


        // ============================================
        // CREATE TOPIC
        // ============================================

        const result =
            await pool.query(
                `INSERT INTO topics
                (
                    chapter_id,
                    name,
                    topic_number,
                    description,
                    estimated_minutes,
                    is_active
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )
                RETURNING
                    id,
                    chapter_id,
                    name,
                    topic_number,
                    description,
                    estimated_minutes,
                    is_active,
                    created_at`,
                [
                    chapter_id,

                    name.trim(),

                    Number(
                        topic_number
                    ),

                    description?.trim() ||
                        null,

                    estimated_minutes ===
                            undefined ||
                    estimated_minutes ===
                            null ||
                    estimated_minutes === ""
                        ? null
                        : Number(
                            estimated_minutes
                        ),

                    topicIsActive
                ]
            );


        res.status(201).json({
            status: "success",
            message:
                "Topic created successfully",
            topic:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Create topic error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to create topic"
        });
    }
};


// ============================================
// AI GENERATE TOPICS
// ============================================

const generateTopics = async (req, res) => {
    try {

        const { chapterId } =
            req.params;


        // ============================================
        // VERIFY CHAPTER OWNERSHIP
        // ============================================

        const chapterResult =
            await pool.query(
                `SELECT
                    chapters.id,
                    chapters.name,
                    chapters.subject_id
                 FROM chapters
                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id
                 WHERE chapters.id = $1
                 AND subjects.user_id = $2`,
                [
                    chapterId,
                    req.user.userId
                ]
            );


        if (
            chapterResult.rows.length ===
            0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Chapter not found or you do not have access to it"
            });
        }


        const chapter =
            chapterResult.rows[0];


        // ============================================
        // DON'T OVERWRITE EXISTING TOPICS
        // ============================================

        const existingTopics =
            await pool.query(
                `SELECT id
                 FROM topics
                 WHERE chapter_id = $1
                 LIMIT 1`,
                [chapterId]
            );


        if (
            existingTopics.rows.length > 0
        ) {

            return res.status(409).json({
                status: "error",
                message:
                    "Topics already exist for this chapter."
            });
        }


        // ============================================
        // GET ALL EXTRACTED PDF TEXT
        // ============================================

        const materialsResult =
            await pool.query(
                `SELECT
                    id,
                    title,
                    file_name,
                    extracted_text
                 FROM study_materials
                 WHERE chapter_id = $1
                 AND user_id = $2
                 AND extracted_text IS NOT NULL
                 AND LENGTH(
                    TRIM(extracted_text)
                 ) > 0
                 ORDER BY uploaded_at ASC`,
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

            return res.status(400).json({
                status: "error",
                message:
                    "Upload at least one readable PDF before generating topics."
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

${material.extracted_text}
`;

                    }
                )
                .join("\n\n");


        console.log(
            "Generating AI topics:",
            {
                chapter:
                    chapter.name,

                materials:
                    materials.length,

                characters:
                    combinedText.length
            }
        );


        // ============================================
        // ASK GEMINI TO GENERATE TOPICS
        // ============================================

        const aiTopics =
            await generateTopicsFromChapter(
                chapter.name,
                combinedText
            );


        if (
            !Array.isArray(aiTopics) ||
            aiTopics.length === 0
        ) {

            return res.status(500).json({
                status: "error",
                message:
                    "AI did not generate any topics."
            });
        }


        // ============================================
        // CLEAN AI OUTPUT
        // ============================================

        const cleanedTopics =
            aiTopics
                .filter(
                    (topic) =>
                        topic &&
                        topic.name &&
                        String(
                            topic.name
                        ).trim()
                )
                .map(
                    (
                        topic,
                        index
                    ) => {

                        let estimatedMinutes =
                            Number(
                                topic
                                    .estimated_minutes
                            );


                        if (
                            !Number.isFinite(
                                estimatedMinutes
                            ) ||
                            estimatedMinutes <= 0
                        ) {

                            estimatedMinutes =
                                30;
                        }


                        estimatedMinutes =
                            Math.min(
                                Math.max(
                                    Math.round(
                                        estimatedMinutes
                                    ),
                                    10
                                ),
                                240
                            );


                        return {
                            topic_number:
                                index + 1,

                            name:
                                String(
                                    topic.name
                                ).trim(),

                            description:
                                topic.description
                                    ? String(
                                        topic.description
                                    ).trim()
                                    : null,

                            estimated_minutes:
                                estimatedMinutes,

                            is_active:
                                index === 0
                        };
                    }
                );


        if (
            cleanedTopics.length ===
            0
        ) {

            return res.status(500).json({
                status: "error",
                message:
                    "AI returned unusable topic data."
            });
        }


        // ============================================
        // SAVE TOPICS USING TRANSACTION
        // ============================================

        const client =
            await pool.connect();


        try {

            await client.query(
                "BEGIN"
            );


            const finalExistingCheck =
                await client.query(
                    `SELECT id
                     FROM topics
                     WHERE chapter_id = $1
                     LIMIT 1`,
                    [chapterId]
                );


            if (
                finalExistingCheck
                    .rows
                    .length > 0
            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res.status(409).json({
                    status: "error",
                    message:
                        "Topics already exist for this chapter."
                });
            }


            const savedTopics = [];


            for (
                const topic
                of cleanedTopics
            ) {

                const result =
                    await client.query(
                        `INSERT INTO topics
                        (
                            chapter_id,
                            name,
                            topic_number,
                            description,
                            estimated_minutes,
                            is_active
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            $6
                        )
                        RETURNING
                            id,
                            chapter_id,
                            name,
                            topic_number,
                            description,
                            estimated_minutes,
                            is_active,
                            created_at`,
                        [
                            chapterId,

                            topic.name,

                            topic.topic_number,

                            topic.description,

                            topic
                                .estimated_minutes,

                            topic.is_active
                        ]
                    );


                savedTopics.push(
                    result.rows[0]
                );
            }


            await client.query(
                "COMMIT"
            );


            return res.status(201).json({
                status: "success",

                message:
                    "Topics generated successfully. The first topic is unlocked and later topics are locked.",

                chapter: {
                    id:
                        chapter.id,

                    name:
                        chapter.name,

                    subject_id:
                        chapter.subject_id
                },

                materials_used:
                    materials.length,

                source_characters:
                    combinedText.length,

                count:
                    savedTopics.length,

                topics:
                    savedTopics
            });


        } catch (databaseError) {

            await client.query(
                "ROLLBACK"
            );


            throw databaseError;

        } finally {

            client.release();
        }


    } catch (error) {

        console.error(
            "AI topic generation error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to generate topics from chapter materials."
        });
    }
};


// ============================================
// GET ALL TOPICS FOR CHAPTER
// ============================================

const getTopics = async (req, res) => {
    try {

        const { chapterId } =
            req.params;


        const chapterCheck =
            await pool.query(
                `SELECT
                    chapters.id,
                    chapters.name,
                    chapters.subject_id
                 FROM chapters
                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id
                 WHERE chapters.id = $1
                 AND subjects.user_id = $2`,
                [
                    chapterId,
                    req.user.userId
                ]
            );


        if (
            chapterCheck.rows.length ===
            0
        ) {

            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this chapter"
            });
        }


        const result =
            await pool.query(
                `SELECT
                    id,
                    chapter_id,
                    name,
                    topic_number,
                    description,
                    estimated_minutes,
                    is_active,
                    created_at
                 FROM topics
                 WHERE chapter_id = $1
                 ORDER BY topic_number ASC`,
                [chapterId]
            );


        res.status(200).json({
            status: "success",

            chapter:
                chapterCheck.rows[0],

            count:
                result.rows.length,

            topics:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get topics error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to fetch topics"
        });
    }
};


// ============================================
// GET SINGLE TOPIC
// ============================================

const getTopicById = async (req, res) => {
    try {

        const { id } =
            req.params;


        const result =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.chapter_id,
                    topics.name,
                    topics.topic_number,
                    topics.description,
                    topics.estimated_minutes,
                    topics.is_active,
                    topics.created_at
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
                    "Topic not found"
            });
        }


        const topic =
            result.rows[0];


        // ============================================
        // BLOCK LOCKED TOPICS
        // ============================================

        if (
            topic.is_active === false
        ) {

            return res.status(403).json({
                status: "error",
                message:
                    "This topic is locked. Complete the previous topic test to unlock it."
            });
        }


        res.status(200).json({
            status: "success",
            topic
        });


    } catch (error) {

        console.error(
            "Get topic error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to fetch topic"
        });
    }
};


// ============================================
// UPDATE TOPIC
// ============================================

const updateTopic = async (req, res) => {
    try {

        const { id } =
            req.params;


        const {
            name,
            description,
            topic_number,
            estimated_minutes,
            is_active
        } = req.body;


        if (
            !name ||
            !name.trim() ||
            !topic_number
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Topic name and topic number are required"
            });
        }


        const topicCheck =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.chapter_id,
                    topics.is_active

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
                    id,
                    req.user.userId
                ]
            );


        if (
            topicCheck.rows.length ===
            0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Topic not found"
            });
        }


        const existingTopic =
            topicCheck.rows[0];


        const chapterId =
            existingTopic.chapter_id;


        // ============================================
        // DUPLICATE NUMBER CHECK
        // ============================================

        const duplicateCheck =
            await pool.query(
                `SELECT id
                 FROM topics
                 WHERE chapter_id = $1
                 AND topic_number = $2
                 AND id <> $3`,
                [
                    chapterId,
                    topic_number,
                    id
                ]
            );


        if (
            duplicateCheck.rows.length >
            0
        ) {

            return res.status(409).json({
                status: "error",
                message:
                    "Another topic already uses this number"
            });
        }


        const finalActiveStatus =
            is_active === undefined
                ? existingTopic.is_active
                : Boolean(is_active);


        // ============================================
        // UPDATE
        // ============================================

        const result =
            await pool.query(
                `UPDATE topics

                 SET
                    name = $1,
                    topic_number = $2,
                    description = $3,
                    estimated_minutes = $4,
                    is_active = $5

                 WHERE id = $6

                 RETURNING
                    id,
                    chapter_id,
                    name,
                    topic_number,
                    description,
                    estimated_minutes,
                    is_active,
                    created_at`,
                [
                    name.trim(),

                    Number(
                        topic_number
                    ),

                    description?.trim() ||
                        null,

                    estimated_minutes ===
                            undefined ||
                    estimated_minutes ===
                            null ||
                    estimated_minutes === ""
                        ? null
                        : Number(
                            estimated_minutes
                        ),

                    finalActiveStatus,

                    id
                ]
            );


        res.status(200).json({
            status: "success",
            message:
                "Topic updated successfully",
            topic:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Update topic error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to update topic"
        });
    }
};


// ============================================
// DELETE TOPIC
// ============================================

const deleteTopic = async (req, res) => {
    try {

        const { id } =
            req.params;


        const result =
            await pool.query(
                `DELETE FROM topics

                 WHERE id = $1

                 AND chapter_id IN
                 (
                    SELECT
                        chapters.id

                    FROM chapters

                    INNER JOIN subjects
                        ON chapters.subject_id =
                           subjects.id

                    WHERE subjects.user_id =
                          $2
                 )

                 RETURNING id`,
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
                    "Topic not found"
            });
        }


        res.status(200).json({
            status: "success",
            message:
                "Topic deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete topic error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to delete topic"
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    createTopic,
    generateTopics,
    getTopics,
    getTopicById,
    updateTopic,
    deleteTopic
};