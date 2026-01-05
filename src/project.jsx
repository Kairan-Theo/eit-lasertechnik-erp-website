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
    name: "Phase 1 - Website Redesign",
    color: "bg-emerald-500",
    tasks: [
      { id: 11, title: "Home Page Design", start: "2026-01-05", end: "2026-01-12", type: "Design" },
      { id: 12, title: "Home Page Development", start: "2026-01-10", end: "2026-01-25", type: "Development" }
    ]
  },
  {
    id: 2,
    name: "Phase 2 - ERP System",
    color: "bg-sky-500",
    tasks: [
      { id: 21, title: "Blog Design", start: "2026-01-22", end: "2026-02-05", type: "Design" },
      { id: 22, title: "Blog Development", start: "2026-02-01", end: "2026-02-20", type: "Development" }
    ]
  },
  {
    id: 3,
    name: "Phase 3 - Marketing",
    color: "bg-purple-500",
    tasks: [
      { id: 31, title: "Tracking Plan", start: "2026-02-10", end: "2026-02-28", type: "Marketing" }
    ]
  }
]

 

/* ---------------- COMPONENT ---------------- */
function GanttChart() {
  const dayWidth = 26
  const weekWidth = dayWidth * 7
  const [projects, setProjects] = React.useState(sampleProjects)
  const [showNewProject, setShowNewProject] = React.useState(false)
  const [newProject, setNewProject] = React.useState({ name: "", title: "", start: "", end: "", color: "bg-emerald-500" })
  const [editing, setEditing] = React.useState(null)
  const now = new Date()
  const rangeStart = startOfMonth(now)
  const rangeEnd = endOfMonth(rangeStart)

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

  const todayLeft = (differenceInDays(new Date(), weeks[0]) / 7) * weekWidth

  const getLeft = (date) =>
    (differenceInDays(new Date(date), weeks[0]) / 7) * weekWidth

  const getWidth = (start, end) =>
    Math.max(weekWidth / 2, Math.ceil((differenceInDays(new Date(end), new Date(start)) + 1) / 7) * weekWidth)

  const colorHex = (c) => {
    if (c === "bg-emerald-500") return "#10b981"
    if (c === "bg-sky-500") return "#0ea5e9"
    if (c === "bg-purple-500") return "#a855f7"
    if (c === "bg-slate-500") return "#64748b"
    return "#64748b"
  }
  const taskProgressPct = (task) => {
    const start = new Date(task.start)
    const end = new Date(task.end)
    const total = Math.max(1, differenceInDays(end, start) + 1)
    const done = Math.min(total, Math.max(0, differenceInDays(now, start) + 1))
    return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Projects Timeline</h1>
          <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
            {format(weeks[0], "MMM d")} – {format(addDays(weeks[weeks.length - 1], 6), "MMM d, yyyy")}
          </span>
        </div>
        <button
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setShowNewProject(true)}
        >
          + Add Project
        </button>
      </div>

      <div className="flex overflow-hidden border rounded-lg">
        <div className="w-64 border-r bg-slate-50">
          <div className="p-3 border-b">
            <div className="text-sm font-semibold">Phase / Task</div>
          </div>
          {projects.map(project => (
            <div key={project.id}>
              {editing?.id === project.id ? (
                <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorHex(project.color) }} />
                    <input
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = editing.name.trim()
                          if (v) {
                            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: v } : p))
                            setEditing(null)
                          }
                        } else if (e.key === "Escape") {
                          setEditing(null)
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      placeholder="Project name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded-md bg-slate-900 text-white text-xs"
                      onClick={() => {
                        const v = editing.name.trim()
                        if (v) {
                          setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: v } : p))
                          setEditing(null)
                        }
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="px-2 py-1 rounded-md border border-slate-300 text-slate-700 text-xs"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 font-semibold text-sm border-b flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorHex(project.color) }} />
                    {project.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{project.tasks.length} tasks</span>
                    <button
                      className="text-xs text-slate-600 hover:underline"
                      onClick={() => setEditing({ id: project.id, name: project.name })}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
              {project.tasks.map(t => (
                <div key={t.id} className="px-4 py-2 text-sm text-slate-600 border-b truncate">{t.title}</div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto relative bg-white">
          <div style={{ width: totalWidth }} className="relative">

            <div className="sticky top-0 bg-white z-20">
              <div className="flex border-b">
                {months.map((m) => (
                  <div key={m.label} style={{ width: m.weeks * weekWidth }} className="text-sm font-medium text-slate-700 px-2 py-2 border-r">
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="flex h-10 border-b bg-slate-50/60">
                {weeks.map((w, idx) => (
                  <div
                    key={w}
                    title={`${format(w, "MMM d")} – ${format(addDays(w, 6), "MMM d")}`}
                    className={`border-r text-slate-600`}
                    style={{ width: weekWidth, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <div className="text-xs">Week {idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none">
              {weeks.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-slate-100"
                  style={{ left: i * weekWidth, width: 1 }}
                />
              ))}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-rose-500/70"
                style={{ left: todayLeft }}
              />
            </div>

            <div className="relative">
              {projects.map((project, pi) => (
                <div key={project.id} className="border-b" style={{ minHeight: (project.tasks.length * 44) + 40 }}>
                  {(() => {
                    const starts = project.tasks.map(t => new Date(t.start).getTime())
                    const ends = project.tasks.map(t => new Date(t.end).getTime())
                    const s = new Date(Math.min(...starts))
                    const e = new Date(Math.max(...ends))
                    return (
                      <div
                        className="relative h-8"
                      >
                        <div
                          className="absolute top-1 h-6 rounded-md px-3 flex items-center text-xs font-medium text-slate-800 shadow-sm"
                          style={{ left: getLeft(s), width: getWidth(s, e) }}
                        >
                          {project.name}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Tasks */}
                  <div className="pl-0 pt-8">
                    {project.tasks.map((task, ti) => {
                      const w = getWidth(task.start, task.end)
                      const durDays = (differenceInDays(new Date(task.end), new Date(task.start)) + 1)
                      return (
                      <div key={task.id} className="relative h-12">
                        <div
                          title={`${task.title} • ${format(new Date(task.start), "MMM d")} – ${format(new Date(task.end), "MMM d")}`}
                          className="absolute top-2 h-8 text-slate-800 text-xs rounded-md pl-4 px-3 flex items-center bg-white border"
                          style={{
                            left: getLeft(task.start),
                            width: w,
                            minWidth: 56,
                            borderColor: colorHex(project.color)
                          }}
                        >
                          <span
                            className="absolute left-0 top-0 bottom-0 w-2 rounded-l-md"
                            style={{ background: colorHex(project.color) }}
                          />
                          {task.title}
                          {w > 100 ? (
                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
                              {durDays}d
                            </span>
                          ) : null}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {showNewProject && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowNewProject(false)}>
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-slate-200 w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-slate-900">New Project</div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">Project Name</div>
                <input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
                  placeholder="e.g., Phase 4 – Launch"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">Accent Color</div>
                <div className="flex gap-2">
                  {["bg-emerald-500","bg-sky-500","bg-purple-500","bg-slate-500"].map(c => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded-full ring-2 ${newProject.color===c ? "ring-slate-900" : "ring-transparent"}`}
                      style={{ background: toGradient(c) }}
                      onClick={() => setNewProject(prev => ({ ...prev, color: c }))}
                      aria-label={`choose ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs font-medium text-slate-600">First Task</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <input
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Task title"
                />
                <input
                  type="date"
                  value={newProject.start}
                  onChange={(e) => setNewProject(prev => ({ ...prev, start: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={newProject.end}
                  onChange={(e) => setNewProject(prev => ({ ...prev, end: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 text-sm"
                onClick={() => {
                  if (!newProject.name.trim()) return
                  if (!(newProject.title && newProject.start && newProject.end)) return
                  const nextId = (projects.reduce((m,p)=>Math.max(m,p.id),0) || 0) + 1
                  const proj = {
                    id: nextId,
                    name: newProject.name.trim(),
                    color: newProject.color,
                    tasks: [{
                      id: Date.now(),
                      title: newProject.title.trim(),
                      start: newProject.start,
                      end: newProject.end
                    }]
                  }
                  setProjects(prev => [...prev, proj])
                  setShowNewProject(false)
                  setNewProject({ name: "", title: "", start: "", end: "", color: "bg-emerald-500" })
                }}
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed, subtle Back button (smaller, lighter) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white text-slate-700 border border-slate-200 text-sm shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
          onClick={() => window.history.back()}
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>

    </div>
  )
}

/* ---------------- RENDER ---------------- */
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<GanttChart />)
