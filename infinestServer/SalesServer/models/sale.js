const mongoose = require('mongoose');

const SaleItem = new mongoose.Schema({
  productId: { type: String, default: '' },
  productNo: { type: String, default: '' },
  productName: { type: String, default: '' },
  qty: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 }
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  shop_id: { type: String, index: true },
  branch_id: { type: String, index: true },
  seller_id: { type: String, default: '' },
  customerNo: { type: String, default: '' },
  items: { type: [SaleItem], default: [] },
  totalAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash','online'], default: 'cash' },
  amountPaid: { type: Number, default: 0 },
  bank_id: { type: String, default: '' },
  createdBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
