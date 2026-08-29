require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");

const passport =
    require("./config/passport");


// ============================================
// ROUTES
// ============================================

const authRoutes =
    require("./routes/authRoutes");

const profileRoutes =
    require("./routes/profileRoutes");

const subjectRoutes =
    require("./routes/subjectRoutes");

const chapterRoutes =
    require("./routes/chapterRoutes");

const topicRoutes =
    require("./routes/topicRoutes");

const topicLearningRoutes =
    require("./routes/topicLearningRoutes");

const flashcardRoutes =
    require("./routes/flashcardRoutes");

const materialRoutes =
    require("./routes/materialRoutes");

const testRoutes =
    require("./routes/testRoutes");

const progressRoutes =
    require("./routes/progressRoutes");

const revisionRoutes =
    require("./routes/revisionRoutes");

const mistakeRoutes =
    require("./routes/mistakeRoutes");

const examRoutes =
    require("./routes/examRoutes");

const studyPlanRoutes =
    require("./routes/studyPlanRoutes");

const examReadinessRoutes =
    require("./routes/examReadinessRoutes");

const passwordRoutes =
    require("./routes/passwordRoutes");

const setupRoutes =
    require("./routes/setupRoutes");


// ============================================
// APP
// ============================================

const app =
    express();


// ============================================
// MIDDLEWARE
// ============================================

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            "http://localhost:5173",

        credentials:
            true
    })
);


app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================
// PASSPORT
// ============================================

app.use(
    passport.initialize()
);


// ============================================
// STATIC FILES
// ============================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// ============================================
// API ROUTES
// ============================================


// ============================================
// AUTHENTICATION
// ============================================

app.use(
    "/api/auth",
    authRoutes
);


// ============================================
// USER PROFILE
// ============================================

app.use(
    "/api/profile",
    profileRoutes
);


// ============================================
// INITIAL STUDENT SETUP
// ============================================

app.use(
    "/api/setup",
    setupRoutes
);


// ============================================
// SUBJECTS
// ============================================

app.use(
    "/api/subjects",
    subjectRoutes
);


// ============================================
// CHAPTERS
// ============================================

app.use(
    "/api/chapters",
    chapterRoutes
);


// ============================================
// TOPICS
// ============================================

app.use(
    "/api/topics",
    topicRoutes
);


// ============================================
// TOPIC LEARNING CONTENT
// ============================================

app.use(
    "/api/topic-learning",
    topicLearningRoutes
);


// ============================================
// FLASHCARDS
// ============================================

app.use(
    "/api/flashcards",
    flashcardRoutes
);


// ============================================
// STUDY MATERIALS / PDFs
// ============================================

app.use(
    "/api/materials",
    materialRoutes
);


// ============================================
// TESTS
// ============================================

app.use(
    "/api/tests",
    testRoutes
);


// ============================================
// PROGRESS / MASTERY
// ============================================

app.use(
    "/api/progress",
    progressRoutes
);


// ============================================
// REVISIONS / WEAK TOPICS
// ============================================

app.use(
    "/api/revisions",
    revisionRoutes
);


// ============================================
// MISTAKE BANK
// ============================================

app.use(
    "/api/mistakes",
    mistakeRoutes
);


// ============================================
// EXAMS
// ============================================

app.use(
    "/api/exams",
    examRoutes
);


// ============================================
// AI STUDY PLANS
// ============================================

app.use(
    "/api/study-plans",
    studyPlanRoutes
);


// ============================================
// EXAM READINESS
// ============================================

app.use(
    "/api/exam-readiness",
    examReadinessRoutes
);


// ============================================
// PASSWORD MANAGEMENT
// ============================================

app.use(
    "/api/password",
    passwordRoutes
);


// ============================================
// HOME ROUTE
// ============================================

app.get(
    "/",
    (req, res) => {

        res.status(200).json({
            status:
                "success",

            message:
                "StudyBuddy AI Backend is running"
        });
    }
);


// ============================================
// HEALTH CHECK
// ============================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({
            status:
                "OK",

            message:
                "StudyBuddy API is healthy"
        });
    }
);


// ============================================
// DATABASE TEST
// ============================================

app.get(
    "/api/test-db",
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(
                    "SELECT NOW() AS current_time"
                );


            res.status(200).json({
                status:
                    "success",

                message:
                    "Database connected successfully",

                database_time:
                    result
                        .rows[0]
                        .current_time
            });


        } catch (error) {

            console.error(
                "Database error:",
                error
            );


            res.status(500).json({
                status:
                    "error",

                message:
                    "Database connection failed"
            });
        }
    }
);


// ============================================
// API 404 HANDLER
// ============================================

app.use(
    "/api",
    (
        req,
        res
    ) => {

        res.status(404).json({
            status:
                "error",

            message:
                "API route not found"
        });
    }
);


// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            err
        );


        // ============================================
        // MULTER FILE SIZE ERROR
        // ============================================

        if (
            err.code ===
            "LIMIT_FILE_SIZE"
        ) {

            return res
                .status(400)
                .json({
                    status:
                        "error",

                    message:
                        "PDF file is too large"
                });
        }


        // ============================================
        // PDF VALIDATION ERROR
        // ============================================

        if (
            err.message ===
            "Only PDF files are allowed"
        ) {

            return res
                .status(400)
                .json({
                    status:
                        "error",

                    message:
                        "Only PDF files are allowed"
                });
        }


        // ============================================
        // GOOGLE AUTH ERROR
        // ============================================

        if (
            err.name ===
            "AuthenticationError"
        ) {

            return res
                .status(401)
                .json({
                    status:
                        "error",

                    message:
                        "Google authentication failed"
                });
        }


        // ============================================
        // DEFAULT SERVER ERROR
        // ============================================

        return res
            .status(500)
            .json({
                status:
                    "error",

                message:
                    "Internal server error"
            });
    }
);


// ============================================
// START SERVER
// ============================================

const PORT =
    process.env.PORT ||
    5000;


app.listen(
    PORT,
    () => {

        console.log(
            "----------------------------------------"
        );

        console.log(
            "StudyBuddy AI Backend"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            `Frontend URL: ${
                process.env.FRONTEND_URL ||
                "http://localhost:5173"
            }`
        );

        console.log(
            "Google callback:"
        );

        console.log(
            process.env.GOOGLE_CALLBACK_URL ||
            "http://localhost:5000/api/auth/google/callback"
        );

        console.log(
            "----------------------------------------"
        );
    }
);