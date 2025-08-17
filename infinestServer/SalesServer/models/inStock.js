const mongoose = require('mongoose');

const InStockItemSchema = new mongoose.Schema({
  productName: { type: String, default: '' },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  // Store as Date for calendar input; old string values remain readable in Mongo
  validity: { type: Date },
}, { _id: false });

const InStockSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true, required: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true, required: true },
  bank_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', index: true },
  supplierAmount: { type: Number, default: 0 },
  items: { type: [InStockItemSchema], default: [] },
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('InStock', InStockSchema);
