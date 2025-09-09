const { Mobile, Expense, Shop, Customer, Dealer, Product, Technician, MobileBrand, MobileIssue } = require("../../models/mongoModels");

exports.getAnalyticsData = async (req, res) => {
  try {
    // Handle both GET and POST requests
    let shop_id, time_range;
    
    if (req.method === 'GET') {
      // GET request - get shop_id from JWT token and timeFrame from query
      shop_id = req.user.shop_id || req.user.id;
      const timeFrame = req.query.timeFrame || '30d';
      time_range = timeFrame.replace('d', ''); // Remove 'd' suffix
    } else {
      // POST request - get from body
      ({ shop_id, time_range = '30' } = req.body);
    }
    
    console.log('Analytics request:', { shop_id, time_range, method: req.method });
    
    // Calculate date range
    const now = new Date();
    const daysAgo = parseInt(time_range);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Fetch all relevant data in parallel
    const [mobiles, expenses, products, customers, dealers, technicians] = await Promise.all([
      Mobile.find({ shop_id }).lean(),
      Expense.find({ userId: shop_id }).lean(),
      Product.find({ userId: shop_id }).lean(),
      Customer.find({ shop_id }).lean(),
      Dealer.find({ shop_id }).lean(),
      Technician.find({ shop_id }).lean(),
    ]);

    // Filter data for the time range
    const mobilesInRange = mobiles.filter(mobile => 
      new Date(mobile.added_date) >= startDate
    );

    const expensesInRange = expenses.filter(expense => 
      new Date(expense.createdAt) >= startDate
    );

    const customersInRange = customers.filter(customer => 
      new Date(customer.created_at) >= startDate
    );

    // 1. Revenue Analysis - Group by date
    const revenueByDate = {};
    const mobilesByDate = {};
    const expensesByDate = {};
    
    // Create date array for consistent data
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      revenueByDate[dateKey] = { date: dateKey, revenue: 0, count: 0, expenses: 0, profit: 0, avgValue: 0 };
      mobilesByDate[dateKey] = { date: dateKey, count: 0 };
      expensesByDate[dateKey] = { date: dateKey, expenses: 0 };
    }

    // Process mobile repairs
    mobilesInRange.forEach(mobile => {
      const dateKey = new Date(mobile.added_date).toISOString().split('T')[0];
      if (revenueByDate[dateKey]) {
        revenueByDate[dateKey].revenue += mobile.paid_amount || 0;
        revenueByDate[dateKey].count += 1;
      }
    });

    // Process expenses
    expensesInRange.forEach(expense => {
      const dateKey = new Date(expense.createdAt).toISOString().split('T')[0];
      if (expensesByDate[dateKey]) {
        expensesByDate[dateKey].expenses += expense.amount || 0;
      }
      if (revenueByDate[dateKey]) {
        revenueByDate[dateKey].expenses += expense.amount || 0;
      }
    });

    // Calculate profit and average values
    Object.keys(revenueByDate).forEach(dateKey => {
      const data = revenueByDate[dateKey];
      data.profit = data.revenue - data.expenses;
      data.avgValue = data.count > 0 ? data.revenue / data.count : 0;
    });

    // Update mobile count data
    mobilesInRange.forEach(mobile => {
      const dateKey = new Date(mobile.added_date).toISOString().split('T')[0];
      if (mobilesByDate[dateKey]) {
        mobilesByDate[dateKey].count += 1;
      }
    });

    // 2. Repair Status Distribution
    const statusDistribution = {
      pending: mobilesInRange.filter(m => !m.ready && !m.delivered && !m.returned).length,
      ready: mobilesInRange.filter(m => m.ready && !m.delivered).length,
      delivered: mobilesInRange.filter(m => m.delivered).length,
      returned: mobilesInRange.filter(m => m.returned).length,
    };

    // 3. Technician Performance - REMOVED per user request

    // 4. Customer Growth
    const customerGrowthByDate = {};
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      customerGrowthByDate[dateKey] = { date: dateKey, newCustomers: 0, totalCustomers: 0 };
    }

    customersInRange.forEach(customer => {
      const dateKey = new Date(customer.created_at).toISOString().split('T')[0];
      if (customerGrowthByDate[dateKey]) {
        customerGrowthByDate[dateKey].newCustomers += 1;
      }
    });

    // Calculate cumulative totals
    let cumulativeTotal = customers.filter(c => new Date(c.created_at) < startDate).length;
    Object.keys(customerGrowthByDate).sort().forEach(dateKey => {
      cumulativeTotal += customerGrowthByDate[dateKey].newCustomers;
      customerGrowthByDate[dateKey].totalCustomers = cumulativeTotal;
    });

    // 5. Expense Analysis
    const expensesByCategory = {};

    expensesInRange.forEach(expense => {
      const dateKey = new Date(expense.createdAt).toISOString().split('T')[0];
      // Date-based expenses are already handled in revenue analysis above

      // Group by category/title
      const category = expense.title || 'Other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
    });

    // 6. Device Brand Analysis and Common Issues - REMOVED per user request
    // Keeping minimal empty objects for backward compatibility
    const deviceBrandAnalysis = {};
    const commonIssuesAnalysis = {};

    // 8. Product/Inventory Analytics
    const productAnalytics = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.totalCost || 0), 0),
      lowStock: products.filter(p => p.quantity < 5).length,
      outOfStock: products.filter(p => p.quantity === 0).length,
      topProducts: products
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          quantity: p.quantity,
          value: p.totalCost,
        })),
    };

    // 9. Financial Summary
    const totalRevenue = mobilesInRange.reduce((sum, m) => sum + (m.paid_amount || 0), 0);
    const totalExpenses = expensesInRange.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const avgJobValue = mobilesInRange.length > 0 ? totalRevenue / mobilesInRange.length : 0;

    // 10. Repair Time Analysis
    const repairTimeDistribution = {
      sameDay: mobilesInRange.filter(m => getRepairDays(m) === 0).length,
      oneToThree: mobilesInRange.filter(m => {
        const days = getRepairDays(m);
        return days >= 1 && days <= 3;
      }).length,
      fourToSeven: mobilesInRange.filter(m => {
        const days = getRepairDays(m);
        return days >= 4 && days <= 7;
      }).length,
      moreThanWeek: mobilesInRange.filter(m => getRepairDays(m) > 7).length,
    };

    // Prepare response data
    const analyticsData = {
      // Time series data
      revenueData: Object.values(revenueByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      mobileCountData: Object.values(mobilesByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      customerGrowthData: Object.values(customerGrowthByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      expenseData: Object.values(expensesByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      
      // Distribution data
      statusDistribution,
      repairTimeDistribution,
      expensesByCategory: Object.entries(expensesByCategory).map(([name, amount]) => ({ name, amount })),
      
      // Inventory data
      productAnalytics,
      
      // Summary metrics
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
        totalMobiles: mobilesInRange.length,
        totalCustomers: customers.length,
        newCustomers: customersInRange.length,
        totalDealers: dealers.length,
        avgJobValue: avgJobValue.toFixed(2),
        avgRepairTime: calculateAvgCompletionTime(mobilesInRange),
        completionRate: mobilesInRange.length > 0 ? ((mobilesInRange.filter(m => m.delivered).length / mobilesInRange.length) * 100).toFixed(2) : 0,
      },
      
      // Comparison with previous period
      previousPeriod: await getPreviousPeriodComparison(shop_id, startDate, daysAgo),
    };

    res.json(analyticsData);
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    res.status(500).json({ message: "Error fetching analytics data" });
  }
};

// Helper functions
function calculateAvgCompletionTime(mobiles) {
  const completedMobiles = mobiles.filter(m => m.delivered && m.delivery_date);
  if (completedMobiles.length === 0) return 0;
  
  const totalDays = completedMobiles.reduce((sum, mobile) => {
    const start = new Date(mobile.added_date);
    const end = new Date(mobile.delivery_date);
    return sum + ((end - start) / (1000 * 60 * 60 * 24));
  }, 0);
  
  return Math.round(totalDays / completedMobiles.length);
}

function getRepairDays(mobile) {
  if (!mobile.delivery_date) return null;
  const start = new Date(mobile.added_date);
  const end = new Date(mobile.delivery_date);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

async function getPreviousPeriodComparison(shop_id, currentStartDate, daysAgo) {
  try {
    const previousStartDate = new Date(currentStartDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const previousEndDate = currentStartDate;

    const [previousMobiles, previousExpenses] = await Promise.all([
      Mobile.find({ 
        shop_id,
        added_date: { $gte: previousStartDate, $lt: previousEndDate }
      }).lean(),
      Expense.find({ 
        userId: shop_id,
        createdAt: { $gte: previousStartDate, $lt: previousEndDate }
      }).lean(),
    ]);

    const previousRevenue = previousMobiles.reduce((sum, m) => sum + (m.paid_amount || 0), 0);
    const previousExpensesTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      revenue: previousRevenue,
      expenses: previousExpensesTotal,
      mobileCount: previousMobiles.length,
    };
  } catch (error) {
    console.error("Previous period comparison error:", error);
    return { revenue: 0, expenses: 0, mobileCount: 0 };
  }
}
