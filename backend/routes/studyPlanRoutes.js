const express = require("express");

const router =
    express.Router();


const {
    generateStudyPlan,
    getStudyPlans,
    getStudyPlanTasks,
    completeTask,
    rescheduleMissedTasks
} = require(
    "../controllers/studyPlanController"
);


const authMiddleware =
    require(
        "../middleware/authMiddleware"
    );


// ============================================
// AUTHENTICATION
// ============================================

router.use(
    authMiddleware
);


// ============================================
// GENERATE MASTER AI STUDY PLAN
//
// POST
// /api/study-plans/generate/:groupId
// ============================================

router.post(
    "/generate/:groupId",
    generateStudyPlan
);


// ============================================
// GET ALL USER STUDY PLANS
//
// GET
// /api/study-plans
// ============================================

router.get(
    "/",
    getStudyPlans
);


// ============================================
// GET STUDY PLAN TASKS
//
// GET
// /api/study-plans/:id/tasks
// ============================================

router.get(
    "/:id/tasks",
    getStudyPlanTasks
);


// ============================================
// COMPLETE STUDY TASK
//
// PATCH
// /api/study-plans/tasks/:taskId/complete
// ============================================

router.patch(
    "/tasks/:taskId/complete",
    completeTask
);


// ============================================
// RESCHEDULE MISSED TASKS
//
// POST
// /api/study-plans/:id/reschedule
// ============================================

router.post(
    "/:id/reschedule",
    rescheduleMissedTasks
);


module.exports =
    router;