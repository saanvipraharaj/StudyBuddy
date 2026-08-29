const pool = require("../config/db");

const {
    generateTopicFlashcards
} = require("../services/geminiService");


// ============================================
// GET FLASHCARDS FOR TOPIC
// ============================================

const getFlashcardsByTopic = async (req, res) => {
    try {

        const { topicId } =
            req.params;


        // ============================================
        // VERIFY TOPIC OWNERSHIP
        // ============================================

        const topicResult =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.name,
                    topics.description
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
                    "Topic not found or you do not have access to it"
            });
        }


        // ============================================
        // GET FLASHCARDS
        // ============================================

        const result =
            await pool.query(
                `SELECT
                    id,
                    user_id,
                    topic_id,
                    question,
                    answer,
                    difficulty,
                    next_review_date,
                    review_count,
                    correct_count,
                    incorrect_count,
                    created_at
                 FROM flashcards
                 WHERE user_id = $1
                 AND topic_id = $2
                 ORDER BY id ASC`,
                [
                    req.user.userId,
                    topicId
                ]
            );


        return res.status(200).json({
            status: "success",

            exists:
                result.rows.length > 0,

            count:
                result.rows.length,

            flashcards:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get flashcards error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to fetch flashcards"
        });
    }
};


// ============================================
// GENERATE FLASHCARDS
// ============================================

const generateFlashcards = async (req, res) => {
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
                    topics.chapter_id
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
                    "Topic not found or you do not have access to it"
            });
        }


        const topic =
            topicResult.rows[0];


        // ============================================
        // CHECK IF FLASHCARDS ALREADY EXIST
        // ============================================

        const existing =
            await pool.query(
                `SELECT id
                 FROM flashcards
                 WHERE user_id = $1
                 AND topic_id = $2
                 LIMIT 1`,
                [
                    req.user.userId,
                    topicId
                ]
            );


        if (
            existing.rows.length > 0
        ) {

            return res.status(409).json({
                status: "error",
                message:
                    "Flashcards already exist for this topic."
            });
        }


        // ============================================
        // GET LEARNING CONTENT
        // ============================================

        const learningResult =
            await pool.query(
                `SELECT
                    notes,
                    key_concepts,
                    examples,
                    important_points
                 FROM topic_learning_content
                 WHERE topic_id = $1`,
                [topicId]
            );


        if (
            learningResult.rows.length === 0
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Generate study notes before generating flashcards."
            });
        }


        const learningContent =
            learningResult.rows[0];


        // ============================================
        // GENERATE WITH GEMINI
        // ============================================

        const generatedFlashcards =
            await generateTopicFlashcards(
                topic,
                learningContent,
                12
            );


        if (
            !Array.isArray(
                generatedFlashcards
            ) ||
            generatedFlashcards.length === 0
        ) {

            return res.status(500).json({
                status: "error",
                message:
                    "AI did not generate valid flashcards."
            });
        }


        // ============================================
        // SAVE FLASHCARDS
        // ============================================

        const client =
            await pool.connect();


        try {

            await client.query(
                "BEGIN"
            );


            // Recheck inside transaction
            const finalCheck =
                await client.query(
                    `SELECT id
                     FROM flashcards
                     WHERE user_id = $1
                     AND topic_id = $2
                     LIMIT 1`,
                    [
                        req.user.userId,
                        topicId
                    ]
                );


            if (
                finalCheck.rows.length > 0
            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res.status(409).json({
                    status: "error",
                    message:
                        "Flashcards already exist for this topic."
                });
            }


            const savedFlashcards = [];


            for (
                const flashcard
                of generatedFlashcards
            ) {

                const result =
                    await client.query(
                        `INSERT INTO flashcards
                        (
                            user_id,
                            topic_id,
                            question,
                            answer,
                            difficulty,
                            next_review_date,
                            review_count,
                            correct_count,
                            incorrect_count
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            CURRENT_DATE,
                            0,
                            0,
                            0
                        )
                        RETURNING
                            id,
                            user_id,
                            topic_id,
                            question,
                            answer,
                            difficulty,
                            next_review_date,
                            review_count,
                            correct_count,
                            incorrect_count,
                            created_at`,
                        [
                            req.user.userId,
                            topicId,
                            flashcard.question,
                            flashcard.answer,
                            flashcard.difficulty
                        ]
                    );


                savedFlashcards.push(
                    result.rows[0]
                );
            }


            await client.query(
                "COMMIT"
            );


            return res.status(201).json({
                status: "success",

                message:
                    "Flashcards generated successfully.",

                count:
                    savedFlashcards.length,

                flashcards:
                    savedFlashcards
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
            "Generate flashcards error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to generate flashcards."
        });
    }
};


