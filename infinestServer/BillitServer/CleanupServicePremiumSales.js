const mongoose = require('mongoose');
const { Feature } = require('./models/mongoModels');

// MongoDB connection
const MONGO_URI = process.env.BILLIT_MONGO_URI || 'mongodb://127.0.0.1:27017/billit_db';

async function cleanupServicePremiumSalesFeatures() {
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

    // Remove service-premium sales features (no longer needed)
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
      console.log(`⚠️  Found ${servicePremiumSalesCount} service-premium sales features. Removing them...`);
      await Feature.deleteMany({ 
        plan_id: "service-premium",
        feature_key: { $in: [
          "bank_accounts_enabled", "bank_accounts_limit", "suppliers_enabled", 
          "suppliers_limit", "gst_calculator_enabled", "payment_history_enabled",
          "supply_history_enabled", "branch_management_enabled", "branch_limit",
          "inventory_management_enabled"
        ]}
      });
      console.log('✅ Removed service-premium sales features (no longer needed)');
    } else {
      console.log('ℹ️  No service-premium sales features found to remove');
    }

    // Final count
    const finalCount = await Feature.countDocuments();
    console.log(`📊 Total features in database: ${finalCount}`);

    console.log('🎉 Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    console.log('🔌 Disconnected from MongoDB');
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the cleanup
cleanupServicePremiumSalesFeatures();
