import React, { useState } from "react"
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  isToday 
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MoreHorizontal, Check } from "lucide-react"
import { API_BASE_URL } from "./config"

export default function CRMActivities({ deals = [], onDeleteActivity, onActivityUpdate }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [optimisticUpdates, setOptimisticUpdates] = useState({})
  
  // Flatten and prepare activities
  const activities = deals.flatMap(deal => 
    (deal.activitySchedules || []).map(activity => ({
      ...activity,
      dealId: deal.id,
      date: activity.dueAt ? new Date(activity.dueAt) : null,
      // Apply optimistic update if exists, otherwise use server state
      completed: optimisticUpdates[activity.id] !== undefined ? optimisticUpdates[activity.id] : activity.completed
    }))
  ).filter(a => a.date) // Only showing activities with dates

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Calendar generation logic
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Helper to get color based on activity type or random/hash
  const getEventColor = (activity) => {
    const colors = [
      "bg-orange-50 text-orange-700 border-l-4 border-orange-300",
      "bg-blue-50 text-blue-700 border-l-4 border-blue-300",
      "bg-green-50 text-green-700 border-l-4 border-green-300",
      "bg-purple-50 text-purple-700 border-l-4 border-purple-300",
      "bg-pink-50 text-pink-700 border-l-4 border-pink-300",
      "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-300",
    ]
    // Simple hash to keep color consistent for same activity
    const hash = (activity.id || 0) + (activity.activityName?.length || 0)
    return colors[hash % colors.length]
  }

  const handleToggleComplete = async (activity, e) => {
    e.stopPropagation()
    const newStatus = !activity.completed
    
    // Optimistic update
    setOptimisticUpdates(prev => ({
      ...prev,
      [activity.id]: newStatus
    }))

    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      
      const res = await fetch(`${API_BASE_URL}/activity_schedules/${activity.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ completed: newStatus })
      })

      if (res.ok) {
        if (onActivityUpdate) onActivityUpdate()
        // Clear optimistic update after successful sync (optional, but keeps state clean)
        // Actually better to keep it until props update to avoid flicker
      } else {
        console.error("Failed to toggle activity status")
        // Revert on failure
        setOptimisticUpdates(prev => {
          const next = { ...prev }
          delete next[activity.id]
          return next
        })
      }
    } catch (err) {
      console.error("Error toggling activity status", err)
      // Revert on error
      setOptimisticUpdates(prev => {
        const next = { ...prev }
        delete next[activity.id]
        return next
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-6 border-b border-gray-100 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-50 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
                {format(currentDate, "MMMM")} <span className="text-gray-400 font-normal text-xl ml-2">{format(currentDate, "yyyy")}</span>
            </h2>
        </div>
        <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-50 rounded-full border border-gray-200 text-gray-600 shadow-sm transition-all hover:shadow-md">
                <Plus className="w-5 h-5" />
            </button>
            
            <div className="hidden md:flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50/50">
                <button className="px-3 py-1.5 bg-white shadow-sm rounded-md text-sm font-semibold text-gray-900 border border-gray-100">Month</button>
                <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Week</button>
                <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Day</button>
            </div>

            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={goToToday} className="px-3 py-1 text-sm font-medium hover:bg-gray-50 rounded-md text-gray-700 transition-colors">Today</button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {day}
            </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-50/30">
        {calendarDays.map((day, dayIdx) => {
            const dayActivities = activities.filter(a => isSameDay(a.date, day))
            // Sort by time
            dayActivities.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
            
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isTodayDate = isToday(day)
            
            const pendingCount = dayActivities.filter(a => !a.completed).length

            return (
                <div 
                    key={day.toString()} 
                    className={`
                        border-b border-r border-gray-100 p-2 min-h-[120px] flex flex-col gap-1 relative group transition-colors hover:bg-white
                        ${!isCurrentMonth ? "bg-gray-50/50 text-gray-400" : "bg-white"}
                        ${dayIdx % 7 === 6 ? "border-r-0" : ""}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span 
                            className={`
                                text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all
                                ${isTodayDate 
                                    ? "bg-[#2D4485] text-white shadow-md transform scale-110" 
                                    : isCurrentMonth ? "text-gray-700 group-hover:bg-gray-100" : "text-gray-300"}
                            `}
                        >
                            {format(day, "d")}
                        </span>
                        {pendingCount > 0 && (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {pendingCount}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[150px] custom-scrollbar">
                        {dayActivities.map((act, i) => (
                            <div 
                                key={i}
                                className={`
                                    group/item text-xs px-2 py-1.5 rounded-md flex items-center gap-2 transition-all hover:shadow-sm hover:scale-[1.02] cursor-pointer
                                    ${getEventColor(act)}
                                    ${act.completed ? 'opacity-50' : ''}
                                `}
                                title={`${act.activityName} - ${format(act.date, "p")} - ${act.customer}`}
                                onClick={(e) => handleToggleComplete(act, e)}
                            >
                                <button
                                    type="button" 
                                    className={`w-5 h-5 rounded-[4px] border border-current flex items-center justify-center shrink-0 ${act.completed ? 'bg-current' : 'bg-white/50'} cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-current`}
                                    onClick={(e) => handleToggleComplete(act, e)}
                                >
                                    {/* Checkbox imitation */}
                                    <Check className={`w-3.5 h-3.5 pointer-events-none ${act.completed ? 'text-white' : 'text-current'} ${act.completed ? '' : 'opacity-0 group-hover/item:opacity-100'}`} strokeWidth={3} />
                                </button>
                                <span className={`truncate font-medium flex-1 ${act.completed ? 'line-through opacity-70' : ''}`}>
                                    {act.activityName || "Untitled"}
                                </span>
                                {act.date && <span className="opacity-70 text-[10px] whitespace-nowrap">{format(act.date, "HH:mm")}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  )
}
