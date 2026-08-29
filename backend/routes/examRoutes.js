const express =
    require("express");

const router =
    express.Router();

const authMiddleware =
    require(
        "../middleware/authMiddleware"
    );

const {
    createExam,
    getExams,
    getExamGroups,
    getExamsByGroup,
    deleteExam
} = require(
    "../controllers/examController"
);


// ============================================
// AUTH
// ============================================

router.use(
    authMiddleware
);


// ============================================
// GROUPS
// ============================================

router.get(
    "/groups",
    getExamGroups
);


router.get(
    "/group/:groupId",
    getExamsByGroup
);


// ============================================
// EXAMS
// ============================================

router.get(
    "/",
    getExams
);


router.post(
    "/",
    createExam
);


router.delete(
    "/:id",
    deleteExam
);


module.exports =
    router;