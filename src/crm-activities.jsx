import React, { useState } from "react"
import { Trash2 } from "lucide-react"

export default function CRMActivities({ deals = [], onDeleteActivity }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Flatten deals to get all activities
  const allActivities = deals.flatMap(deal => 
    (deal.activitySchedules || []).map(activity => ({
      ...activity,
      dealId: deal.id,
      dealTitle: deal.title,
      customer: activity.customer || deal.customer,
      salesperson: activity.salesperson || deal.salesperson || deal.salespersonName,
    }))
  )

  // Sort by due date (nearest first)
  allActivities.sort((a, b) => {
    const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER
    const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER
    return timeA - timeB
  })

  const filteredActivities = allActivities.filter(activity => {
    const term = searchTerm.toLowerCase()
    const text = (activity.activityName || "").toLowerCase()
    const customer = (activity.customer || "").toLowerCase()
    const deal = (activity.dealTitle || "").toLowerCase()
    const salesperson = (activity.salesperson || "").toLowerCase()
    return text.includes(term) || customer.includes(term) || deal.includes(term) || salesperson.includes(term)
  })

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Activity Schedule</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-slate-500 font-medium text-sm">
            Total: <span className="text-slate-900 font-bold">{allActivities.length}</span> activities
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b">Due Date</th>
              <th className="p-4 border-b">Activity Name</th>
              <th className="p-4 border-b">Salesperson</th>
              <th className="p-4 border-b">Customer</th>
              <th className="p-4 border-b">Deal</th>
              <th className="p-4 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredActivities.map((activity, index) => (
              <tr key={activity.id || index} className="hover:bg-gray-50 transition border-b border-gray-100">
                <td className="p-4 text-gray-800 whitespace-nowrap">
                  {activity.dueAt ? new Date(activity.dueAt).toLocaleString() : "-"}
                </td>
                <td className="p-4 text-gray-800 font-medium">
                  {activity.activityName || "-"}
                </td>
                <td className="p-4 text-gray-600">
                  {activity.salesperson ? (
                    <div className="flex items-center gap-1.5">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {activity.salesperson}
                    </div>
                  ) : "-"}
                </td>
                <td className="p-4 text-gray-600 font-medium">
                  {activity.customer || "-"}
                </td>
                <td className="p-4 text-gray-600">
                  {activity.dealTitle || "-"}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => onDeleteActivity && onDeleteActivity(activity.dealId, activity.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    title="Delete Activity"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredActivities.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">
                  {searchTerm ? "No matching activities found." : "No activities scheduled."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
