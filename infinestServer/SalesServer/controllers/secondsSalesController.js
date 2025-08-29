const fs = require('fs');
const path = require('path');
const SecondsSale = require('../models/secondsSale');

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { }
}

function saveBase64File(base64, destDir, originalName) {
  try {
    const match = base64.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const data = match[2];
    const buffer = Buffer.from(data, 'base64');
    ensureDir(destDir);
    const ext = (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const filePath = path.join(destDir, filename);
    fs.writeFileSync(filePath, buffer);
    return { filename, originalName: originalName || filename, mimeType: mime, size: buffer.length, path: filePath };
  } catch (err) {
    console.error('saveBase64File error', err && err.message);
    return null;
  }
}

exports.create = async (req, res) => {
  try {
    const { shop_id } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });

    const payload = req.body || {};
    const destBase = path.resolve(__dirname, '..', 'uploads', 'seconds-sales');

    const images = (payload.images || []).map(f => saveBase64File(f.base64, destBase, f.name)).filter(Boolean);
    const documents = (payload.documents || []).map(f => saveBase64File(f.base64, destBase, f.name)).filter(Boolean);
    const signatures = (payload.signatures || []).map(f => saveBase64File(f.base64, destBase, f.name)).filter(Boolean);

    // If bank_id provided, debit the bank by valueOfProduct
    const bank_id = payload.bank_id || payload.paymentBankId || null;
    const value = Number(payload.valueOfProduct) || 0;
    let txn = null;
    if (bank_id) {
      const Bank = require('../models/bank');
      const BankTransaction = require('../models/bankTransaction');
      const bank = await Bank.findOne({ _id: bank_id, $or: [{ shop_id }, { mysql_user_id: req.user.userId }] });
      if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' });
      const current = Number(bank.accountBalance || 0);
      if (current < value) return res.status(400).json({ success: false, message: 'Insufficient bank balance' });
      bank.accountBalance = current - value;
      await bank.save();
      txn = await BankTransaction.create({ shop_id, bank_id: bank._id, type: 'debit', amount: value, reference: `SecondsSale debit`, balanceAfter: bank.accountBalance, createdBy: String(req.user.userId || '') });
    }

    const doc = await SecondsSale.create({
      shop_id,
      branch_id: req.user.branch_id || undefined,
      mobileName: payload.mobileName || '',
      model: payload.model || '',
      imeNo: payload.imeNo || '',
      specification: payload.specification || '',
      mobileCondition: payload.mobileCondition || '',
      colour: payload.colour || '',
      sellerName: payload.sellerName || '',
      sellerAddress: payload.sellerAddress || '',
      referenceName: payload.referenceName || '',
      referenceNumber: payload.referenceNumber || '',
      reasonForSale: payload.reasonForSale || '',
      proofType: payload.proofType || '',
      proofNo: payload.proofNo || '',
      valueOfProduct: Number(payload.valueOfProduct) || 0,
      paymentMethod: payload.paymentMethod || '',
      images,
      documents,
      signatures,
      createdBy: String(req.user.userId || ''),
    });

  return res.json({ success: true, entry: doc, transaction: txn });
  } catch (err) {
    console.error('secondsSales.create error', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { shop_id } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });
    const q = { shop_id };
    if (req.user.isBranch && req.user.branch_id) q.branch_id = req.user.branch_id;
    const rows = await SecondsSale.find(q).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, rows });
  } catch (err) {
    console.error('secondsSales.list error', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create a purchase for a specific seconds-sale entry
exports.createPurchase = async (req, res) => {
  try {
    const { shop_id } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ success: false, message: 'id required' });
    const payload = req.body || {};
    const destBase = path.resolve(__dirname, '..', 'uploads', 'seconds-sales');

    // save base64 files
    const images = (payload.images || []).map(f => saveBase64File(f.base64, destBase, f.name)).filter(Boolean);
    const documents = (payload.documents || []).map(f => saveBase64File(f.base64, destBase, f.name)).filter(Boolean);

    const price = Number(payload.price || 0);
    if (!price || price <= 0) return res.status(400).json({ success: false, message: 'Price required' });

    const SecondsSale = require('../models/secondsSale');
    const doc = await SecondsSale.findOne({ _id: id, shop_id });
    if (!doc) return res.status(404).json({ success: false, message: 'SecondsSale entry not found' });

    let txn = null;
    if (payload.bank_id) {
      const Bank = require('../models/bank');
      const BankTransaction = require('../models/bankTransaction');
      const bank = await Bank.findOne({ _id: payload.bank_id, $or: [{ shop_id }, { mysql_user_id: req.user.userId }] });
      if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' });
      bank.accountBalance = Number(bank.accountBalance || 0) + price; // credit
      await bank.save();
      txn = await BankTransaction.create({ shop_id, bank_id: bank._id, type: 'credit', amount: price, reference: `Seconds Mobile sold for`, balanceAfter: bank.accountBalance, createdBy: String(req.user.userId || '') });
    }

    const purchase = {
      customerName: payload.customerName || '',
      phone: payload.phone || '',
      price: price,
      images,
      documents,
      bankTransactionId: txn ? txn._id : undefined,
      bank_id: txn ? txn.bank_id : (payload.bank_id || undefined),
      bankName: payload.bankName || undefined,
      createdAt: new Date()
    };

    doc.purchases = doc.purchases || [];
    doc.purchases.push(purchase);
    doc.sold = true;
    await doc.save();

    return res.json({ success: true, purchase, transaction: txn, entry: doc });
  } catch (err) {
    console.error('createPurchase error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
