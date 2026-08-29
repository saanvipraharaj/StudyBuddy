const pool = require("../config/db");

const {
    generateTopicTest
} = require("../services/geminiService");


// ============================================
// MASTERY HELPERS
// ============================================

const calculateMasteryScore = (
    latestScore,
    averageScore,
    bestScore
) => {

    const latest =
        Number(latestScore) || 0;

    const average =
        Number(averageScore) || 0;

    const best =
        Number(bestScore) || 0;


    const weightedScore =
        (latest * 0.50) +
        (average * 0.30) +
        (best * 0.20);


    return Number(
        Math.min(
            100,
            Math.max(
                0,
                weightedScore
            )
        ).toFixed(2)
    );
};


// ============================================
// WEAKNESS LEVEL
// ============================================

const getWeaknessLevel = (
    masteryScore
) => {

    const mastery =
        Number(masteryScore) || 0;


    if (mastery < 40) {
        return "high";
    }


    if (mastery < 60) {
        return "medium";
    }


    if (mastery < 70) {
        return "low";
    }


    return null;
};


// ============================================
// MASTERY LEVEL
// ============================================

const getMasteryLevel = (
    masteryScore
) => {

    const mastery =
        Number(masteryScore) || 0;


    if (mastery >= 80) {
        return "strong";
    }


    if (mastery >= 70) {
        return "mastered";
    }


    if (mastery >= 60) {
        return "needs_review";
    }


    if (mastery >= 40) {
        return "weak";
    }


    return "very_weak";
};


// ============================================
// CREATE TEST
// ============================================

