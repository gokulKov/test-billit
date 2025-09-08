const mongoose = require('mongoose');
const { Feature } = require('./models/mongoModels');

// MongoDB connection
const MONGO_URI = process.env.BILLIT_MONGO_URI || 'mongodb://127.0.0.1:27017/billit_db';

// Sales Basic Plan Features
const salesBasicFeatures = [
  {
    plan_id: "sales-basic",
    feature_key: "bank_accounts_enabled",
    type: "boolean",
    enabled: true,
    description: "Bank account management enabled"
  },
  {
    plan_id: "sales-basic",
    feature_key: "bank_accounts_limit",
    type: "limit",
    config: {
      maxBankAccounts: 1
    },
    description: "Maximum 1 bank account"
  },
  {
    plan_id: "sales-basic",
    feature_key: "suppliers_enabled",
    type: "boolean",
    enabled: true,
    description: "Supplier management enabled"
  },
  {
    plan_id: "sales-basic",
    feature_key: "suppliers_limit",
    type: "limit",
    config: {
      maxSuppliers: 5
    },
    description: "Maximum 5 suppliers"
  },
  {
    plan_id: "sales-basic",
    feature_key: "gst_calculator_enabled",
    type: "boolean",
    enabled: false,
    description: "GST calculator disabled"
  },
  {
    plan_id: "sales-basic",
    feature_key: "payment_history_enabled",
    type: "boolean",
    enabled: false,
    description: "Payment history disabled"
  },
  {
    plan_id: "sales-basic",
    feature_key: "supply_history_enabled",
    type: "boolean",
    enabled: false,
    description: "Supply history disabled"
  },
  {
    plan_id: "sales-basic",
    feature_key: "branch_management_enabled",
    type: "boolean",
    enabled: true,
    description: "Branch management enabled"
  },
  {
    plan_id: "sales-basic",
    feature_key: "branch_limit",
    type: "limit",
    config: {
      maxBranches: 1
    },
    description: "Maximum 1 branch"
  },
  {
    plan_id: "sales-basic",
    feature_key: "total_inventory_volume",
    type: "limit",
    config: {
      maxProducts: 500
    },
    description: "Maximum 500 products in inventory"
  }
];

// Sales Gold Plan Features
const salesGoldFeatures = [
  {
    plan_id: "sales-gold",
    feature_key: "bank_accounts_enabled",
    type: "boolean",
    enabled: true,
    description: "Bank account management enabled"
  },
  {
    plan_id: "sales-gold",
    feature_key: "bank_accounts_limit",
    type: "limit",
    config: {
      maxBankAccounts: 5
    },
    description: "Maximum 5 bank accounts"
  },
  {
    plan_id: "sales-gold",
    feature_key: "suppliers_enabled",
    type: "boolean",
    enabled: true,
    description: "Supplier management enabled"
  },
  {
    plan_id: "sales-gold",
    feature_key: "suppliers_limit",
    type: "limit",
    config: {
      maxSuppliers: 15
    },
    description: "Maximum 15 suppliers"
  },
  {
    plan_id: "sales-gold",
    feature_key: "gst_calculator_enabled",
    type: "boolean",
    enabled: true,
    description: "GST calculator enabled"
  },
  {
    plan_id: "sales-gold",
    feature_key: "payment_history_enabled",
    type: "boolean",
    enabled: true,
    description: "Payment history enabled"
  },
  {
    plan_id: "sales-gold",
    feature_key: "supply_history_enabled",
    type: "boolean",
    enabled: false,
    description: "Supply history disabled"
  },
  {
    plan_id: "sales-gold",
    feature_key: "branch_management_enabled",
    type: "boolean",
    enabled: true,
    description: "Branch management enabled"
  },
  {
    plan_id: "sales-gold",
    feature_key: "branch_limit",
    type: "limit",
    config: {
      maxBranches: 3
    },
    description: "Maximum 3 branches"
  },
  {
    plan_id: "sales-gold",
    feature_key: "total_inventory_volume",
    type: "limit",
    config: {
      maxProducts: 1000
    },
    description: "Maximum 1000 products in inventory"
  }
];

