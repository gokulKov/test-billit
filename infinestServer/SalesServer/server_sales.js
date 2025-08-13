require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios').create({ family: 4, timeout: 10000 });
const jwt = require('jsonwebtoken');
const Shop = require('./models/shop');

const { syncSalesUser } = require('./controllers/salesSyncController');
const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.AUTH_SERVER_URL || 'http://localhost:7000',
  'http://localhost:3020',
  'http://127.0.0.1:3020'
  ],
  credentials: true,
}));

// Mongo connection (reuse BILLIT_MONGO_URI as requested)
const MONGO_URI = process.env.BILLIT_MONGO_URI || 'mongodb://127.0.0.1:27017/billit_db';
mongoose.connect(MONGO_URI).then(() => console.log('✅ Sales Mongo Connected')).catch(e => console.error('❌ Sales Mongo error:', e.message));

// Models are defined in ./models to avoid redefinition

app.get('/health', (req, res) => res.json({ ok: true }));

// Sales auth: login using CommonDB and issue a JWT with userId, mongoPlanId, shop_id
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    // Login against CommonDB
    const loginRes = await axios.post(`${process.env.AUTH_SERVER_URL}/login`, { email, password });
    const token = loginRes.data?.token;
    if (!token) return res.status(401).json({ message: 'Invalid credentials' });

    // Verify token to get MySQL userId
    const verifyRes = await axios.post(`${process.env.AUTH_SERVER_URL}/internal-verify-token`, {}, {
      headers: { Authorization: `Bearer ${token}`, 'x-internal-key': process.env.INTERNAL_API_KEY }
    });
    if (!verifyRes.data?.valid) return res.status(401).json({ message: 'Invalid token' });
    const userId = verifyRes.data.user.userId;

    // Check SALES access to get mongoPlanId
    const accessRes = await axios.post(`${process.env.AUTH_SERVER_URL}/get-user-sales-access`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const hasAccess = !!accessRes.data?.hasAccess;
    if (!hasAccess) {
      return res.status(403).json({ message: 'No active SALES subscription for this user' });
    }
    const mongoPlanId = accessRes.data?.mongoPlanId || null;

    // Find or create a Shop by mysql_user_id
    let shop = await Shop.findOne({ mysql_user_id: userId });
    if (!shop) {
      shop = await Shop.create({ mysql_user_id: userId });
    }

    const payload = {
      userId,               // MySQL user ID
      mongoPlanId,          // e.g., 'sales-premium'
      shop_id: String(shop._id)
    };

    const signed = jwt.sign(payload, process.env.JWT_SECRET || 'dev-sales-secret', {
      expiresIn: '7d',
      issuer: process.env.JWT_ISSUER || 'sales.local'
    });

    res.json({ message: 'Login successful', token: signed, payload });
  } catch (err) {
    console.error('Sales /auth/login error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Login failed', error: err.response?.data || err.message });
  }
});

// Verify the Sales JWT
app.get('/auth/verify', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const raw = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!raw) return res.status(400).json({ valid: false, message: 'Token missing' });

    // Try to verify as a Sales token first
    try {
      const decoded = jwt.verify(raw, process.env.JWT_SECRET || 'dev-sales-secret');
      return res.json({ valid: true, decoded });
    } catch (_) {
      // Fall through to CommonDB verification
    }

    // Validate token with CommonDB
    const verifyRes = await axios.post(`${process.env.AUTH_SERVER_URL}/internal-verify-token`, {}, {
      headers: { Authorization: `Bearer ${raw}`, 'x-internal-key': process.env.INTERNAL_API_KEY }
    });
    if (!verifyRes.data?.valid) return res.status(401).json({ valid: false, message: 'Invalid token' });
    const userId = verifyRes.data.user.userId;

    // Ensure SALES access
    const accessRes = await axios.post(`${process.env.AUTH_SERVER_URL}/get-user-sales-access`, {}, {
      headers: { Authorization: `Bearer ${raw}` }
    });
    if (!accessRes.data?.hasAccess) {
      return res.status(403).json({ valid: false, message: 'No active SALES subscription' });
    }

    // Resolve or create shop
    let shop = await Shop.findOne({ mysql_user_id: userId });
    if (!shop) shop = await Shop.create({ mysql_user_id: userId });

    // Reissue a proper Sales token
    const payload = {
      userId,
      mongoPlanId: accessRes.data.mongoPlanId || null,
      shop_id: String(shop._id)
    };
    const signed = jwt.sign(payload, process.env.JWT_SECRET || 'dev-sales-secret', {
      expiresIn: '7d',
      issuer: process.env.JWT_ISSUER || 'sales.local'
    });
    return res.json({ valid: true, token: signed, payload });
  } catch (err) {
    console.error('Sales /auth/verify error:', err.response?.data || err.message);
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// Subscribe endpoint: records MySQL subscription via CommonDB and mirrors to Mongo
app.post('/api/subscribe', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const { mongoPlanId, mongoCategoryId, amount = 0 } = req.body;
    if (!mongoPlanId || !mongoCategoryId) {
      return res.status(400).json({ message: 'mongoPlanId and mongoCategoryId are required' });
    }

    // Verify token and get user via CommonDB
    const verify = await axios.post(`${process.env.AUTH_SERVER_URL}/internal-verify-token`, {}, {
      headers: { Authorization: `Bearer ${token}`, 'x-internal-key': process.env.INTERNAL_API_KEY }
    });
    if (!verify.data?.valid) return res.status(403).json({ message: 'Invalid token' });
    const userId = verify.data.user.userId;

    // Create subscription in MySQL as SALES product
    const subUrl = amount === 0 ? '/mysql-subscribe-free' : '/mysql-subscribe';
    const payload = amount === 0
      ? { mongoPlanId, mongoCategoryId, amount: 0, product: 'SALES' }
      : { mongoPlanId, mongoCategoryId, amount, product: 'SALES' };

  const mysqlRes = await axios.post(`${process.env.AUTH_SERVER_URL}${subUrl}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

  // Mirror to Mongo for SALES namespace using controller
  await syncSalesUser(userId, `Bearer ${token}`);

    return res.json({ success: true, mysql: mysqlRes.data });
  } catch (err) {
    console.error('❌ Sales subscribe error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
});

const PORT = process.env.SALES_PORT || 9000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Sales Server on ${PORT}`));
