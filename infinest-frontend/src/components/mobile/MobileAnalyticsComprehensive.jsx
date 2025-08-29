"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Package, 
  Smartphone, 
  Eye, 
  Filter,
  RefreshCw,
  PieChart,
  BarChart3,
  Target,
  Percent,
  Minus,
  X,
  Wallet
} from "lucide-react"
import { usePlanFeatures } from "@/context/PlanFeatureContext"
import { logAndNotify, logError, logSuccess } from "@/utils/logger"
import api from "../api"

export default function MobileAnalytics({ shopId }) {
  const { features, loading } = usePlanFeatures()
  const [activeTab, setActiveTab] = useState("overview") // overview, records, stock
  const [dateFilters, setDateFilters] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    specificDate: new Date().toISOString().split("T")[0]
  })
  const [filterType, setFilterType] = useState("today") // today, range, specific
  const [isLoading, setIsLoading] = useState(false)
  
  // Analytics Data
  const [overviewData, setOverviewData] = useState({
    totalRevenue: 0,
    serviceRevenue: 0,
    stockRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    netProfitPercentage: 0,
    outstandingBalance: 0,
    balanceRecords: 0
  })
  
  const [recordsAnalytics, setRecordsAnalytics] = useState({
    totalRecords: 0,
    completedRecords: 0,
    pendingRecords: 0,
    totalRevenue: 0,
    avgRevenuePerRecord: 0,
    topCustomers: []
  })
  
  const [stockAnalytics, setStockAnalytics] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    recentSales: 0,
    topSellingProducts: []
  })

  useEffect(() => {
    if (shopId) {
      fetchAnalyticsData()
    }
  }, [shopId, dateFilters, filterType])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      // Get dashboard summary data
      const overviewRes = await api.post("/api/dashboard/summary", 
        { shop_id: shopId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Get daily summary for revenue breakdown
      const dateParam = filterType === "today" ? new Date().toISOString().split('T')[0] : dateFilters.specificDate
      const dailySummaryRes = await api.post("/api/daily-summary", 
        { shop_id: shopId, date: dateParam }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Get expense data
      const expensesRes = await api.post("/api/expenses/today", 
        { shop_id: shopId, date: dateParam }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const dailyData = dailySummaryRes.data
      const expenseData = expensesRes.data
      
      // Calculate net profit
      const totalRevenue = dailyData.totalRevenue || 0
      const totalExpenses = expenseData.totalAmount || 0
      const netProfit = totalRevenue - totalExpenses
      const netProfitPercentage = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0
      
      setOverviewData({
        totalRevenue,
        serviceRevenue: dailyData.serviceRevenue || 0,
        stockRevenue: dailyData.stockRevenue || 0,
        totalExpenses,
        netProfit,
        netProfitPercentage,
        outstandingBalance: 0, // Will be updated by balance fetch
        balanceRecords: 0 // Will be updated by balance fetch
      })
      
      // Set records analytics
      setRecordsAnalytics({
        totalRecords: overviewRes.data.mobiles ? overviewRes.data.mobiles.length : 0,
        revenue: dailyData.serviceRevenue || 0,
        recentTransactions: [] // You can fetch specific records if needed
      })
      
      // Fetch stock analytics
      const stockRes = await api.post("/api/products/list", 
        { shop_id: shopId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const products = stockRes.data.products || []
      setStockAnalytics({
        totalProducts: products.length,
        totalInventoryValue: products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
        revenue: dailyData.stockRevenue || 0,
        lowStockProducts: products.filter(p => p.quantity <= 10),
        topSellingProducts: products.slice(0, 5) // You can implement proper sorting based on sales
      })
      
      // Fetch balance analytics
      try {
        const customerBalanceRes = await api.post("/api/customers/balance", 
          { shop_id: shopId }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        const dealerBalanceRes = await api.post("/api/dealers/balance", 
          { shop_id: shopId }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        const allBalanceData = [...customerBalanceRes.data, ...dealerBalanceRes.data]
        const totalBalance = allBalanceData.reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0)
        
        // Update overview data with balance information
        setOverviewData(prev => ({
          ...prev,
          outstandingBalance: totalBalance,
          balanceRecords: allBalanceData.length
        }))
      } catch (balanceError) {
        logError("Failed to fetch balance data", balanceError)
      }
      
    } catch (error) {
      logError("Failed to fetch analytics data", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateParams = () => {
    switch (filterType) {
      case "today":
        return { date: new Date().toISOString().split("T")[0] }
      case "range":
        return { 
          fromDate: dateFilters.fromDate, 
          toDate: dateFilters.toDate 
        }
      case "specific":
        return { date: dateFilters.specificDate }
      default:
        return { date: new Date().toISOString().split("T")[0] }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
          
          {/* Date Filter Controls */}
          <div className="space-y-3">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {[
                { value: "today", label: "Today" },
                { value: "range", label: "Date Range" },
                { value: "specific", label: "Specific Date" }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    filterType === filter.value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            {filterType === "range" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFilters.fromDate}
                  onChange={(e) => setDateFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateFilters.toDate}
                  onChange={(e) => setDateFilters(prev => ({ ...prev, toDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {filterType === "specific" && (
              <input
                type="date"
                value={dateFilters.specificDate}
                onChange={(e) => setDateFilters(prev => ({ ...prev, specificDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "records", label: "Records", icon: Smartphone },
            { id: "stock", label: "Stock", icon: Package }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 text-center font-medium transition-colors whitespace-nowrap min-w-0 ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(overviewData.totalRevenue)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Expenses</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(overviewData.totalExpenses)}
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Net Profit */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Net Profit</h3>
                      <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount:</span>
                        <span className={`font-bold text-lg ${
                          overviewData.netProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatCurrency(overviewData.netProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Margin:</span>
                        <span className={`font-bold ${
                          overviewData.netProfitPercentage >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatPercentage(overviewData.netProfitPercentage)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">Service Revenue</span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(overviewData.serviceRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <span className="text-gray-700">Stock Revenue</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(overviewData.stockRevenue)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Outstanding Balance */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Outstanding Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-red-600" />
                        <span className="text-gray-700">Total Outstanding</span>
                      </div>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(overviewData.outstandingBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">Balance Records</span>
                      </div>
                      <span className="font-semibold text-gray-600">
                        {overviewData.balanceRecords}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Records Tab */}
            {activeTab === "records" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Records</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {recordsAnalytics.totalRecords}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(recordsAnalytics.totalRevenue)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed Records:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {recordsAnalytics.completedRecords}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Records:</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {recordsAnalytics.pendingRecords}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Revenue/Record:</span>
                        <span className="font-semibold">
                          {formatCurrency(recordsAnalytics.avgRevenuePerRecord)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stock Tab */}
            {activeTab === "stock" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stockAnalytics.totalProducts}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Stock Value</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(stockAnalytics.totalValue)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Low Stock Items:</span>
                        <Badge className="bg-red-100 text-red-800">
                          {stockAnalytics.lowStockItems}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recent Sales:</span>
                        <span className="font-semibold">
                          {formatCurrency(stockAnalytics.recentSales)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
