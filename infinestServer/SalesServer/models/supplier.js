const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true, required: true },
  supplierName: { type: String, default: '' },
  agencyName: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
