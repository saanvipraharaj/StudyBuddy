const pool =
    require("../config/db");


// ============================================
// GET MISTAKE BANK
// ============================================

const getMistakes = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        const result =
            await pool.query(
                `SELECT
                    student_answers.id
                        AS student_answer_id,

                    student_answers.attempt_id,

                    student_answers.question_id,

                    student_answers.selected_answer,

                    student_answers.is_correct,

                    student_answers.marks_obtained,

                    test_attempts.test_id,

                    test_attempts.attempt_number,

                    test_attempts.percentage
                        AS attempt_percentage,

                    test_attempts.attempted_at,

                    tests.title
                        AS test_title,

                    tests.topic_id,

                    questions.question_text,

                    questions.question_type,

                    questions.option_a,

                    questions.option_b,

                    questions.option_c,

                    questions.option_d,

                    questions.correct_answer,

                    questions.explanation,

                    questions.difficulty,

                    topics.name
                        AS topic_name,

                    topics.topic_number,

                    topics.chapter_id,

                    chapters.name
                        AS chapter_name,

                    chapters.chapter_number,

                    chapters.subject_id,

                    subjects.name
                        AS subject_name

                 FROM student_answers

                 INNER JOIN test_attempts
                    ON student_answers.attempt_id =
                       test_attempts.id

                 INNER JOIN tests
                    ON test_attempts.test_id =
                       tests.id

                 INNER JOIN questions
                    ON student_answers.question_id =
                       questions.id

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE test_attempts.user_id =
                    $1

                 AND student_answers.is_correct =
                    FALSE

                 ORDER BY
                    test_attempts.attempted_at DESC,
                    student_answers.id DESC`,
                [
                    userId
                ]
            );


        // ============================================
        // FORMAT RESULTS
        // ============================================

        const mistakes =
            result.rows.map(
                (
                    mistake
                ) => {

                    const options = {

                        A:
                            mistake.option_a,

                        B:
                            mistake.option_b,

                        C:
                            mistake.option_c,

                        D:
                            mistake.option_d
                    };


                    const selectedKey =
                        String(
                            mistake.selected_answer ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    const correctKey =
                        String(
                            mistake.correct_answer ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    return {

                        id:
                            mistake.student_answer_id,

                        attempt_id:
                            mistake.attempt_id,

                        question_id:
                            mistake.question_id,

                        test_id:
                            mistake.test_id,

                        topic_id:
                            mistake.topic_id,

                        chapter_id:
                            mistake.chapter_id,

                        subject_id:
                            mistake.subject_id,


                        subject_name:
                            mistake.subject_name,

                        chapter_name:
                            mistake.chapter_name,

                        chapter_number:
                            mistake.chapter_number,

                        topic_name:
                            mistake.topic_name,

                        topic_number:
                            mistake.topic_number,

                        test_title:
                            mistake.test_title,


                        question_text:
                            mistake.question_text,

                        difficulty:
                            mistake.difficulty,


                        selected_answer:
                            selectedKey,

                        selected_answer_text:
                            options[
                                selectedKey
                            ] || "",


                        correct_answer:
                            correctKey,

                        correct_answer_text:
                            options[
                                correctKey
                            ] || "",


                        explanation:
                            mistake.explanation ||
                            "",


                        attempt_number:
                            Number(
                                mistake.attempt_number ||
                                1
                            ),

                        attempt_percentage:
                            Number(
                                mistake.attempt_percentage ||
                                0
                            ),

                        attempted_at:
                            mistake.attempted_at
                    };
                }
            );


        return res.status(200).json({

            status:
                "success",

            count:
                mistakes.length,

            mistakes
        });


    } catch (error) {

        console.error(
            "Get mistake bank error:",
            error
        );


        return res.status(500).json({

            status:
                "error",

            message:
                "Unable to load mistake bank."
        });
    }
};


// ============================================
// GET MISTAKES FOR A TOPIC
// ============================================