// Sales Premium Plan Features
const salesPremiumFeatures = [
  {
    plan_id: "sales-premium",
    feature_key: "bank_accounts_enabled",
    type: "boolean",
    enabled: true,
    description: "Bank account management enabled"
  },
  {
    plan_id: "sales-premium",
    feature_key: "bank_accounts_limit",
    type: "limit",
    config: {
      maxBankAccounts: 999999
    },
    description: "Unlimited bank accounts"
  },
  {
    plan_id: "sales-premium",
    feature_key: "suppliers_enabled",
    type: "boolean",
    enabled: true,
    description: "Supplier management enabled"
  },
  {
    plan_id: "sales-premium",
    feature_key: "suppliers_limit",
    type: "limit",
    config: {
      maxSuppliers: 999999
    },
    description: "Unlimited suppliers"
  },
  {
    plan_id: "sales-premium",
    feature_key: "gst_calculator_enabled",
    type: "boolean",
    enabled: true,
    description: "GST calculator enabled"
  },
  {
    plan_id: "sales-premium",
    feature_key: "payment_history_enabled",
    type: "boolean",
    enabled: true,
    description: "Payment history enabled"
  },
  {
    plan_id: "sales-premium",
    feature_key: "supply_history_enabled",
    type: "boolean",
    enabled: true,
    description: "Supply history enabled"
  },
  {
    plan_id: "sales-premium",
    feature_key: "branch_management_enabled",
    type: "boolean",
    enabled: true,
    description: "Branch management enabled"
  },
  {
    plan_id: "sales-premium",
    feature_key: "branch_limit",
    type: "limit",
    config: {
      maxBranches: 5
    },
    description: "Maximum 5 branches"
  },
  {
    plan_id: "sales-premium",
    feature_key: "total_inventory_volume",
    type: "limit",
    config: {
      maxProducts: 999999
    },
    description: "Unlimited products in inventory"
  }
];

// Seeding function
const seedSalesFeatures = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');

    // Check existing features count before seeding
    const existingCount = await Feature.countDocuments();
    console.log(`📊 Existing features in database: ${existingCount}`);

    // Check if sales features already exist
    const existingSalesFeatures = await Feature.countDocuments({ 
      plan_id: { $regex: /^sales-/ } 
    });
    
    if (existingSalesFeatures > 0) {
      console.log(`⚠️  Found ${existingSalesFeatures} existing sales features. Removing them first...`);
      await Feature.deleteMany({ plan_id: { $regex: /^sales-/ } });
      console.log('✅ Removed existing sales features');
    }

    // Combine all sales features
    const allSalesFeatures = [
      ...salesBasicFeatures,
      ...salesGoldFeatures,
      ...salesPremiumFeatures
    ];

    console.log('📦 Inserting sales features...');
    const result = await Feature.insertMany(allSalesFeatures);
    console.log(`✅ Successfully inserted ${result.length} sales features`);

    // Verify insertion
    const basicCount = await Feature.countDocuments({ plan_id: "sales-basic" });
    const goldCount = await Feature.countDocuments({ plan_id: "sales-gold" });
    const premiumCount = await Feature.countDocuments({ plan_id: "sales-premium" });
    
    console.log('\n📋 Sales Features Summary:');
    console.log(`   📦 Sales Basic: ${basicCount} features`);
    console.log(`   🥇 Sales Gold: ${goldCount} features`);
    console.log(`   💎 Sales Premium: ${premiumCount} features`);
    
    // Total feature count after seeding
    const totalCount = await Feature.countDocuments();
    console.log(`\n📊 Total features in database: ${totalCount}`);

    console.log('\n🎉 Sales features seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding
if (require.main === module) {
  seedSalesFeatures();
}

module.exports = { seedSalesFeatures };
