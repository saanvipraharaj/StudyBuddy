const pool = require("../config/db");


// ============================================
// CANONICAL EXAM TYPES
// ============================================

const ALLOWED_EXAM_TYPES = [
    "internal",
    "practical",
    "external_midterm",
    "external_endterm",
    "other"
];


// ============================================
// ALLOWED PRIORITIES
// ============================================

const ALLOWED_PRIORITIES = [
    "low",
    "medium",
    "high"
];


// ============================================
// NORMALIZE EXAM TYPE
// ============================================

const normalizeExamType = (
    value
) => {

    if (!value) {
        return null;
    }


    const rawValue =
        String(value)
            .trim()
            .toLowerCase();


    // ============================================
    // NORMALIZE SPACING / SYMBOLS
    // ============================================

    const cleanedValue =
        rawValue
            .replace(/[()]/g, "")
            .replace(/[-]+/g, " ")
            .replace(/[_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();


    // ============================================
    // INTERNAL
    // ============================================

    if (
        cleanedValue === "internal" ||
        cleanedValue === "internal exam" ||
        cleanedValue === "internal examination"
    ) {

        return "internal";
    }


    // ============================================
    // PRACTICAL
    // ============================================

    if (
        cleanedValue === "practical" ||
        cleanedValue === "practical exam" ||
        cleanedValue === "practical examination"
    ) {

        return "practical";
    }


    // ============================================
    // EXTERNAL MIDTERM
    // ============================================

    if (
        cleanedValue === "external midterm" ||
        cleanedValue === "external midterm exam" ||
        cleanedValue === "external midterm examination" ||
        cleanedValue === "midterm" ||
        cleanedValue === "midterm exam"
    ) {

        return "external_midterm";
    }


    // ============================================
    // EXTERNAL ENDTERM
    // ============================================

    if (
        cleanedValue === "external endterm" ||
        cleanedValue === "external endterm exam" ||
        cleanedValue === "external endterm examination" ||
        cleanedValue === "endterm" ||
        cleanedValue === "endterm exam" ||
        cleanedValue === "end term" ||
        cleanedValue === "end term exam"
    ) {

        return "external_endterm";
    }


    // ============================================
    // OTHER
    // ============================================

    if (
        cleanedValue === "other" ||
        cleanedValue === "other exam"
    ) {

        return "other";
    }


    // ============================================
    // CANONICAL DATABASE VALUES
    // ============================================

    if (
        ALLOWED_EXAM_TYPES.includes(
            rawValue
        )
    ) {

        return rawValue;
    }


    return null;
};


// ============================================
// NORMALIZE PRIORITY
// ============================================

const normalizePriority = (
    value
) => {

    const normalized =
        String(
            value ||
            "medium"
        )
            .trim()
            .toLowerCase();


    if (
        ALLOWED_PRIORITIES.includes(
            normalized
        )
    ) {

        return normalized;
    }


    return "medium";
};


// ============================================
// GROUP DISPLAY NAME
// ============================================

const getDefaultGroupName = (
    examType,
    customExamType
) => {

    switch (examType) {

        case "internal":

            return "Internal Exams";


        case "practical":

            return "Practical Exams";


        case "external_midterm":

            return "External Midterm Exams";


        case "external_endterm":

            return "External Endterm Exams";


        case "other":

            return customExamType
                ? String(
                    customExamType
                ).trim()
                : "Other Exams";


        default:

            return "Exam Group";
    }
};


// ============================================
// EXAM TYPE DISPLAY NAME
// ============================================

const getExamTypeDisplayName = (
    examType,
    customExamType = null
) => {

    switch (examType) {

        case "internal":

            return "Internal Exam";


        case "practical":

            return "Practical";


        case "external_midterm":

            return "External (Midterm) Exam";


        case "external_endterm":

            return "External (Endterm) Exam";


        case "other":

            return (
                customExamType ||
                "Other"
            );


        default:

            return examType;
    }
};


// ============================================
// CREATE EXAM
// ============================================

const createExam = async (
    req,
    res
) => {

    try {

        const {
            subject_id,
            exam_name,
            exam_date,
            exam_time,
            exam_type,
            custom_exam_type,
            priority,
            notes
        } = req.body;


        const userId =
            req.user.userId;


        // ============================================
        // BASIC VALIDATION
        // ============================================

        if (
            !subject_id ||
            !exam_name ||
            !String(
                exam_name
            ).trim() ||
            !exam_date ||
            !exam_type
        ) {

            return res.status(400).json({

                status: "error",

                message:
                    "Subject, exam name, exam date and exam type are required."
            });
        }


        // ============================================
        // NORMALIZE EXAM TYPE
        // ============================================

        const normalizedType =
            normalizeExamType(
                exam_type
            );


        if (!normalizedType) {

            console.log(
                "Invalid exam type received:",
                exam_type
            );


            return res.status(400).json({

                status: "error",

                message:
                    "Invalid exam type."
            });
        }


        // ============================================
        // CUSTOM EXAM TYPE
        // ============================================

        let normalizedCustomExamType =
            null;


        if (
            normalizedType ===
            "other"
        ) {

            if (
                !custom_exam_type ||
                !String(
                    custom_exam_type
                ).trim()
            ) {

                return res.status(400).json({

                    status: "error",

                    message:
                        "Please enter the exam type."
                });
            }


            normalizedCustomExamType =
                String(
                    custom_exam_type
                )
                    .trim();
        }


        // ============================================
        // PRIORITY
        // ============================================

        const normalizedPriority =
            normalizePriority(
                priority
            );


        // ============================================
        // VERIFY SUBJECT OWNERSHIP
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
                    subject_id,
                    userId
                ]
            );


        if (
            subjectResult.rows.length ===
            0
        ) {

            return res.status(404).json({

                status: "error",

                message:
                    "Subject not found."
            });
        }


        // ============================================
        // GROUP NAME
        // ============================================

        const groupName =
            getDefaultGroupName(
                normalizedType,
                normalizedCustomExamType
            );


        // ============================================
        // FIND EXISTING ACTIVE GROUP
        // ============================================

        let groupResult;


        if (
            normalizedType ===
            "other"
        ) {

            groupResult =
                await pool.query(

                    `SELECT *

                     FROM exam_groups

                     WHERE user_id = $1

                     AND exam_type = 'other'

                     AND LOWER(
                        COALESCE(
                            custom_exam_type,
                            ''
                        )
                     ) = LOWER($2)

                     AND status = 'active'

                     LIMIT 1`,

                    [
                        userId,
                        normalizedCustomExamType
                    ]
                );

        } else {

            groupResult =
                await pool.query(

                    `SELECT *

                     FROM exam_groups

                     WHERE user_id = $1

                     AND exam_type = $2

                     AND status = 'active'

                     LIMIT 1`,

                    [
                        userId,
                        normalizedType
                    ]
                );
        }


        // ============================================
        // CREATE GROUP IF NEEDED
        // ============================================

        let examGroup;


        if (
            groupResult.rows.length >
            0
        ) {

            examGroup =
                groupResult.rows[0];

        } else {

            const createdGroup =
                await pool.query(

                    `INSERT INTO exam_groups
                    (
                        user_id,
                        group_name,
                        exam_type,
                        custom_exam_type,
                        status
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        'active'
                    )

                    RETURNING *`,

                    [
                        userId,

                        groupName,

                        normalizedType,

                        normalizedType ===
                        "other"
                            ? normalizedCustomExamType
                            : null
                    ]
                );


            examGroup =
                createdGroup.rows[0];
        }


        // ============================================
        // CREATE EXAM
        // ============================================

        const result =
            await pool.query(

                `INSERT INTO exams
                (
                    user_id,
                    subject_id,
                    exam_group_id,
                    exam_name,
                    exam_date,
                    exam_time,
                    exam_type,
                    custom_exam_type,
                    priority,
                    notes
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
                    $10
                )

                RETURNING *`,

                [
                    userId,

                    subject_id,

                    examGroup.id,

                    String(
                        exam_name
                    ).trim(),

                    exam_date,

                    exam_time ||
                        null,

                    normalizedType,

                    normalizedType ===
                    "other"
                        ? normalizedCustomExamType
                        : null,

                    normalizedPriority,

                    notes
                        ? String(
                            notes
                        ).trim()
                        : null
                ]
            );


        const createdExam =
            result.rows[0];


        // ============================================
        // SUCCESS
        // ============================================

        return res.status(201).json({

            status: "success",

            message:
                "Exam added successfully.",

            exam: {
                ...createdExam,

                exam_type_display:
                    getExamTypeDisplayName(
                        createdExam.exam_type,
                        createdExam.custom_exam_type
                    )
            },

            exam_group:
                examGroup
        });


    } catch (error) {

        console.error(
            "Create exam error:",
            error
        );


        return res.status(500).json({

            status: "error",

            message:
                "Unable to create exam."
        });
    }
};


