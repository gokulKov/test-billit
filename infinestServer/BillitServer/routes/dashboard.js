const express = require("express")
const router = express.Router()
const authenticateToken = require("../utils/authMiddleware")
const axios = require("../utils/axiosConfig")
const {
  Shop,
  Customer,
  Dealer,
  Mobile,
  Technician,
  Product,
  ProductHistory,
  Expense,
  DailySummary,
} = require("../models/mongoModels")

router.get("/mobile-summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const shopId = req.user.shop_id

    if (!userId || !shopId) {
      return res.status(400).json({ error: "User ID and Shop ID are required" })
    }

    // Convert shopId to ObjectId if it's a string
    const mongoose = require('mongoose')
    const shopObjectId = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    try {
      // Fetch MySQL user data via auth server
      let userDashboardData = null
      try {
        const authResponse = await axios.post(
          `${process.env.AUTH_SERVER_URL}/get-user-dashboard-data`,
          {},
          {
            headers: {
              Authorization: req.headers.authorization,
            },
          },
        )
        userDashboardData = authResponse.data
      } catch (authError) {
        console.error("Auth server error:", authError.response?.data || authError.message)
      }

      // Get today's expenses
      const todayExpenses = await Expense.aggregate([
        {
          $match: {
            userId: shopObjectId,
            createdAt: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ])

      // Get today's mobile revenue
      const todayMobileRevenue = await Mobile.aggregate([
        {
          $match: {
            shop_id: shopObjectId,
            $or: [
              {
                delivered: true,
                delivery_date: { $gte: startOfDay, $lt: endOfDay },
              },
              {
                paid_amount: { $gt: 0 },
                update_date: { $gte: startOfDay, $lt: endOfDay },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$paid_amount" },
            count: { $sum: 1 },
          },
        },
      ])

      // Get today's product sales revenue from ProductHistory
      const todayProductSales = await ProductHistory.aggregate([
        {
          $match: {
            changeType: "SELL",
            changeDate: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$paidAmount" },
            totalQuantity: { $sum: "$quantity" },
            count: { $sum: 1 },
          },
        },
      ])

      // Calculate totals
      const mobileRevenue = todayMobileRevenue[0]?.totalRevenue || 0
      const productRevenue = todayProductSales[0]?.totalRevenue || 0
      const totalRevenue = mobileRevenue + productRevenue
      const totalExpenses = todayExpenses[0]?.totalExpenses || 0
      const netProfit = totalRevenue - totalExpenses

      // Calculate transaction count
      const mobileTransactions = todayMobileRevenue[0]?.count || 0
      const productTransactions = todayProductSales[0]?.count || 0
      const totalTransactions = mobileTransactions + productTransactions

      // Fetch DailySummary
      const todaySummary = await DailySummary.findOne({
        userId: shopObjectId,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      })

      // Fetch mobile repairs data
      const totalMobiles = await Mobile.countDocuments({ shop_id: shopObjectId })
      const pendingRepairs = await Mobile.countDocuments({
        shop_id: shopObjectId,
        ready: false,
        delivered: false,
      })
      const readyForDelivery = await Mobile.countDocuments({
        shop_id: shopObjectId,
        ready: true,
        delivered: false,
      })
      const deliveredToday = await Mobile.countDocuments({
        shop_id: shopObjectId,
        delivered: true,
        delivery_date: { $gte: startOfDay, $lt: endOfDay },
      })

      // Fetch customer data
      const totalCustomers = await Customer.countDocuments({ shop_id: shopObjectId })
      const totalDealers = await Dealer.countDocuments({ shop_id: shopObjectId })
      const newCustomersToday = await Customer.countDocuments({
        shop_id: shopObjectId,
        created_at: { $gte: startOfDay, $lt: endOfDay },
      })
      const newDealersToday = await Dealer.countDocuments({
        shop_id: shopObjectId,
        created_at: { $gte: startOfDay, $lt: endOfDay },
      })

      // Fetch inventory data
      const products = await Product.find({ userId: shopObjectId })
      const totalProducts = products.length
      const lowStockItems = products.filter((product) => product.quantity < 10).length
      const totalInventoryValue = products.reduce((sum, product) => sum + (product.totalCost || 0), 0)

      const lowStockProducts = products
        .filter((product) => product.quantity < 10)
        .map((product) => ({
          name: product.name,
          category: product.category || "General",
          quantity: product.quantity,
          minStock: 10,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
        }))
        .sort((a, b) => a.quantity - b.quantity)

      const activeTechnicians = await Technician.countDocuments({ shop_id: shopObjectId })
      const avgMobilesPerTechnician = activeTechnicians > 0 ? Math.round(totalMobiles / activeTechnicians) : 0

      // Get recent expenses (last 7 days)
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const recentExpenses = await Expense.find({
        userId: shopObjectId,
        createdAt: { $gte: sevenDaysAgo },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title amount createdAt")

      const formattedRecentExpenses = recentExpenses.map((expense) => ({
        title: expense.title,
        amount: expense.amount,
        createdAt: expense.createdAt.toISOString(),
      }))

      // Final sales data
      const finalSalesData = {
        totalRevenue: todaySummary?.totalRevenue || totalRevenue,
        totalExpenses: todaySummary?.totalExpense || totalExpenses,
        netProfit: todaySummary?.netRevenue || netProfit,
        transactionCount: totalTransactions,
        mobileRevenue,
        productRevenue,
      }

      const dashboardData = {
        todaySales: finalSalesData,
        mobileRepairs: {
          totalMobiles,
          pendingRepairs,
          readyForDelivery,
          deliveredToday,
        },
        customers: {
          newCustomersToday,
          totalCustomers,
          newDealersToday,
          totalDealers,
        },
        inventory: {
          totalProducts,
          lowStockItems,
          totalInventoryValue,
        },
        technicians: {
          activeTechnicians,
          avgMobilesPerTechnician,
        },
        recentExpenses: formattedRecentExpenses,
        lowStockProducts: lowStockProducts,
        userInfo: userDashboardData?.success ? userDashboardData.user : null,
        subscription: userDashboardData?.success ? userDashboardData.subscription : null,
      }

      return res.json(dashboardData)
    } catch (dbError) {
      console.error("Database query error:", dbError)
      return res.status(500).json({ error: "Database query failed", details: dbError.message })
    }
  } catch (error) {
    console.error("Dashboard API error:", error)
    return res.status(500).json({ error: "Failed to fetch dashboard data", details: error.message })
  }
})

module.exports = router