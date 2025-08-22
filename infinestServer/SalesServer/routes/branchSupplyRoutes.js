const express = require('express');
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { createBranchSupply, listBranchStock, listSuppliesForShop } = require('../controllers/branchSupplyController');

// Create a supply operation: deliver items from central stock to a branch
router.post('/api/branch-supply', requireUser, createBranchSupply);

// List current stock for branches (query: ?branch_id=)
router.get('/api/branch-stock', requireUser, listBranchStock);

// Admin: list supply operations for this shop
router.get('/api/branch-supplies', requireUser, listSuppliesForShop);

module.exports = router;
