const express = require('express');
const router = express.Router();
const { Feature, User, Role } = require('../models/mongoModels');
const authenticateToken = require("../utils/authMiddleware");


router.get('/user/features', authenticateToken, async (req, res) => {
    try {
        const mongoPlanId = req.user.mongoPlanId;
        if (!mongoPlanId) {
            return res.status(400).json({ message: "Plan not found for user." });
        }
        const features = await Feature.find({ plan_id: mongoPlanId });
        res.json({ success: true, features });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching features." });
    }
});


module.exports = router;




