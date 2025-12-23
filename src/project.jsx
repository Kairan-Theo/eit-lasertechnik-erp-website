import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"
import { API_BASE_URL } from "./config"
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  eachMonthOfInterval, 
  eachWeekOfInterval, 
  format, 
  addMonths, 
  differenceInDays, 
  addDays, 
  isSameMonth,
  startOfDay
} from "date-fns"

function ProjectPage() {
  const [deals, setDeals] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  
  // Default range: current month to +3 months
  const [range, setRange] = React.useState(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(addMonths(now, 3))
    return { start, end }
  })

  const [editingTask, setEditingTask] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Dimensions
  const dayWidth = 40 // pixels per day
  const headerHeight = 60
  const rowHeight = 40 // Height for task row
  const groupHeaderHeight = 40 // Height for deal title row (optional, or just first row)

  React.useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/deals/`, {
        headers: token ? { "Authorization": `Token ${token}` } : {}
      })
      if (!res.ok) throw new Error("Failed to fetch deals")
      const data = await res.json()
      setDeals(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = (dealId) => {
    setEditingTask({
      deal: dealId,
      text: "New Task",
      start: new Date(),
      end: addDays(new Date(), 5),
      assignee: ""
    })
    setIsModalOpen(true)
  }

  const handleTaskClick = (task) => {
    setEditingTask({ ...task })
    setIsModalOpen(true)
  }

  const handleSaveTask = async (e) => {
    e.preventDefault()
    if (!editingTask) return

    try {
      const token = localStorage.getItem("authToken")
      // Calculate due_at based on start and end
      // Note: Backend expects ISO strings
      const payload = {
        text: editingTask.text,
        start_at: editingTask.start.toISOString(),
        due_at: editingTask.end.toISOString(),
        assignee: editingTask.assignee
      }

      // If deal is present in editingTask, it's a new task (POST)
      // Otherwise it's an update (PATCH) to existing task ID
      const isNew = !editingTask.id

      if (isNew) {
        payload.deal = editingTask.deal
      }

      const url = isNew 
        ? `${API_BASE_URL}/api/activity_schedules/` 
        : `${API_BASE_URL}/api/activity_schedules/${editingTask.id}/`
      
      const method = isNew ? "POST" : "PATCH"

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Token ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save task")
      
      setIsModalOpen(false)
      fetchDeals() // Refresh data
    } catch (err) {
      alert("Error saving task: " + err.message)
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask || !window.confirm("Delete this task?")) return
    
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/activity_schedules/${editingTask.id}/`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Token ${token}` } : {}
      })
      
      if (!res.ok) throw new Error("Failed to delete task")
      
      setIsModalOpen(false)
      fetchDeals()
    } catch (err) {
      alert("Error deleting task: " + err.message)
    }
  }

  // Process data into rows
  // Hierarchy: Deal (Phase) -> Tasks
  const rows = React.useMemo(() => {
    // Colors for different phases/deals
    const colors = [
      { bar: "bg-amber-400", border: "border-amber-500", text: "text-amber-900" }, // Yellow (Planning)
      { bar: "bg-lime-400", border: "border-lime-500", text: "text-lime-900" },   // Green (Packaging)
      { bar: "bg-orange-400", border: "border-orange-500", text: "text-orange-900" }, // Orange (Marketing)
      { bar: "bg-sky-400", border: "border-sky-500", text: "text-sky-900" },     // Blue (Sales)
      { bar: "bg-rose-400", border: "border-rose-500", text: "text-rose-900" },   // Red (Stats)
    ]

    return deals.map((deal, index) => {
      const color = colors[index % colors.length]
      const schedules = deal.activity_schedules || []
      
      // If no schedules, create a placeholder or skip?
      // Let's show the deal as a group even if empty.
      
      const tasks = schedules.map(s => {
        // Fallbacks
        const startDate = s.start_at ? new Date(s.start_at) : (s.created_at ? new Date(s.created_at) : new Date())
        const endDate = s.due_at ? new Date(s.due_at) : addDays(startDate, 5) // Default duration 5 days
        
        return {
          id: s.id,
          text: s.text || "Untitled Task",
          start: startDate,
          end: endDate,
          assignee: s.assignee || deal.contact || "Unassigned"
        }
      })

      return {
        id: deal.id,
        title: deal.title, // e.g. "Planning"
        tasks: tasks,
        color
      }
    })
  }, [deals])

  // Timeline Headers
  const timeline = React.useMemo(() => {
    const months = eachMonthOfInterval({ start: range.start, end: range.end })
    const monthData = months.map(m => {
      const start = startOfMonth(m) < range.start ? range.start : startOfMonth(m)
      const end = endOfMonth(m) > range.end ? range.end : endOfMonth(m)
      const days = differenceInDays(end, start) + 1
      
      // Calculate weeks in this month fragment
      // This is tricky because weeks can cross months.
      // Simplification: Just show W1, W2, W3, W4 based on day of month approx?
      // Or actual weeks.
      
      // Let's generate actual weeks for the sub-header
      // We'll iterate days and group by week.
      
      return {
        date: m,
        label: format(m, "MMMM"),
        width: days * dayWidth
      }
    })

    // Generate weeks for the entire range
    const weeks = []
    let current = startOfWeek(range.start, { weekStartsOn: 1 })
    while (current <= range.end) {
      const end = endOfWeek(current, { weekStartsOn: 1 })
      // intersection with range
      const visibleStart = current < range.start ? range.start : current
      const visibleEnd = end > range.end ? range.end : end
      
      if (visibleStart <= visibleEnd) {
        const days = differenceInDays(visibleEnd, visibleStart) + 1
        weeks.push({
          start: visibleStart,
          end: visibleEnd,
          label: `W${format(current, "w")}`, // Week number
          width: days * dayWidth
        })
      }
      current = addDays(current, 7)
    }

    return { months: monthData, weeks }
  }, [range])

  const totalWidth = differenceInDays(range.end, range.start) * dayWidth

  const getX = (date) => {
    const d = new Date(date)
    if (d < range.start) return 0
    const diff = differenceInDays(d, range.start)
    return diff * dayWidth
  }

  const getWidth = (start, end) => {
    const s = new Date(start) < range.start ? range.start : new Date(start)
    const e = new Date(end)
    const days = differenceInDays(e, s)
    return Math.max(dayWidth, days * dayWidth) // Minimum 1 day width
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
        <Navigation className="bg-white border-b border-slate-200" />
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PROJECT MANAGEMENT</h1>
            <p className="text-slate-500 text-sm">Gantt Chart View</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setRange(prev => ({ start: addMonths(prev.start, -1), end: addMonths(prev.end, -1) }))}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700"
            >
              Previous Month
            </button>
            <button 
              onClick={() => setRange(prev => ({ start: addMonths(prev.start, 1), end: addMonths(prev.end, 1) }))}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700"
            >
              Next Month
            </button>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">Loading...</div>}
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (Deal Titles) */}
            <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 z-10 flex flex-col">
              {/* Header spacer */}
              <div className="h-[60px] border-b border-slate-200 bg-white box-border"></div> 
              
              {/* Rows */}
              <div className="overflow-hidden">
                {rows.map(row => (
                  <div key={row.id}>
                    {/* Deal Header */}
                    <div className="h-10 flex items-center justify-between px-4 font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
                      <span className="truncate mr-2">{row.title}</span>
                      <button 
                        onClick={() => handleAddTask(row.id)}
                        className="flex-shrink-0 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
                        title="Add Task to this Project"
                      >
                        + Add Task
                      </button>
                    </div>
                    {/* Task Rows Placeholder */}
                    {row.tasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => handleTaskClick(task)}
                        className="h-14 flex flex-col justify-center px-8 border-b border-slate-100 text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <span className="truncate group-hover:text-slate-900">{task.text}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Grid */}
            <div className="flex-1 overflow-auto bg-white relative">
              <div style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
                
                {/* Timeline Header */}
                <div className="sticky top-0 z-20 bg-white">
                  {/* Months */}
                  <div className="flex h-8 border-b border-slate-200">
                    {timeline.months.map((m, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-center text-sm font-medium text-slate-600 border-r border-slate-200 bg-slate-50"
                        style={{ width: `${m.width}px` }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                  {/* Weeks */}
                  <div className="flex h-[28px] border-b border-slate-200">
                    {timeline.weeks.map((w, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-center text-xs text-slate-500 border-r border-slate-200"
                        style={{ width: `${w.width}px` }}
                      >
                        W{format(w.start, "w")}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid Lines (Vertical) */}
                <div className="absolute inset-0 top-[60px] pointer-events-none">
                   {timeline.weeks.map((w, i) => (
                      <div 
                        key={i} 
                        className="absolute top-0 bottom-0 border-r border-slate-100"
                        style={{ left: `${getX(w.start) + w.width}px` }}
                      />
                    ))}
                </div>

                {/* Task Bars */}
                <div className="relative pt-0">
                  {rows.map(row => (
                    <div key={row.id}>
                      {/* Deal Spacer (Matches Sidebar) */}
                      <div className="h-10 border-b border-slate-100 bg-slate-50"></div>
                      
                      {/* Tasks */}
                      {row.tasks.map(task => {
                        const x = getX(task.start)
                        const w = getWidth(task.start, task.end)
                        return (
                          <div key={task.id} className="h-14 relative border-b border-slate-100 group">
                            {/* Bar */}
                            <div 
                              onClick={() => handleTaskClick(task)}
                              className={`absolute h-4 rounded-full shadow-sm ${row.color.bar} top-6 cursor-pointer hover:opacity-80 transition-opacity`}
                              style={{ left: `${x}px`, width: `${w}px` }}
                            >
                              {/* Assignee Label */}
                              <div className="absolute -top-5 left-0 text-xs text-slate-500 whitespace-nowrap group-hover:text-slate-800">
                                {task.assignee}
                              </div>
                            </div>
                            
                            {/* Optional: Dependency Line Connector Logic could go here */}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
        {/* Modal */}
        {isModalOpen && editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingTask.id ? "Edit Task" : "Add New Task"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Task Name</label>
                  <input 
                    type="text" 
                    value={editingTask.text}
                    onChange={e => setEditingTask({...editingTask, text: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={format(editingTask.start, "yyyy-MM-dd")}
                      onChange={e => setEditingTask({
                        ...editingTask, 
                        start: new Date(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={format(editingTask.end, "yyyy-MM-dd")}
                      onChange={e => setEditingTask({
                        ...editingTask, 
                        end: new Date(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                  <input 
                    type="text" 
                    value={editingTask.assignee}
                    onChange={e => setEditingTask({...editingTask, assignee: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  {editingTask.id && (
                    <button 
                      type="button" 
                      onClick={handleDeleteTask}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Delete
                    </button>
                  )}
                  <div className={`flex gap-2 ${!editingTask.id ? 'w-full justify-end' : ''}`}>
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                    >
                      {editingTask.id ? "Save Changes" : "Create Task"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LanguageProvider>
  )
}

export default ProjectPage

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<ProjectPage />)
