const jwt = require('jsonwebtoken');
const Shop = require('../models/shop');
const axios = require('axios').create({ family: 4, timeout: 10000 });

// Extract user via Sales JWT or fallback to CommonDB verification + SALES access
module.exports = async function requireUser(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const raw = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!raw) return res.status(401).json({ message: 'Missing token' });

    // Try local Sales token or branch token first
    try {
      const decoded = jwt.verify(raw, process.env.JWT_SECRET || 'dev-sales-secret');
      // If this is a branch token it will contain branch_id instead of userId
      if (decoded.branch_id) {
        req.user = { 
          branch_id: decoded.branch_id, 
          shop_id: decoded.shop_id, 
          isBranch: true, 
          branchName: decoded.name, 
          isAdmin: !!decoded.isAdmin 
        };
        return next();
      }
      req.user = { 
        userId: decoded.userId, 
        shop_id: decoded.shop_id,
        mongoPlanId: decoded.mongoPlanId // Include plan info from JWT
      };
      return next();
    } catch (_) {}

    // Else verify via CommonDB and ensure SALES access
    const verifyRes = await axios.post(`${process.env.AUTH_SERVER_URL}/internal-verify-token`, {}, {
      headers: { Authorization: `Bearer ${raw}`, 'x-internal-key': process.env.INTERNAL_API_KEY }
    });
    if (!verifyRes.data?.valid) return res.status(401).json({ message: 'Invalid token' });
    const userId = verifyRes.data.user.userId;

    const accessRes = await axios.post(`${process.env.AUTH_SERVER_URL}/get-user-sales-access`, {}, {
      headers: { Authorization: `Bearer ${raw}` }
    });
    if (!accessRes.data?.hasAccess) return res.status(403).json({ message: 'No SALES access' });
    
    const mongoPlanId = accessRes.data?.mongoPlanId || null;

    let shop = await Shop.findOne({ mysql_user_id: userId });
    if (!shop) shop = await Shop.create({ mysql_user_id: userId });
    req.user = { 
      userId, 
      shop_id: String(shop._id),
      mongoPlanId // Include plan info from access check
    };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.response?.data || err.message);
    res.status(401).json({ message: 'Unauthorized' });
  }
}
