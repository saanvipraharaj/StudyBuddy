const express = require("express");

const {
    createChapter,
    getChapters,
    getChapterById,
    updateChapter,
    deleteChapter
} = require("../controllers/chapterController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


// Create chapter
router.post("/", createChapter);


// Get chapters belonging to a subject
router.get("/subject/:subjectId", getChapters);


// Get one chapter
router.get("/:id", getChapterById);


// Update chapter
router.put("/:id", updateChapter);


// Delete chapter
router.delete("/:id", deleteChapter);


module.exports = router;