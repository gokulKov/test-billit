"use client"

import { useState } from "react"
import Pagination from "./Pagination"
import api from "../api"
import { Calendar, Smartphone, AlertCircle, CheckCircle, RotateCcw, DollarSign, Truck } from "lucide-react"

const MobileNameTable = ({ mobileData, setMobileData, onRevenueUpdate, hideActions }) => {
  const validMobileData = Array.isArray(mobileData) ? mobileData : []
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentMobileData = validMobileData.slice(indexOfFirstItem, indexOfLastItem)

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const toggleStatus = async (index, field) => {
    if (hideActions) return

    const mobile = currentMobileData[index]
    const globalIndex = indexOfFirstItem + index

    try {
      const token = localStorage.getItem("token")
      const response = await api.post(
        "/api/toggle-status",
        {
          id: mobile._id,
          field,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const updated = response.data.updatedMobile
      const updatedData = [...mobileData]
      updatedData[globalIndex] = { ...updated, deliveryDate: updated.deliveryDate }

      setMobileData(updatedData)
    } catch (error) {
      console.error(`Failed to toggle ${field}:`, error.message)
    }
  }

  const updatePaidAmount = async (index, value) => {
    if (hideActions) return

    const mobile = currentMobileData[index]
    const globalIndex = indexOfFirstItem + index

    try {
      const token = localStorage.getItem("token")
      const response = await api.post(
        "/api/update-paid-amount",
        {
          id: mobile._id,
          paidAmount: Number.parseInt(value, 10),
          updateDate: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const updated = response.data.updatedMobile
      const updatedData = [...mobileData]
      updatedData[globalIndex] = { ...updated }

      setMobileData(updatedData)

      if (typeof onRevenueUpdate === "function") {
        onRevenueUpdate()
      }
    } catch (error) {
      console.error("Failed to update paid amount:", error.message)
    }
  }

  if (validMobileData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
          <Smartphone className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Mobile Data</h3>
        <p className="text-gray-600">No mobile devices found for this record.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden shadow-lg rounded-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  Date
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-2 text-indigo-600" />
                  Mobile Name
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                  Issues
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Ready
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2 text-purple-600" />
                  Delivered
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-pink-600" />
                  Delivered Date
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2 text-red-600" />
                  Returned
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-emerald-600" />
                  Paid Amount
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentMobileData.map((mobile, index) => (
              <tr
                key={mobile.id || index}
                className={`hover:bg-blue-50 transition-colors duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="px-6 py-4 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{formatDate(mobile.added_date)}</span>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <span className="font-semibold text-gray-800">{mobile.mobile_name}</span>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <span className="text-sm text-gray-600">{mobile.issue || "N/A"}</span>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleStatus(index, "ready")}
                    disabled={hideActions}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                      mobile.ready
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    } ${hideActions ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    {mobile.ready ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleStatus(index, "delivered")}
                    disabled={hideActions}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                      mobile.delivered
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    } ${hideActions ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    {mobile.delivered ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{formatDate(mobile.delivery_date)}</span>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleStatus(index, "returned")}
                    disabled={hideActions}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                      mobile.returned
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    } ${hideActions ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    {mobile.returned ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <input
                    type="number"
                    placeholder="₹0"
                    value={mobile.paid_amount || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    onChange={(e) => {
                      if (hideActions) return
                      const value = e.target.value
                      if (/^\d{0,8}$/.test(value)) {
                        const updated = [...mobileData]
                        updated[indexOfFirstItem + index].paid_amount = value
                        setMobileData(updated)
                      }
                    }}
                    onBlur={(e) => updatePaidAmount(index, e.target.value || 0)}
                    disabled={hideActions}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <Pagination
          invoicesPerPage={itemsPerPage}
          totalInvoices={validMobileData.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>
    </div>
  )
}

export default MobileNameTable