// ============================================
// REVIEW FLASHCARD
// ============================================

const reviewFlashcard = async (req, res) => {
    try {

        const { id } =
            req.params;

        const {
            rating
        } = req.body;


        // ============================================
        // VALIDATE RATING
        // ============================================

        const allowedRatings = [
            "again",
            "good",
            "easy"
        ];


        if (
            !rating ||
            !allowedRatings.includes(
                String(rating)
                    .trim()
                    .toLowerCase()
            )
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Rating must be again, good or easy."
            });
        }


        const finalRating =
            String(rating)
                .trim()
                .toLowerCase();


        // ============================================
        // VERIFY FLASHCARD OWNERSHIP
        // ============================================

        const flashcardResult =
            await pool.query(
                `SELECT
                    id,
                    user_id,
                    topic_id,
                    question,
                    answer,
                    difficulty,
                    next_review_date,
                    review_count,
                    correct_count,
                    incorrect_count
                 FROM flashcards
                 WHERE id = $1
                 AND user_id = $2`,
                [
                    id,
                    req.user.userId
                ]
            );


        if (
            flashcardResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Flashcard not found."
            });
        }


        const flashcard =
            flashcardResult.rows[0];


        // ============================================
        // CURRENT VALUES
        // ============================================

        const currentReviewCount =
            Number(
                flashcard.review_count
            ) || 0;


        const currentCorrectCount =
            Number(
                flashcard.correct_count
            ) || 0;


        const currentIncorrectCount =
            Number(
                flashcard.incorrect_count
            ) || 0;


        let intervalDays = 1;

        let newCorrectCount =
            currentCorrectCount;

        let newIncorrectCount =
            currentIncorrectCount;


        // ============================================
        // CALCULATE SPACED REVIEW
        // ============================================

        if (
            finalRating === "again"
        ) {

            intervalDays = 1;

            newIncorrectCount += 1;

        } else if (
            finalRating === "good"
        ) {

            intervalDays = 3;

            newCorrectCount += 1;

        } else if (
            finalRating === "easy"
        ) {

            intervalDays = 7;

            newCorrectCount += 1;
        }


        const newReviewCount =
            currentReviewCount + 1;


        // ============================================
        // UPDATE FLASHCARD
        // ============================================

        const result =
            await pool.query(
                `UPDATE flashcards

                 SET
                    review_count = $1,
                    correct_count = $2,
                    incorrect_count = $3,
                    next_review_date =
                        CURRENT_DATE + $4

                 WHERE id = $5
                 AND user_id = $6

                 RETURNING
                    id,
                    user_id,
                    topic_id,
                    question,
                    answer,
                    difficulty,
                    next_review_date,
                    review_count,
                    correct_count,
                    incorrect_count,
                    created_at`,
                [
                    newReviewCount,
                    newCorrectCount,
                    newIncorrectCount,
                    intervalDays,
                    id,
                    req.user.userId
                ]
            );


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(200).json({
            status: "success",

            message:
                "Flashcard review saved.",

            rating:
                finalRating,

            interval_days:
                intervalDays,

            flashcard:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Review flashcard error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to save flashcard review."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    getFlashcardsByTopic,
    generateFlashcards,
    reviewFlashcard
};