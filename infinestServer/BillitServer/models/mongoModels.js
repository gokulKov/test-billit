const mongoose = require("mongoose");

// ==============================
// 📦 Role Schema (Tracks Roles)
// ==============================
const roleSchema = new mongoose.Schema({
  mysql_user_id: { type: String, required: true, unique: true },
  role: { type: String, enum: ["manager", "shop_owner"], required: true },
  shop_type: { type: String, enum: ["separate_shop", "branch"], required: true },
  isComplete: { type: Boolean, default: false },
  mongoPlanId: { type: String, ref: "Plan" }, // ✅ Changed from ObjectId to String
  mongoCategoryId: { type: String, ref: "PlanCategory" }, // ✅ Changed from ObjectId to String
  created_at: { type: Date, default: Date.now }
});


// ==============================
// 👤 User Schema (Product-Specific Users)
// ==============================
const userSchema = new mongoose.Schema({
  mysql_user_id: { type: String, required: true, unique: true },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  isSubscriptionActive: { type: Boolean, default: true }, // ✅ New field
  created_at: { type: Date, default: Date.now }
});        

// ==============================
// 👑 Manager Schema
// ==============================
const managerSchema = new mongoose.Schema({
  mysql_user_id: { type: String, required: true, unique: true },
  plan_id: { type: String, required: true }, // ID from MySQL
  branch_limit: { type: Number, required: true },
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
  invite_code: { type: String, unique: true, required: true }, // 👈 Moved here
  created_at: { type: Date, default: Date.now }
});

// ==============================
// 🏢 Branch Schema
// ==============================
const branchSchema = new mongoose.Schema({
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },
  branch_name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// ==============================
// 🛍️ Shop Schema
// ==============================
const shopSchema = new mongoose.Schema({
  mysql_user_id: { type: String, required: true, unique: true },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  shop_name: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String }, // ✅ Add this line
  email: { type: String },
  address: { type: String },
  owner_name: { type: String }, // ✅ new field for MySQL name
  created_at: { type: Date, default: Date.now }
});

// ==============================
// 🧾 Dealer Schema
// ==============================
const dealerSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  client_name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  bill_no: { type: String },
  customer_type: { type: String, default: "Dealer" },
  balance_amount: { type: Number, default: 0 },
  no_of_mobile: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});


// ==============================
// 🔔 Notification Schema
// ==============================
const notificationSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  type: { type: String, enum: ["success", "error", "info", "warning"], default: "info" },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now, index: { expires: '7d' } } // auto-delete after 7 days
});


// ==============================
// 🧍 Customer Schema
// ==============================
const customerSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  client_name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  bill_no: { type: String },
  customer_type: { type: String, default: "Customer" },
  no_of_mobile: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// ==============================
// 📱 Mobile Schema
// ==============================
const mobileSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  dealer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
  mobile_name: { type: String, required: true },
  issue: { type: String },
  technician_name: { type: String },
  added_date: { type: Date, default: Date.now },
  update_date: { type: Date },
  ready: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  returned: { type: Boolean, default: false },
  paid_amount: { type: Number, default: 0 },
  delivery_date: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// ==============================
// 🔧 Technician Schema
// ==============================
const technicianSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  technician_name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  assigned_mobiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mobile" }],
  created_at: { type: Date, default: Date.now }
});

// ==============================
// 📂 Plan Category (Sales, Service...)
// ==============================
const planCategorySchema = new mongoose.Schema({
  _id: {
    type: String, // 👈 Use string-based constant ID
    required: true
  },
  name: {
    type: String,
    enum: ["Sales", "Service", "Sales + Service", "Manager"],
    required: true,
    unique: true
  },
  created_at: { type: Date, default: Date.now }
});


// ==============================
// 📦 Plan (Basic, Gold, Premium)
// ==============================
const planSchema = new mongoose.Schema({
  _id: {
    type: String, // 👈 Use string-based constant ID
    required: true
  },
  category_id: {
    type: String, // 👈 Reference will now also be a string
    ref: "PlanCategory",
    required: true
  },
  name: { type: String, enum: ["Basic", "Gold", "Premium"], required: true },
  description: String,
  branchLimit: { type: Number, required: true },
  originalPrice: String,
  price: String,
  savePercentage: Number,
  term: String,
  bonusOffer: String,
  renewalPrice: String,
  renewalTerm: String,
  isPopular: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});



// ==============================
// ✅ Feature Schema (Dummy Features)
// ==============================
// ✅ Feature Schema (Dummy Features)
const featureSchema = new mongoose.Schema({
  plan_id: { type: String, ref: "Plan", required: true }, // 🔁 FIXED from ObjectId → String
  feature_key: { type: String, required: true },
  type: { type: String, enum: ["boolean", "limit"], required: true },
  enabled: { type: Boolean },
  config: {
    totalPages: Number,
    entriesPerPage: Number,
    maxPerCreation: Number,
    // Sales-specific config fields
    maxBankAccounts: Number,
    maxSuppliers: Number,
    maxBranches: Number,
    maxProducts: Number,
  },
  description: { type: String }
});





const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  category: { type: String },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number },
  quantity: { type: Number, required: true },
  totalCost: { type: Number, required: true }, // should be calculated on save
  addedDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre("save", function (next) {
  this.totalCost = this.costPrice * this.quantity;
  next();
});

const productHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  changeDate: { type: Date, default: Date.now },
  changeType: { type: String, enum: ["ADD", "REMOVE", "EDIT", "SELL"], required: true },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  paidAmount: { type: Number },
  notes: { type: String }
});


const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});


const dailySummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, unique: true },
  totalRevenue: { type: Number, required: true },
  totalExpense: { type: Number, required: true },
  netRevenue: { type: Number, required: true }
});


// ==============================
// ✅ Export All Models
// ==============================
const Role = mongoose.model("Role", roleSchema);
const User = mongoose.model("User", userSchema);
const Manager = mongoose.model("Manager", managerSchema);
const Branch = mongoose.model("Branch", branchSchema);
const Shop = mongoose.model("Shop", shopSchema);
const Dealer = mongoose.model("Dealer", dealerSchema);
const Customer = mongoose.model("Customer", customerSchema);
const Mobile = mongoose.model("Mobile", mobileSchema);
const Technician = mongoose.model("Technician", technicianSchema);
const PlanCategory = mongoose.model("PlanCategory", planCategorySchema);
const Plan = mongoose.model("Plan", planSchema);
const Feature = mongoose.model("Feature", featureSchema);
const Product = mongoose.model("Product", productSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const ProductHistory = mongoose.model("ProductHistory", productHistorySchema);
// ==============================
// 🧾 Admin Sale Schema
// ==============================
const adminSaleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productNo: { type: String },
  productName: { type: String },
  qty: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 }
}, { _id: false });

const adminSaleSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
  seller_id: { type: String },
  customerNo: { type: String, default: '' },
  items: { type: [adminSaleItemSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'online' },
  bank_id: { type: String, default: '' },
  createdBy: { type: String, default: '' }
}, { timestamps: true });

const AdminSale = mongoose.model('AdminSale', adminSaleSchema);
const Expense = mongoose.model("Expense", expenseSchema);
const DailySummary = mongoose.model("DailySummary", dailySummarySchema);


module.exports = {
  Role, User, Manager, Branch, Shop, Dealer, Customer, Notification, Mobile, Technician,
  PlanCategory, Plan, Feature, DailySummary, Expense, ProductHistory, Product
};
