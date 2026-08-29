const pool = require("../config/db");

const {
    generatePersonalizedStudyPlan
} = require("../services/geminiService");


// ============================================
// DATE HELPERS
// ============================================

const formatLocalDate = (date) => {

    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
};


// ============================================
// NORMALIZE DATABASE DATE
// ============================================

const normalizeDateOnly = (
    value
) => {

    if (!value) {
        return null;
    }


    // ========================================
    // DATE OBJECT
    // ========================================

    if (
        value instanceof Date
    ) {

        return formatLocalDate(
            value
        );
    }


    // ========================================
    // STRING
    // ========================================

    const stringValue =
        String(
            value
        ).trim();


    const directMatch =
        stringValue.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (directMatch) {

        return (
            `${directMatch[1]}-` +
            `${directMatch[2]}-` +
            `${directMatch[3]}`
        );
    }


    // ========================================
    // FALLBACK
    // ========================================

    const parsed =
        new Date(
            stringValue
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return null;
    }


    return formatLocalDate(
        parsed
    );
};


// ============================================
// DATE STRING -> DATE OBJECT
// ============================================

const parseDateOnly = (
    dateString
) => {

    if (!dateString) {
        return null;
    }


    const normalized =
        normalizeDateOnly(
            dateString
        );


    if (!normalized) {
        return null;
    }


    const parts =
        normalized.split("-");


    if (
        parts.length !== 3
    ) {
        return null;
    }


    const year =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        );


    const day =
        Number(
            parts[2]
        );


    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {

        return null;
    }


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    if (
        date.getFullYear() !== year ||
        date.getMonth() !==
            month - 1 ||
        date.getDate() !== day
    ) {

        return null;
    }


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;
};


// ============================================
// GET TODAY
// ============================================

const getToday = () => {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return today;
};


// ============================================
// AUTOMATICALLY RESCHEDULE MISSED TASKS
// ============================================

