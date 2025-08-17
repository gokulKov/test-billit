const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    mysql_user_id: { type: String, required: true, index: true },
    shop_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    address: { type: String },
    phoneNumber: { type: String },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SalesBranch || mongoose.model('SalesBranch', branchSchema);
