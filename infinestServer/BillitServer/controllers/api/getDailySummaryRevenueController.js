const { Customer, Dealer, Mobile, ProductHistory, Product } = require("../../models/mongoModels");

const getDailySummaryRevenue = async (req, res) => {
  try {
    const { shop_id, date } = req.body;

    if (!shop_id || !date) {
      return res.status(400).json({ error: "shop_id and date are required" });
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    // 1️⃣ Fetch customers & dealers (in case needed for advanced analytics later)
    const customers = await Customer.find({ shop_id }).lean();
    const dealers = await Dealer.find({ shop_id }).lean();

    // 2️⃣ Get mobile records created today
    const mobilesCreatedToday = await Mobile.find({
      shop_id,
      added_date: { $gte: start, $lte: end },
    }).lean();

    // Calculate mobile revenue for mobiles created today
    const mobileRevenueCreatedToday = mobilesCreatedToday.reduce((total, mobile) => {
      return total + (mobile.paid_amount || 0);
    }, 0);

    // 3️⃣ Get mobile records updated today
    const mobilesUpdatedToday = await Mobile.find({
      shop_id,
      update_date: { $gte: start, $lte: end },
    }).lean();

    // Exclude mobiles already created today to prevent double-counting
    const mobilesUpdatedTodayFiltered = mobilesUpdatedToday.filter(m => {
      return !(m.added_date >= start && m.added_date <= end);
    });

    const mobileRevenueUpdatedToday = mobilesUpdatedTodayFiltered.reduce((total, mobile) => {
      return total + (mobile.paid_amount || 0);
    }, 0);

    // 4️⃣ Calculate SERVICE REVENUE (mobile/service payments)
    const serviceRevenue = mobileRevenueCreatedToday + mobileRevenueUpdatedToday;

    // 5️⃣ Get STOCK REVENUE (product sales)
    const products = await Product.find({ userId: shop_id }).select("_id").lean();
    const productIds = products.map(p => p._id);

    const productHistory = await ProductHistory.find({
      productId: { $in: productIds },
      changeType: "SELL",
      changeDate: { $gte: start, $lte: end },
    }).lean();

    const stockRevenue = productHistory.reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);

    // 6️⃣ Calculate total revenue
    const totalRevenue = serviceRevenue + stockRevenue;

    // 7️⃣ Return all three revenue values
    return res.status(200).json({ 
      totalRevenue,
      serviceRevenue,
      stockRevenue
    });
  } catch (error) {
    console.error("❌ Error fetching daily summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getDailySummaryRevenue };