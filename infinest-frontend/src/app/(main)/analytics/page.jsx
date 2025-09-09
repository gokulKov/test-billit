"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import EnhancedAnalyticsDashboard from "@/components/dashboard/EnhancedAnalyticsDashboard";
import { PlanFeatureProvider } from "@/context/PlanFeatureContext";

export default function AnalyticsPage() {
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setShopId(decoded.shop_id || decoded.id);
    } catch (error) {
      console.error("Invalid token:", error);
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PlanFeatureProvider>
      <EnhancedAnalyticsDashboard shopId={shopId} />
    </PlanFeatureProvider>
  );
}
