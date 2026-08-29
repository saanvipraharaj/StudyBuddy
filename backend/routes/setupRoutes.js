const express = require("express");

const {
    getSetupProfile,
    saveSetupProfile
} = require("../controllers/setupController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getSetupProfile);

router.put("/", saveSetupProfile);

module.exports = router;