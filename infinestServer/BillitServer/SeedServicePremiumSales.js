const mongoose = require('mongoose');
const { Feature } = require('./models/mongoModels');

// MongoDB connection
const MONGO_URI = process.env.BILLIT_MONGO_URI || 'mongodb://127.0.0.1:27017/billit_db';

// Service Premium Plan Sales Features (same as sales-premium)
const servicePremiumSalesFeatures = [
  {
    plan_id: "service-premium",
    feature_key: "bank_accounts_enabled",
    type: "boolean",
    enabled: true,
    description: "Bank account management enabled"
  },
  {
    plan_id: "service-premium",
    feature_key: "bank_accounts_limit",
    type: "limit",
    config: {
      maxBankAccounts: 999
    },
    description: "Unlimited bank accounts"
  },
  {
    plan_id: "service-premium",
    feature_key: "suppliers_enabled",
    type: "boolean",
    enabled: true,
    description: "Supplier management enabled"
  },
  {
    plan_id: "service-premium",
    feature_key: "suppliers_limit",
    type: "limit",
    config: {
      maxSuppliers: 999
    },
    description: "Unlimited suppliers"
  },
  {
    plan_id: "service-premium",
    feature_key: "gst_calculator_enabled",
    type: "boolean",
    enabled: true,
    description: "GST calculator enabled"
  },
  {
    plan_id: "service-premium",
    feature_key: "payment_history_enabled",
    type: "boolean",
    enabled: true,
    description: "Payment history tracking enabled"
  },
  {
    plan_id: "service-premium",
    feature_key: "supply_history_enabled",
    type: "boolean",
    enabled: true,
    description: "Supply history tracking enabled"
  },
  {
    plan_id: "service-premium",
    feature_key: "branch_management_enabled",
    type: "boolean",
    enabled: true,
    description: "Branch management enabled"
  },
  {
    plan_id: "service-premium",
    feature_key: "branch_limit",
    type: "limit",
    config: {
      maxBranches: 999
    },
    description: "Unlimited branches"
  },
  {
    plan_id: "service-premium",
    feature_key: "inventory_management_enabled",
    type: "boolean",
    enabled: true,
    description: "Advanced inventory management enabled"
  }
];

async function seedServicePremiumSalesFeatures() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check existing features
    const existingCount = await Feature.countDocuments();
    console.log(`📊 Existing features in database: ${existingCount}`);

    // Remove existing service-premium sales features if any
    const servicePremiumSalesCount = await Feature.countDocuments({ 
      plan_id: "service-premium",
      feature_key: { $in: [
        "bank_accounts_enabled", "bank_accounts_limit", "suppliers_enabled", 
        "suppliers_limit", "gst_calculator_enabled", "payment_history_enabled",
        "supply_history_enabled", "branch_management_enabled", "branch_limit",
        "inventory_management_enabled"
      ]}
    });
    
    if (servicePremiumSalesCount > 0) {
      console.log(`⚠️  Found ${servicePremiumSalesCount} existing service-premium sales features. Removing them first...`);
      await Feature.deleteMany({ 
        plan_id: "service-premium",
        feature_key: { $in: [
          "bank_accounts_enabled", "bank_accounts_limit", "suppliers_enabled", 
          "suppliers_limit", "gst_calculator_enabled", "payment_history_enabled",
          "supply_history_enabled", "branch_management_enabled", "branch_limit",
          "inventory_management_enabled"
        ]}
      });
      console.log('✅ Removed existing service-premium sales features');
    }

    // Insert new service-premium sales features
    console.log('📦 Inserting service-premium sales features...');
    await Feature.insertMany(servicePremiumSalesFeatures);
    console.log(`✅ Successfully inserted ${servicePremiumSalesFeatures.length} service-premium sales features`);

    // Final count
    const finalCount = await Feature.countDocuments();
    console.log(`📊 Total features in database: ${finalCount}`);

    console.log('🎉 Service Premium sales features seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding service-premium sales features:', error);
  } finally {
    console.log('🔌 Disconnected from MongoDB');
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the seeding
seedServicePremiumSalesFeatures();
