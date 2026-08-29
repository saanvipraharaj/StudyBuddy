const express =
    require("express");


const router =
    express.Router();


const {

    getRevisions,

    getDueRevisions,

    rescheduleRevision,

    getRevisionSummary

} = require(
    "../controllers/revisionController"
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
// GET /api/revisions/summary
// ============================================

router.get(
    "/summary",
    getRevisionSummary
);


// ============================================
// DUE REVISIONS
//
// GET /api/revisions/due
// ============================================

router.get(
    "/due",
    getDueRevisions
);


// ============================================
// ALL REVISIONS
//
// GET /api/revisions
// ============================================

router.get(
    "/",
    getRevisions
);


// ============================================
// RESCHEDULE
//
// PATCH /api/revisions/:id/reschedule
// ============================================

router.patch(
    "/:id/reschedule",
    rescheduleRevision
);


module.exports =
    router;