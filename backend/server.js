require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");

const passport = require("./config/passport");

// ============================================
// ROUTES
// ============================================

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const topicRoutes = require("./routes/topicRoutes");
const topicLearningRoutes = require("./routes/topicLearningRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const materialRoutes = require("./routes/materialRoutes");
const testRoutes = require("./routes/testRoutes");
const progressRoutes = require("./routes/progressRoutes");
const revisionRoutes = require("./routes/revisionRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const examRoutes = require("./routes/examRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
const examReadinessRoutes = require("./routes/examReadinessRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const setupRoutes = require("./routes/setupRoutes");

// ============================================
// APP
// ============================================

const app = express();

// ============================================
// ROUTE DIAGNOSTIC HELPER
// ============================================

const mountRoute = (routePath, router, routeName) => {
    console.log(
        `[ROUTE CHECK] ${routeName}:`,
        typeof router
    );

    if (typeof router !== "function") {
        console.error(
            `[ROUTE ERROR] ${routeName} is invalid`,
            router
        );

        throw new TypeError(
            `${routeName} is not a valid Express router. Received: ${typeof router}`
        );
    }

    app.use(routePath, router);

    console.log(
        `[ROUTE OK] ${routeName} mounted at ${routePath}`
    );
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            process.env.FRONTEND_URL
        ].filter(Boolean),

        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ============================================
// PASSPORT
// ============================================

app.use(passport.initialize());

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

// AUTHENTICATION
mountRoute(
    "/api/auth",
    authRoutes,
    "authRoutes"
);

// USER PROFILE
mountRoute(
    "/api/profile",
    profileRoutes,
    "profileRoutes"
);

// INITIAL STUDENT SETUP
mountRoute(
    "/api/setup",
    setupRoutes,
    "setupRoutes"
);

// SUBJECTS
mountRoute(
    "/api/subjects",
    subjectRoutes,
    "subjectRoutes"
);

// CHAPTERS
mountRoute(
    "/api/chapters",
    chapterRoutes,
    "chapterRoutes"
);

// TOPICS
mountRoute(
    "/api/topics",
    topicRoutes,
    "topicRoutes"
);

// TOPIC LEARNING CONTENT
mountRoute(
    "/api/topic-learning",
    topicLearningRoutes,
    "topicLearningRoutes"
);

// FLASHCARDS
mountRoute(
    "/api/flashcards",
    flashcardRoutes,
    "flashcardRoutes"
);

// STUDY MATERIALS / PDFs
mountRoute(
    "/api/materials",
    materialRoutes,
    "materialRoutes"
);

// TESTS
mountRoute(
    "/api/tests",
    testRoutes,
    "testRoutes"
);

// PROGRESS / MASTERY
mountRoute(
    "/api/progress",
    progressRoutes,
    "progressRoutes"
);

// REVISIONS / WEAK TOPICS
mountRoute(
    "/api/revisions",
    revisionRoutes,
    "revisionRoutes"
);

// MISTAKE BANK
mountRoute(
    "/api/mistakes",
    mistakeRoutes,
    "mistakeRoutes"
);

// EXAMS
mountRoute(
    "/api/exams",
    examRoutes,
    "examRoutes"
);

// AI STUDY PLANS
mountRoute(
    "/api/study-plans",
    studyPlanRoutes,
    "studyPlanRoutes"
);

// EXAM READINESS
mountRoute(
    "/api/exam-readiness",
    examReadinessRoutes,
    "examReadinessRoutes"
);

// PASSWORD MANAGEMENT
mountRoute(
    "/api/password",
    passwordRoutes,
    "passwordRoutes"
);

// ============================================
// HOME ROUTE
// ============================================

app.get(
    "/",
    (req, res) => {
        res.status(200).json({
            status: "success",
            message: "StudyBuddy AI Backend is running"
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
            status: "OK",
            message: "StudyBuddy API is healthy"
        });
    }
);

// ============================================
// DATABASE TEST
// ============================================

app.get(
    "/api/test-db",
    async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT NOW() AS current_time"
            );

            res.status(200).json({
                status: "success",
                message: "Database connected successfully",
                database_time:
                    result.rows[0].current_time
            });

        } catch (error) {
            console.error(
                "Database error:",
                error
            );

            res.status(500).json({
                status: "error",
                message: "Database connection failed"
            });
        }
    }
);

// ============================================
// API 404 HANDLER
// ============================================

app.use(
    "/api",
    (req, res) => {
        res.status(404).json({
            status: "error",
            message: "API route not found"
        });
    }
);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(
    (err, req, res, next) => {
        console.error(
            "Unhandled server error:",
            err
        );

        // MULTER FILE SIZE ERROR
        if (
            err.code ===
            "LIMIT_FILE_SIZE"
        ) {
            return res
                .status(400)
                .json({
                    status: "error",
                    message: "PDF file is too large"
                });
        }

        // PDF VALIDATION ERROR
        if (
            err.message ===
            "Only PDF files are allowed"
        ) {
            return res
                .status(400)
                .json({
                    status: "error",
                    message: "Only PDF files are allowed"
                });
        }

        // GOOGLE AUTH ERROR
        if (
            err.name ===
            "AuthenticationError"
        ) {
            return res
                .status(401)
                .json({
                    status: "error",
                    message: "Google authentication failed"
                });
        }

        // DEFAULT SERVER ERROR
        return res
            .status(500)
            .json({
                status: "error",
                message: "Internal server error"
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

module.exports = app;