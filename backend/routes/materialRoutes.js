const express = require("express");
const multer = require("multer");

const {
    uploadMaterial,
    getMaterialsByChapter,
    getCombinedChapterText,
    getMaterialById,
    deleteMaterial
} = require("../controllers/materialController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

// ============================================
// MULTER MEMORY STORAGE
// Vercel-safe: no permanent local uploads folder
// ============================================

const storage = multer.memoryStorage();

// ============================================
// PDF FILE FILTER
// ============================================

const fileFilter = (
    req,
    file,
    cb
) => {
    if (
        file.mimetype ===
        "application/pdf"
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF files are allowed"
            ),
            false
        );
    }
};

// ============================================
// MULTER CONFIG
// ============================================

const upload = multer({
    storage,

    fileFilter,

    limits: {
        fileSize:
            15 * 1024 * 1024
    }
});

// ============================================
// AUTHENTICATION
// ============================================

router.use(
    authMiddleware
);

// ============================================
// UPLOAD PDF
// ============================================

router.post(
    "/upload",
    upload.single("file"),
    uploadMaterial
);

// ============================================
// GET COMBINED CHAPTER TEXT
// ============================================

router.get(
    "/chapter/:chapterId/combined-text",
    getCombinedChapterText
);

// ============================================
// GET ALL MATERIALS FOR CHAPTER
// ============================================

router.get(
    "/chapter/:chapterId",
    getMaterialsByChapter
);

// ============================================
// GET SINGLE MATERIAL
// ============================================

router.get(
    "/:id",
    getMaterialById
);

// ============================================
// DELETE MATERIAL
// ============================================

router.delete(
    "/:id",
    deleteMaterial
);

module.exports = router;