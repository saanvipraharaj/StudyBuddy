const express = require("express");

const {
    getTopicLearningContent,
    generateLearningContent
} = require(
    "../controllers/topicLearningController"
);

const authMiddleware =
    require("../middleware/authMiddleware");

const router =
    express.Router();


// ============================================
// AUTHENTICATION
// ============================================

router.use(authMiddleware);


// ============================================
// GENERATE CONTENT
// ============================================

router.post(
    "/generate/:topicId",
    generateLearningContent
);


// ============================================
// GET SAVED CONTENT
// ============================================

router.get(
    "/:topicId",
    getTopicLearningContent
);


module.exports = router;