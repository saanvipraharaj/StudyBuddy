const express = require("express");

const {
    getFlashcardsByTopic,
    generateFlashcards,
    reviewFlashcard
} = require(
    "../controllers/flashcardController"
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
// GENERATE FLASHCARDS
// ============================================

router.post(
    "/generate/:topicId",
    generateFlashcards
);


// ============================================
// REVIEW FLASHCARD
// ============================================

router.post(
    "/:id/review",
    reviewFlashcard
);


// ============================================
// GET FLASHCARDS FOR TOPIC
// ============================================

router.get(
    "/topic/:topicId",
    getFlashcardsByTopic
);


// ============================================
// EXPORT
// ============================================

module.exports = router;