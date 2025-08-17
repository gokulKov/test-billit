const Supplier = require('../models/supplier');

exports.createSupplier = async (req, res) => {
  try {
    const { shop_id, userId } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });

    const {
      supplierName = '',
      agencyName = '',
      phoneNumber = '',
      address = '',
      gstNumber = '',
      panNumber = ''
    } = req.body || {};

    const doc = await Supplier.create({
      shop_id,
      supplierName,
      agencyName,
      phoneNumber,
      address,
      gstNumber,
      panNumber,
      createdBy: String(userId || ''),
      updatedBy: String(userId || ''),
    });

    return res.json({ success: true, supplier: doc });
  } catch (err) {
    console.error('createSupplier error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listSuppliers = async (req, res) => {
  try {
    const { shop_id } = req.user || {};
    if (!shop_id) return res.status(400).json({ success: false, message: 'Shop missing' });

    const suppliers = await Supplier.find({ shop_id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, suppliers });
  } catch (err) {
    console.error('listSuppliers error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
