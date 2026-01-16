import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal, ChevronDown, CornerDownRight, Layout, List } from "lucide-react"
import Navigation from "./components/navigation.jsx"
import "./index.css"

const STORAGE_KEY = "eit-projects-v2"

const COLORS = [
  { hex: "#f43f5e", name: "Important" },
  { hex: "#6366f1", name: "In Progress" },
  { hex: "#10b981", name: "Done" },
  { hex: "#64748b", name: "Not Started" },
  { hex: "#f59e0b", name: "Blocked" },
]

const getColorMeaning = (hex) => COLORS.find((c) => c.hex === hex)?.name || "In Progress"
const DEFAULT_COLOR = "#6366f1"

const initialProjects = [
  { 
    id: 1, 
    name: "Website Redesign", 
    start: "2026-01-06", 
    end: "2026-01-20", 
    status: "in_progress",
    color: "#6366f1",
    expanded: true,
    subtasks: [
      { id: 101, name: "Wireframing", start: "2026-01-06", end: "2026-01-10", status: "done", color: "#10b981" },
      { id: 102, name: "Design System", start: "2026-01-11", end: "2026-01-15", status: "in_progress", color: "#6366f1" },
      { id: 103, name: "Implementation", start: "2026-01-16", end: "2026-01-20", status: "todo", color: "#64748b" },
    ]
  },
  { id: 2, name: "Mobile App Development", start: "2026-01-15", end: "2026-02-10", status: "todo", color: "#6366f1" },
  { id: 3, name: "Marketing Campaign", start: "2026-01-25", end: "2026-02-05", status: "review", color: "#f59e0b" },
  { id: 4, name: "Database Migration", start: "2026-02-01", end: "2026-02-15", status: "done", color: "#10b981" },
]

