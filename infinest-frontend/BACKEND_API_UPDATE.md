# Backend API Update for Separate Revenue Types

## Updated API Response Structure

Your `getDailySummaryRevenue` function should be updated to return separate service and stock revenues. Here's the updated code:

```javascript
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

    // 4️⃣ Calculate total SERVICE REVENUE (mobile payments)
    const serviceRevenue = mobileRevenueCreatedToday + mobileRevenueUpdatedToday;

    // 5️⃣ Get product revenue (STOCK REVENUE)
    const products = await Product.find({ userId: shop_id }).select("_id").lean();
    const productIds = products.map(p => p._id);

    const productHistory = await ProductHistory.find({
      productId: { $in: productIds },
      changeType: "SELL",
      changeDate: { $gte: start, $lte: end },
    }).lean();

    const stockRevenue = productHistory.reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);

    // 6️⃣ Final revenue calculation
    const totalRevenue = serviceRevenue + stockRevenue;

    // 7️⃣ Return separate revenue types
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
```

## Key Changes Made:

1. **Service Revenue**: Combined mobile revenue from both created and updated mobiles
2. **Stock Revenue**: Revenue from product sales (ProductHistory with changeType: "SELL")
3. **Response Structure**: Returns all three values:
   - `totalRevenue`: Sum of service + stock revenue
   - `serviceRevenue`: Revenue from mobile/service payments
   - `stockRevenue`: Revenue from product sales

## Frontend Changes Made:

1. Added new state variables for `serviceRevenue` and `stockRevenue`
2. Updated the API response handling to extract separate revenue types
3. Created 5 summary cards instead of 3:
   - Service Revenue (with Smartphone icon)
   - Stock Revenue (with Package icon)
   - Total Revenue (with TrendingUp icon)
   - Total Expense (with TrendingDown icon)
   - Net Revenue (with DollarSign icon)

## Benefits:

- **Clear Visibility**: Users can now see exactly how much revenue comes from services vs stock
- **Better Analytics**: Separate tracking helps in business decision making
- **Improved UI**: Visual distinction with different colors and icons for each revenue type
