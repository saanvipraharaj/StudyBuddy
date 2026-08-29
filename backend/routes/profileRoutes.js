const express = require("express");

const {
    getProfile,
    updateProfile
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// All profile routes require login
router.use(authMiddleware);


// Get profile
router.get("/", getProfile);


// Update profile
router.put("/", updateProfile);


module.exports = router;