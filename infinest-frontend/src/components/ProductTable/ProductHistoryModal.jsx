"use client"

import { useEffect, useState } from "react"
import api from "../../components/api"
import { X, History, Filter, Calendar, Package } from "lucide-react"

const ProductHistoryModal = ({ onClose, products, shop_id }) => {
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [history, setHistory] = useState([])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [changeType, setChangeType] = useState("")

  const fetchHistory = async (productId, filters = {}) => {
    try {
      const token = localStorage.getItem("token")
      const response = await api.post(
        `/api/products/history/${productId}`,
        {
          shop_id,
          ...filters,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      setHistory(response.data.history || [])
    } catch (error) {
      console.error("Error fetching history:", error)
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      const firstProductId = products[0]._id
      setSelectedProductId(firstProductId)
      fetchHistory(firstProductId)
    }
  }, [products])

  const handleProductChange = (e) => {
    const productId = e.target.value
    setSelectedProductId(productId)
    fetchHistory(productId, { fromDate, toDate, changeType })
  }

  const handleApplyFilters = () => {
    if (selectedProductId) {
      fetchHistory(selectedProductId, { fromDate, toDate, changeType })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-start pt-8 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <History className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Product History</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Filters */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-800">Filters</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-600" />
                  Select Product
                </label>
                <select
                  value={selectedProductId || ""}
                  onChange={handleProductChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Change Type</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="ADD">ADD</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                      Cost Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                      Paid Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr
                      key={entry._id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">
                        {new Date(entry.changeDate).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm border-b border-gray-200">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            entry.changeType === "ADD" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.changeType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200 font-medium">
                        {entry.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200 font-medium">
                        ₹{entry.costPrice}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200 font-medium">
                        {entry.paidAmount != null ? `₹${entry.paidAmount}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">{entry.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {history.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No history available for this product</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductHistoryModal
