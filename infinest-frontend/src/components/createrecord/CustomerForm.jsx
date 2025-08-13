"use client"

export default function CustomerForm({ formData, setFormData, disabled }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* First Row */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Client Name</label>
        <input
          type="text"
          name="clientName"
          placeholder="Enter client name"
          value={formData.clientName || ""}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Mobile Number</label>
        <input
          type="tel"
          name="mobileNumber"
          placeholder="Enter mobile number"
          value={formData.mobileNumber || ""}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">No. of Mobile</label>
        <input
          type="number"
          name="noOfMobile"
          placeholder="Enter number of mobiles"
          min="1"
          max="15"
          value={formData.noOfMobile || ""}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Second Row */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Bill Number</label>
        <input
          type="text"
          name="billNo"
          placeholder="Auto-generated"
          value={formData.billNo || ""}
          readOnly
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Technician Name</label>
        <input
          type="text"
          name="technician"
          placeholder="Enter technician name"
          value={formData.technician || ""}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