const getMistakesByTopic = async (
    req,
    res
) => {

    try {

        const {
            topicId
        } = req.params;


        const userId =
            req.user.userId;


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
                    userId
                ]
            );


        if (
            topicCheck.rows.length ===
            0
        ) {

            return res.status(404).json({

                status:
                    "error",

                message:
                    "Topic not found."
            });
        }


        // ============================================
        // GET TOPIC MISTAKES
        // ============================================

        const result =
            await pool.query(
                `SELECT
                    student_answers.id
                        AS student_answer_id,

                    student_answers.attempt_id,

                    student_answers.question_id,

                    student_answers.selected_answer,

                    test_attempts.attempt_number,

                    test_attempts.percentage
                        AS attempt_percentage,

                    test_attempts.attempted_at,

                    questions.question_text,

                    questions.option_a,

                    questions.option_b,

                    questions.option_c,

                    questions.option_d,

                    questions.correct_answer,

                    questions.explanation,

                    questions.difficulty,

                    topics.name
                        AS topic_name,

                    chapters.name
                        AS chapter_name,

                    subjects.name
                        AS subject_name

                 FROM student_answers

                 INNER JOIN test_attempts
                    ON student_answers.attempt_id =
                       test_attempts.id

                 INNER JOIN tests
                    ON test_attempts.test_id =
                       tests.id

                 INNER JOIN questions
                    ON student_answers.question_id =
                       questions.id

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE test_attempts.user_id =
                    $1

                 AND tests.topic_id =
                    $2

                 AND student_answers.is_correct =
                    FALSE

                 ORDER BY
                    test_attempts.attempted_at DESC`,
                [
                    userId,
                    topicId
                ]
            );


        const mistakes =
            result.rows.map(
                (
                    mistake
                ) => {

                    const options = {

                        A:
                            mistake.option_a,

                        B:
                            mistake.option_b,

                        C:
                            mistake.option_c,

                        D:
                            mistake.option_d
                    };


                    const selected =
                        String(
                            mistake.selected_answer ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    const correct =
                        String(
                            mistake.correct_answer ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    return {

                        id:
                            mistake.student_answer_id,

                        attempt_id:
                            mistake.attempt_id,

                        question_id:
                            mistake.question_id,

                        topic_id:
                            Number(
                                topicId
                            ),


                        subject_name:
                            mistake.subject_name,

                        chapter_name:
                            mistake.chapter_name,

                        topic_name:
                            mistake.topic_name,


                        question_text:
                            mistake.question_text,

                        difficulty:
                            mistake.difficulty,


                        selected_answer:
                            selected,

                        selected_answer_text:
                            options[
                                selected
                            ] || "",


                        correct_answer:
                            correct,

                        correct_answer_text:
                            options[
                                correct
                            ] || "",


                        explanation:
                            mistake.explanation ||
                            "",


                        attempt_number:
                            Number(
                                mistake.attempt_number ||
                                1
                            ),

                        attempt_percentage:
                            Number(
                                mistake.attempt_percentage ||
                                0
                            ),

                        attempted_at:
                            mistake.attempted_at
                    };
                }
            );


        return res.status(200).json({

            status:
                "success",

            count:
                mistakes.length,

            mistakes
        });


    } catch (error) {

        console.error(
            "Get topic mistakes error:",
            error
        );


        return res.status(500).json({

            status:
                "error",

            message:
                "Unable to load topic mistakes."
        });
    }
};


// ============================================
// GET MISTAKE SUMMARY
// ============================================

const getMistakeSummary = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        // ============================================
        // GENERAL SUMMARY
        // ============================================

        const summaryResult =
            await pool.query(
                `SELECT

                    COUNT(*)
                        AS total_mistakes,

                    COUNT(
                        DISTINCT tests.topic_id
                    )
                        AS affected_topics,

                    COUNT(
                        DISTINCT chapters.id
                    )
                        AS affected_chapters,

                    COUNT(
                        DISTINCT subjects.id
                    )
                        AS affected_subjects

                 FROM student_answers

                 INNER JOIN test_attempts
                    ON student_answers.attempt_id =
                       test_attempts.id

                 INNER JOIN tests
                    ON test_attempts.test_id =
                       tests.id

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE test_attempts.user_id =
                    $1

                 AND student_answers.is_correct =
                    FALSE`,
                [
                    userId
                ]
            );


        // ============================================
        // MOST DIFFICULT TOPICS
        // ============================================

        const weakTopicResult =
            await pool.query(
                `SELECT
                    topics.id
                        AS topic_id,

                    topics.name
                        AS topic_name,

                    subjects.name
                        AS subject_name,

                    COUNT(*)
                        AS mistake_count

                 FROM student_answers

                 INNER JOIN test_attempts
                    ON student_answers.attempt_id =
                       test_attempts.id

                 INNER JOIN tests
                    ON test_attempts.test_id =
                       tests.id

                 INNER JOIN topics
                    ON tests.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE test_attempts.user_id =
                    $1

                 AND student_answers.is_correct =
                    FALSE

                 GROUP BY
                    topics.id,
                    topics.name,
                    subjects.name

                 ORDER BY
                    mistake_count DESC

                 LIMIT 5`,
                [
                    userId
                ]
            );


        const summary =
            summaryResult.rows[0];


        return res.status(200).json({

            status:
                "success",

            summary: {

                total_mistakes:
                    Number(
                        summary.total_mistakes ||
                        0
                    ),

                affected_topics:
                    Number(
                        summary.affected_topics ||
                        0
                    ),

                affected_chapters:
                    Number(
                        summary.affected_chapters ||
                        0
                    ),

                affected_subjects:
                    Number(
                        summary.affected_subjects ||
                        0
                    )
            },

            most_difficult_topics:
                weakTopicResult.rows.map(
                    (
                        topic
                    ) => ({

                        ...topic,

                        mistake_count:
                            Number(
                                topic.mistake_count ||
                                0
                            )
                    })
                )
        });


    } catch (error) {

        console.error(
            "Get mistake summary error:",
            error
        );


        return res.status(500).json({

            status:
                "error",

            message:
                "Unable to load mistake summary."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {

    getMistakes,

    getMistakesByTopic,

    getMistakeSummary
};