const KanbanBoard = ({ projects, setProjects, showNotification, notifyTeam }) => {
  const [draggedItem, setDraggedItem] = React.useState(null)

  // Prevent UI from changing pipelines in Kanban
  const PIPELINE_LOCKED = false

  const columns = [
      { id: 'todo', title: 'To Do', color: 'bg-gray-100/50', accent: 'border-gray-300' },
      { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50/50', accent: 'border-blue-300' },
      { id: 'review', title: 'Review', color: 'bg-amber-50/50', accent: 'border-amber-300' },
      { id: 'done', title: 'Done', color: 'bg-emerald-50/50', accent: 'border-emerald-300' }
  ]

  const handleDragStart = (e, item) => {
      setDraggedItem(item)
      e.dataTransfer.setData('text/plain', item.id)
      e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
  }

  const labelFor = (s) => s === 'in_progress' ? 'In Progress' : s === 'todo' ? 'To Do' : s === 'review' ? 'Review' : s === 'done' ? 'Done' : s

  const handleDrop = (e, status) => {
      e.preventDefault()
      if (!draggedItem) return
      if (PIPELINE_LOCKED) { setDraggedItem(null); return }

      const fromStatus = draggedItem.status || 'todo'
      const toStatus = status

      setProjects(prev => prev.map(p => {
          if (p.id === draggedItem.id) {
              return { ...p, status }
          }
          return p
      }))

      const baseMsg = `Project: Moved "${draggedItem.name}" from ${labelFor(fromStatus)} -> ${labelFor(toStatus)}`
      showNotification && showNotification(baseMsg)
      notifyTeam && notifyTeam(baseMsg, 'info', '', 'Project')
      try { window.dispatchEvent(new Event('notificationUpdated')) } catch {}

      setDraggedItem(null)
  }

  const getProjectsByStatus = (status) => {
      return projects.filter(p => (p.status || 'todo') === status)
  }

  return (
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 bg-gray-50/50">
          <div className="flex gap-6 h-full min-w-max">
              {columns.map(col => (
                  <div 
                      key={col.id} 
                      className={`w-80 flex flex-col rounded-3xl ${col.color} border border-gray-200/60 shadow-sm backdrop-blur-sm transition-colors`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                  >
                      <div className={`p-4 border-b border-gray-200/50 flex items-center justify-between relative overflow-hidden`}>
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${col.accent.replace('border-', '')} to-transparent opacity-50`} />
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${col.accent.replace('border-', 'bg-')}`} />
                              <h3 className="font-bold text-gray-700 text-sm tracking-wide">{col.title}</h3>
                          </div>
                          <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-full text-gray-500 shadow-sm border border-gray-100">
                              {getProjectsByStatus(col.id).length}
                          </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                          {getProjectsByStatus(col.id).map(project => (
                              <div
                                  key={project.id}
                                  draggable={!PIPELINE_LOCKED}
                                  onDragStart={(e) => !PIPELINE_LOCKED && handleDragStart(e, project)}
                                  title={PIPELINE_LOCKED ? 'Pipeline changes are disabled' : undefined}
                                  className={`bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 ${PIPELINE_LOCKED ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
                              >
                                  {/* Top accent bar */}
                                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: project.color, opacity: 0.8 }}></div>
                                  
                                  <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-md shadow-gray-200 shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: project.color }}>
                                              {project.name.charAt(0)}
                                          </div>
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">
                                              {getColorMeaning(project.color)}
                                          </span>
                                      </div>
                                      <button className="text-gray-300 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-full">
                                          <MoreHorizontal size={16} />
                                      </button>
                                  </div>

                                  <h4 className="font-bold text-gray-800 text-sm mb-2 leading-snug pr-2">{project.name}</h4>
                                  
                                  <div className="flex items-center gap-3 mb-4">
                                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100/50">
                                          <Calendar size={12} className="text-gray-400" />
                                          {format(new Date(project.start), "MMM d")} - {format(new Date(project.end), "MMM d")}
                                      </div>
                                  </div>

                                  {project.subtasks && project.subtasks.length > 0 && (
                                      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-gray-50/50 border border-gray-100/60 group-hover:bg-gray-50/80 transition-colors">
                                          <div className="flex items-center justify-between mb-1">
                                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                                              <span className="text-[10px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                                                  {Math.round((project.subtasks.filter(s => s.status === 'done').length / project.subtasks.length) * 100)}%
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap px-1">
                                               {project.subtasks.map((subtask, idx) => {
                                                   const isDone = subtask.status === 'done';
                                                   return (
                                                       <div 
                                                           key={subtask.id}
                                                           className={`h-3 flex-1 rounded-full transition-all duration-300 relative group/pip ${isDone ? 'border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.15)] scale-105' : 'bg-white border-gray-200 shadow-sm'}`}
                                                           style={{ minWidth: '12px', backgroundColor: isDone ? project.color : undefined }}
                                                           title={`${subtask.name}: ${subtask.status}`}
                                                       >
                                                           {/* Tooltip on Hover */}
                                                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/pip:block whitespace-nowrap z-10">
                                                               <div className="bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 transform -translate-y-1 transition-transform">
                                                                   <div className={`w-2 h-2 rounded-full ring-2 ring-white/20 ${isDone ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                                                                   {subtask.name}
                                                               </div>
                                                               {/* Arrow */}
                                                               <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                                           </div>
                                                       </div>
                                                   )
                                               })}
                                           </div>
                                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium mt-0.5">
                                              <span>{project.subtasks.filter(s => s.status === 'done').length} done</span>
                                              <span>{project.subtasks.length - project.subtasks.filter(s => s.status === 'done').length} left</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  )
}

function ProjectApp() {
  const [projects, setProjects] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialProjects
  })
  
  const [today] = React.useState(new Date())
  const [startDate, setStartDate] = React.useState(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))
  const [dragging, setDragging] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [draftParentId, setDraftParentId] = React.useState(null)
  const [draft, setDraft] = React.useState({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
  const [view, setView] = React.useState("timeline") // timeline, list
  const [notification, setNotification] = React.useState({ show: false, message: "" })

  const activeProjectsCount = projects.filter((p) => (p.status || "todo") !== "done").length
  const doneProjectsCount = projects.filter((p) => (p.status || "todo") === "done").length
  const totalProjectsCount = projects.length

  // Persist projects
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  const showNotification = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  const notifyTeam = (msg, type = "info", company = "", source = "") => {
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      list.unshift({
        id: Date.now(),
        message: msg,
        timestamp: new Date().toISOString(),
        unread: true,
        type,
        company: company || "",
        source: source || ""
      })
      if (list.length > 50) list.length = 50
      localStorage.setItem("notifications", JSON.stringify(list))
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }

  // Drag & Drop Logic
  const handleMouseMove = React.useCallback((e) => {
    if (!dragging) return

    const dayWidth = 48 // pixel width of one day
    const diffX = e.clientX - dragging.initialMouseX
    const daysDiff = Math.round(diffX / dayWidth)

    if (daysDiff === 0) return

    const updateItem = (item) => {
        const newStart = new Date(dragging.initialStart)
        const newEnd = new Date(dragging.initialEnd)

        if (dragging.type === 'move') {
            newStart.setDate(newStart.getDate() + daysDiff)
            newEnd.setDate(newEnd.getDate() + daysDiff)
        } else if (dragging.type === 'resize-start') {
            newStart.setDate(newStart.getDate() + daysDiff)
            if (newStart >= newEnd) return item // Prevent inversion
        } else if (dragging.type === 'resize-end') {
            newEnd.setDate(newEnd.getDate() + daysDiff)
            if (newEnd <= newStart) return item // Prevent inversion
        }

        return {
            ...item,
            start: format(newStart, "yyyy-MM-dd"),
            end: format(newEnd, "yyyy-MM-dd")
        }
    }

    setProjects(prev => prev.map(p => {
      // Check main project
      if (p.id === dragging.id) {
          return updateItem(p)
      }

      // Check subtasks
      if (p.subtasks) {
          const updatedSubtasks = p.subtasks.map(sub => 
              sub.id === dragging.id ? updateItem(sub) : sub
          )
          
          if (updatedSubtasks.some((s, i) => s !== p.subtasks[i])) {
              return { ...p, subtasks: updatedSubtasks }
          }
      }

      return p
    }))
  }, [dragging])

  const handleMouseUp = React.useCallback(() => {
    setDragging(null)
  }, [])

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Calendar calculations
  const daysToShow = 21
  const days = Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i))
  const dayWidth = 48

  const left = (dateStr) => {
    const date = new Date(dateStr)
    const diff = differenceInDays(date, startDate)
    return diff * dayWidth
  }

  const width = (startStr, endStr) => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const diff = differenceInDays(end, start) + 1
    return diff * dayWidth
  }

  const handleAddSubtask = (parentId) => {
      setDraftParentId(parentId)
      setDraft({ name: "", start: format(new Date(), "yyyy-MM-dd"), end: format(addDays(new Date(), 5), "yyyy-MM-dd"), status: "todo", color: DEFAULT_COLOR })
      setIsModalOpen(true)
  }

  const saveProject = () => {
    if (!draft.name || !draft.start || !draft.end) return
    
    if (draftParentId) {
        setProjects(prev => prev.map(p => {
            if (p.id === draftParentId) {
                return {
                    ...p,
                    subtasks: [
                        ...(p.subtasks || []),
                        { id: Date.now(), ...draft }
                    ],
                    expanded: true
                }
            }
            return p
        }))
    } else {
        setProjects(p => [...p, {
          id: Date.now(),
          ...draft,
          subtasks: []
        }])
    }
    setIsModalOpen(false)
    setDraft({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
    setDraftParentId(null)
  }

  const toggleProject = (id) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p))
  }

  const handleProgressChange = (id, newProgress) => {
    setProjects(prev => prev.map(p => {
        if (p.id === id) {
            return { ...p, progress: newProgress }
        }
        return p
    }))
  }

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <Navigation />

      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {notification.message}
        </div>
      )}

      {/* Toolbar and stats can go here if needed */}

      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">Project Management</h1>
          </div>
          <div className="text-sm text-slate-500">
            <span className="mr-3">Active: {activeProjectsCount}</span>
            <span className="mr-3">Done: {doneProjectsCount}</span>
            <span>Total: {totalProjectsCount}</span>
          </div>
        </div>
      </div>

      <KanbanBoard projects={projects} setProjects={setProjects} showNotification={showNotification} notifyTeam={notifyTeam} />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectApp />
  </React.StrictMode>
)