// ============================================
// GET EXAMS
// ============================================

const getExams = async (
    req,
    res
) => {

    try {

        const result =
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
                    exams.created_at,

                    subjects.name
                        AS subject_name,

                    exam_groups.group_name,

                    exam_groups.exam_type
                        AS group_exam_type

                 FROM exams

                 INNER JOIN subjects
                    ON exams.subject_id =
                       subjects.id

                 LEFT JOIN exam_groups
                    ON exams.exam_group_id =
                       exam_groups.id

                 WHERE exams.user_id =
                    $1

                 ORDER BY
                    exams.exam_date ASC,
                    exams.exam_time ASC`,

                [
                    req.user.userId
                ]
            );


        // ============================================
        // ADD DISPLAY LABEL
        // ============================================

        const exams =
            result.rows.map(
                (exam) => ({

                    ...exam,

                    exam_type_display:
                        getExamTypeDisplayName(
                            exam.exam_type,
                            exam.custom_exam_type
                        )
                })
            );


        return res.status(200).json({

            status: "success",

            count:
                exams.length,

            exams
        });


    } catch (error) {

        console.error(
            "Get exams error:",
            error
        );


        return res.status(500).json({

            status: "error",

            message:
                "Unable to load exams."
        });
    }
};


// ============================================
// GET EXAM GROUPS
// ============================================

const getExamGroups = async (
    req,
    res
) => {

    try {

        const result =
            await pool.query(

                `SELECT
                    exam_groups.id,
                    exam_groups.group_name,
                    exam_groups.exam_type,
                    exam_groups.custom_exam_type,
                    exam_groups.status,
                    exam_groups.created_at,

                    COUNT(exams.id)
                        AS exam_count,

                    MIN(exams.exam_date)
                        AS first_exam_date,

                    MAX(exams.exam_date)
                        AS last_exam_date

                 FROM exam_groups

                 LEFT JOIN exams
                    ON exam_groups.id =
                       exams.exam_group_id

                 WHERE exam_groups.user_id =
                    $1

                 GROUP BY
                    exam_groups.id

                 ORDER BY
                    MIN(exams.exam_date)
                    ASC NULLS LAST`,

                [
                    req.user.userId
                ]
            );


        // ============================================
        // ADD DISPLAY LABEL
        // ============================================

        const examGroups =
            result.rows.map(
                (group) => ({

                    ...group,

                    exam_type_display:
                        getExamTypeDisplayName(
                            group.exam_type,
                            group.custom_exam_type
                        )
                })
            );


        return res.status(200).json({

            status: "success",

            count:
                examGroups.length,

            exam_groups:
                examGroups
        });


    } catch (error) {

        console.error(
            "Get exam groups error:",
            error
        );


        return res.status(500).json({

            status: "error",

            message:
                "Unable to load exam groups."
        });
    }
};


// ============================================
// GET EXAMS FOR GROUP
// ============================================

const getExamsByGroup = async (
    req,
    res
) => {

    try {

        const {
            groupId
        } = req.params;


        const result =
            await pool.query(

                `SELECT
                    exams.*,

                    subjects.name
                        AS subject_name

                 FROM exams

                 INNER JOIN subjects
                    ON exams.subject_id =
                       subjects.id

                 INNER JOIN exam_groups
                    ON exams.exam_group_id =
                       exam_groups.id

                 WHERE exams.exam_group_id =
                    $1

                 AND exam_groups.user_id =
                    $2

                 ORDER BY
                    exams.exam_date ASC,
                    exams.exam_time ASC`,

                [
                    groupId,
                    req.user.userId
                ]
            );


        const exams =
            result.rows.map(
                (exam) => ({

                    ...exam,

                    exam_type_display:
                        getExamTypeDisplayName(
                            exam.exam_type,
                            exam.custom_exam_type
                        )
                })
            );


        return res.status(200).json({

            status: "success",

            count:
                exams.length,

            exams
        });


    } catch (error) {

        console.error(
            "Get group exams error:",
            error
        );


        return res.status(500).json({

            status: "error",

            message:
                "Unable to load exams."
        });
    }
};


// ============================================
// DELETE EXAM
// ============================================

const deleteExam = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        // ============================================
        // DELETE EXAM
        // ============================================

        const result =
            await pool.query(

                `DELETE FROM exams

                 WHERE id = $1
                 AND user_id = $2

                 RETURNING
                    id,
                    exam_group_id`,

                [
                    id,
                    req.user.userId
                ]
            );


        if (
            result.rows.length ===
            0
        ) {

            return res.status(404).json({

                status: "error",

                message:
                    "Exam not found."
            });
        }


        const groupId =
            result.rows[0]
                .exam_group_id;


        // ============================================
        // REMOVE EMPTY GROUP
        // ============================================

        if (groupId) {

            const remaining =
                await pool.query(

                    `SELECT
                        COUNT(*) AS count

                     FROM exams

                     WHERE exam_group_id =
                        $1`,

                    [
                        groupId
                    ]
                );


            if (
                Number(
                    remaining
                        .rows[0]
                        .count
                ) === 0
            ) {

                await pool.query(

                    `DELETE FROM exam_groups

                     WHERE id = $1
                     AND user_id = $2`,

                    [
                        groupId,
                        req.user.userId
                    ]
                );
            }
        }


        return res.status(200).json({

            status: "success",

            message:
                "Exam deleted successfully."
        });


    } catch (error) {

        console.error(
            "Delete exam error:",
            error
        );


        return res.status(500).json({

            status: "error",

            message:
                "Unable to delete exam."
        });
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {

    createExam,

    getExams,

    getExamGroups,

    getExamsByGroup,

    deleteExam
};