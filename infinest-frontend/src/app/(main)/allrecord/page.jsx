"use client"

import { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import AllRecordTable from "@/components/AllRecordTable/AllRecordTable"

// Force this page to be dynamically rendered and skip static generation
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function AllRecordPage() {
  const [shopId, setShopId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token")
      const decoded = jwtDecode(token)
      if (!decoded?.shop_id) throw new Error("shop_id missing")
      setShopId(decoded.shop_id)
    } catch (e) {
      // Redirect to login if token invalid
      if (typeof window !== "undefined") {
        window.location.href = "/billit-login"
      }
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!shopId) return null

  return <AllRecordTable shopId={shopId} />
}
