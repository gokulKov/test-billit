const InStock = require('../models/inStock');
const Bank = require('../models/bank');
const BankTransaction = require('../models/bankTransaction');

exports.createInStock = async (req, res) => {
  try {
  console.debug('createInStock payload items:', JSON.stringify(req.body.items || []));
  const { shop_id, userId } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });

  // Branch users are not allowed to create in-stock entries via this endpoint
  if (req.user.isBranch) return res.status(403).json({ success: false, message: 'Branches cannot create in-stock entries' });

  const { supplier_id, bank_id, supplierAmount = 0, items = [], reference = '' } = req.body || {};
    if (!supplier_id) return res.status(400).json({ success: false, message: 'supplier_id is required' });
  if (!bank_id) return res.status(400).json({ success: false, message: 'bank_id is required' });

  // Removed supplierAmount vs totalCost validation as requested

    // Fetch and validate bank balance
    const bank = await Bank.findOne({ _id: bank_id, $or: [{ shop_id }, { mysql_user_id: req.user.userId }] });
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' });
    const currentBalance = Number(bank.accountBalance || 0);
    if (currentBalance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient bank balance' });
    }

  const doc = await InStock.create({
      shop_id,
      supplier_id,
      bank_id,
      supplierAmount: Number(supplierAmount) || 0,
      items: (items || []).map(i => {
        // Helper to generate random alphanumeric string (2-9 chars)
        function randomProductNo() {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          const len = Math.floor(Math.random() * 8) + 2;
          let str = '';
          for (let j = 0; j < len; j++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return str;
        }
        return {
          productNo: i.productNo && i.productNo.trim() ? i.productNo : randomProductNo(),
          productName: i.productName || '',
          brand: i.brand || '',
          model: i.model || '',
          quantity: Number(i.quantity) || 1,
          totalQuantity: Number(i.quantity) || 1,
          costPrice: Number(i.costPrice) || 0,
          sellingPrice: Number(i.sellingPrice) || 0,
          validity: i.validity ? new Date(i.validity) : undefined,
        };
      }),
      createdBy: String(userId || ''),
      updatedBy: String(userId || ''),
    });
  console.debug('createInStock saved doc items:', JSON.stringify(doc.items || []));

    // Debit bank and record transaction
    const newBalance = currentBalance - totalCost;
    bank.accountBalance = newBalance;
    await bank.save();
    const txn = await BankTransaction.create({
      shop_id,
      bank_id,
      type: 'debit',
      amount: totalCost,
      reference: reference || `InStock payment for supplier ${String(supplier_id)}`,
      supplier_id,
      inStock_id: doc._id,
      balanceAfter: newBalance,
      createdBy: String(userId || '')
    });

    return res.json({ success: true, entry: doc, bank: { _id: bank._id, accountBalance: newBalance }, transaction: txn });
  } catch (err) {
    console.error('createInStock error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listInStock = async (req, res) => {
  try {
    const { shop_id } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });
    // If branch user, restrict to banks owned by that branch
    if (req.user.isBranch) {
      const Bank = require('../models/bank');
      const banks = await Bank.find({ branch_id: req.user.branch_id }).select('_id').lean();
      const bankIds = banks.map(b => b._id);
      if (!bankIds.length) return res.json({ success: true, entries: [] });
      const entries = await InStock.find({ shop_id, bank_id: { $in: bankIds } })
        .sort({ createdAt: -1 })
        .populate('supplier_id', 'supplierName agencyName')
        .lean();
      return res.json({ success: true, entries });
    }

    const entries = await InStock.find({ shop_id })
      .sort({ createdAt: -1 })
      .populate('supplier_id', 'supplierName agencyName')
      .lean();
    // For each returned entry, compute for each item how much was shipped
    // to branches by comparing totalQuantity vs current quantity.
    try {
      const enriched = (entries || []).map(e => {
        const items = (Array.isArray(e.items) ? e.items : []).map(it => {
          const totalQ = Number(it.totalQuantity || it.quantity || 0);
          const currentQ = Number(it.quantity || 0);
          const shippedQty = Math.max(0, totalQ - currentQ);
          return { ...it, totalQuantity: totalQ, shippedQty };
        });
        return { ...e, items };
      });
      return res.json({ success: true, entries: enriched });
    } catch (err) {
      console.error('listInStock enrich error:', err && err.message ? err.message : err);
      return res.json({ success: true, entries });
    }
  } catch (err) {
    console.error('listInStock error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
