const express =
    require("express");


const router =
    express.Router();


const {
    getExamReadiness
} =
    require(
        "../controllers/examReadinessController"
    );


const authMiddleware =
    require(
        "../middleware/authMiddleware"
    );


// ============================================================
// AUTH
// ============================================================

router.use(
    authMiddleware
);


// ============================================================
// GET EXAM READINESS
//
// GET
// /api/exam-readiness
// ============================================================

router.get(
    "/",
    getExamReadiness
);


module.exports =
    router;