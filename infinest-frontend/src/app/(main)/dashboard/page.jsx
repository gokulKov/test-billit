'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import { jwtDecode } from 'jwt-decode';
import { usePlanFeatures } from '@/context/PlanFeatureContext';
import { checkFeatureAccess, createFeatureLockedComponent, FEATURE_CONFIG } from '@/utils/featureAccess';

export default function DashboardPage() {
  const [shopId, setShopId] = useState(null);
  const { features, loading } = usePlanFeatures();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded?.shop_id) {
          setShopId(decoded.shop_id);
        } else {
          console.warn("No shop_id in token");
          window.location.href = "/billit-login";
        }
      } catch (err) {
        console.error("Token decode failed:", err);
        localStorage.removeItem("token");
        window.location.href = "/billit-login";
      }
    } else {
      window.location.href = "/billit-login";
    }
  }, []);

  useEffect(() => {
    // Show upgrade notification when user tries to access dashboard
    if (!loading && shopId && features) {
      const config = FEATURE_CONFIG.dashboard;
      checkFeatureAccess(config.key, config.name, features, shopId, config.requiredPlans);
    }
  }, [loading, shopId, features]);

  if (loading) {
    return <p className="text-center text-gray-500 p-8">Loading...</p>;
  }

  const isDashboardEnabled = features["dashboard_enabled"]?.enabled;

  if (!isDashboardEnabled) {
    const config = FEATURE_CONFIG.dashboard;
    return createFeatureLockedComponent(
      config.name,
      config.description,
      config.requiredPlans,
      () => {
        // Show additional notification when user clicks upgrade
        if (shopId) {
          checkFeatureAccess(config.key, config.name, features, shopId, config.requiredPlans);
        }
        window.location.href = '/pricing';
      }
    );
  }

  return (
    <div className="py-8">
      {shopId ? (
        <Dashboard shopId={shopId} />
      ) : (
        <p className="text-center text-gray-500">Loading...</p>
      )}
    </div>
  );
}