const createTest = async (
    req,
    res
) => {

    try {

        const {
            topic_id,
            title,
            test_type,
            difficulty,
            total_questions,
            passing_percentage,
            is_mandatory
        } = req.body;


        if (
            !topic_id ||
            !title ||
            !title.trim()
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Topic and title are required"
            });
        }


        // ============================================
        // VERIFY TOPIC OWNERSHIP
        // ============================================

        const topicCheck =
            await pool.query(
                `SELECT
                    topics.id

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
                    topic_id,
                    req.user.userId
                ]
            );


        if (
            topicCheck.rows.length === 0
        ) {

            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this topic"
            });
        }


        // ============================================
        // CREATE TEST
        // ============================================

        const result =
            await pool.query(
                `INSERT INTO tests
                (
                    topic_id,
                    title,
                    test_type,
                    difficulty,
                    total_questions,
                    passing_percentage,
                    is_mandatory
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )

                RETURNING
                    id,
                    topic_id,
                    title,
                    test_type,
                    difficulty,
                    total_questions,
                    passing_percentage,
                    is_mandatory,
                    created_at`,
                [
                    topic_id,

                    title.trim(),

                    test_type ||
                    "topic_test",

                    difficulty ||
                    "adaptive",

                    total_questions
                        ? Number(
                            total_questions
                        )
                        : 10,

                    passing_percentage
                        ? Number(
                            passing_percentage
                        )
                        : 70,

                    is_mandatory ===
                    undefined
                        ? true
                        : Boolean(
                            is_mandatory
                        )
                ]
            );


        return res.status(201).json({
            status: "success",

            message:
                "Test created successfully",

            test:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Create test error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to create test"
        });
    }
};


// ============================================
// GENERATE AI TEST
// ============================================

const generateTest = async (
    req,
    res
) => {

    try {

        const {
            topicId
        } = req.params;


        // ============================================
        // GET TOPIC
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
        // CHECK EXISTING TEST
        // ============================================

        const existingTest =
            await pool.query(
                `SELECT
                    id,
                    topic_id,
                    title,
                    test_type,
                    difficulty,
                    total_questions,
                    passing_percentage,
                    is_mandatory,
                    created_at

                 FROM tests

                 WHERE topic_id = $1
                 AND test_type =
                    'topic_test'

                 ORDER BY
                    created_at ASC

                 LIMIT 1`,
                [
                    topicId
                ]
            );


        if (
            existingTest.rows.length > 0
        ) {

            return res.status(409).json({
                status: "error",

                message:
                    "A topic test already exists for this topic.",

                test:
                    existingTest.rows[0]
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
                [
                    topicId
                ]
            );


        if (
            learningResult.rows.length === 0
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Generate study notes before generating the topic test."
            });
        }


        const learningContent =
            learningResult.rows[0];


        // ============================================
        // GENERATE WITH GEMINI
        // ============================================

        const generatedTest =
            await generateTopicTest(
                topic,
                learningContent,
                10
            );


        if (
            !generatedTest ||
            !Array.isArray(
                generatedTest.questions
            ) ||
            generatedTest.questions.length === 0
        ) {

            return res.status(500).json({
                status: "error",
                message:
                    "AI did not generate a valid test."
            });
        }


        // ============================================
        // SAVE TEST + QUESTIONS
        // ============================================

        const client =
            await pool.connect();


        try {

            await client.query(
                "BEGIN"
            );


            // ========================================
            // FINAL DUPLICATE CHECK
            // ========================================

            const finalCheck =
                await client.query(
                    `SELECT id

                     FROM tests

                     WHERE topic_id = $1
                     AND test_type =
                        'topic_test'

                     LIMIT 1`,
                    [
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
                        "A topic test already exists for this topic."
                });
            }


            // ========================================
            // CREATE TEST
            // ========================================

            const testResult =
                await client.query(
                    `INSERT INTO tests
                    (
                        topic_id,
                        title,
                        test_type,
                        difficulty,
                        total_questions,
                        passing_percentage,
                        is_mandatory
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
                    )

                    RETURNING
                        id,
                        topic_id,
                        title,
                        test_type,
                        difficulty,
                        total_questions,
                        passing_percentage,
                        is_mandatory,
                        created_at`,
                    [
                        topicId,

                        generatedTest.title,

                        generatedTest.test_type,

                        generatedTest.difficulty,

                        generatedTest.total_questions,

                        generatedTest.passing_percentage,

                        true
                    ]
                );


            const test =
                testResult.rows[0];


            const savedQuestions =
                [];


            // ========================================
            // SAVE QUESTIONS
            // ========================================

            for (
                const question
                of generatedTest.questions
            ) {

                const questionResult =
                    await client.query(
                        `INSERT INTO questions
                        (
                            test_id,
                            question_text,
                            question_type,
                            option_a,
                            option_b,
                            option_c,
                            option_d,
                            correct_answer,
                            explanation,
                            difficulty,
                            topic_id
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
                            $10,
                            $11
                        )

                        RETURNING
                            id,
                            test_id,
                            question_text,
                            question_type,
                            option_a,
                            option_b,
                            option_c,
                            option_d,
                            correct_answer,
                            explanation,
                            difficulty,
                            topic_id,
                            created_at`,
                        [
                            test.id,

                            question.question_text,

                            question.question_type,

                            question.option_a,

                            question.option_b,

                            question.option_c,

                            question.option_d,

                            question.correct_answer,

                            question.explanation,

                            question.difficulty,

                            topicId
                        ]
                    );


                savedQuestions.push(
                    questionResult.rows[0]
                );
            }


            await client.query(
                "COMMIT"
            );


            return res.status(201).json({
                status: "success",

                message:
                    "Topic test generated successfully.",

                test,

                question_count:
                    savedQuestions.length
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
            "Generate test error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to generate topic test."
        });
    }
};


// ============================================
// GET TESTS FOR TOPIC
// ============================================

const getTestsByTopic = async (
    req,
    res
) => {

    try {

        const {
            topicId
        } = req.params;


        // ============================================
        // VERIFY TOPIC OWNERSHIP
        // ============================================

        const topicCheck =
            await pool.query(
                `SELECT
                    topics.id

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
            topicCheck.rows.length === 0
        ) {

            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this topic"
            });
        }


        // ============================================
        // GET TESTS
        // ============================================

        const result =
            await pool.query(
                `SELECT
                    id,
                    topic_id,
                    title,
                    test_type,
                    difficulty,
                    total_questions,
                    passing_percentage,
                    is_mandatory,
                    created_at

                 FROM tests

                 WHERE topic_id = $1

                 ORDER BY
                    created_at ASC`,
                [
                    topicId
                ]
            );


        return res.status(200).json({
            status: "success",

            count:
                result.rows.length,

            tests:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get tests error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to fetch tests"
        });
    }
};


// ============================================
// GET SINGLE TEST
// ============================================

