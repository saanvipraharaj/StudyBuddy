const pool =
    require("../config/db");


// ============================================
// DATE HELPER
// ============================================

const normalizeDateOnly = (
    value
) => {

    if (!value) {
        return null;
    }


    if (
        value instanceof Date
    ) {

        const year =
            value.getFullYear();

        const month =
            String(
                value.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                value.getDate()
            ).padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}`;
    }


    const match =
        String(
            value
        )
            .trim()
            .match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


    if (!match) {
        return null;
    }


    return (
        `${match[1]}-` +
        `${match[2]}-` +
        `${match[3]}`
    );
};


// ============================================
// GET ALL REVISIONS
// ============================================

const getRevisions = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        const result =
            await pool.query(
                `SELECT
                    revisions.id,
                    revisions.user_id,
                    revisions.topic_id,
                    revisions.scheduled_date,
                    revisions.revision_type,
                    revisions.completed,
                    revisions.score,
                    revisions.interval_days,
                    revisions.completed_at,

                    topics.name
                        AS topic_name,

                    topics.topic_number,

                    topics.chapter_id,

                    topics.is_active,

                    chapters.name
                        AS chapter_name,

                    chapters.chapter_number,

                    chapters.subject_id,

                    subjects.name
                        AS subject_name,

                    progress.mastery_score,
                    progress.latest_score,
                    progress.best_score,
                    progress.average_score,
                    progress.total_attempts,
                    progress.revision_required,

                    weak_topics.weakness_level,
                    weak_topics.average_score
                        AS weak_average_score

                 FROM revisions

                 INNER JOIN topics
                    ON revisions.topic_id =
                       topics.id

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
                       revisions.user_id

                 LEFT JOIN weak_topics
                    ON weak_topics.topic_id =
                       topics.id
                    AND weak_topics.user_id =
                       revisions.user_id

                 WHERE revisions.user_id =
                    $1

                 ORDER BY
                    revisions.completed ASC,
                    revisions.scheduled_date ASC,
                    revisions.id ASC`,
                [
                    userId
                ]
            );


        const revisions =
            result.rows.map(
                (revision) => ({

                    ...revision,

                    scheduled_date:
                        normalizeDateOnly(
                            revision.scheduled_date
                        ),

                    mastery_score:
                        revision.mastery_score !==
                        null
                            ? Number(
                                revision.mastery_score
                            )
                            : null,

                    latest_score:
                        revision.latest_score !==
                        null
                            ? Number(
                                revision.latest_score
                            )
                            : null,

                    best_score:
                        revision.best_score !==
                        null
                            ? Number(
                                revision.best_score
                            )
                            : null,

                    average_score:
                        revision.average_score !==
                        null
                            ? Number(
                                revision.average_score
                            )
                            : null,

                    total_attempts:
                        Number(
                            revision.total_attempts ||
                            0
                        ),

                    interval_days:
                        Number(
                            revision.interval_days ||
                            1
                        )
                })
            );


        return res.status(200).json({
            status: "success",

            count:
                revisions.length,

            revisions
        });


    } catch (error) {

        console.error(
            "Get revisions error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to load revisions."
        });
    }
};


// ============================================
// GET DUE REVISIONS
// ============================================

const getDueRevisions = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        const result =
            await pool.query(
                `SELECT
                    revisions.id,
                    revisions.topic_id,
                    revisions.scheduled_date,
                    revisions.revision_type,
                    revisions.completed,
                    revisions.score,
                    revisions.interval_days,

                    topics.name
                        AS topic_name,

                    topics.topic_number,

                    topics.chapter_id,

                    chapters.name
                        AS chapter_name,

                    chapters.subject_id,

                    subjects.name
                        AS subject_name,

                    progress.mastery_score,
                    progress.latest_score,

                    weak_topics.weakness_level

                 FROM revisions

                 INNER JOIN topics
                    ON revisions.topic_id =
                       topics.id

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
                       revisions.user_id

                 LEFT JOIN weak_topics
                    ON weak_topics.topic_id =
                       topics.id
                    AND weak_topics.user_id =
                       revisions.user_id

                 WHERE revisions.user_id =
                    $1

                 AND revisions.completed =
                    FALSE

                 AND revisions.scheduled_date <=
                    CURRENT_DATE

                 ORDER BY
                    revisions.scheduled_date ASC,
                    revisions.id ASC`,
                [
                    userId
                ]
            );


        const revisions =
            result.rows.map(
                (revision) => ({

                    ...revision,

                    scheduled_date:
                        normalizeDateOnly(
                            revision.scheduled_date
                        ),

                    mastery_score:
                        revision.mastery_score !==
                        null
                            ? Number(
                                revision.mastery_score
                            )
                            : null,

                    latest_score:
                        revision.latest_score !==
                        null
                            ? Number(
                                revision.latest_score
                            )
                            : null
                })
            );


        return res.status(200).json({
            status: "success",

            count:
                revisions.length,

            revisions
        });


    } catch (error) {

        console.error(
            "Get due revisions error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to load due revisions."
        });
    }
};


// ============================================
// RESCHEDULE REVISION
// ============================================

const rescheduleRevision = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const userId =
            req.user.userId;


        const {
            days
        } = req.body;


        let intervalDays =
            Number(
                days
            );


        if (
            !Number.isInteger(
                intervalDays
            ) ||
            intervalDays < 1
        ) {

            intervalDays =
                1;
        }


        intervalDays =
            Math.min(
                intervalDays,
                30
            );


        const result =
            await pool.query(
                `UPDATE revisions

                 SET
                    scheduled_date =
                        CURRENT_DATE +
                        $1::INTEGER,

                    interval_days =
                        $1

                 WHERE id =
                    $2

                 AND user_id =
                    $3

                 AND completed =
                    FALSE

                 RETURNING *`,
                [
                    intervalDays,
                    id,
                    userId
                ]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({
                status: "error",
                message:
                    "Active revision not found."
            });
        }


        return res.status(200).json({
            status: "success",

            message:
                `Revision moved ${intervalDays} day${
                    intervalDays === 1
                        ? ""
                        : "s"
                } forward.`,

            revision: {
                ...result.rows[0],

                scheduled_date:
                    normalizeDateOnly(
                        result.rows[0]
                            .scheduled_date
                    )
            }
        });


    } catch (error) {

        console.error(
            "Reschedule revision error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to reschedule revision."
        });
    }
};


// ============================================
// GET REVISION SUMMARY
// ============================================

const getRevisionSummary = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;


        const result =
            await pool.query(
                `SELECT

                    COUNT(*)
                    FILTER
                    (
                        WHERE completed =
                            FALSE
                    )
                        AS pending,

                    COUNT(*)
                    FILTER
                    (
                        WHERE completed =
                            FALSE

                        AND scheduled_date <
                            CURRENT_DATE
                    )
                        AS overdue,

                    COUNT(*)
                    FILTER
                    (
                        WHERE completed =
                            FALSE

                        AND scheduled_date =
                            CURRENT_DATE
                    )
                        AS due_today,

                    COUNT(*)
                    FILTER
                    (
                        WHERE completed =
                            TRUE
                    )
                        AS completed

                 FROM revisions

                 WHERE user_id =
                    $1`,
                [
                    userId
                ]
            );


        const row =
            result.rows[0];


        return res.status(200).json({
            status: "success",

            summary: {
                pending:
                    Number(
                        row.pending ||
                        0
                    ),

                overdue:
                    Number(
                        row.overdue ||
                        0
                    ),

                due_today:
                    Number(
                        row.due_today ||
                        0
                    ),

                completed:
                    Number(
                        row.completed ||
                        0
                    )
            }
        });


    } catch (error) {

        console.error(
            "Get revision summary error:",
            error
        );


        return res.status(500).json({
            status: "error",
            message:
                "Unable to load revision summary."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {

    getRevisions,

    getDueRevisions,

    rescheduleRevision,

    getRevisionSummary
};