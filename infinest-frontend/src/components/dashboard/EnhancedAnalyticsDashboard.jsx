"use client";
import { useEffect, useState } from "react";
import { usePlanFeatures } from "@/context/PlanFeatureContext";
import { createFeatureLockedComponent } from "@/utils/featureAccess";

// Clean placeholder while debugging build issues related to previous heavy chart implementation.
export default function EnhancedAnalyticsDashboard() {
  const { isFeatureEnabled } = usePlanFeatures();
  const hasAnalyticsAccess = isFeatureEnabled('analytics_dashboard_enabled');
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  if (!hasAnalyticsAccess) {
    return createFeatureLockedComponent(
      'Analytics Dashboard',
      'Unlock advanced performance insights.',
      ['Pro','Enterprise'],
      () => (window.location.href = '/pricing')
    );
  }

  if (!ready) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-8 text-center border border-dashed">
        <h2 className="text-xl font-bold mb-2">Analytics Dashboard Temporarily Disabled</h2>
        <p className="text-gray-600">Charts disabled while fixing build issue. Core features unaffected.</p>
      </div>
    </div>
  );
}
