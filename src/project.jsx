import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import {
  startOfMonth,
  endOfMonth,
  format,
  differenceInDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays
} from "date-fns"

/* ---------------- SAMPLE DATA ---------------- */
const sampleProjects = [
  {
    id: 1,
    name: "Website Redesign",
    color: "#3b82f6",
    tasks: [
      { id: 11, title: "Requirements & Planning", start: "2026-01-06", end: "2026-01-12", progress: 100 },
      { id: 12, title: "UI/UX Design", start: "2026-01-13", end: "2026-01-26", progress: 75 },
      { id: 13, title: "Frontend Development", start: "2026-01-20", end: "2026-02-09", progress: 45 },
      { id: 14, title: "Design Review", start: "2026-01-26", end: "2026-01-26", progress: 100, isMilestone: true }
    ]
  },
  {
    id: 2,
    name: "Backend Development",
    color: "#8b5cf6",
    tasks: [
      { id: 21, title: "Database Design", start: "2026-01-13", end: "2026-01-26", progress: 80 },
      { id: 22, title: "API Development", start: "2026-01-27", end: "2026-02-16", progress: 55 },
      { id: 23, title: "Testing & QA", start: "2026-02-10", end: "2026-02-23", progress: 30 }
    ]
  },
  {
    id: 3,
    name: "Deployment & Launch",
    color: "#10b981",
    tasks: [
      { id: 31, title: "Security Audit", start: "2026-02-17", end: "2026-02-28", progress: 15 },
      { id: 32, title: "Go Live", start: "2026-03-03", end: "2026-03-03", progress: 0, isMilestone: true }
    ]
  }
]

 

/* ---------------- COMPONENT ---------------- */
function GanttChart() {
  const dayWidth = 30
  const weekWidth = dayWidth * 7
  const [projects, setProjects] = React.useState(sampleProjects)
  const [showNewProject, setShowNewProject] = React.useState(false)
  const [newProject, setNewProject] = React.useState({ name: "", title: "", start: "", end: "", color: "#3b82f6" })
  const [editing, setEditing] = React.useState(null)
  const now = new Date()
  const allWindows = projects
    .flatMap(p => p.tasks.map(t => ({ start: new Date(t.start), end: new Date(t.end) })))
    .filter(w => !isNaN(w.start) && !isNaN(w.end))
  const minStart = allWindows.length ? new Date(Math.min(...allWindows.map(w => w.start.getTime()))) : startOfMonth(now)
  const maxEnd = allWindows.length ? new Date(Math.max(...allWindows.map(w => w.end.getTime()))) : endOfMonth(now)
  const baseStart = startOfWeek(minStart, { weekStartsOn: 1 })
  const baseEnd = endOfWeek(maxEnd, { weekStartsOn: 1 })
  const rangeStart = addWeeks(baseStart, -1)
  const rangeEnd = addWeeks(baseEnd, 1)

  const weeksToShow = 12
  const weeks = (() => {
    const start = startOfWeek(rangeStart, { weekStartsOn: 1 })
    return Array.from({ length: weeksToShow }).map((_, i) => addWeeks(start, i))
  })()

  const totalWidth = weeks.length * weekWidth
  const months = (() => {
    const out = []
    if (weeks.length === 0) return out
    let cursor = startOfMonth(weeks[0])
    const lastMonthEnd = endOfMonth(addWeeks(weeks[0], weeks.length - 1))
    while (cursor <= lastMonthEnd) {
      const mStart = startOfMonth(cursor)
      const mEnd = endOfMonth(cursor)
      const wkCount = weeks.filter(w => (w <= mEnd && addDays(w, 6) >= mStart)).length
      out.push({ label: format(mStart, "MMMM yyyy"), weeks: wkCount })
      cursor = addMonths(cursor, 1)
    }
    return out
  })()

  const getLeft = (date) => {
    const d = new Date(date)
    const left = (differenceInDays(d, rangeStart) / 7) * weekWidth
    return Math.max(0, Math.min(left, (weeks.length * weekWidth)))
  }

  const getWidth = (start, end) => {
    const s = new Date(start)
    const e = new Date(end)
    const a = isNaN(s) ? new Date() : s
    const b = isNaN(e) ? a : e
    const [minD, maxD] = a <= b ? [a, b] : [b, a]
    const weeksSpan = Math.ceil((differenceInDays(maxD, minD) + 1) / 7)
    return Math.max(weekWidth / 2, weeksSpan * weekWidth)
  }

  const colorHex = (c) => {
    if (c === "bg-emerald-500") return "#10b981"
    if (c === "bg-sky-500") return "#0ea5e9"
    if (c === "bg-purple-500") return "#a855f7"
    if (c === "bg-slate-500") return "#64748b"
    return c
  }

  const lightenColor = (hex) => {
    return hex + '20'
  }
  
  const taskProgressPct = (task) => {
    return task.progress || 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Project Timeline</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">{format(weeks[0], "MMM d")} – {format(addDays(weeks[weeks.length - 1], 6), "MMM d, yyyy")}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm"
            >
              ← Back
            </button>
            <button
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              onClick={() => setShowNewProject(true)}
            >
              + New Project
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex">
          {/* Left Sidebar - Task List */}
          <div className="w-80 border-r border-gray-200 bg-gray-50">
            <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Tasks</h3>
            </div>
            {projects.map(project => (
              <div key={project.id} className="border-b border-gray-200">
                {/* Project Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-purple-50 transition-all border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-1.5 h-8 rounded-full shadow-sm" 
                        style={{ backgroundColor: colorHex(project.color) }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{project.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-xs text-gray-500 font-medium">{project.tasks.length} tasks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tasks */}
                {project.tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all border-t border-gray-50 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {task.isMilestone ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
                            <defs>
                              <linearGradient id={`milestone-${task.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#f59e0b" />
                              </linearGradient>
                            </defs>
                            <polygon points="12,3 21,12 12,21 3,12" fill={`url(#milestone-${task.id})`} stroke="#f59e0b" strokeWidth="2" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex-shrink-0 shadow-sm" />
                        )}
                        <span className="text-sm text-gray-700 truncate group-hover:text-blue-700 transition-colors font-medium">{task.title}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 ml-3 px-2 py-0.5 bg-gray-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-all">{task.progress}%</span>
                    </div>
                    <div className="ml-5 mt-1">
                      <span className="text-xs text-gray-500">
                        {format(new Date(task.start), "MMM d")} - {format(new Date(task.end), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Right Side - Timeline */}
          <div className="flex-1 overflow-auto bg-white">
            <div style={{ width: totalWidth }}>
              {/* Timeline Header */}
              <div className="sticky top-0 bg-gradient-to-b from-white to-gray-50 z-10 border-b border-gray-200 shadow-sm">
                {/* Months */}
                <div className="flex">
                  {months.map((m) => (
                    <div 
                      key={m.label} 
                      style={{ width: m.weeks * weekWidth }} 
                      className="px-3 py-3 text-sm font-bold text-gray-800 border-r border-gray-200"
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                {/* Weeks */}
                <div className="flex bg-gradient-to-r from-gray-50 to-blue-50">
                  {weeks.map((w, idx) => (
                    <div
                      key={w}
                      style={{ width: weekWidth }}
                      className="px-2 py-2 text-xs text-gray-700 font-medium text-center border-r border-gray-200"
                      title={`${format(w, "MMM d")} – ${format(addDays(w, 6), "MMM d")}`}
                    >
                      W{idx + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Lines */}
              <div className="relative" style={{ minHeight: '400px' }}>
                {/* Vertical Grid Lines */}
                {weeks.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-gray-100"
                    style={{ left: i * weekWidth }}
                  />
                ))}

                {/* Tasks Timeline */}
                {projects.map((project) => {
                  return (
                    <div key={project.id} className="border-b border-gray-200">
                      {/* Project Row */}
                      <div className="h-16" />
                      
                      {/* Task Rows */}
                      {project.tasks.map((task) => {
                        const w = getWidth(task.start, task.end)
                        const progress = taskProgressPct(task)
                        const durDays = differenceInDays(new Date(task.end), new Date(task.start)) + 1

                        return (
                          <div key={task.id} className="relative h-14 flex items-center">
                            {task.isMilestone ? (
                              /* Milestone Diamond */
                              <div
                                className="absolute flex items-center justify-center"
                                style={{ left: getLeft(task.start) - 12 }}
                                title={`${task.title} - ${format(new Date(task.start), "MMM d, yyyy")}`}
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                  <polygon
                                    points="12,3 21,12 12,21 3,12"
                                    fill="#f59e0b"
                                    stroke="#fff"
                                    strokeWidth="2"
                                  />
                                  {progress === 100 && (
                                    <path
                                      d="M9 12l2 2 4-4"
                                      stroke="white"
                                      strokeWidth="2"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  )}
                                </svg>
                              </div>
                            ) : (
                              /* Task Bar */
                              <div
                                className="absolute h-7 rounded shadow-sm hover:shadow transition-all cursor-pointer overflow-hidden"
                                style={{
                                  left: getLeft(task.start),
                                  width: w,
                                  minWidth: 100,
                                  backgroundColor: lightenColor(colorHex(project.color))
                                }}
                                title={`${task.title}\n${format(new Date(task.start), "MMM d")} - ${format(new Date(task.end), "MMM d")}\n${progress}% complete`}
                              >
                                {/* Progress Fill */}
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${progress}%`,
                                    backgroundColor: colorHex(project.color)
                                  }}
                                />
                                
                                {/* Task Label */}
                                <div className="absolute inset-0 px-3 flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-900 truncate">
                                    {task.title}
                                  </span>
                                  <div className="flex items-center gap-2 ml-2">
                                    {w > 140 && (
                                      <span className="text-xs text-gray-600 bg-white/80 px-2 py-0.5 rounded">
                                        {durDays}d
                                      </span>
                                    )}
                                    <span className="text-xs font-semibold text-gray-900 bg-white/90 px-2 py-0.5 rounded">
                                      {progress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewProject(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">New Project</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mobile App Development"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"].map((c) => (
                    <button
                      key={c}
                      className={`w-10 h-10 rounded ${newProject.color === c ? "ring-2 ring-gray-900" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewProject((prev) => ({ ...prev, color: c }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">First Task</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Start</label>
                  <input
                    type="date"
                    value={newProject.start}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">End</label>
                  <input
                    type="date"
                    value={newProject.end}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={!newProject.name.trim() || !newProject.title || !newProject.start || !newProject.end}
                onClick={() => {
                  if (!newProject.name.trim() || !newProject.title || !newProject.start || !newProject.end) return
                  const nextId = Math.max(...projects.map((p) => p.id), 0) + 1
                  const proj = {
                    id: nextId,
                    name: newProject.name.trim(),
                    color: newProject.color,
                    tasks: [
                      {
                        id: Date.now(),
                        title: newProject.title.trim(),
                        start: newProject.start,
                        end: newProject.end,
                        progress: 0,
                        isMilestone: false
                      }
                    ]
                  }
                  setProjects((prev) => [...prev, proj])
                  setShowNewProject(false)
                  setNewProject({ name: "", title: "", start: "", end: "", color: "#3b82f6" })
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- RENDER ---------------- */
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<GanttChart />)