const autoRescheduleMissedTasksForPlan =
    async (
        planId,
        userId
    ) => {

        // ============================================
        // GET STUDY PLAN
        // ============================================

        const planResult =
            await pool.query(
                `SELECT
                    id,
                    exam_group_id,
                    planned_minutes,
                    status

                 FROM study_plans

                 WHERE id = $1
                 AND user_id = $2`,
                [
                    planId,
                    userId
                ]
            );


        if (
            planResult.rows.length ===
            0
        ) {

            return {
                triggered: false,

                missed_count: 0,

                rescheduled_count: 0,

                unable_to_reschedule_count:
                    0,

                message: null,

                rescheduled_tasks: [],

                unable_to_reschedule: []
            };
        }


        const plan =
            planResult.rows[0];


        // ============================================
        // ONLY ACTIVE MASTER PLANS
        // ============================================

        if (
            plan.status !== "active" ||
            !plan.exam_group_id
        ) {

            return {
                triggered: false,

                missed_count: 0,

                rescheduled_count: 0,

                unable_to_reschedule_count:
                    0,

                message: null,

                rescheduled_tasks: [],

                unable_to_reschedule: []
            };
        }


        // ============================================
        // MARK OVERDUE TASKS AS MISSED
        // ============================================

        await pool.query(
            `UPDATE study_plan_tasks

             SET status = 'missed'

             WHERE
                study_plan_id = $1

             AND
                completed = FALSE

             AND
                status IN
                (
                    'pending',
                    'rescheduled'
                )

             AND
                task_date <
                CURRENT_DATE`,
            [
                planId
            ]
        );


        // ============================================
        // GET MISSED TASKS
        // ============================================

        const missedResult =
            await pool.query(
                `SELECT
                    study_plan_tasks.id,
                    study_plan_tasks.study_plan_id,
                    study_plan_tasks.topic_id,
                    study_plan_tasks.task_date,
                    study_plan_tasks.duration_minutes,
                    study_plan_tasks.reason,

                    topics.name
                        AS topic_name,

                    chapters.subject_id,

                    subjects.name
                        AS subject_name

                 FROM study_plan_tasks

                 INNER JOIN topics
                    ON study_plan_tasks.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE
                    study_plan_tasks.study_plan_id =
                    $1

                 AND
                    study_plan_tasks.completed =
                    FALSE

                 AND
                    study_plan_tasks.status =
                    'missed'

                 ORDER BY
                    study_plan_tasks.task_date ASC,
                    study_plan_tasks.id ASC`,
                [
                    planId
                ]
            );


        const missedTasks =
            missedResult.rows;


        // ============================================
        // NOTHING MISSED
        // ============================================

        if (
            missedTasks.length === 0
        ) {

            return {
                triggered: false,

                missed_count: 0,

                rescheduled_count: 0,

                unable_to_reschedule_count:
                    0,

                message: null,

                rescheduled_tasks: [],

                unable_to_reschedule: []
            };
        }


        // ============================================
        // GET EXAM DATES
        // ============================================

        const examsResult =
            await pool.query(
                `SELECT
                    exams.subject_id,
                    exams.exam_date,

                    subjects.name
                        AS subject_name

                 FROM exams

                 INNER JOIN subjects
                    ON exams.subject_id =
                       subjects.id

                 WHERE
                    exams.exam_group_id =
                    $1

                 AND
                    exams.user_id =
                    $2

                 ORDER BY
                    exams.exam_date ASC`,
                [
                    plan.exam_group_id,
                    userId
                ]
            );


        // ============================================
        // SUBJECT -> EARLIEST EXAM
        // ============================================

        const subjectExamMap =
            new Map();


        examsResult.rows.forEach(
            (exam) => {

                const subjectId =
                    Number(
                        exam.subject_id
                    );


                const examDate =
                    normalizeDateOnly(
                        exam.exam_date
                    );


                if (!examDate) {
                    return;
                }


                const existingDate =
                    subjectExamMap.get(
                        subjectId
                    );


                if (
                    !existingDate ||
                    examDate <
                        existingDate
                ) {

                    subjectExamMap.set(
                        subjectId,
                        examDate
                    );
                }
            }
        );


        // ============================================
        // GET CURRENT FUTURE WORKLOAD
        // ============================================

        const futureLoadResult =
            await pool.query(
                `SELECT
                    task_date,

                    COALESCE(
                        SUM(
                            duration_minutes
                        ),
                        0
                    ) AS minutes

                 FROM study_plan_tasks

                 WHERE
                    study_plan_id =
                    $1

                 AND
                    completed =
                    FALSE

                 AND
                    task_date >=
                    CURRENT_DATE

                 AND
                    status IN
                    (
                        'pending',
                        'rescheduled'
                    )

                 GROUP BY
                    task_date`,
                [
                    planId
                ]
            );


        const loadMap =
            new Map();


        futureLoadResult.rows.forEach(
            (row) => {

                const date =
                    normalizeDateOnly(
                        row.task_date
                    );


                if (!date) {
                    return;
                }


                loadMap.set(
                    date,

                    Number(
                        row.minutes
                    ) || 0
                );
            }
        );


        // ============================================
        // DAILY LIMIT
        // ============================================

        const dailyLimit =
            Number(
                plan.planned_minutes
            ) || 120;


        // ============================================
        // START FROM TODAY
        // ============================================

        const today =
            getToday();


        const updatedTasks =
            [];


        const unableToReschedule =
            [];


        // ============================================
        // REDISTRIBUTE MISSED TASKS
        // ============================================

        for (
            const task
            of missedTasks
        ) {

            const subjectId =
                Number(
                    task.subject_id
                );


            const examDateString =
                subjectExamMap.get(
                    subjectId
                );


            // ========================================
            // NO EXAM FOR SUBJECT
            // ========================================

            if (!examDateString) {

                unableToReschedule.push({

                    task_id:
                        task.id,

                    topic_name:
                        task.topic_name,

                    subject_name:
                        task.subject_name,

                    reason:
                        "No exam date found for this subject."
                });


                continue;
            }


            const examDate =
                parseDateOnly(
                    examDateString
                );


            if (!examDate) {

                unableToReschedule.push({

                    task_id:
                        task.id,

                    topic_name:
                        task.topic_name,

                    subject_name:
                        task.subject_name,

                    reason:
                        "The exam date could not be read."
                });


                continue;
            }


            // ========================================
            // BUILD AVAILABLE STUDY DATES
            // ========================================

            const availableDates =
                [];


            const cursor =
                new Date(
                    today
                );


            while (
                cursor <
                examDate
            ) {

                const dateString =
                    formatLocalDate(
                        cursor
                    );


                if (dateString) {

                    availableDates.push(
                        dateString
                    );
                }


                cursor.setDate(
                    cursor.getDate() + 1
                );
            }


            // ========================================
            // NO TIME BEFORE EXAM
            // ========================================

            if (
                availableDates.length ===
                0
            ) {

                unableToReschedule.push({

                    task_id:
                        task.id,

                    topic_name:
                        task.topic_name,

                    subject_name:
                        task.subject_name,

                    reason:
                        "There are no remaining study days before this subject's exam."
                });


                continue;
            }


            const taskMinutes =
                Number(
                    task.duration_minutes
                ) || 30;


            let selectedDate =
                null;


            // ========================================
            // FIRST AVAILABLE DAY
            // ========================================

            for (
                const date
                of availableDates
            ) {

                const currentLoad =
                    loadMap.get(
                        date
                    ) || 0;


                if (
                    currentLoad +
                    taskMinutes <=
                    dailyLimit
                ) {

                    selectedDate =
                        date;

                    break;
                }
            }


            // ========================================
            // ALL FUTURE DAYS FULL
            // ========================================

            if (!selectedDate) {

                selectedDate =
                    availableDates.reduce(
                        (
                            bestDate,
                            currentDate
                        ) => {

                            const bestLoad =
                                loadMap.get(
                                    bestDate
                                ) || 0;


                            const currentLoad =
                                loadMap.get(
                                    currentDate
                                ) || 0;


                            return (
                                currentLoad <
                                bestLoad
                            )
                                ? currentDate
                                : bestDate;
                        },
                        availableDates[0]
                    );
            }


            // ========================================
            // UPDATE TASK
            // ========================================

            const updatedResult =
                await pool.query(
                    `UPDATE study_plan_tasks

                     SET
                        task_date =
                            $1,

                        status =
                            'rescheduled',

                        reason =
                            CASE

                                WHEN reason
                                    IS NULL

                                THEN
                                    'Automatically rescheduled because the previous study session was missed'

                                ELSE
                                    reason ||
                                    ' | Automatically rescheduled after missed study session'

                            END

                     WHERE
                        id = $2

                     AND
                        study_plan_id =
                        $3

                     RETURNING *`,
                    [
                        selectedDate,

                        task.id,

                        planId
                    ]
                );


            if (
                updatedResult.rows.length ===
                0
            ) {

                continue;
            }


            // ========================================
            // UPDATE DAILY LOAD
            // ========================================

            const newLoad =
                (
                    loadMap.get(
                        selectedDate
                    ) || 0
                ) +
                taskMinutes;


            loadMap.set(
                selectedDate,
                newLoad
            );


            updatedTasks.push({

                ...updatedResult.rows[0],

                topic_name:
                    task.topic_name,

                subject_name:
                    task.subject_name
            });
        }


        // ============================================
        // CREATE STUDENT-FRIENDLY MESSAGE
        // ============================================

        let message =
            null;


        if (
            updatedTasks.length === 1
        ) {

            message =
                "You missed 1 study task. Your remaining timetable has been adjusted automatically.";

        } else if (
            updatedTasks.length > 1
        ) {

            message =
                `You missed ${updatedTasks.length} study tasks. Your remaining timetable has been adjusted automatically.`;

        } else if (
            unableToReschedule.length >
            0
        ) {

            message =
                "You have missed study tasks, but some could not be moved because their exam is too close.";
        }


        // ============================================
        // RETURN RESULT
        // ============================================

        return {

            triggered:
                true,

            missed_count:
                missedTasks.length,

            rescheduled_count:
                updatedTasks.length,

            unable_to_reschedule_count:
                unableToReschedule.length,

            message,

            rescheduled_tasks:
                updatedTasks,

            unable_to_reschedule:
                unableToReschedule
        };
    };


