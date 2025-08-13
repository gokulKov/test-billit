"use client"

import { useState, useEffect } from "react"
import { PlusCircle, User, Hash, Smartphone, FileText, Wrench, Users } from "lucide-react"
import { logAndNotify, logSuccess } from "@/utils/logger"

export default function DealerForm({ dealers, formData, setFormData, handleCreateDealer, disabled }) {

  const handleDealerCreate = async () => {
    // Add validation for dealerName and dealerNumber
    if (!formData.dealerName.trim()) {
      logAndNotify("Dealer Name cannot be empty.", "warning")
      return
    }

    if (!formData.dealerNumber.trim()) {
      logAndNotify("Dealer Number cannot be empty.", "warning")
      return
    }

    // Ensure dealerNumber is a string (though it should be from the input)
    const success = await handleCreateDealer(formData.dealerName, formData.dealerNumber)

    if (success) {
      logSuccess("Dealer created successfully!")
      setFormData((prev) => ({
        ...prev,
        dealerName: "",
        dealerNumber: "",
      }))
    }
  }

  return (
    <div className="space-y-8">
      {/* Create New Dealer Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Dealer</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <User className="h-4 w-4 text-gray-500" />
              Dealer Name
            </label>
            <input
              type="text"
              value={formData.dealerName || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, dealerName: e.target.value }))}
              placeholder="Enter dealer name"
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Hash className="h-4 w-4 text-gray-500" />
              Dealer Number
            </label>
            <input
              type="text"
              value={formData.dealerNumber || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, dealerNumber: e.target.value }))}
              placeholder="Enter dealer number"
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleDealerCreate}
              disabled={disabled}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium"
            >
              <PlusCircle className="h-4 w-4" />
              Create Dealer
            </button>
          </div>
        </div>
      </div>

      {/* Select Existing Dealer Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dealer Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <User className="h-4 w-4 text-gray-500" />
              Select Dealer
            </label>
            <select
              value={formData.selectedDealer || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, selectedDealer: e.target.value }))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="">Select Dealer</option>
              {dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.clientName}>
                  {dealer.clientName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Smartphone className="h-4 w-4 text-gray-500" />
              No. of Mobile
            </label>
            <input
              type="number"
              value={formData.noOfMobile || ""}
              disabled={disabled}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, noOfMobile: Number.parseInt(e.target.value, 10) || 0 }))
              }
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <FileText className="h-4 w-4 text-gray-500" />
              Bill Number
            </label>
            <input
              type="text"
              value={formData.billNo || ""}
              placeholder="Auto-generated"
              readOnly
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Wrench className="h-4 w-4 text-gray-500" />
              Technician Name
            </label>
            <input
              type="text"
              value={formData.technician || ""}
              disabled={disabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, technician: e.target.value }))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
