const pool =
    require("../config/db");


// ============================================================
// HELPERS
// ============================================================

const clamp = (
    value,
    min = 0,
    max = 100
) => {

    return Math.min(
        Math.max(
            Number(value) || 0,
            min
        ),
        max
    );
};


const round = (
    value
) => {

    return Math.round(
        Number(value) || 0
    );
};


// ============================================================
// DATE HELPER
// ============================================================

const getDaysUntilExam = (
    examDate
) => {

    if (!examDate) {
        return null;
    }


    const date =
        new Date(
            String(examDate).slice(
                0,
                10
            ) +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    date.setHours(
        0,
        0,
        0,
        0
    );


    return Math.ceil(
        (
            date.getTime() -
            today.getTime()
        ) /
        (
            1000 *
            60 *
            60 *
            24
        )
    );
};


// ============================================================
// GET READINESS FOR ALL UPCOMING EXAMS
// ============================================================

const getExamReadiness = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        // ====================================================
        // UPCOMING EXAMS
        // ====================================================

        const examsResult =
            await pool.query(
                `
                SELECT
                    exams.id,
                    exams.subject_id,
                    exams.exam_group_id,
                    exams.exam_name,
                    exams.exam_date,
                    exams.exam_time,
                    exams.priority,
                    exams.exam_type,
                    exams.custom_exam_type,

                    subjects.name
                        AS subject_name,

                    exam_groups.group_name

                FROM exams

                INNER JOIN subjects
                    ON exams.subject_id =
                       subjects.id

                LEFT JOIN exam_groups
                    ON exams.exam_group_id =
                       exam_groups.id

                WHERE
                    exams.user_id = $1

                AND
                    exams.exam_date >=
                    CURRENT_DATE

                ORDER BY
                    exams.exam_date ASC,
                    exams.exam_time ASC
                `,
                [
                    userId
                ]
            );


        const exams =
            examsResult.rows;


        if (
            exams.length === 0
        ) {

            return res.status(
                200
            ).json({

                status:
                    "success",

                overall_readiness:
                    0,

                exam_count:
                    0,

                exams:
                    [],

                message:
                    "No upcoming exams found."
            });
        }


        // ====================================================
        // PROCESS EACH EXAM
        // ====================================================

        const readinessResults =
            [];


        for (
            const exam
            of exams
        ) {

            const subjectId =
                Number(
                    exam.subject_id
                );


            // =================================================
            // TOPICS + PROGRESS
            // =================================================

            const topicsResult =
                await pool.query(
                    `
                    SELECT
                        topics.id,
                        topics.name,
                        topics.topic_number,
                        topics.estimated_minutes,
                        topics.is_active,

                        chapters.id
                            AS chapter_id,

                        chapters.name
                            AS chapter_name,

                        progress.mastery_score,
                        progress.latest_score,
                        progress.best_score,
                        progress.average_score,
                        progress.total_attempts,
                        progress.revision_required

                    FROM topics

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

                    LEFT JOIN progress
                        ON progress.topic_id =
                           topics.id

                    AND progress.user_id =
                        $2

                    WHERE
                        chapters.subject_id =
                        $1

                    ORDER BY
                        chapters.chapter_number ASC,
                        topics.topic_number ASC
                    `,
                    [
                        subjectId,
                        userId
                    ]
                );


            const topics =
                topicsResult.rows;


            const totalTopics =
                topics.length;


            // =================================================
            // PASSED TOPICS
            // =================================================

            const passedResult =
                await pool.query(
                    `
                    SELECT DISTINCT
                        tests.topic_id

                    FROM test_attempts

                    INNER JOIN tests
                        ON test_attempts.test_id =
                           tests.id

                    INNER JOIN topics
                        ON tests.topic_id =
                           topics.id

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

                    WHERE
                        test_attempts.user_id =
                        $1

                    AND
                        test_attempts.completed =
                        TRUE

                    AND
                        test_attempts.percentage >=
                        tests.passing_percentage

                    AND
                        chapters.subject_id =
                        $2
                    `,
                    [
                        userId,
                        subjectId
                    ]
                );


            const passedTopicIds =
                new Set(
                    passedResult.rows.map(
                        row =>
                            Number(
                                row.topic_id
                            )
                    )
                );


            const passedTopics =
                passedTopicIds.size;


            // =================================================
            // SYLLABUS COMPLETION
            // =================================================

            const syllabusCompletion =
                totalTopics > 0
                    ? (
                        passedTopics /
                        totalTopics
                    ) * 100
                    : 0;


            // =================================================
            // MASTERY
            // =================================================

            const masteryValues =
                topics
                    .map(
                        topic =>
                            Number(
                                topic.mastery_score
                            )
                    )
                    .filter(
                        value =>
                            Number.isFinite(
                                value
                            )
                    );


            const averageMastery =
                masteryValues.length > 0
                    ? (
                        masteryValues.reduce(
                            (
                                total,
                                value
                            ) =>
                                total +
                                value,
                            0
                        ) /
                        masteryValues.length
                    )
                    : 0;


            // =================================================
            // TEST PERFORMANCE
            // =================================================

            const testResult =
                await pool.query(
                    `
                    SELECT

                        COUNT(*)
                            AS attempt_count,

                        COALESCE(
                            AVG(
                                test_attempts.percentage
                            ),
                            0
                        ) AS average_percentage,

                        COALESCE(
                            MAX(
                                test_attempts.percentage
                            ),
                            0
                        ) AS best_percentage

                    FROM test_attempts

                    INNER JOIN tests
                        ON test_attempts.test_id =
                           tests.id

                    INNER JOIN topics
                        ON tests.topic_id =
                           topics.id

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

                    WHERE
                        test_attempts.user_id =
                        $1

                    AND
                        chapters.subject_id =
                        $2

                    AND
                        test_attempts.completed =
                        TRUE
                    `,
                    [
                        userId,
                        subjectId
                    ]
                );


            const testStats =
                testResult.rows[0];


            const averageTestScore =
                Number(
                    testStats.average_percentage
                ) || 0;


            const testAttempts =
                Number(
                    testStats.attempt_count
                ) || 0;


            // =================================================
            // WEAK TOPICS
            // =================================================

            const weakResult =
                await pool.query(
                    `
                    SELECT
                        weak_topics.topic_id,
                        weak_topics.average_score,
                        weak_topics.weakness_level,

                        topics.name
                            AS topic_name

                    FROM weak_topics

                    INNER JOIN topics
                        ON weak_topics.topic_id =
                           topics.id

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

                    WHERE
                        weak_topics.user_id =
                        $1

                    AND
                        chapters.subject_id =
                        $2
                    `,
                    [
                        userId,
                        subjectId
                    ]
                );


            const weakTopics =
                weakResult.rows;


            const weakTopicCount =
                weakTopics.length;


            const weakPenalty =
                totalTopics > 0
                    ? Math.min(
                        (
                            weakTopicCount /
                            totalTopics
                        ) *
                        30,
                        30
                    )
                    : 0;


            // =================================================
            // REVISION PERFORMANCE
            // =================================================

            let revisionScore =
                100;


            try {

                const revisionResult =
                    await pool.query(
                        `
                        SELECT

                            COUNT(*)
                                AS total,

                            COUNT(*)
                                FILTER (
                                    WHERE completed = TRUE
                                )
                                AS completed

                        FROM revisions

                        INNER JOIN topics
                            ON revisions.topic_id =
                               topics.id

                        INNER JOIN chapters
                            ON topics.chapter_id =
                               chapters.id

                        WHERE
                            revisions.user_id =
                            $1

                        AND
                            chapters.subject_id =
                            $2
                        `,
                        [
                            userId,
                            subjectId
                        ]
                    );


                const revision =
                    revisionResult.rows[0];


                const revisionTotal =
                    Number(
                        revision.total
                    ) || 0;


                const revisionCompleted =
                    Number(
                        revision.completed
                    ) || 0;


                if (
                    revisionTotal > 0
                ) {

                    revisionScore =
                        (
                            revisionCompleted /
                            revisionTotal
                        ) *
                        100;
                }


            } catch (
                revisionError
            ) {

                console.log(
                    "Revision readiness skipped:",
                    revisionError.message
                );


                revisionScore =
                    100;
            }


            // =================================================
            // FLASHCARD PERFORMANCE
            // =================================================

            const flashcardResult =
                await pool.query(
                    `
                    SELECT

                        COALESCE(
                            SUM(
                                flashcards.correct_count
                            ),
                            0
                        ) AS correct,

                        COALESCE(
                            SUM(
                                flashcards.incorrect_count
                            ),
                            0
                        ) AS incorrect,

                        COALESCE(
                            SUM(
                                flashcards.review_count
                            ),
                            0
                        ) AS reviews

                    FROM flashcards

                    INNER JOIN topics
                        ON flashcards.topic_id =
                           topics.id

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

                    WHERE
                        flashcards.user_id =
                        $1

                    AND
                        chapters.subject_id =
                        $2
                    `,
                    [
                        userId,
                        subjectId
                    ]
                );


            const flashcardStats =
                flashcardResult.rows[0];


            const flashCorrect =
                Number(
                    flashcardStats.correct
                ) || 0;


            const flashIncorrect =
                Number(
                    flashcardStats.incorrect
                ) || 0;


            const flashTotal =
                flashCorrect +
                flashIncorrect;


            const flashcardScore =
                flashTotal > 0
                    ? (
                        flashCorrect /
                        flashTotal
                    ) * 100
                    : 50;


            // =================================================
            // STUDY PLAN PROGRESS
            // =================================================

            const planResult =
                await pool.query(
                    `
                    SELECT

                        COUNT(
                            study_plan_tasks.id
                        )
                            AS total_tasks,

                        COUNT(
                            study_plan_tasks.id
                        )
                            FILTER (
                                WHERE
                                    study_plan_tasks.completed =
                                    TRUE
                            )
                            AS completed_tasks

                    FROM study_plan_tasks

                    INNER JOIN study_plans
                        ON study_plan_tasks.study_plan_id =
                           study_plans.id

                    INNER JOIN topics
                        ON study_plan_tasks.topic_id =
                           topics.id

                    INNER JOIN chapters
                        ON topics.chapter_id =
                           chapters.id

                    WHERE
                        study_plans.user_id =
                        $1

                    AND
                        chapters.subject_id =
                        $2

                    AND
                        study_plans.status IN
                        (
                            'active',
                            'completed'
                        )
                    `,
                    [
                        userId,
                        subjectId
                    ]
                );


            const planStats =
                planResult.rows[0];


            const totalPlanTasks =
                Number(
                    planStats.total_tasks
                ) || 0;


            const completedPlanTasks =
                Number(
                    planStats.completed_tasks
                ) || 0;


            const studyPlanScore =
                totalPlanTasks > 0
                    ? (
                        completedPlanTasks /
                        totalPlanTasks
                    ) * 100
                    : syllabusCompletion;


            // =================================================
            // DAYS LEFT
            // =================================================

            const daysLeft =
                getDaysUntilExam(
                    exam.exam_date
                );


            // =================================================
            // TIME PRESSURE SCORE
            // =================================================

            let timeScore =
                100;


            if (
                daysLeft !== null
            ) {

                if (
                    daysLeft <= 1
                ) {

                    timeScore =
                        35;

                } else if (
                    daysLeft <= 3
                ) {

                    timeScore =
                        50;

                } else if (
                    daysLeft <= 7
                ) {

                    timeScore =
                        70;

                } else if (
                    daysLeft <= 14
                ) {

                    timeScore =
                        85;
                }
            }


            // =================================================
            // FINAL READINESS SCORE
            // =================================================
            //
            // Mastery            25%
            // Tests              20%
            // Syllabus           20%
            // Study Plan         15%
            // Revision           10%
            // Flashcards          5%
            // Time                5%
            //
            // Weak topics reduce score.
            // =================================================

            const baseReadiness =
                (
                    clamp(
                        averageMastery
                    ) *
                    0.25
                ) +

                (
                    clamp(
                        averageTestScore
                    ) *
                    0.20
                ) +

                (
                    clamp(
                        syllabusCompletion
                    ) *
                    0.20
                ) +

                (
                    clamp(
                        studyPlanScore
                    ) *
                    0.15
                ) +

                (
                    clamp(
                        revisionScore
                    ) *
                    0.10
                ) +

                (
                    clamp(
                        flashcardScore
                    ) *
                    0.05
                ) +

                (
                    clamp(
                        timeScore
                    ) *
                    0.05
                );


            const readinessScore =
                clamp(
                    baseReadiness -
                    weakPenalty
                );


            // =================================================
            // READINESS LEVEL
            // =================================================

            let readinessLevel =
                "Needs Work";


            if (
                readinessScore >=
                85
            ) {

                readinessLevel =
                    "Exam Ready";

            } else if (
                readinessScore >=
                70
            ) {

                readinessLevel =
                    "On Track";

            } else if (
                readinessScore >=
                50
            ) {

                readinessLevel =
                    "Needs Revision";
            }


            // =================================================
            // AI-LIKE RECOMMENDATION
            // =================================================

            let recommendation =
                "";


            if (
                readinessScore >=
                85
            ) {

                recommendation =
                    "You're in a strong position. Focus on quick revision, flashcards and maintaining accuracy.";

            } else if (
                weakTopicCount >
                0
            ) {

                recommendation =
                    `Focus on your ${weakTopicCount} weak ${
                        weakTopicCount === 1
                            ? "topic"
                            : "topics"
                    } and complete pending revisions before the exam.`;

            } else if (
                syllabusCompletion <
                70
            ) {

                recommendation =
                    "Prioritize syllabus completion and mandatory topic tests before increasing revision time.";

            } else if (
                averageTestScore <
                70
            ) {

                recommendation =
                    "Your syllabus progress is reasonable, but test performance needs improvement. Practice more mastery tests.";

            } else {

                recommendation =
                    "You are progressing well. Continue following your study timetable and revise consistently.";
            }


            // =================================================
            // SAVE / UPDATE READINESS
            // Optional — will not break if table differs
            // =================================================

            try {

                await pool.query(
                    `
                    INSERT INTO exam_readiness
                    (
                        user_id,
                        exam_id,
                        readiness_score,
                        calculated_at
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        CURRENT_TIMESTAMP
                    )

                    ON CONFLICT
                    (
                        user_id,
                        exam_id
                    )

                    DO UPDATE SET

                        readiness_score =
                            EXCLUDED.readiness_score,

                        calculated_at =
                            CURRENT_TIMESTAMP
                    `,
                    [
                        userId,
                        exam.id,
                        round(
                            readinessScore
                        )
                    ]
                );


            } catch (
                saveError
            ) {

                /*
                    Readiness calculation should
                    still work if the existing
                    exam_readiness table has a
                    different schema.
                */

                console.log(
                    "Exam readiness save skipped:",
                    saveError.message
                );
            }


            // =================================================
            // RESULT
            // =================================================

            readinessResults.push({

                exam_id:
                    Number(
                        exam.id
                    ),

                exam_group_id:
                    exam.exam_group_id
                        ? Number(
                            exam.exam_group_id
                        )
                        : null,

                subject_id:
                    subjectId,

                subject_name:
                    exam.subject_name,

                exam_name:
                    exam.exam_name,

                exam_date:
                    exam.exam_date,

                exam_time:
                    exam.exam_time,

                priority:
                    exam.priority,

                group_name:
                    exam.group_name,

                days_left:
                    daysLeft,

                readiness_score:
                    round(
                        readinessScore
                    ),

                readiness_level:
                    readinessLevel,

                recommendation,

                metrics: {

                    total_topics:
                        totalTopics,

                    passed_topics:
                        passedTopics,

                    syllabus_completion:
                        round(
                            syllabusCompletion
                        ),

                    average_mastery:
                        round(
                            averageMastery
                        ),

                    average_test_score:
                        round(
                            averageTestScore
                        ),

                    test_attempts:
                        testAttempts,

                    weak_topics:
                        weakTopicCount,

                    revision_score:
                        round(
                            revisionScore
                        ),

                    flashcard_score:
                        round(
                            flashcardScore
                        ),

                    study_plan_score:
                        round(
                            studyPlanScore
                        )
                },

                weak_topics:
                    weakTopics.map(
                        topic => ({

                            topic_id:
                                Number(
                                    topic.topic_id
                                ),

                            topic_name:
                                topic.topic_name,

                            average_score:
                                Number(
                                    topic.average_score
                                ) || 0,

                            weakness_level:
                                topic.weakness_level
                        })
                    )
            });
        }


        // ====================================================
        // OVERALL READINESS
        // ====================================================

        const overallReadiness =
            readinessResults.length > 0
                ? round(
                    readinessResults.reduce(
                        (
                            total,
                            exam
                        ) =>
                            total +
                            exam.readiness_score,
                        0
                    ) /
                    readinessResults.length
                )
                : 0;


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.status(
            200
        ).json({

            status:
                "success",

            overall_readiness:
                overallReadiness,

            exam_count:
                readinessResults.length,

            exams:
                readinessResults
        });


    } catch (error) {

        console.error(
            "Exam readiness error:",
            error
        );


        return res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to calculate exam readiness."
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    getExamReadiness
};