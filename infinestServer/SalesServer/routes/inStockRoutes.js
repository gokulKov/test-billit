const express = require('express');
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { createInStock, listInStock } = require('../controllers/inStockController');

router.post('/api/in-stock', requireUser, createInStock);
router.get('/api/in-stock', requireUser, listInStock);

module.exports = router;
