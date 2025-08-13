"use client"

import React, { useState, useEffect } from "react"
import Pagination from "./Pagination"
import MobileNameTable from "./MobileNameTable"
import api from "../api"
import { usePlanFeatures } from "@/context/PlanFeatureContext"

const RecordTable = ({ shop_id, setIsLimitReached }) => {
  const { features } = usePlanFeatures()
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isNotReadyFilter, setIsNotReadyFilter] = useState(false)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const ROWS_PER_PAGE = 15

  useEffect(() => {
    if (shop_id && features.entry_limit) {
      const maxPages = features.entry_limit.totalPages || 30
      const entriesPerPage = features.entry_limit.entriesPerPage || 15
      const maxTotalRecords = maxPages * entriesPerPage
      if (data.length >= maxTotalRecords) {
        setIsLimitReached(true)
      } else {
        setIsLimitReached(false)
      }
    }
  }, [data, features, shop_id])

  useEffect(() => {
    if (shop_id) {
      fetchRecords()
      fetchTodayRevenue()
    }
  }, [shop_id])

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await api.post(
        "/api/recordsToday",
        { shop_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const { records, todayRevenue } = res.data
      setData(records)
      setFilteredData(records)
      setTodayRevenue(todayRevenue || 0)
    } catch (error) {
      console.error("Error fetching records:", error)
      setData([])
      setFilteredData([])
    }
  }

  const fetchTodayRevenue = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await api.post(
        "/api/recordsToday",
        { shop_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      const { todayRevenue } = res.data
      setTodayRevenue(todayRevenue || 0)
    } catch (error) {
      console.error("Error fetching today's revenue:", error.message)
      setTodayRevenue(0)
    }
  }

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index)
  }

  const updateBalance = async (id, balanceAmount, type) => {
    try {
      const token = localStorage.getItem("token")
      await api.post(
        "/api/updateBalance",
        { id, balanceAmount, type },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      await fetchRecords()
      await fetchTodayRevenue()
    } catch (error) {
      console.error("Error updating balance:", error.response?.data || error.message)
    }
  }

  const handleBalanceChange = (index, value) => {
    const updated = [...filteredData]
    updated[index].balanceAmount = value
    setFilteredData(updated)
  }

  const updateMobileData = (index, updatedMobiles) => {
    const update = [...filteredData]
    update[index].mobiles = updatedMobiles
    setFilteredData(update)
    const updateMain = [...data]
    updateMain[index].mobiles = updatedMobiles
    setData(updateMain)
  }

  const computeTotals = () => {
    let notReady = 0,
      ready = 0,
      delivered = 0,
      pending = 0,
      returned = 0
    data.forEach((record) => {
      record.mobiles?.forEach((m) => {
        if (m.returned) returned++
        else {
          if (m.ready) ready++
          else notReady++
          if (m.delivered) delivered++
          else pending++
        }
      })
    })
    return { ready, notReady, delivered, pending, returned }
  }

  const totals = computeTotals()
  const currentData = filteredData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Today's Record Header */}
      <h2 className="text-xl font-semibold text-gray-900">Today's Record</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ready/Not Ready Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Ready/Not Ready</div>
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">{totals.ready} Ready</span>
            <button
              onClick={() => {
                setFilteredData(isNotReadyFilter ? data : data.filter((r) => r.mobiles?.some((m) => !m.ready)))
                setIsNotReadyFilter(!isNotReadyFilter)
              }}
              className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium hover:bg-red-200 transition-colors"
            >
              {totals.notReady} Not Ready
            </button>
          </div>
        </div>

        {/* Delivery Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Delivery Status</div>
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">{totals.delivered} Delivered</span>
            <span className="text-red-600 font-medium">{totals.pending} Pending</span>
          </div>
        </div>

        {/* Returned Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Returned</div>
          <div className="text-green-600 font-medium text-lg">{totals.returned}</div>
        </div>

        {/* Today's Revenue Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Today's Revenue</div>
          <div className="text-green-600 font-medium text-lg">₹{todayRevenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">S.No</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  Mobile Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  Bill Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  Mobiles
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  Balance Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((record, index) => (
                <React.Fragment key={record.id}>
                  <tr
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 cursor-pointer transition-colors duration-200`}
                    onClick={() => toggleRow(index)}
                  >
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className="text-sm text-gray-900">{(currentPage - 1) * ROWS_PER_PAGE + index + 1}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className="text-sm text-gray-900">{record.clientName}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className="text-sm text-gray-900">{record.mobileNumber}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className="text-sm text-gray-900">{record.billNo}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className="text-sm text-gray-900">{record.mobiles.length}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="₹0"
                        value={record.balanceAmount || ""}
                        onChange={(e) => handleBalanceChange((currentPage - 1) * ROWS_PER_PAGE + index, e.target.value)}
                        onBlur={(e) =>
                          updateBalance(
                            record.id,
                            Number.parseInt(e.target.value, 10) || 0,
                            record.customerType || "Dealer",
                          )
                        }
                      />
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr>
                      <td colSpan="6" className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h5 className="text-sm font-medium text-gray-800">Mobile Device Details</h5>
                          </div>
                          <div className="p-4">
                            <MobileNameTable
                              mobileData={record.mobiles}
                              setMobileData={(updatedMobiles) =>
                                updateMobileData((currentPage - 1) * ROWS_PER_PAGE + index, updatedMobiles)
                              }
                              onRevenueUpdate={fetchTodayRevenue}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200">
          <Pagination
            invoicesPerPage={ROWS_PER_PAGE}
            totalInvoices={filteredData.length}
            paginate={setCurrentPage}
            currentPage={currentPage}
          />
        </div>
      </div>
    </div>
  )
}

export default RecordTable