const getTestById = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const result =
            await pool.query(
                `SELECT
                    tests.id,
                    tests.topic_id,
                    tests.title,
                    tests.test_type,
                    tests.difficulty,
                    tests.total_questions,
                    tests.passing_percentage,
                    tests.is_mandatory,
                    tests.created_at

                 FROM tests

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE tests.id = $1
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
                    "Test not found"
            });
        }


        return res.status(200).json({
            status: "success",

            test:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Get test error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to fetch test"
        });
    }
};


// ============================================
// GET SAFE TEST QUESTIONS
// ============================================

const getTestQuestions = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        // ============================================
        // GET TEST
        // ============================================

        const testResult =
            await pool.query(
                `SELECT
                    tests.id,
                    tests.topic_id,
                    tests.title,
                    tests.test_type,
                    tests.difficulty,
                    tests.total_questions,
                    tests.passing_percentage,
                    tests.is_mandatory

                 FROM tests

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE tests.id = $1
                 AND subjects.user_id = $2`,
                [
                    id,
                    req.user.userId
                ]
            );


        if (
            testResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Test not found or you do not have access to it"
            });
        }


        const test =
            testResult.rows[0];


        // ============================================
        // SAFE QUESTIONS
        // ============================================

        const questionsResult =
            await pool.query(
                `SELECT
                    id,
                    test_id,
                    topic_id,
                    question_text,
                    question_type,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    difficulty

                 FROM questions

                 WHERE test_id = $1

                 ORDER BY
                    id ASC`,
                [
                    id
                ]
            );


        if (
            questionsResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "No questions found for this test"
            });
        }


        return res.status(200).json({
            status: "success",

            test: {
                id:
                    test.id,

                topic_id:
                    test.topic_id,

                title:
                    test.title,

                test_type:
                    test.test_type,

                difficulty:
                    test.difficulty,

                total_questions:
                    test.total_questions,

                passing_percentage:
                    test.passing_percentage,

                is_mandatory:
                    test.is_mandatory
            },

            count:
                questionsResult.rows.length,

            questions:
                questionsResult.rows
        });


    } catch (error) {

        console.error(
            "Get test questions error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to fetch test questions"
        });
    }
};


// ============================================
// SUBMIT TEST
// ============================================

const submitTest = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            answers,
            time_taken_seconds
        } = req.body;


        // ============================================
        // VALIDATE SUBMISSION
        // ============================================

        if (
            !Array.isArray(
                answers
            ) ||
            answers.length === 0
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Test answers are required"
            });
        }


        // ============================================
        // VERIFY TEST OWNERSHIP
        // ============================================

        const testResult =
            await pool.query(
                `SELECT
                    tests.id,
                    tests.topic_id,
                    tests.title,
                    tests.total_questions,
                    tests.passing_percentage,

                    topics.chapter_id,
                    topics.topic_number

                 FROM tests

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE tests.id = $1
                 AND subjects.user_id = $2`,
                [
                    id,
                    req.user.userId
                ]
            );


        if (
            testResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Test not found or you do not have access to it"
            });
        }


        const test =
            testResult.rows[0];


        // ============================================
        // GET QUESTIONS
        // ============================================

        const questionsResult =
            await pool.query(
                `SELECT
                    id,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_answer,
                    explanation,
                    difficulty

                 FROM questions

                 WHERE test_id = $1

                 ORDER BY
                    id ASC`,
                [
                    id
                ]
            );


        const questions =
            questionsResult.rows;


        if (
            questions.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "No questions found for this test"
            });
        }


        // ============================================
        // VALIDATE QUESTION IDS + ANSWERS
        // ============================================

        const validQuestionIds =
            new Set(
                questions.map(
                    (
                        question
                    ) =>
                        Number(
                            question.id
                        )
                )
            );


        for (
            const answer
            of answers
        ) {

            if (
                !answer.question_id ||
                !validQuestionIds.has(
                    Number(
                        answer.question_id
                    )
                )
            ) {

                return res.status(400).json({
                    status: "error",
                    message:
                        "One or more submitted questions do not belong to this test."
                });
            }


            const selected =
                String(
                    answer.selected_answer ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            if (
                ![
                    "A",
                    "B",
                    "C",
                    "D"
                ].includes(
                    selected
                )
            ) {

                return res.status(400).json({
                    status: "error",
                    message:
                        "Each answer must be A, B, C or D."
                });
            }
        }


        // ============================================
        // PREVENT DUPLICATE ANSWERS
        // ============================================

        const submittedIds =
            answers.map(
                (
                    answer
                ) =>
                    Number(
                        answer.question_id
                    )
            );


        if (
            new Set(
                submittedIds
            ).size !==
            submittedIds.length
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Duplicate answers were submitted."
            });
        }


        // ============================================
        // REQUIRE ALL QUESTIONS
        // ============================================

        if (
            submittedIds.length !==
            questions.length
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Please answer all questions before submitting the test."
            });
        }


        // ============================================
        // BUILD ANSWER MAP
        // ============================================

        const answerMap =
            new Map();


        answers.forEach(
            (
                answer
            ) => {

                answerMap.set(
                    Number(
                        answer.question_id
                    ),

                    String(
                        answer.selected_answer
                    )
                        .trim()
                        .toUpperCase()
                );
            }
        );


        // ============================================
        // SCORE TEST
        // ============================================

        let score =
            0;


        const resultDetails =
            [];


        for (
            const question
            of questions
        ) {

            const selectedAnswer =
                answerMap.get(
                    Number(
                        question.id
                    )
                );


            const correctAnswer =
                String(
                    question.correct_answer
                )
                    .trim()
                    .toUpperCase();


            const isCorrect =
                selectedAnswer ===
                correctAnswer;


            if (
                isCorrect
            ) {

                score += 1;
            }


            resultDetails.push({
                question_id:
                    question.id,

                question_text:
                    question.question_text,

                selected_answer:
                    selectedAnswer,

                correct_answer:
                    correctAnswer,

                is_correct:
                    isCorrect,

                explanation:
                    question.explanation,

                difficulty:
                    question.difficulty
            });
        }


        const totalQuestions =
            questions.length;


        const percentage =
            Number(
                (
                    (
                        score /
                        totalQuestions
                    ) *
                    100
                ).toFixed(
                    2
                )
            );


        const passingPercentage =
            Number(
                test.passing_percentage
            );


        const passed =
            percentage >=
            passingPercentage;


        // ============================================
        // ATTEMPT NUMBER
        // ============================================

        const attemptResult =
            await pool.query(
                `SELECT

                    COALESCE(
                        MAX(
                            attempt_number
                        ),
                        0
                    ) AS last_attempt

                 FROM test_attempts

                 WHERE user_id = $1
                 AND test_id = $2`,
                [
                    req.user.userId,
                    id
                ]
            );


        const attemptNumber =
            Number(
                attemptResult
                    .rows[0]
                    .last_attempt
            ) + 1;


        // ============================================
        // TRANSACTION
        // ============================================

        const client =
            await pool.connect();


        try {

            await client.query(
                "BEGIN"
            );


            // ========================================
            // SAVE TEST ATTEMPT
            // ========================================

            const savedAttempt =
                await client.query(
                    `INSERT INTO test_attempts
                    (
                        user_id,
                        test_id,
                        score,
                        total_questions,
                        percentage,
                        completed,
                        time_taken_seconds,
                        attempt_number
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        TRUE,
                        $6,
                        $7
                    )

                    RETURNING
                        id,
                        user_id,
                        test_id,
                        score,
                        total_questions,
                        percentage,
                        completed,
                        time_taken_seconds,
                        attempt_number,
                        attempted_at`,
                    [
                        req.user.userId,

                        id,

                        score,

                        totalQuestions,

                        percentage,

                        Number(
                            time_taken_seconds
                        ) || 0,

                        attemptNumber
                    ]
                );


            const attempt =
                savedAttempt.rows[0];


            // ========================================
            // SAVE STUDENT ANSWERS
            // ========================================

            for (
                const detail
                of resultDetails
            ) {

                await client.query(
                    `INSERT INTO student_answers
                    (
                        attempt_id,
                        question_id,
                        selected_answer,
                        is_correct,
                        marks_obtained
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )`,
                    [
                        attempt.id,

                        detail.question_id,

                        detail.selected_answer,

                        detail.is_correct,

                        detail.is_correct
                            ? 1
                            : 0
                    ]
                );
            }


            // ========================================
            // GET PREVIOUS PROGRESS
            // ========================================

            const previousProgress =
                await client.query(
                    `SELECT
                        id,
                        latest_score,
                        best_score,
                        average_score,
                        total_attempts,
                        mastery_score,
                        times_revised

                     FROM progress

                     WHERE user_id = $1
                     AND topic_id = $2

                     LIMIT 1`,
                    [
                        req.user.userId,
                        test.topic_id
                    ]
                );


            let progressRecord;


            // ========================================
            // UPDATE EXISTING PROGRESS
            // ========================================

            if (
                previousProgress.rows.length >
                0
            ) {

                const previous =
                    previousProgress.rows[0];


                const previousAttempts =
                    Number(
                        previous.total_attempts
                    ) || 0;


                const previousAverage =
                    Number(
                        previous.average_score
                    ) || 0;


                const newTotalAttempts =
                    previousAttempts + 1;


                const newAverage =
                    Number(
                        (
                            (
                                (
                                    previousAverage *
                                    previousAttempts
                                ) +
                                percentage
                            ) /
                            newTotalAttempts
                        ).toFixed(
                            2
                        )
                    );


                const previousBest =
                    Number(
                        previous.best_score
                    ) || 0;


                const newBest =
                    Math.max(
                        previousBest,
                        percentage
                    );


                const masteryScore =
                    calculateMasteryScore(
                        percentage,
                        newAverage,
                        newBest
                    );


                const revisionRequired =
                    !passed ||
                    masteryScore < 70;


                const progressUpdate =
                    await client.query(
                        `UPDATE progress

                         SET
                            status = $1,
                            study_completed = TRUE,
                            test_completed = $2,
                            mastery_score = $3,
                            latest_score = $4,
                            best_score = $5,
                            average_score = $6,
                            total_attempts = $7,
                            revision_required = $8,
                            last_tested_at =
                                CURRENT_TIMESTAMP,
                            updated_at =
                                CURRENT_TIMESTAMP

                         WHERE id = $9

                         RETURNING *`,
                        [
                            passed
                                ? "completed"
                                : "in_progress",

                            passed,

                            masteryScore,

                            percentage,

                            newBest,

                            newAverage,

                            newTotalAttempts,

                            revisionRequired,

                            previous.id
                        ]
                    );


                progressRecord =
                    progressUpdate.rows[0];


            } else {

                // ====================================
                // FIRST PROGRESS RECORD
                // ====================================

                const firstMasteryScore =
                    calculateMasteryScore(
                        percentage,
                        percentage,
                        percentage
                    );


                const revisionRequired =
                    !passed ||
                    firstMasteryScore < 70;


                const progressInsert =
                    await client.query(
                        `INSERT INTO progress
                        (
                            user_id,
                            topic_id,
                            status,
                            study_completed,
                            test_completed,
                            mastery_score,
                            latest_score,
                            best_score,
                            average_score,
                            total_attempts,
                            revision_required,
                            times_revised,
                            last_studied_at,
                            last_tested_at
                        )

                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            TRUE,
                            $4,
                            $5,
                            $6,
                            $7,
                            $8,
                            1,
                            $9,
                            0,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )

                        RETURNING *`,
                        [
                            req.user.userId,

                            test.topic_id,

                            passed
                                ? "completed"
                                : "in_progress",

                            passed,

                            firstMasteryScore,

                            percentage,

                            percentage,

                            percentage,

                            revisionRequired
                        ]
                    );


                progressRecord =
                    progressInsert.rows[0];
            }


            // ========================================
            // FINAL MASTERY
            // ========================================

            const masteryScore =
                Number(
                    progressRecord
                        .mastery_score
                ) || 0;


            const masteryLevel =
                getMasteryLevel(
                    masteryScore
                );


            const weaknessLevel =
                getWeaknessLevel(
                    masteryScore
                );


            const needsRevision =
                !passed ||
                masteryScore < 70;


            // ========================================
            // SYNC FINAL REVISION FLAG
            // ========================================

            const refreshedProgress =
                await client.query(
                    `UPDATE progress

                     SET
                        revision_required = $1,
                        updated_at =
                            CURRENT_TIMESTAMP

                     WHERE id = $2

                     RETURNING *`,
                    [
                        needsRevision,

                        progressRecord.id
                    ]
                );


            progressRecord =
                refreshedProgress.rows[0];


            // ========================================
            // WEAK TOPIC / REVISION MANAGEMENT
            // ========================================

            if (
                needsRevision
            ) {

                const finalWeaknessLevel =
                    weaknessLevel ||
                    "low";


                // ====================================
                // UPSERT WEAK TOPIC
                // ====================================

                const existingWeak =
                    await client.query(
                        `SELECT id

                         FROM weak_topics

                         WHERE user_id = $1
                         AND topic_id = $2

                         LIMIT 1`,
                        [
                            req.user.userId,
                            test.topic_id
                        ]
                    );


                if (
                    existingWeak.rows.length >
                    0
                ) {

                    await client.query(
                        `UPDATE weak_topics

                         SET
                            average_score = $1,
                            weakness_level = $2,
                            detected_at =
                                CURRENT_TIMESTAMP

                         WHERE id = $3`,
                        [
                            progressRecord
                                .average_score,

                            finalWeaknessLevel,

                            existingWeak
                                .rows[0]
                                .id
                        ]
                    );


                } else {

                    await client.query(
                        `INSERT INTO weak_topics
                        (
                            user_id,
                            topic_id,
                            average_score,
                            weakness_level
                        )

                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4
                        )`,
                        [
                            req.user.userId,

                            test.topic_id,

                            progressRecord
                                .average_score,

                            finalWeaknessLevel
                        ]
                    );
                }


                // ====================================
                // SCHEDULE REVISION
                // ====================================

                const existingRevision =
                    await client.query(
                        `SELECT id

                         FROM revisions

                         WHERE user_id = $1
                         AND topic_id = $2
                         AND completed = FALSE

                         LIMIT 1`,
                        [
                            req.user.userId,
                            test.topic_id
                        ]
                    );


                if (
                    existingRevision.rows.length ===
                    0
                ) {

                    let revisionIntervalDays =
                        3;


                    if (
                        finalWeaknessLevel ===
                        "high"
                    ) {

                        revisionIntervalDays =
                            1;

                    } else if (
                        finalWeaknessLevel ===
                        "medium"
                    ) {

                        revisionIntervalDays =
                            2;
                    }


                    await client.query(
                        `INSERT INTO revisions
                        (
                            user_id,
                            topic_id,
                            scheduled_date,
                            revision_type,
                            completed,
                            score,
                            interval_days
                        )

                        VALUES
                        (
                            $1,
                            $2,
                            CURRENT_DATE + $3::INTEGER,
                            'weak_topic',
                            FALSE,
                            NULL,
                            $3
                        )`,
                        [
                            req.user.userId,

                            test.topic_id,

                            revisionIntervalDays
                        ]
                    );
                }


            } else {

                // ====================================
                // MASTERY RECOVERED
                // ====================================

                await client.query(
                    `DELETE FROM weak_topics

                     WHERE user_id = $1
                     AND topic_id = $2`,
                    [
                        req.user.userId,
                        test.topic_id
                    ]
                );


                // ====================================
                // COMPLETE OPEN REVISION
                // ====================================

                await client.query(
                    `UPDATE revisions

                     SET
                        completed = TRUE,
                        completed_at =
                            CURRENT_TIMESTAMP,
                        score = $3

                     WHERE user_id = $1
                     AND topic_id = $2
                     AND completed = FALSE`,
                    [
                        req.user.userId,

                        test.topic_id,

                        percentage
                    ]
                );
            }


            // ========================================
            // PASS HANDLING / UNLOCK NEXT TOPIC
            // ========================================

            let nextTopic =
                null;


            if (
                passed
            ) {

                const nextTopicResult =
                    await client.query(
                        `SELECT
                            id,
                            chapter_id,
                            name,
                            topic_number,
                            description,
                            estimated_minutes,
                            is_active

                         FROM topics

                         WHERE chapter_id = $1
                         AND topic_number > $2

                         ORDER BY
                            topic_number ASC

                         LIMIT 1`,
                        [
                            test.chapter_id,
                            test.topic_number
                        ]
                    );


                if (
                    nextTopicResult.rows.length >
                    0
                ) {

                    nextTopic =
                        nextTopicResult.rows[0];


                    // =================================
                    // UNLOCK NEXT TOPIC
                    // =================================

                    const unlocked =
                        await client.query(
                            `UPDATE topics

                             SET is_active = TRUE

                             WHERE id = $1

                             RETURNING
                                id,
                                chapter_id,
                                name,
                                topic_number,
                                description,
                                estimated_minutes,
                                is_active`,
                            [
                                nextTopic.id
                            ]
                        );


                    nextTopic =
                        unlocked.rows[0];
                }
            }


            // ========================================
            // COMMIT
            // ========================================

            await client.query(
                "COMMIT"
            );


            // ========================================
            // RESPONSE
            // ========================================

            return res.status(200).json({
                status: "success",


                message:
                    passed
                        ? nextTopic
                            ? needsRevision
                                ? "You passed the topic test and unlocked the next topic. StudyBuddy has also scheduled revision because your mastery score still needs reinforcement."
                                : "Congratulations! You passed the topic test. The next topic is now unlocked."
                            : needsRevision
                                ? "You passed the final topic test. StudyBuddy has scheduled revision because your mastery score still needs reinforcement."
                                : "Congratulations! You passed the topic test and completed the final topic in this chapter."
                        : "You did not reach the passing score. StudyBuddy marked this as a weak topic and scheduled revision before your next attempt.",


                attempt: {

                    id:
                        attempt.id,

                    attempt_number:
                        attempt.attempt_number,

                    score,

                    total_questions:
                        totalQuestions,

                    percentage,

                    passing_percentage:
                        passingPercentage,

                    passed,

                    time_taken_seconds:
                        attempt
                            .time_taken_seconds
                },


                progress: {

                    status:
                        progressRecord
                            .status,

                    mastery_score:
                        progressRecord
                            .mastery_score,

                    latest_score:
                        progressRecord
                            .latest_score,

                    best_score:
                        progressRecord
                            .best_score,

                    average_score:
                        progressRecord
                            .average_score,

                    total_attempts:
                        progressRecord
                            .total_attempts,

                    revision_required:
                        progressRecord
                            .revision_required,

                    mastery_level:
                        masteryLevel,

                    weakness_level:
                        needsRevision
                            ? (
                                weaknessLevel ||
                                "low"
                            )
                            : null
                },


                next_topic:
                    nextTopic,


                results:
                    resultDetails
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
            "Submit test error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to submit test."
        });
    }
};


// ============================================
// UPDATE TEST
// ============================================

const updateTest = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            title,
            test_type,
            difficulty,
            total_questions,
            passing_percentage,
            is_mandatory
        } = req.body;


        if (
            !title ||
            !title.trim()
        ) {

            return res.status(400).json({
                status: "error",
                message:
                    "Test title is required"
            });
        }


        // ============================================
        // VERIFY TEST OWNERSHIP
        // ============================================

        const testCheck =
            await pool.query(
                `SELECT
                    tests.id

                 FROM tests

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE tests.id = $1
                 AND subjects.user_id = $2`,
                [
                    id,
                    req.user.userId
                ]
            );


        if (
            testCheck.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Test not found"
            });
        }


        // ============================================
        // UPDATE
        // ============================================

        const result =
            await pool.query(
                `UPDATE tests

                 SET
                    title = $1,
                    test_type = $2,
                    difficulty = $3,
                    total_questions = $4,
                    passing_percentage = $5,
                    is_mandatory = $6

                 WHERE id = $7

                 RETURNING
                    id,
                    topic_id,
                    title,
                    test_type,
                    difficulty,
                    total_questions,
                    passing_percentage,
                    is_mandatory,
                    created_at`,
                [
                    title.trim(),

                    test_type ||
                    "topic_test",

                    difficulty ||
                    "adaptive",

                    total_questions
                        ? Number(
                            total_questions
                        )
                        : 10,

                    passing_percentage
                        ? Number(
                            passing_percentage
                        )
                        : 70,

                    is_mandatory ===
                    undefined
                        ? true
                        : Boolean(
                            is_mandatory
                        ),

                    id
                ]
            );


        return res.status(200).json({
            status: "success",

            message:
                "Test updated successfully",

            test:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Update test error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to update test"
        });
    }
};


// ============================================
// DELETE TEST
// ============================================

const deleteTest = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const result =
            await pool.query(
                `DELETE FROM tests

                 WHERE id = $1

                 AND topic_id IN
                 (
                    SELECT
                        topics.id

                    FROM topics

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

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
                    "Test not found"
            });
        }


        return res.status(200).json({
            status: "success",
            message:
                "Test deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete test error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to delete test"
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {

    createTest,

    generateTest,

    getTestsByTopic,

    getTestById,

    getTestQuestions,

    submitTest,

    updateTest,

    deleteTest
};