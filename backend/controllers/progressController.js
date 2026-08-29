const pool = require("../config/db");


// ============================================
// GET USER OVERALL PROGRESS
// ============================================

const getOverallProgress = async (req, res) => {
    try {

        const userId =
            req.user.userId;


        // ============================================
        // GET ALL USER TOPICS
        // ============================================

        const topicsResult =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.name,
                    topics.topic_number,
                    topics.is_active,
                    topics.chapter_id,

                    chapters.name
                        AS chapter_name,

                    chapters.subject_id,

                    subjects.name
                        AS subject_name

                 FROM topics

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE subjects.user_id = $1

                 ORDER BY
                    subjects.id ASC,
                    chapters.chapter_number ASC,
                    topics.topic_number ASC`,
                [userId]
            );


        const topics =
            topicsResult.rows;


        // ============================================
        // NO TOPICS YET
        // ============================================

        if (topics.length === 0) {

            return res.status(200).json({
                status: "success",

                progress: {
                    total_topics: 0,
                    completed_topics: 0,
                    in_progress_topics: 0,
                    remaining_topics: 0,
                    completion_percentage: 0,
                    average_mastery: 0
                },

                chart: {
                    completed: 0,
                    in_progress: 0,
                    remaining: 0
                },

                subjects: []
            });
        }


        // ============================================
        // GET TEST / PROGRESS INFORMATION
        // ============================================

        const progressResult =
            await pool.query(
                `SELECT
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

                 FROM progress

                 WHERE user_id = $1`,
                [userId]
            );


        const progressRows =
            progressResult.rows;


        const progressMap =
            new Map();


        progressRows.forEach(
            (row) => {

                progressMap.set(
                    Number(row.topic_id),
                    row
                );

            }
        );


        // ============================================
        // GET PASSED TESTS
        // ============================================

        const passedTestsResult =
            await pool.query(
                `SELECT DISTINCT
                    tests.topic_id

                 FROM test_attempts

                 INNER JOIN tests
                    ON test_attempts.test_id =
                       tests.id

                 WHERE
                    test_attempts.user_id = $1

                 AND test_attempts.completed = TRUE

                 AND test_attempts.percentage >=
                     tests.passing_percentage`,
                [userId]
            );


        const passedTopicIds =
            new Set(
                passedTestsResult.rows.map(
                    (row) =>
                        Number(row.topic_id)
                )
            );


        // ============================================
        // CALCULATE TOPIC STATUS
        // ============================================

        let completedTopics = 0;
        let inProgressTopics = 0;
        let remainingTopics = 0;

        let masteryTotal = 0;
        let masteryCount = 0;


        const topicProgress =
            topics.map(
                (topic) => {

                    const progress =
                        progressMap.get(
                            Number(topic.id)
                        );


                    const passed =
                        passedTopicIds.has(
                            Number(topic.id)
                        );


                    let status =
                        "remaining";


                    if (passed) {

                        status =
                            "completed";

                        completedTopics += 1;

                    } else if (
                        topic.is_active
                    ) {

                        status =
                            "in_progress";

                        inProgressTopics += 1;

                    } else {

                        remainingTopics += 1;
                    }


                    const masteryScore =
                        progress?.mastery_score !==
                            null &&
                        progress?.mastery_score !==
                            undefined

                            ? Number(
                                progress.mastery_score
                            )

                            : passed
                                ? Number(
                                    progress?.best_score ||
                                    progress?.latest_score ||
                                    100
                                )

                                : 0;


                    if (
                        Number.isFinite(
                            masteryScore
                        ) &&
                        masteryScore > 0
                    ) {

                        masteryTotal +=
                            masteryScore;

                        masteryCount += 1;
                    }


                    return {

                        id:
                            topic.id,

                        name:
                            topic.name,

                        topic_number:
                            topic.topic_number,

                        chapter_id:
                            topic.chapter_id,

                        chapter_name:
                            topic.chapter_name,

                        subject_id:
                            topic.subject_id,

                        subject_name:
                            topic.subject_name,

                        is_active:
                            topic.is_active,

                        status,

                        mastery_score:
                            masteryScore,

                        latest_score:
                            progress?.latest_score
                                ? Number(
                                    progress.latest_score
                                )
                                : null,

                        best_score:
                            progress?.best_score
                                ? Number(
                                    progress.best_score
                                )
                                : null,

                        average_score:
                            progress?.average_score
                                ? Number(
                                    progress.average_score
                                )
                                : null,

                        total_attempts:
                            Number(
                                progress?.total_attempts ||
                                0
                            ),

                        revision_required:
                            Boolean(
                                progress?.revision_required
                            )
                    };

                }
            );


        const totalTopics =
            topics.length;


        const completionPercentage =
            Number(
                (
                    (
                        completedTopics /
                        totalTopics
                    ) * 100
                ).toFixed(2)
            );


        const averageMastery =
            masteryCount > 0

                ? Number(
                    (
                        masteryTotal /
                        masteryCount
                    ).toFixed(2)
                )

                : 0;


        // ============================================
        // SUBJECT PROGRESS
        // ============================================

        const subjectMap =
            new Map();


        topicProgress.forEach(
            (topic) => {

                const subjectId =
                    Number(
                        topic.subject_id
                    );


                if (
                    !subjectMap.has(
                        subjectId
                    )
                ) {

                    subjectMap.set(
                        subjectId,
                        {
                            subject_id:
                                subjectId,

                            subject_name:
                                topic.subject_name,

                            total_topics:
                                0,

                            completed_topics:
                                0,

                            in_progress_topics:
                                0,

                            remaining_topics:
                                0,

                            mastery_total:
                                0,

                            mastery_count:
                                0
                        }
                    );
                }


                const subject =
                    subjectMap.get(
                        subjectId
                    );


                subject.total_topics += 1;


                if (
                    topic.status ===
                    "completed"
                ) {

                    subject.completed_topics += 1;

                } else if (
                    topic.status ===
                    "in_progress"
                ) {

                    subject.in_progress_topics += 1;

                } else {

                    subject.remaining_topics += 1;
                }


                if (
                    topic.mastery_score > 0
                ) {

                    subject.mastery_total +=
                        topic.mastery_score;

                    subject.mastery_count += 1;
                }

            }
        );


        const subjects =
            Array.from(
                subjectMap.values()
            ).map(
                (subject) => {

                    const percentage =
                        subject.total_topics > 0

                            ? Number(
                                (
                                    (
                                        subject.completed_topics /
                                        subject.total_topics
                                    ) * 100
                                ).toFixed(2)
                            )

                            : 0;


                    const mastery =
                        subject.mastery_count > 0

                            ? Number(
                                (
                                    subject.mastery_total /
                                    subject.mastery_count
                                ).toFixed(2)
                            )

                            : 0;


                    return {

                        subject_id:
                            subject.subject_id,

                        subject_name:
                            subject.subject_name,

                        total_topics:
                            subject.total_topics,

                        completed_topics:
                            subject.completed_topics,

                        in_progress_topics:
                            subject.in_progress_topics,

                        remaining_topics:
                            subject.remaining_topics,

                        completion_percentage:
                            percentage,

                        average_mastery:
                            mastery
                    };

                }
            );


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(200).json({
            status: "success",

            progress: {
                total_topics:
                    totalTopics,

                completed_topics:
                    completedTopics,

                in_progress_topics:
                    inProgressTopics,

                remaining_topics:
                    remainingTopics,

                completion_percentage:
                    completionPercentage,

                average_mastery:
                    averageMastery
            },

            chart: {
                completed:
                    completedTopics,

                in_progress:
                    inProgressTopics,

                remaining:
                    remainingTopics
            },

            subjects,

            topics:
                topicProgress
        });


    } catch (error) {

        console.error(
            "Get overall progress error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to calculate progress."
        });
    }
};


// ============================================
// GET SUBJECT PROGRESS
// ============================================

const getSubjectProgress = async (
    req,
    res
) => {
    try {

        const {
            subjectId
        } = req.params;


        const userId =
            req.user.userId;


        // ============================================
        // VERIFY SUBJECT
        // ============================================

        const subjectResult =
            await pool.query(
                `SELECT
                    id,
                    name

                 FROM subjects

                 WHERE id = $1
                 AND user_id = $2`,
                [
                    subjectId,
                    userId
                ]
            );


        if (
            subjectResult.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Subject not found."
            });
        }


        // ============================================
        // GET TOPICS
        // ============================================

        const topicsResult =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.name,
                    topics.topic_number,
                    topics.is_active,

                    chapters.id
                        AS chapter_id,

                    chapters.name
                        AS chapter_name

                 FROM topics

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 WHERE
                    chapters.subject_id = $1

                 ORDER BY
                    chapters.chapter_number ASC,
                    topics.topic_number ASC`,
                [subjectId]
            );


        const topics =
            topicsResult.rows;


        // ============================================
        // PASSED TOPICS
        // ============================================

        const passedResult =
            await pool.query(
                `SELECT DISTINCT
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
                    test_attempts.user_id = $1

                 AND chapters.subject_id = $2

                 AND test_attempts.completed = TRUE

                 AND test_attempts.percentage >=
                     tests.passing_percentage`,
                [
                    userId,
                    subjectId
                ]
            );


        const passedIds =
            new Set(
                passedResult.rows.map(
                    (row) =>
                        Number(row.topic_id)
                )
            );


        let completed = 0;
        let inProgress = 0;
        let remaining = 0;


        const topicData =
            topics.map(
                (topic) => {

                    let status =
                        "remaining";


                    if (
                        passedIds.has(
                            Number(topic.id)
                        )
                    ) {

                        status =
                            "completed";

                        completed += 1;

                    } else if (
                        topic.is_active
                    ) {

                        status =
                            "in_progress";

                        inProgress += 1;

                    } else {

                        remaining += 1;
                    }


                    return {
                        ...topic,
                        status
                    };

                }
            );


        const total =
            topics.length;


        const percentage =
            total > 0

                ? Number(
                    (
                        (
                            completed /
                            total
                        ) * 100
                    ).toFixed(2)
                )

                : 0;


        return res.status(200).json({
            status: "success",

            subject:
                subjectResult.rows[0],

            progress: {
                total_topics:
                    total,

                completed_topics:
                    completed,

                in_progress_topics:
                    inProgress,

                remaining_topics:
                    remaining,

                completion_percentage:
                    percentage
            },

            chart: {
                completed,
                in_progress:
                    inProgress,
                remaining
            },

            topics:
                topicData
        });


    } catch (error) {

        console.error(
            "Get subject progress error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to calculate subject progress."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {
    getOverallProgress,
    getSubjectProgress
};