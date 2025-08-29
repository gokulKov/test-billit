"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Wallet,
  Search,
  Users,
  Phone,
  FileText,
  Smartphone,
  DollarSign,
  Edit3,
  Trash2,
  Save,
  X,
  Hash,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react"
import { usePlanFeatures } from "@/context/PlanFeatureContext"
import { logAndNotify, logError, logSuccess } from "@/utils/logger"
import api from "../api"

export default function MobileBalanceAmount({ shopId }) {
  const { features, loading } = usePlanFeatures()
  const [balanceData, setBalanceData] = useState([])
  const [originalData, setOriginalData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [editingBalance, setEditingBalance] = useState(null)
  const [editAmount, setEditAmount] = useState("")
  const [totalBalance, setTotalBalance] = useState(0)

  useEffect(() => {
    if (shopId) fetchBalanceData()
  }, [shopId])

  const fetchBalanceData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      // Fetch customer balance data
      const customerResponse = await api.post(
        "/api/customers/balance",
        { shop_id: shopId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const customers = customerResponse.data.map((customer) => ({
        ...customer,
        type: "Customer",
        mobiles: customer.mobiles.map((mobile) => ({
          mobileName: mobile.mobileName,
          addedDate: mobile.addedDate,
          issue: mobile.issue || "No issue",
        })),
      }))

      // Fetch dealer balance data
      const dealerResponse = await api.post(
        "/api/dealers/balance",
        { shop_id: shopId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const dealers = dealerResponse.data.map((dealer) => ({
        ...dealer,
        type: "Dealer",
        mobiles: dealer.mobiles.map((mobile) => ({
          mobileName: mobile.mobileName,
          addedDate: mobile.addedDate,
          issue: mobile.issue || "No issue",
        })),
      }))

      const consolidatedData = [...customers, ...dealers]
      const sortedData = consolidatedData.sort((a, b) => {
        const dateA = new Date(a.mobiles[0]?.addedDate || 0)
        const dateB = new Date(b.mobiles[0]?.addedDate || 0)
        return dateB - dateA
      })

      setOriginalData(sortedData)
      setBalanceData(sortedData)
      
      // Calculate total balance
      const total = sortedData.reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0)
      setTotalBalance(total)
      
    } catch (error) {
      logError("Failed to fetch balance data", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setBalanceData(originalData)
      return
    }

    const filtered = originalData.filter(item => 
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    setBalanceData(filtered)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setBalanceData(originalData)
  }

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const startEditing = (id, currentAmount) => {
    setEditingBalance(id)
    setEditAmount(currentAmount || "0")
  }

  const saveBalance = async (id, type) => {
    try {
      if (!editAmount.trim()) {
        logError("Balance amount cannot be empty")
        return
      }

      const token = localStorage.getItem("token")
      const response = await api.put(
        "/api/invoices/updateBalance",
        {
          id,
          balanceAmount: parseFloat(editAmount),
          type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        logSuccess("Balance amount updated successfully")
        setEditingBalance(null)
        setEditAmount("")
        await fetchBalanceData()
      } else {
        logError("Failed to update balance amount")
      }
    } catch (error) {
      logError("Error saving balance amount", error)
    }
  }

  const clearBalance = async (id, type) => {
    try {
      const token = localStorage.getItem("token")
      const response = await api.put(
        "/api/invoices/clearBalance",
        { id, type },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        logSuccess("Balance cleared successfully")
        await fetchBalanceData()
      } else {
        logError("Failed to clear balance")
      }
    } catch (error) {
      logError("Error clearing balance", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Balance Summary</h1>
            <p className="text-blue-100 text-sm">Manage outstanding balances</p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Outstanding Balance</h3>
              <p className="text-3xl font-bold text-red-600">₹{totalBalance.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">{balanceData.length} records</p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Search by Name or Phone
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter client name or phone"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {searchQuery && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <Button
          onClick={fetchBalanceData}
          disabled={isLoading}
          className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>

        {/* Balance List */}
        <div className="space-y-3">
          {balanceData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Balance Records</h3>
                <p className="text-gray-600">No outstanding balance amounts found.</p>
              </CardContent>
            </Card>
          ) : (
            balanceData.map((item, index) => (
              <Card key={item.id || index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <h3 className="font-semibold text-gray-800">{item.clientName}</h3>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{item.mobileNumber}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>Bill: {item.billNo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Smartphone className="w-3 h-3" />
                            <span>{item.noOfMobile} mobile(s)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {editingBalance === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  saveBalance(item.id, item.type)
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingBalance(null)
                                }}
                                className="px-2 py-1 text-xs"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600">
                                ₹{(item.balanceAmount || 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditing(item.id, item.balanceAmount)
                                }}
                                className="text-xs px-2 py-1"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearBalance(item.id, item.type)
                                }}
                                className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="mt-2">
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Mobile Details */}
                  {expandedItems.has(item.id) && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h4 className="font-medium text-gray-800 mb-3">Mobile Devices</h4>
                      <div className="space-y-2">
                        {item.mobiles?.map((mobile, mIndex) => (
                          <div key={mIndex} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Device:</span>
                                <p className="text-gray-600">{mobile.mobileName}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Issue:</span>
                                <p className="text-gray-600">{mobile.issue}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
