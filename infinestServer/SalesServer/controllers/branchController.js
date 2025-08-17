const crypto = require('crypto');
const Branch = require('../models/branch');

const PLAN_LIMITS = {
  'sales-basic': 0,
  'sales-gold': 3,
  'sales-premium': 10
};

// POST /api/branches
const createBranch = async (req, res) => {
  try {
    const { name, address, phoneNumber, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    // Prefer branchLimit supplied in Sales JWT (populated from CommonDB MySQL plan table).
    // Fallback to PLAN_LIMITS map for backward compatibility.
    const jwtLimit = Number.isFinite(Number(req.user?.branchLimit)) ? Number(req.user.branchLimit) : null;
    const planId = req.user?.mongoPlanId || 'sales-basic';
    const limit = jwtLimit !== null ? jwtLimit : (PLAN_LIMITS[planId] ?? 0);

    if (limit <= 0) {
      return res.status(403).json({ success: false, message: 'Your plan does not allow branch creation' });
    }

    const count = await Branch.countDocuments({ shop_id: req.user.shop_id });
    if (count >= limit) {
      return res.status(403).json({ success: false, message: 'Branch limit reached for your plan' });
    }

    const exists = await Branch.findOne({ shop_id: req.user.shop_id, email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A branch with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const isAdmin = count === 0; // first branch is admin

    const doc = await Branch.create({
      mysql_user_id: req.user.userId,
      shop_id: req.user.shop_id,
      name,
      address: address || '',
      phoneNumber: phoneNumber || '',
      email,
      passwordHash,
      isAdmin,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    res.status(201).json({ success: true, branch: doc });
  } catch (err) {
    console.error('Create branch error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/branches
const listBranches = async (req, res) => {
  try {
    const list = await Branch.find({ shop_id: req.user.shop_id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, branches: list });
  } catch (err) {
    console.error('List branches error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBranch, listBranches };
