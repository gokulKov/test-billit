"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Phone,
  Calendar,
  Store,
  Smartphone,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  AlertCircle,
  FileText,
} from "lucide-react"
import api from "@/components/api"

export default function ReceiptViewPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await api.put(
          "/api/receipt/view",
          { id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        setData(res.data)
      } catch (err) {
        console.error("Error loading receipt:", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchReceipt()
  }, [id])

  const getStatusInfo = (mobile) => {
    if (mobile.returned) {
      return {
        status: "Returned",
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        icon: RotateCcw,
        progress: 100,
      }
    }
    if (mobile.delivered) {
      return {
        status: "Delivered",
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        icon: CheckCircle,
        progress: 100,
      }
    }
    if (mobile.ready) {
      return {
        status: "Ready for Pickup",
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: Truck,
        progress: 75,
      }
    }
    return {
      status: "In Progress",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      icon: Clock,
      progress: 25,
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getDaysElapsed = (dateString) => {
    if (!dateString) return 0
    const addedDate = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - addedDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt Not Found</h3>
            <p className="text-gray-600">The requested receipt could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mobileRecords = Array.isArray(data.MobileName) ? data.MobileName : []
  const totalMobiles = mobileRecords.length
  const completedMobiles = mobileRecords.filter((m) => m.delivered || m.returned).length

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Store className="h-6 w-6" />
                  {data.owner_name}
                </CardTitle>
                <p className="text-blue-100 mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {data.shop_phone}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {totalMobiles} Device{totalMobiles !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Submitted on {formatDate(data.added_date)}</span>
              </div>
              <div className="mt-2 sm:mt-0">
                <span className="text-sm text-gray-600">Progress: </span>
                <span className="font-semibold text-blue-600">
                  {completedMobiles}/{totalMobiles} Completed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Devices List */}
        <div className="space-y-4">
          {mobileRecords.length > 0 ? (
            mobileRecords.map((mobile, index) => {
              const statusInfo = getStatusInfo(mobile)
              const StatusIcon = statusInfo.icon
              const daysElapsed = getDaysElapsed(mobile.added_date)

              return (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Mobile Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Smartphone className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{mobile.mobile_name}</h3>
                            <p className="text-gray-600 mt-1">
                              <span className="font-medium">Issue:</span> {mobile.issue || "N/A"}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Added: {formatDate(mobile.added_date)}
                              </span>
                              {mobile.delivery_date && (
                                <span className="flex items-center gap-1">
                                  <Truck className="h-4 w-4" />
                                  Delivery: {formatDate(mobile.delivery_date)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {daysElapsed} day{daysElapsed !== 1 ? "s" : ""} ago
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Section */}
                      <div className="lg:w-64">
                        <div
                          className={`p-4 rounded-lg ${statusInfo.bgColor} border-l-4`}
                          style={{ borderLeftColor: statusInfo.color.replace("bg-", "#") }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={`h-5 w-5 ${statusInfo.textColor}`} />
                            <span className={`font-semibold ${statusInfo.textColor}`}>{statusInfo.status}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${statusInfo.color}`}
                              style={{ width: `${statusInfo.progress}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span>{statusInfo.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mobile Records</h3>
                <p className="text-gray-600">No mobile devices found for this receipt.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Card */}
        {mobileRecords.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalMobiles}</div>
                  <div className="text-sm text-gray-600">Total Devices</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {mobileRecords.filter((m) => !m.ready && !m.delivered && !m.returned).length}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {mobileRecords.filter((m) => m.ready && !m.delivered && !m.returned).length}
                  </div>
                  <div className="text-sm text-gray-600">Ready</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedMobiles}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={() => window.print()} className="flex-1 text border-e-white bg-black sm:flex-none" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={() => window.location.reload()} className="flex-1 border-e-white bg-black sm:flex-none">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  )
}
