const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('../utils/axiosConfig'); // Use IPv4-specific axios
const passport = require('passport');
const { User, Role, Shop } = require('../models/mongoModels');
const router = express.Router();

require('dotenv').config(); // ✅ Load environment variables

// Start Google login
router.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

// Google callback
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    const token = jwt.sign({
      userId: req.user._id,
      mongoPlanId: req.user.mongoPlanId
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.redirect(`${process.env.FRONTEND_URL}/callback?token=${token}`);
  }
);

router.post('/billit-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // 1️⃣ Verify MySQL credentials
    const { data: authData } = await axios.post(`${process.env.AUTH_SERVER_URL}/verify-user-login`, {
      email,
      password
    });

    if (!authData.success) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const mysqlUserId = authData.userId;

    // 2️⃣ Sync user to Mongo directly (no HTTP call needed)
    const { syncUserToBillit } = require('../controllers/userSyncController');
    const jwtToken = jwt.sign(
      { userId: mysqlUserId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await syncUserToBillit(mysqlUserId, `Bearer ${jwtToken}`);

    // 3️⃣ Find MongoDB User
    const user = await User.findOne({ mysql_user_id: mysqlUserId }).populate('role_id');

    if (!user) {
      return res.status(404).json({ message: "User not found in Billit database." });
    }

    if (!user.isSubscriptionActive) {
      return res.status(403).json({ message: "Subscription expired." });
    }

    // 4️⃣ Find Shop for user
    const shop = await Shop.findOne({ mysql_user_id: mysqlUserId });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found for this user." });
    }

    // 5️⃣ Create JWT
    const mongoPlanId = user.role_id.mongoPlanId;
    // Enforce: sales plan users are NOT allowed in Billit, but service and other plans are allowed
    if (mongoPlanId && mongoPlanId.startsWith('sales-')) {
      return res.status(403).json({ message: `You only have access to Sales product. Please login to the Sales portal.` });
    }

    const payload = {
      userId: mysqlUserId, // ✅ store MySQL UUID instead of MongoDB _id
      mongoPlanId,
      shop_id: shop._id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      message: "Login successful!"
    });

  } catch (err) {
    console.error('Billit Login Error:', err?.response?.data || err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