// ============================================
// GENERATE MASTER AI STUDY PLAN
// ============================================

const generateStudyPlan = async (
    req,
    res
) => {

    try {

        const {
            groupId
        } = req.params;


        const {
            study_hours_per_day
        } = req.body;


        const userId =
            req.user.userId;


        // ============================================
        // VALIDATE GROUP
        // ============================================

        if (
            !groupId ||
            !Number.isFinite(
                Number(
                    groupId
                )
            )
        ) {

            return res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "A valid exam group is required."
            });
        }


        // ============================================
        // GET EXAM GROUP
        // ============================================

        const groupResult =
            await pool.query(
                `SELECT
                    id,
                    user_id,
                    group_name,
                    exam_type,
                    custom_exam_type,
                    status,
                    created_at

                 FROM exam_groups

                 WHERE
                    id = $1

                 AND
                    user_id = $2

                 AND
                    status = 'active'`,
                [
                    groupId,
                    userId
                ]
            );


        if (
            groupResult.rows.length ===
            0
        ) {

            return res.status(
                404
            ).json({

                status:
                    "error",

                message:
                    "Exam group not found."
            });
        }


        const examGroup =
            groupResult.rows[0];


        // ============================================
        // GET EXAMS IN GROUP
        // ============================================

        const examsResult =
            await pool.query(
                `SELECT
                    exams.id,
                    exams.user_id,
                    exams.subject_id,
                    exams.exam_group_id,
                    exams.exam_name,
                    exams.exam_date,
                    exams.exam_time,
                    exams.exam_type,
                    exams.custom_exam_type,
                    exams.priority,
                    exams.notes,

                    subjects.name
                        AS subject_name

                 FROM exams

                 INNER JOIN subjects
                    ON exams.subject_id =
                       subjects.id

                 WHERE
                    exams.exam_group_id =
                    $1

                 AND
                    exams.user_id =
                    $2

                 ORDER BY
                    exams.exam_date ASC,
                    exams.exam_time ASC`,
                [
                    groupId,
                    userId
                ]
            );


        const allExams =
            examsResult.rows;


        if (
            allExams.length === 0
        ) {

            return res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "This exam group does not contain any exams."
            });
        }


        // ============================================
        // TODAY
        // ============================================

        const today =
            getToday();


        const todayString =
            formatLocalDate(
                today
            );


        // ============================================
        // NORMALIZE EXAMS
        // ============================================

        const normalizedExams =
            allExams
                .map(
                    (
                        exam
                    ) => {

                        const examDate =
                            normalizeDateOnly(
                                exam.exam_date
                            );


                        return {

                            ...exam,

                            id:
                                Number(
                                    exam.id
                                ),

                            subject_id:
                                Number(
                                    exam.subject_id
                                ),

                            exam_date:
                                examDate
                        };
                    }
                )
                .filter(
                    (
                        exam
                    ) =>
                        exam.exam_date
                );


        // ============================================
        // FUTURE EXAMS ONLY
        // ============================================

        const futureExams =
            normalizedExams.filter(
                (
                    exam
                ) => {

                    const examDate =
                        parseDateOnly(
                            exam.exam_date
                        );


                    return (
                        examDate &&
                        examDate >
                        today
                    );
                }
            );


        if (
            futureExams.length ===
            0
        ) {

            return res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "There are no future exams in this exam group."
            });
        }


        console.log(
            "========================================"
        );

        console.log(
            "GENERATING MASTER STUDY PLAN"
        );

        console.log(
            "Group:",
            examGroup.group_name
        );

        console.log(
            "Today:",
            todayString
        );

        console.log(
            "Upcoming exams:",
            futureExams.map(
                (
                    exam
                ) => ({

                    subject:
                        exam.subject_name,

                    exam:
                        exam.exam_name,

                    date:
                        exam.exam_date
                })
            )
        );

        console.log(
            "========================================"
        );


        // ============================================
        // DAILY STUDY MINUTES
        // ============================================

        let studyHours =
            Number(
                study_hours_per_day
            );


        if (
            !Number.isFinite(
                studyHours
            ) ||
            studyHours <= 0
        ) {

            studyHours =
                2;
        }


        studyHours =
            Math.min(
                Math.max(
                    studyHours,
                    0.5
                ),
                12
            );


        const dailyStudyMinutes =
            Math.round(
                studyHours *
                60
            );


        // ============================================
        // EXISTING ACTIVE PLAN
        // ============================================

        const existingPlan =
            await pool.query(
                `SELECT
                    id

                 FROM study_plans

                 WHERE
                    user_id = $1

                 AND
                    exam_group_id =
                    $2

                 AND
                    status =
                    'active'

                 AND
                    task_type =
                    'ai_exam_group_plan'

                 LIMIT 1`,
                [
                    userId,
                    groupId
                ]
            );


        if (
            existingPlan.rows.length >
            0
        ) {

            return res.status(
                409
            ).json({

                status:
                    "error",

                message:
                    "An active master study plan already exists for this exam group.",

                study_plan_id:
                    existingPlan.rows[0]
                        .id
            });
        }


        // ============================================
        // SUBJECT IDS
        // ============================================

        const subjectIds =
            [
                ...new Set(
                    futureExams.map(
                        (
                            exam
                        ) =>
                            Number(
                                exam.subject_id
                            )
                    )
                )
            ];


        // ============================================
        // GET ALL TOPICS
        // ============================================

        const topicsResult =
            await pool.query(
                `SELECT
                    topics.id,
                    topics.name,
                    topics.description,
                    topics.topic_number,
                    topics.estimated_minutes,
                    topics.is_active,

                    chapters.id
                        AS chapter_id,

                    chapters.name
                        AS chapter_name,

                    chapters.chapter_number,

                    subjects.id
                        AS subject_id,

                    subjects.name
                        AS subject_name,

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

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 LEFT JOIN progress
                    ON progress.topic_id =
                       topics.id

                    AND progress.user_id =
                       $2

                 WHERE
                    subjects.id =
                    ANY($1::int[])

                 ORDER BY
                    subjects.id ASC,
                    chapters.chapter_number ASC,
                    topics.topic_number ASC`,
                [
                    subjectIds,
                    userId
                ]
            );


        const topics =
            topicsResult.rows;


        if (
            topics.length === 0
        ) {

            return res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "No topics exist for the subjects in this exam group."
            });
        }


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
                    ANY($2::int[])`,
                [
                    userId,
                    subjectIds
                ]
            );


        const passedIds =
            new Set(
                passedResult.rows.map(
                    (
                        row
                    ) =>
                        Number(
                            row.topic_id
                        )
                )
            );


        // ============================================
        // BUILD AI TOPICS
        // ============================================

        const planningTopics =
            topics.map(
                (
                    topic
                ) => ({

                    id:
                        Number(
                            topic.id
                        ),

                    subject_id:
                        Number(
                            topic.subject_id
                        ),

                    subject_name:
                        topic.subject_name,

                    chapter_id:
                        Number(
                            topic.chapter_id
                        ),

                    chapter_name:
                        topic.chapter_name,

                    chapter_number:
                        Number(
                            topic.chapter_number
                        ) || 0,

                    topic_number:
                        Number(
                            topic.topic_number
                        ) || 0,

                    name:
                        topic.name,

                    description:
                        topic.description,

                    estimated_minutes:
                        Number(
                            topic.estimated_minutes
                        ) || 30,

                    completed:
                        passedIds.has(
                            Number(
                                topic.id
                            )
                        ),

                    mastery_score:
                        topic.mastery_score !==
                            null
                            ? Number(
                                topic.mastery_score
                            )
                            : null,

                    latest_score:
                        topic.latest_score !==
                            null
                            ? Number(
                                topic.latest_score
                            )
                            : null,

                    best_score:
                        topic.best_score !==
                            null
                            ? Number(
                                topic.best_score
                            )
                            : null,

                    average_score:
                        topic.average_score !==
                            null
                            ? Number(
                                topic.average_score
                            )
                            : null,

                    total_attempts:
                        Number(
                            topic.total_attempts ||
                            0
                        ),

                    revision_required:
                        Boolean(
                            topic.revision_required
                        )
                })
            );


        // ============================================
        // WEAK TOPICS
        // ============================================

        const weakResult =
            await pool.query(
                `SELECT
                    weak_topics.topic_id,
                    weak_topics.average_score,
                    weak_topics.weakness_level,

                    topics.name
                        AS topic_name,

                    subjects.id
                        AS subject_id,

                    subjects.name
                        AS subject_name

                 FROM weak_topics

                 INNER JOIN topics
                    ON weak_topics.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE
                    weak_topics.user_id =
                    $1

                 AND
                    subjects.id =
                    ANY($2::int[])`,
                [
                    userId,
                    subjectIds
                ]
            );


        // ============================================
        // FLASHCARD PERFORMANCE
        // ============================================

        const flashcardResult =
            await pool.query(
                `SELECT
                    flashcards.topic_id,

                    subjects.id
                        AS subject_id,

                    subjects.name
                        AS subject_name,

                    COUNT(*)
                        AS total_flashcards,

                    COALESCE(
                        SUM(
                            flashcards.review_count
                        ),
                        0
                    ) AS total_reviews,

                    COALESCE(
                        SUM(
                            flashcards.correct_count
                        ),
                        0
                    ) AS correct_count,

                    COALESCE(
                        SUM(
                            flashcards.incorrect_count
                        ),
                        0
                    ) AS incorrect_count

                 FROM flashcards

                 INNER JOIN topics
                    ON flashcards.topic_id =
                       topics.id

                 INNER JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 INNER JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE
                    flashcards.user_id =
                    $1

                 AND
                    subjects.id =
                    ANY($2::int[])

                 GROUP BY
                    flashcards.topic_id,
                    subjects.id,
                    subjects.name`,
                [
                    userId,
                    subjectIds
                ]
            );


        // ============================================
        // GENERATE WITH AI
        // ============================================

        const generatedTasks =
            await generatePersonalizedStudyPlan({

                examGroup,

                exams:
                    futureExams,

                dailyStudyMinutes,

                topics:
                    planningTopics,

                weakTopics:
                    weakResult.rows,

                flashcardPerformance:
                    flashcardResult.rows
            });


        // ============================================
        // TOPIC MAP
        // ============================================

        const topicMap =
            new Map();


        planningTopics.forEach(
            (
                topic
            ) => {

                topicMap.set(
                    Number(
                        topic.id
                    ),
                    topic
                );
            }
        );


        // ============================================
        // SUBJECT -> EARLIEST EXAM
        // ============================================

        const subjectExamMap =
            new Map();


        futureExams.forEach(
            (
                exam
            ) => {

                const subjectId =
                    Number(
                        exam.subject_id
                    );


                const existing =
                    subjectExamMap.get(
                        subjectId
                    );


                if (
                    !existing ||
                    exam.exam_date <
                    existing
                ) {

                    subjectExamMap.set(
                        subjectId,
                        exam.exam_date
                    );
                }
            }
        );


        // ============================================
        // VALIDATE GENERATED TASKS
        // ============================================

        const validTasks =
            [];


        for (
            const task
            of generatedTasks
        ) {

            const topicId =
                Number(
                    task.topic_id
                );


            const topic =
                topicMap.get(
                    topicId
                );


            if (!topic) {
                continue;
            }


            const taskDateString =
                normalizeDateOnly(
                    task.task_date
                );


            const taskDate =
                parseDateOnly(
                    taskDateString
                );


            if (!taskDate) {
                continue;
            }


            if (
                taskDate <
                today
            ) {
                continue;
            }


            const subjectExamDateString =
                subjectExamMap.get(
                    Number(
                        topic.subject_id
                    )
                );


            if (
                !subjectExamDateString
            ) {
                continue;
            }


            const subjectExamDate =
                parseDateOnly(
                    subjectExamDateString
                );


            if (
                !subjectExamDate
            ) {
                continue;
            }


            if (
                taskDate >=
                subjectExamDate
            ) {
                continue;
            }


            validTasks.push({

                ...task,

                topic_id:
                    topicId,

                task_date:
                    taskDateString,

                duration_minutes:
                    Math.min(
                        Math.max(
                            Number(
                                task.duration_minutes
                            ) || 30,
                            10
                        ),
                        180
                    )
            });
        }


        // ============================================
        // CHECK DAILY LOAD
        // ============================================

        const dailyLoad =
            new Map();


        const finalTasks =
            [];


        for (
            const task
            of validTasks
        ) {

            const currentLoad =
                dailyLoad.get(
                    task.task_date
                ) || 0;


            const taskMinutes =
                Number(
                    task.duration_minutes
                ) || 30;


            if (
                currentLoad +
                taskMinutes >
                dailyStudyMinutes +
                15
            ) {

                continue;
            }


            dailyLoad.set(
                task.task_date,

                currentLoad +
                taskMinutes
            );


            finalTasks.push(
                task
            );
        }


        if (
            finalTasks.length === 0
        ) {

            return res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "AI generated no valid study dates."
            });
        }


        // ============================================
        // LAST EXAM DATE
        // ============================================

        const lastExamDate =
            futureExams.reduce(
                (
                    latest,
                    exam
                ) => {

                    if (
                        !latest ||
                        exam.exam_date >
                        latest
                    ) {

                        return exam.exam_date;
                    }


                    return latest;
                },
                null
            );


        // ============================================
        // SAVE MASTER PLAN
        // ============================================

        const client =
            await pool.connect();


        try {

            await client.query(
                "BEGIN"
            );


            const transactionCheck =
                await client.query(
                    `SELECT id

                     FROM study_plans

                     WHERE
                        user_id = $1

                     AND
                        exam_group_id =
                        $2

                     AND
                        status =
                        'active'

                     AND
                        task_type =
                        'ai_exam_group_plan'

                     LIMIT 1`,
                    [
                        userId,
                        groupId
                    ]
                );


            if (
                transactionCheck.rows.length >
                0
            ) {

                await client.query(
                    "ROLLBACK"
                );


                return res.status(
                    409
                ).json({

                    status:
                        "error",

                    message:
                        "An active master study plan already exists for this exam group.",

                    study_plan_id:
                        transactionCheck.rows[0]
                            .id
                });
            }


            // ========================================
            // CREATE MASTER PLAN
            // ========================================

            const planResult =
                await client.query(
                    `INSERT INTO study_plans
                    (
                        user_id,
                        exam_id,
                        exam_group_id,
                        plan_scope,
                        plan_date,
                        start_date,
                        end_date,
                        topic_id,
                        task_type,
                        planned_minutes,
                        priority,
                        reason,
                        completed,
                        status
                    )

                    VALUES
                    (
                        $1,
                        NULL,
                        $2,
                        'exam_group',
                        CURRENT_DATE,
                        CURRENT_DATE,
                        $3,
                        NULL,
                        'ai_exam_group_plan',
                        $4,
                        'medium',
                        $5,
                        FALSE,
                        'active'
                    )

                    RETURNING *`,
                    [
                        userId,

                        groupId,

                        lastExamDate,

                        dailyStudyMinutes,

                        `Master AI study plan for ${examGroup.group_name}`
                    ]
                );


            const studyPlan =
                planResult.rows[0];


            // ========================================
            // SAVE TASKS
            // ========================================

            const savedTasks =
                [];


            for (
                const task
                of finalTasks
            ) {

                const taskResult =
                    await client.query(
                        `INSERT INTO study_plan_tasks
                        (
                            study_plan_id,
                            topic_id,
                            task_date,
                            duration_minutes,
                            completed,
                            task_type,
                            priority,
                            reason,
                            status
                        )

                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            FALSE,
                            $5,
                            $6,
                            $7,
                            'pending'
                        )

                        RETURNING *`,
                        [
                            studyPlan.id,

                            task.topic_id,

                            task.task_date,

                            task.duration_minutes,

                            task.task_type,

                            task.priority,

                            task.reason
                        ]
                    );


                savedTasks.push(
                    taskResult.rows[0]
                );
            }


            await client.query(
                "COMMIT"
            );


            console.log(
                "========================================"
            );

            console.log(
                "MASTER STUDY PLAN SAVED"
            );

            console.log(
                "Plan ID:",
                studyPlan.id
            );

            console.log(
                "Tasks:",
                savedTasks.length
            );

            console.log(
                "========================================"
            );


            return res.status(
                201
            ).json({

                status:
                    "success",

                message:
                    "Master personalized study timetable generated successfully.",

                study_plan:
                    studyPlan,

                exam_group:
                    examGroup,

                exams:
                    futureExams,

                count:
                    savedTasks.length,

                tasks:
                    savedTasks
            });


        } catch (
            databaseError
        ) {

            await client.query(
                "ROLLBACK"
            );


            throw databaseError;


        } finally {

            client.release();
        }


    } catch (error) {

        console.error(
            "Generate master study plan error:",
            error
        );


        return res.status(
            500
        ).json({

            status:
                "error",

            message:
                error?.message ||
                "Unable to generate master study plan."
        });
    }
};


// ============================================
// GET USER STUDY PLANS
// ============================================

const getStudyPlans = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        const result =
            await pool.query(
                `SELECT
                    study_plans.id,
                    study_plans.exam_id,
                    study_plans.exam_group_id,
                    study_plans.plan_scope,
                    study_plans.plan_date,
                    study_plans.start_date,
                    study_plans.end_date,
                    study_plans.planned_minutes,
                    study_plans.status,
                    study_plans.completed,
                    study_plans.created_at,

                    exam_groups.group_name,
                    exam_groups.exam_type,
                    exam_groups.custom_exam_type,

                    (
                        SELECT COUNT(*)

                        FROM study_plan_tasks

                        WHERE
                            study_plan_tasks.study_plan_id =
                            study_plans.id
                    ) AS total_tasks,

                    (
                        SELECT COUNT(*)

                        FROM study_plan_tasks

                        WHERE
                            study_plan_tasks.study_plan_id =
                            study_plans.id

                        AND
                            study_plan_tasks.completed =
                            TRUE
                    ) AS completed_tasks

                 FROM study_plans

                 LEFT JOIN exam_groups
                    ON study_plans.exam_group_id =
                       exam_groups.id

                 WHERE
                    study_plans.user_id =
                    $1

                 AND
                    study_plans.task_type =
                    'ai_exam_group_plan'

                 ORDER BY
                    study_plans.created_at
                    DESC`,
                [
                    userId
                ]
            );


        return res.status(
            200
        ).json({

            status:
                "success",

            count:
                result.rows.length,

            study_plans:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get study plans error:",
            error
        );


        return res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to load study plans."
        });
    }
};


// ============================================
// GET STUDY PLAN TASKS
// ============================================

const getStudyPlanTasks = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const userId =
            req.user.userId;


        // ============================================
        // GET PLAN
        // ============================================

        const planResult =
            await pool.query(
                `SELECT
                    study_plans.id,
                    study_plans.exam_group_id,
                    study_plans.plan_scope,
                    study_plans.plan_date,
                    study_plans.start_date,
                    study_plans.end_date,
                    study_plans.planned_minutes,
                    study_plans.status,
                    study_plans.completed,

                    exam_groups.group_name,
                    exam_groups.exam_type,
                    exam_groups.custom_exam_type

                 FROM study_plans

                 LEFT JOIN exam_groups
                    ON study_plans.exam_group_id =
                       exam_groups.id

                 WHERE
                    study_plans.id =
                    $1

                 AND
                    study_plans.user_id =
                    $2`,
                [
                    id,
                    userId
                ]
            );


        if (
            planResult.rows.length ===
            0
        ) {

            return res.status(
                404
            ).json({

                status:
                    "error",

                message:
                    "Study plan not found."
            });
        }


        const studyPlan =
            planResult.rows[0];


        // ============================================
        // AUTOMATIC TIMETABLE ADJUSTMENT
        // ============================================

        const autoAdjustment =
            await autoRescheduleMissedTasksForPlan(
                id,
                userId
            );


        // ============================================
        // FETCH UPDATED TASKS
        // ============================================

        const result =
            await pool.query(
                `SELECT
                    study_plan_tasks.id,
                    study_plan_tasks.study_plan_id,
                    study_plan_tasks.topic_id,
                    study_plan_tasks.task_date,
                    study_plan_tasks.duration_minutes,
                    study_plan_tasks.completed,
                    study_plan_tasks.task_type,
                    study_plan_tasks.priority,
                    study_plan_tasks.reason,
                    study_plan_tasks.status,
                    study_plan_tasks.completed_at,
                    study_plan_tasks.created_at,

                    topics.name
                        AS topic_name,

                    topics.topic_number,

                    chapters.id
                        AS chapter_id,

                    chapters.name
                        AS chapter_name,

                    chapters.chapter_number,

                    subjects.id
                        AS subject_id,

                    subjects.name
                        AS subject_name

                 FROM study_plan_tasks

                 LEFT JOIN topics
                    ON study_plan_tasks.topic_id =
                       topics.id

                 LEFT JOIN chapters
                    ON topics.chapter_id =
                       chapters.id

                 LEFT JOIN subjects
                    ON chapters.subject_id =
                       subjects.id

                 WHERE
                    study_plan_tasks.study_plan_id =
                    $1

                 ORDER BY
                    study_plan_tasks.task_date ASC,
                    subjects.name ASC,
                    study_plan_tasks.id ASC`,
                [
                    id
                ]
            );


        // ============================================
        // GET EXAMS
        // ============================================

        let exams =
            [];


        if (
            studyPlan.exam_group_id
        ) {

            const examsResult =
                await pool.query(
                    `SELECT
                        exams.id,
                        exams.subject_id,
                        exams.exam_name,
                        exams.exam_date,
                        exams.exam_time,
                        exams.priority,

                        subjects.name
                            AS subject_name

                     FROM exams

                     INNER JOIN subjects
                        ON exams.subject_id =
                           subjects.id

                     WHERE
                        exams.exam_group_id =
                        $1

                     AND
                        exams.user_id =
                        $2

                     ORDER BY
                        exams.exam_date ASC`,
                    [
                        studyPlan.exam_group_id,

                        userId
                    ]
                );


            exams =
                examsResult.rows;
        }


        // ============================================
        // STATISTICS
        // ============================================

        const totalTasks =
            result.rows.length;


        const completedTasks =
            result.rows.filter(
                (
                    task
                ) =>
                    Boolean(
                        task.completed
                    )
            ).length;


        const missedTasks =
            result.rows.filter(
                (
                    task
                ) =>
                    task.status ===
                    "missed"
            ).length;


        const rescheduledTasks =
            result.rows.filter(
                (
                    task
                ) =>
                    task.status ===
                    "rescheduled"
            ).length;


        const completionPercentage =
            totalTasks > 0

                ? Number(
                    (
                        (
                            completedTasks /
                            totalTasks
                        ) *
                        100
                    ).toFixed(
                        2
                    )
                )

                : 0;


        // ============================================
        // TODAY'S WORKLOAD
        // ============================================

        const todayString =
            formatLocalDate(
                getToday()
            );


        const todaysTasks =
            result.rows.filter(
                (
                    task
                ) => {

                    return (
                        normalizeDateOnly(
                            task.task_date
                        ) ===
                        todayString
                    );
                }
            );


        const todayMinutes =
            todaysTasks.reduce(
                (
                    total,
                    task
                ) => {

                    return (
                        total +
                        Number(
                            task.duration_minutes ||
                            0
                        )
                    );
                },
                0
            );


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(
            200
        ).json({

            status:
                "success",

            study_plan:
                studyPlan,

            exams,

            auto_adjustment:
                autoAdjustment,

            notification:
                autoAdjustment.message,

            statistics: {

                total_tasks:
                    totalTasks,

                completed_tasks:
                    completedTasks,

                remaining_tasks:
                    totalTasks -
                    completedTasks,

                missed_tasks:
                    missedTasks,

                rescheduled_tasks:
                    rescheduledTasks,

                completion_percentage:
                    completionPercentage,

                today_minutes:
                    todayMinutes,

                daily_limit_minutes:
                    Number(
                        studyPlan.planned_minutes
                    ) || 120
            },

            count:
                totalTasks,

            tasks:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get study plan tasks error:",
            error
        );


        return res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to load study plan tasks."
        });
    }
};


// ============================================
// COMPLETE TASK
// ============================================

const completeTask = async (
    req,
    res
) => {

    try {

        const {
            taskId
        } = req.params;


        const userId =
            req.user.userId;


        const result =
            await pool.query(
                `UPDATE study_plan_tasks

                 SET
                    completed =
                        TRUE,

                    status =
                        'completed',

                    completed_at =
                        CURRENT_TIMESTAMP

                 WHERE
                    id =
                    $1

                 AND
                    study_plan_id
                    IN
                    (
                        SELECT id

                        FROM study_plans

                        WHERE
                            user_id =
                            $2
                    )

                 RETURNING *`,
                [
                    taskId,
                    userId
                ]
            );


        if (
            result.rows.length ===
            0
        ) {

            return res.status(
                404
            ).json({

                status:
                    "error",

                message:
                    "Study task not found."
            });
        }


        const task =
            result.rows[0];


        // ============================================
        // CHECK PLAN COMPLETION
        // ============================================

        const remainingResult =
            await pool.query(
                `SELECT
                    COUNT(*)
                        AS remaining

                 FROM study_plan_tasks

                 WHERE
                    study_plan_id =
                    $1

                 AND
                    completed =
                    FALSE`,
                [
                    task.study_plan_id
                ]
            );


        const remaining =
            Number(
                remainingResult
                    .rows[0]
                    .remaining
            );


        // ============================================
        // COMPLETE WHOLE PLAN
        // ============================================

        if (
            remaining === 0
        ) {

            await pool.query(
                `UPDATE study_plans

                 SET
                    completed =
                        TRUE,

                    completed_at =
                        CURRENT_TIMESTAMP,

                    status =
                        'completed'

                 WHERE
                    id =
                    $1`,
                [
                    task.study_plan_id
                ]
            );
        }


        return res.status(
            200
        ).json({

            status:
                "success",

            message:
                remaining === 0
                    ? "Study task completed. You completed the entire study plan!"
                    : "Study task completed.",

            plan_completed:
                remaining === 0,

            task
        });


    } catch (error) {

        console.error(
            "Complete study task error:",
            error
        );


        return res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to complete study task."
        });
    }
};


// ============================================
// RESCHEDULE MISSED TASKS
// ============================================

const rescheduleMissedTasks = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const result =
            await autoRescheduleMissedTasksForPlan(
                id,
                req.user.userId
            );


        return res.status(
            200
        ).json({

            status:
                "success",

            ...result
        });


    } catch (error) {

        console.error(
            "Reschedule study plan error:",
            error
        );


        return res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to automatically adjust the study plan."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {

    generateStudyPlan,

    getStudyPlans,

    getStudyPlanTasks,

    completeTask,

    rescheduleMissedTasks
};