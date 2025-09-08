const express = require('express');
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { Feature } = require('../models/feature'); // Use local Feature model

// Get user features based on their plan
router.get('/api/user/features', requireUser, async (req, res) => {
  try {
    const { mongoPlanId } = req.user;
    
    console.log('🔍 Feature request - User plan:', mongoPlanId);
    
    if (!mongoPlanId) {
      return res.status(400).json({ 
        error: 'User plan not found. Please ensure you have a valid subscription.' 
      });
    }

    // Test MongoDB connection first
    console.log('🔍 Testing MongoDB connection...');
    const testCount = await Feature.countDocuments();
    console.log('🔍 Total features in DB:', testCount);
    
    // Fetch features for the user's plan with timeout
    console.log('🔍 Fetching features for plan:', mongoPlanId);
    const features = await Feature.find({ plan_id: mongoPlanId }).lean().maxTimeMS(5000);
    console.log('🔍 Found features:', features.length);
    
    // Also return the user's plan for context
    res.json({
      success: true,
      userPlan: mongoPlanId,
      features: features,
      totalFeatures: features.length
    });

  } catch (error) {
    console.error('❌ Error fetching user features:', error);
    res.status(500).json({ 
      error: 'Failed to fetch features',
      message: error.message 
    });
  }
});

// Get specific feature by key
router.get('/api/user/features/:featureKey', requireUser, async (req, res) => {
  try {
    const { mongoPlanId } = req.user;
    const { featureKey } = req.params;
    
    if (!mongoPlanId) {
      return res.status(400).json({ 
        error: 'User plan not found. Please ensure you have a valid subscription.' 
      });
    }

    const feature = await Feature.findOne({ 
      plan_id: mongoPlanId, 
      feature_key: featureKey 
    }).lean();
    
    if (!feature) {
      return res.status(404).json({ 
        error: 'Feature not found for your plan',
        featureKey,
        userPlan: mongoPlanId
      });
    }

    res.json({
      success: true,
      feature: feature,
      userPlan: mongoPlanId
    });

  } catch (error) {
    console.error('❌ Error fetching specific feature:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feature',
      message: error.message 
    });
  }
});

// Check if a specific feature is enabled
router.get('/api/user/features/:featureKey/enabled', requireUser, async (req, res) => {
  try {
    const { mongoPlanId } = req.user;
    const { featureKey } = req.params;
    
    if (!mongoPlanId) {
      return res.status(400).json({ 
        error: 'User plan not found',
        enabled: false
      });
    }

    const feature = await Feature.findOne({ 
      plan_id: mongoPlanId, 
      feature_key: featureKey 
    }).lean();
    
    const isEnabled = feature?.enabled ?? false;

    res.json({
      success: true,
      featureKey,
      enabled: isEnabled,
      userPlan: mongoPlanId,
      feature: feature || null
    });

  } catch (error) {
    console.error('❌ Error checking feature enabled status:', error);
    res.status(500).json({ 
      error: 'Failed to check feature status',
      enabled: false,
      message: error.message 
    });
  }
});

// Get feature limits for a specific feature
router.get('/api/user/features/:featureKey/limits', requireUser, async (req, res) => {
  try {
    const { mongoPlanId } = req.user;
    const { featureKey } = req.params;
    
    if (!mongoPlanId) {
      return res.status(400).json({ 
        error: 'User plan not found',
        limits: {}
      });
    }

    const feature = await Feature.findOne({ 
      plan_id: mongoPlanId, 
      feature_key: featureKey 
    }).lean();
    
    if (!feature || feature.type !== 'limit') {
      return res.status(404).json({ 
        error: 'Limit feature not found for your plan',
        featureKey,
        userPlan: mongoPlanId,
        limits: {}
      });
    }

    res.json({
      success: true,
      featureKey,
      limits: feature.config || {},
      userPlan: mongoPlanId,
      description: feature.description
    });

  } catch (error) {
    console.error('❌ Error fetching feature limits:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feature limits',
      limits: {},
      message: error.message 
    });
  }
});

// Debug endpoint to check user info and features
router.get('/api/debug/user-info', requireUser, async (req, res) => {
  try {
    const { mongoPlanId, userId, shop_id } = req.user;
    
    // Get features for this plan
    const features = await Feature.find({ plan_id: mongoPlanId }).lean();
    
    res.json({
      debug: true,
      userInfo: {
        userId,
        shop_id,
        mongoPlanId,
        hasFeatures: features.length > 0
      },
      features: features,
      featureKeys: features.map(f => f.feature_key),
      enabledBooleanFeatures: features.filter(f => f.type === 'boolean' && f.enabled).map(f => f.feature_key),
      limitFeatures: features.filter(f => f.type === 'limit').map(f => ({ key: f.feature_key, config: f.config }))
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ 
      debug: true,
      error: 'Debug failed',
      message: error.message 
    });
  }
});

module.exports = router;
