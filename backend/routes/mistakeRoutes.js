const express =
    require("express");


const router =
    express.Router();


const {

    getMistakes,

    getMistakesByTopic,

    getMistakeSummary

} = require(
    "../controllers/mistakeController"
);


const authMiddleware =
    require(
        "../middleware/authMiddleware"
    );


// ============================================
// AUTH
// ============================================

router.use(
    authMiddleware
);


// ============================================
// SUMMARY
//
// GET /api/mistakes/summary
// ============================================

router.get(
    "/summary",
    getMistakeSummary
);


// ============================================
// TOPIC MISTAKES
//
// GET /api/mistakes/topic/:topicId
// ============================================

router.get(
    "/topic/:topicId",
    getMistakesByTopic
);


// ============================================
// ALL MISTAKES
//
// GET /api/mistakes
// ============================================

router.get(
    "/",
    getMistakes
);


module.exports =
    router;