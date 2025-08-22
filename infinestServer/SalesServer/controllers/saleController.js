const Sale = require('../models/sale');

exports.listSales = async (req, res) => {
  try {
    const shop_id = req.user.shop_id;
    const branch_id = req.query.branch_id || req.user.branch_id || null;
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(10, Number(req.query.pageSize || 25)));
    const q = { shop_id };
    if (branch_id) q.branch_id = branch_id;
    const total = await Sale.countDocuments(q);
    const sales = await Sale.find(q).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean();
    return res.json({ success: true, sales, total, page, pageSize });
  } catch (err) {
    console.error('listSales error:', err && err.message ? err.message : err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createSale = async (req, res) => {
  try {
    const shop_id = req.user.shop_id;
    const branch_id = req.user.branch_id || req.body.branch_id;
    if (!branch_id) return res.status(400).json({ success: false, message: 'branch_id required' });

    const seller_id = req.user.branch_id ? req.user.branch_id : (req.user.userId || '');
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const customerNo = req.body.customerNo || '';
    const paymentMethod = req.body.paymentMethod || 'cash';
    const amountPaid = Number(req.body.amountPaid || 0);
    const bank_id = req.body.bank_id || '';

    const totalAmount = items.reduce((s, it) => s + (Number(it.qty || it.sellingQty || 0) * Number(it.sellingPrice || 0)), 0);

    // Check branch stock availability before creating the sale
    try {
      const BranchStock = require('../models/branchStock');
      for (const it of items) {
        const required = Math.max(0, Number(it.qty || it.sellingQty || 0));
        if (required <= 0) continue;
        // Build search using productId and/or productNo
        const or = [];
        if (it.productId) or.push({ productId: it.productId });
        if (it.productNo && String(it.productNo).trim() !== '') or.push({ productNo: String(it.productNo).trim() });

        if (or.length === 0) {
          // No reliable identifier to check availability
          return res.status(400).json({ success: false, message: `Cannot verify stock for an item without productId or productNo` });
        }

        const query = { shop_id, branch_id, $or: or };
        const bs = await BranchStock.findOne(query).lean();
        const available = bs ? Number(bs.qty || 0) : 0;
        if (available < required) {
          const idDesc = it.productId || it.productNo || it.productName || 'unknown';
          return res.status(400).json({ success: false, message: `Insufficient stock for ${idDesc}: available ${available}, requested ${required}` });
        }
      }
    } catch (e) {
      console.error('createSale: availability check failed', e && e.message ? e.message : e);
      return res.status(500).json({ success: false, message: 'Server error during availability check' });
    }

    const doc = await Sale.create({ shop_id, branch_id, seller_id, customerNo, items, totalAmount, paymentMethod, amountPaid, bank_id, createdBy: req.user.userId || req.user.branch_id || '' });

    // If payment went to a bank, create a BankTransaction (credit) and update Bank.accountBalance
    try {
      if (bank_id) {
        const Bank = require('../models/bank');
        const BankTransaction = require('../models/bankTransaction');
        const bankDoc = await Bank.findById(bank_id);
        if (bankDoc) {
          const newBal = (Number(bankDoc.accountBalance || 0) + Number(totalAmount || 0));
          const tx = await BankTransaction.create({ shop_id: shop_id, bank_id: bank_id, type: 'credit', amount: Number(totalAmount || 0), reference: `Sale:${doc._id}`, balanceAfter: newBal, createdBy: req.user.userId || req.user.branch_id || '' });
          await Bank.findByIdAndUpdate(bank_id, { $set: { accountBalance: newBal } });
        }
      }
    } catch (e) {
      console.error('createSale: bank update failed', e && e.message ? e.message : e);
    }

    // Decrement BranchStock quantities for sold items
    try {
      const BranchStock = require('../models/branchStock');
      for (const it of items) {
        try {
          if (!it.productId) continue;
          await BranchStock.findOneAndUpdate({ shop_id, branch_id, productId: it.productId }, { $inc: { qty: -Math.max(0, Number(it.qty || it.sellingQty || 0)) } });
        } catch (e) {}
      }
    } catch (e) {
      console.error('createSale: decrement branch stock failed', e && e.message ? e.message : e);
    }

    return res.status(201).json({ success: true, sale: doc });
  } catch (err) {
    console.error('createSale error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
