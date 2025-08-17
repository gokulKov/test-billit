const Bank = require('../models/bank');

// POST /api/banks
const createBank = async (req, res) => {
  try {
    const { bankName, accountNumber, holderName, address, phoneNumber, accountBalance } = req.body || {};
    const payload = {
      mysql_user_id: req.user.userId || req.user.branch_id || '',
      shop_id: req.user.shop_id || null,
      branch_id: req.user.isBranch ? req.user.branch_id : undefined,
      branchName: req.user.isBranch ? req.user.branchName || '' : undefined,

      bankName: bankName || '',
      accountNumber: accountNumber || '',
      holderName: holderName || '',
      address: address || '',
      phoneNumber: phoneNumber || '',
      accountBalance: accountBalance === '' || accountBalance === undefined || accountBalance === null ? undefined : Number(accountBalance),
      createdBy: req.user.userId || req.user.branch_id || '',
      updatedBy: req.user.userId || req.user.branch_id || '',
    };
    const doc = await Bank.create(payload);
    res.status(201).json({ success: true, bank: doc });
  } catch (err) {
    console.error('Create bank error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/banks
const listBanks = async (req, res) => {
  try {
    let filter = {};
    if (req.user.isBranch) {
      // Branch users see only banks created by their branch
      filter = { branch_id: req.user.branch_id };
    } else {
      // Admin/sales user should see banks they created (mysql_user_id)
      // plus any banks created for their shop (branch-created banks where shop_id matches)
      filter = { $or: [ { mysql_user_id: req.user.userId }, { shop_id: req.user.shop_id } ] };
    }
    const list = await Bank.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, banks: list });
  } catch (err) {
    console.error('List banks error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBank, listBanks };
