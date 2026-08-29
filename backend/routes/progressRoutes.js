const express = require("express");

const {
    getOverallProgress,
    getSubjectProgress
} = require(
    "../controllers/progressController"
);

const authMiddleware =
    require("../middleware/authMiddleware");


const router = express.Router();


// ============================================
// AUTHENTICATION
// ============================================

router.use(authMiddleware);


// ============================================
// GET OVERALL STUDENT PROGRESS
// ============================================
//
// GET /api/progress
//

router.get(
    "/",
    getOverallProgress
);


// ============================================
// GET SUBJECT PROGRESS
// ============================================
//
// GET /api/progress/subject/:subjectId
//

router.get(
    "/subject/:subjectId",
    getSubjectProgress
);


// ============================================
// EXPORT
// ============================================

module.exports = router;