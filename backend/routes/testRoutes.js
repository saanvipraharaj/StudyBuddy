const express = require("express");

const {
    createTest,
    generateTest,
    getTestsByTopic,
    getTestById,
    getTestQuestions,
    submitTest,
    updateTest,
    deleteTest
} = require("../controllers/testController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router =
    express.Router();


// ============================================
// AUTHENTICATION
// ============================================

router.use(authMiddleware);


// ============================================
// GENERATE AI TEST
// ============================================

router.post(
    "/generate/:topicId",
    generateTest
);


// ============================================
// CREATE TEST MANUALLY
// ============================================

router.post(
    "/",
    createTest
);


// ============================================
// GET TESTS FOR TOPIC
// ============================================

router.get(
    "/topic/:topicId",
    getTestsByTopic
);


// ============================================
// GET SAFE QUESTIONS
// ============================================

router.get(
    "/:id/questions",
    getTestQuestions
);


// ============================================
// SUBMIT TEST
// ============================================

router.post(
    "/:id/submit",
    submitTest
);


// ============================================
// GET SINGLE TEST
// ============================================

router.get(
    "/:id",
    getTestById
);


// ============================================
// UPDATE TEST
// ============================================

router.put(
    "/:id",
    updateTest
);


// ============================================
// DELETE TEST
// ============================================

router.delete(
    "/:id",
    deleteTest
);


module.exports = router;