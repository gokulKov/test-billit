const { Shop, Feature } = require("../../models/mongoModels");


const updateShopPlanLimitController = async (req, res) => {
    try {
        // ✅ userId from verified JWT via authMySQLToken middleware
        const userId = req.user.userId;


        if (!userId) {
            return res.status(400).json({ error: "User ID missing in token." });
        }


        // 1️⃣ Fetch Shop using mysql_user_id
        const shop = await Shop.findOne({ mysql_user_id: userId }).populate("role_id");
        if (!shop) {
            return res.status(404).json({ error: "Shop not found for this user." });
        }


        const mongoPlanId = shop.role_id?.mongoPlanId;
        if (!mongoPlanId) {
            return res.status(400).json({ error: "No mongoPlanId associated with this shop's role." });
        }


        // 2️⃣ Fetch entry limit feature for the plan
        const feature = await Feature.findOne({
            plan_id: mongoPlanId,
            feature_key: "entry_limit",
            type: "limit"
        });


        if (!feature || !feature.config) {
            return res.status(400).json({ error: "No entry_limit feature found for this plan." });
        }


        const { totalPages = 30, entriesPerPage = 15 } = feature.config;
        const record_limit = totalPages * entriesPerPage;


        // 3️⃣ Update shop limits
        shop.record_limit = record_limit;
        shop.record_count = 0; // Reset count on subscription upgrade
        await shop.save();


        return res.status(200).json({
            message: "✅ Shop plan record limit updated successfully.",
            shop_id: shop._id,
            record_limit: shop.record_limit,
            record_count: shop.record_count
        });
    } catch (error) {
        console.error("❌ updateShopPlanLimitController error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};


module.exports = { updateShopPlanLimitController };



