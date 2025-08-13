const express = require('express');
const multer = require("multer");
const router = express.Router();
const { downloadFullBackup, viewBackup } = require('../controllers/api/backupDownloadController');
const authenticateToken = require('../utils/authMiddleware'); // same as records
const authMySQLToken = require('../utils/authMySQLToken');
const { Plan, Feature } = require('../models/mongoModels');
const upload = multer(); // buffer upload


const { updateShopPlanLimitController } = require("../controllers/api/updateShopPlanLimitController");


// Secure this with your INTERNAL AUTH middleware
router.post("/update-shop-plan-limit", authMySQLToken, updateShopPlanLimitController);




const { getDashboardSummary } = require("../controllers/api/summaryController");
router.post("/dashboard/summary", authenticateToken, getDashboardSummary);

const { getDashboardSummaryPublic } = require("../controllers/api/summaryController");
router.get("/dashboard/summary/get/:shop_id", getDashboardSummaryPublic);


const { getDashboardRecords, getDashboardRecordsPublic } = require("../controllers/api/dashboardRecordsController");
router.post("/dashboard/records", authenticateToken, getDashboardRecords);

router.get("/dashboard/records/get/:shop_id", getDashboardRecordsPublic);
router.post("/backup/download", authenticateToken, downloadFullBackup);
router.post("/backup/view", upload.single("file"), viewBackup);

// Plan related routes
router.get('/plan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "Plan ID is required" });
    }

    const plan = await Plan.findById(id);
    
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    
    // Include features if available
    const features = await Feature.find({ plan_id: id });
    
    res.json({
      ...plan.toObject(),
      features: features || []
    });
  } catch (err) {
    console.error("Error fetching plan details:", err);
    res.status(500).json({ message: "Failed to fetch plan details", error: err.message });
  }
});


module.exports = router;



