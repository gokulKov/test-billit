"use client"

export default function MobileEntryTable({ rows, setRows }) {
  const handleInputChange = (index, event) => {
    const { name, value } = event.target
    const updatedRows = [...rows]
    updatedRows[index][name] = value
    setRows(updatedRows)
  }

  const handleBlur = (index, event) => {
    const { name, value } = event.target
    if (name === "description" || name === "descriptionIssue") {
      const updatedRows = [...rows]
      if (value.trim() !== "") {
        const today = new Date()
        updatedRows[index].date = today.toISOString().split("T")[0]
      } else {
        updatedRows[index].date = ""
      }
      setRows(updatedRows)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">S.No</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                Mobile Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Issues</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-200`}
              >
                <td className="px-6 py-4 border-b border-gray-200">
                  <span className="text-sm text-gray-900">{index + 1}</span>
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <input
                    type="text"
                    name="description"
                    placeholder="Enter Mobile Name"
                    value={row.description}
                    onChange={(e) => handleInputChange(index, e)}
                    onBlur={(e) => handleBlur(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <input
                    type="text"
                    name="descriptionIssue"
                    placeholder="Enter Issues"
                    value={row.descriptionIssue}
                    onChange={(e) => handleInputChange(index, e)}
                    onBlur={(e) => handleBlur(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
                <td className="px-6 py-4 border-b border-gray-200">
                  <span className="text-sm text-gray-900">{row.date}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
