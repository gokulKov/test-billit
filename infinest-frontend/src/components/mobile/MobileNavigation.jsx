"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home, 
  Plus, 
  Package, 
  BarChart3, 
  User, 
  Menu, 
  X,
  Smartphone,
  Receipt,
  DollarSign,
  Lock,
  Wallet
} from "lucide-react"
import { checkFeatureAccess, FEATURE_CONFIG } from "@/utils/featureAccess"

export default function MobileNavigation({ activeView, setActiveView, profileImage, profileName, features, shopId }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    {
      id: "records",
      label: "Home",
      icon: Smartphone,
      description: "Mobile Services",
      featureKey: null // Always available
    },
    {
      id: "stock",
      label: "Stock",
      icon: Package,
      description: "Inventory",
      featureKey: "product_inventory_enabled"
    },
    {
      id: "balance",
      label: "Money",
      icon: Wallet,
      description: "Outstanding Balances",
      featureKey: null // Always available
    },
    {
      id: "expenses",
      label: "Costs",
      icon: DollarSign,
      description: "Track Expenses",
      featureKey: "expense_tracker_enabled"
    },
    {
      id: "analytics",
      label: "Charts",
      icon: BarChart3,
      description: "Reports & Insights",
      featureKey: "dashboard_enabled"
    }
  ]

  const handleNavClick = (viewId) => {
    // Handle profile as a special case since it's not in navigationItems
    if (viewId === "profile") {
      setActiveView("profile")
      setIsMenuOpen(false)
      return
    }
    
    const item = navigationItems.find(nav => nav.id === viewId)
    
    // Check feature access before navigation
    if (item?.featureKey && features) {
      const isEnabled = features[item.featureKey]?.enabled
      if (!isEnabled) {
        // Map view ID to feature config for better messaging
        let featureConfig
        if (viewId === "stock") {
          featureConfig = FEATURE_CONFIG.product_inventory
        } else if (viewId === "expenses") {
          featureConfig = FEATURE_CONFIG.expense_tracker
        } else if (viewId === "analytics") {
          featureConfig = FEATURE_CONFIG.dashboard
        }
        
        if (featureConfig) {
          checkFeatureAccess(featureConfig.key, featureConfig.name, features, shopId, featureConfig.requiredPlans)
        }
        return // Don't change view if feature is not enabled
      }
    }
    
    setActiveView(viewId)
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Fixel</h1>
              <p className="text-sm text-gray-500">
                {navigationItems.find(item => item.id === activeView)?.description || "Mobile Dashboard"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleNavClick("profile")}
              className="relative hover:ring-2 hover:ring-blue-300 rounded-full transition-all"
            >
              <img
                src={profileImage}
                alt={profileName}
                className="w-8 h-8 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  e.target.src = "/default-profile.png"
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Fixel</span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={profileImage}
                alt={profileName}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  e.target.src = "/default-profile.png"
                }}
              />
              <div>
                <p className="font-medium text-gray-900">{profileName}</p>
                <p className="text-sm text-gray-500">Mobile User</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              const isFeatureLocked = item.featureKey && features && !features[item.featureKey]?.enabled
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : isFeatureLocked
                        ? 'text-gray-400 hover:bg-gray-50'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${
                      isActive 
                        ? 'text-blue-600' 
                        : isFeatureLocked 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isFeatureLocked && (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="mt-8 space-y-2">
            <p className="text-sm font-medium text-gray-500 px-4">Quick Actions</p>
            <Link
              href="/pricing"
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <DollarSign className="w-5 h-5 text-gray-500" />
              <span>Pricing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-5 gap-0">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            const isFeatureLocked = item.featureKey && features && !features[item.featureKey]?.enabled
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-0 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : isFeatureLocked
                      ? 'text-gray-400'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 ${
                    isActive 
                      ? 'text-blue-600' 
                      : isFeatureLocked 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                  }`} />
                  {isFeatureLocked && (
                    <Lock className="absolute -top-1 -right-1 w-3 h-3 text-red-500 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-xs font-medium whitespace-nowrap text-center leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
