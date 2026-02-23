import React, { useState, useEffect } from "react"
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  isToday, parseISO 
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MoreHorizontal, Check, X, CheckSquare, Clock, AlertCircle, Edit2, Sparkles, Type, Briefcase, ChevronDown } from "lucide-react"
import { API_BASE_URL } from "./config"

export default function CRMActivities({ deals = [], onDeleteActivity, onActivityUpdate }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [optimisticUpdates, setOptimisticUpdates] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [formData, setFormData] = useState({
    activityName: "",
    startAt: "",
    dueAt: "",
    dealId: ""
  })

  useEffect(() => {
    if (isModalOpen) {
      if (editingActivity) {
        setFormData({
          activityName: editingActivity.activityName || "",
          startAt: editingActivity.startAt || (editingActivity.date ? format(editingActivity.date, "yyyy-MM-dd'T'HH:mm") : ""),
          dueAt: editingActivity.date ? format(editingActivity.date, "yyyy-MM-dd'T'HH:mm") : "",
          dealId: editingActivity.dealId || ""
        })
      } else {
        setFormData({
          activityName: "",
          startAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          dueAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          dealId: ""
        })
      }
    }
  }, [isModalOpen, editingActivity])

  const handleOpenNew = () => {
    setEditingActivity(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (activity) => {
    setEditingActivity(activity)
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Optimistic update for "Done" action
    if (editingActivity) {
        setOptimisticUpdates(prev => ({
            ...prev,
            [editingActivity.id]: true
        }))
    }

    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      
      const url = editingActivity 
        ? `${API_BASE_URL}/api/activity_schedules/${editingActivity.id}/`
        : `${API_BASE_URL}/api/activity_schedules/`
        
      const method = editingActivity ? "PATCH" : "POST"
      
      const body = {
        activity_name: formData.activityName,
        start_at: formData.startAt || null,
        due_at: formData.dueAt,
        deal: formData.dealId,
        ...(editingActivity ? { completed: true } : {})
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body)
      })

      if (res.status === 401) {
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("userRole")
          localStorage.removeItem("currentUser")
          localStorage.removeItem("authToken")
          window.location.href = "/"
          return
      }

      if (res.ok) {
        setIsModalOpen(false)
        if (onActivityUpdate) onActivityUpdate()
      } else {
        console.error("Failed to save activity")
      }
    } catch (err) {
      console.error("Error saving activity", err)
    }
  }

  // Flatten and prepare activities
  const activities = deals.flatMap(deal => 
    (deal.activitySchedules || []).map(activity => ({
      ...activity,
      dealId: deal.id,
      startAt: activity.startAt || "",
      date: activity.dueAt ? new Date(activity.dueAt) : null,
      // Apply optimistic update if exists, otherwise use server state
      completed: optimisticUpdates[activity.id] !== undefined ? optimisticUpdates[activity.id] : activity.completed
    }))
  ).filter(a => a.date && !isNaN(a.date.getTime())) // Only showing activities with valid dates

  const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime())

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
      "bg-red-50 text-red-700 border-l-4 border-red-300",
    ]
    // Simple hash to keep color consistent for same activity
    const hash = (activity.id || 0) + (activity.activityName?.length || 0)
    return colors[hash % colors.length]
  }

  // Comment: Color palette for day backgrounds by weekday index (0=Sun ... 6=Sat)
  // Comment: Pastel tones to keep contrast with events; applied only for current month cells
  const getDayBackground = (day) => {
    const palette = [
      "bg-violet-50",   // Sun
      "bg-blue-50",     // Mon
      "bg-teal-50",     // Tue
      "bg-green-50",    // Wed
      "bg-yellow-50",   // Thu
      "bg-orange-50",   // Fri
      "bg-pink-50",     // Sat
    ]
    return palette[day.getDay()]
  }
  
  // Comment: Slightly stronger header tint to visually group columns
  // Comment: Mirrors getDayBackground but uses 100 shade for headers
  const getWeekdayHeaderBackground = (weekdayIndex) => {
    const headerPalette = [
      "bg-violet-100", // Sun
      "bg-blue-100",   // Mon
      "bg-teal-100",   // Tue
      "bg-green-100",  // Wed
      "bg-yellow-100", // Thu
      "bg-orange-100", // Fri
      "bg-pink-100",   // Sat
    ]
    return headerPalette[weekdayIndex % 7]
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
      
      const res = await fetch(`${API_BASE_URL}/api/activity_schedules/${activity.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ completed: newStatus })
      })

      if (res.status === 401) {
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("userRole")
          localStorage.removeItem("currentUser")
          localStorage.removeItem("authToken")
          window.location.href = "/"
          return
      }

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
            <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 select-none">
                    {format(currentDate, "MMMM")} <span className="text-gray-400 font-normal text-xl ml-2">{format(currentDate, "yyyy")}</span>
                </h2>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map((day, idx) => (
            <div 
              key={day} 
              // Comment: Make weekday names bold to match month title emphasis
              className={`py-4 text-center text-sm font-bold uppercase tracking-wider text-gray-600 ${getWeekdayHeaderBackground(idx)}`}
            >
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
                        border-b border-r border-gray-100 p-2 min-h-[120px] flex flex-col gap-1 relative group transition-colors
                        ${!isCurrentMonth ? "bg-gray-50/50 text-gray-400" : `${getDayBackground(day)} hover:bg-white`}
                        ${dayIdx % 7 === 6 ? "border-r-0" : ""}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span 
                            className={`
                                // Comment: Make day numbers bold to match month header styling
                                text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
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
                                    group/item text-xs px-2 py-1.5 rounded-md flex flex-col gap-0.5 transition-all hover:shadow-md cursor-pointer border border-transparent hover:border-gray-100
                                    ${getEventColor(act)}
                                    ${act.completed ? 'opacity-50' : ''}
                                `}
                                title={`${act.activityName} - ${format(act.date, "p")} - ${act.customer}`}
                                onClick={(e) => handleOpenEdit(act)}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button" 
                                        className={`w-4 h-4 rounded-[4px] border border-current flex items-center justify-center shrink-0 ${act.completed ? 'bg-current' : 'bg-white/50'} cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-current`}
                                        onClick={(e) => handleToggleComplete(act, e)}
                                    >
                                        <Check className={`w-3 h-3 pointer-events-none ${act.completed ? 'text-white' : 'text-current'} ${act.completed ? '' : 'opacity-0 group-hover/item:opacity-100'}`} strokeWidth={3} />
                                    </button>
                                    <span className={`truncate font-medium flex-1 ${act.completed ? 'line-through opacity-70' : ''}`}>
                                        {act.activityName || "Untitled"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 pl-6 opacity-75">
                                    {/* Due date removed from card view as requested */}
                                    {/* Assigned date removed from card view as requested */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg">
            {/* Creative Decorative Glows */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Main Creative Box Frame */}
            <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/80 via-white/40 to-white/60 shadow-2xl backdrop-blur-3xl overflow-hidden">
                <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative h-full flex flex-col">
                    {/* Header */}
                    <div className="px-8 py-8 bg-gradient-to-b from-gray-50/50 to-transparent">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D4485] to-[#3D56A6] flex items-center justify-center shadow-lg shadow-blue-900/20 text-white">
                                    {editingActivity ? <Edit2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        {editingActivity ? "Edit Activity" : "New Activity"}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                        {editingActivity ? "Update the details below" : "Schedule something amazing"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSave} className="px-8 pb-8 space-y-6 overflow-y-auto custom-scrollbar">
                        {/* Activity Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Activity Name</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D4485] transition-colors">
                                    <Type className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#2D4485]/20 focus:ring-4 focus:ring-[#2D4485]/10 transition-all font-semibold text-gray-900 placeholder-gray-400"
                                    placeholder="e.g. Call with John Doe"
                                    value={formData.activityName}
                                    onChange={e => setFormData({...formData, activityName: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Assign Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-blue-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" /> Assign Date
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="datetime-local" 
                                        required
                                        className="w-full px-4 py-3.5 rounded-2xl bg-blue-50/50 border-2 border-blue-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-blue-900"
                                        value={formData.startAt}
                                        onChange={e => setFormData({...formData, startAt: e.target.value})}
                                    />
                                </div>
                                {formData.startAt && (() => {
                                    const d = parseISO(formData.startAt)
                                    return isValidDate(d) ? (
                                        <p className="text-[10px] text-blue-600 font-medium mt-1 ml-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                                            <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                            {format(d, "EEE, MMM d, h:mm a")}
                                        </p>
                                    ) : null
                                })()}
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-red-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Due Date
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="datetime-local" 
                                        required
                                        className="w-full px-4 py-3.5 rounded-2xl bg-red-50/50 border-2 border-red-100 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-bold text-red-900"
                                        value={formData.dueAt}
                                        onChange={e => setFormData({...formData, dueAt: e.target.value})}
                                    />
                                </div>
                                {formData.dueAt && (() => {
                                    const d = parseISO(formData.dueAt)
                                    return isValidDate(d) ? (
                                        <p className="text-[10px] text-red-600 font-medium mt-1 ml-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                                            <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                            {format(d, "EEE, MMM d, h:mm a")}
                                        </p>
                                    ) : null
                                })()}
                            </div>
                        </div>

                        {/* Deal Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Related Deal</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D4485] transition-colors">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <select 
                                    required
                                    className="w-full pl-12 pr-10 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#2D4485]/20 focus:ring-4 focus:ring-[#2D4485]/10 transition-all font-semibold text-gray-900 appearance-none cursor-pointer"
                                    value={formData.dealId}
                                    onChange={e => setFormData({...formData, dealId: e.target.value})}
                                    disabled={!!editingActivity}
                                >
                                    <option value="">Select a deal...</option>
                                    {deals.map(deal => (
                                        <option key={deal.id} value={deal.id}>{deal.title}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-8 py-3 rounded-xl bg-[#2D4485] text-white text-sm font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {editingActivity ? "Done" : "Create Activity"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
