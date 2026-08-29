const express = require("express");

const {
    createTopic,
    generateTopics,
    getTopics,
    getTopicById,
    updateTopic,
    deleteTopic
} = require("../controllers/topicController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// AUTHENTICATION
// ============================================

router.use(authMiddleware);


// ============================================
// AI GENERATE TOPICS
// ============================================

router.post(
    "/generate/:chapterId",
    generateTopics
);


// ============================================
// CREATE TOPIC
// ============================================

router.post(
    "/",
    createTopic
);


// ============================================
// GET TOPICS FOR CHAPTER
// ============================================

router.get(
    "/chapter/:chapterId",
    getTopics
);


// ============================================
// GET SINGLE TOPIC
// ============================================

router.get(
    "/:id",
    getTopicById
);


// ============================================
// UPDATE TOPIC
// ============================================

router.put(
    "/:id",
    updateTopic
);


// ============================================
// DELETE TOPIC
// ============================================

router.delete(
    "/:id",
    deleteTopic
);


module.exports = router;