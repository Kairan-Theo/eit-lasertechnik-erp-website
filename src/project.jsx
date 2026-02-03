import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal, ChevronDown, CornerDownRight, Layout, List, X, Trash2, Edit } from "lucide-react"
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
  { id: 2, name: "Mobile App Development", start: "2026-01-15", end: "2026-02-10", status: "todo", color: "#8b5cf6" },
  { id: 3, name: "Marketing Campaign", start: "2026-01-25", end: "2026-02-05", status: "review", color: "#ec4899" },
  { id: 4, name: "Database Migration", start: "2026-02-01", end: "2026-02-15", status: "done", color: "#f59e0b" },
]

const KanbanBoard = ({ projects, setProjects, showNotification, notifyTeam, onEdit, onDelete, onAdd }) => {
  const [draggedItem, setDraggedItem] = React.useState(null)
  const [activeMenu, setActiveMenu] = React.useState(null)

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
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 bg-white" onClick={() => setActiveMenu(null)}>
          <div className="flex gap-6 h-full min-w-max">
              {columns.map(col => (
                  <div 
                      key={col.id} 
                    className={`w-80 h-full min-h-[75vh] shrink-0 flex flex-col rounded-3xl ${col.color} border border-gray-200/60 shadow-sm backdrop-blur-sm transition-colors`}
                    onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                  >
                      <div className={`p-4 border-b border-gray-200/50 flex items-center justify-between relative overflow-hidden`}>
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${col.accent.replace('border-', '')} to-transparent opacity-50`} />
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${col.accent.replace('border-', 'bg-')}`} />
                              <h3 className="font-bold text-gray-700 text-sm tracking-wide">{col.title}</h3>
                              <button onClick={() => onAdd && onAdd(col.id)} className="ml-2 p-1 hover:bg-white/50 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
                                  <Plus size={14} />
                              </button>
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
                                  className={`bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 ${PIPELINE_LOCKED ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group relative overflow-visible`}
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
                                      <div className="relative">
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === project.id ? null : project.id) }}
                                              className="text-gray-300 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-full"
                                          >
                                              <MoreHorizontal size={16} />
                                          </button>
                                          {activeMenu === project.id && (
                                              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                                                  <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(project); setActiveMenu(null) }} className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                      <Edit size={12} /> Edit
                                                  </button>
                                                  <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(project.id); setActiveMenu(null) }} className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                      <Trash2 size={12} /> Delete
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  <h4 className="font-bold text-gray-800 text-sm mb-2 leading-snug pr-2">{project.name}</h4>
                                  
                                  <div className="flex items-center gap-3 mb-4">
                                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100/50">
                                          <Calendar size={12} className="text-gray-400" />
                                          {format(new Date(project.start), "MMM d")} - {format(new Date(project.end), "MMM d")}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  )
}

const GanttChart = ({ projects, setProjects, onAddSubtask, onEdit }) => {
    const [startDate, setStartDate] = React.useState(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))
    const [dragging, setDragging] = React.useState(null)
    const [hoveredTask, setHoveredTask] = React.useState(null)

    const toggleProject = (id) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p))
    }

    // Calendar calculations
    const daysToShow = 28 // Increased for wider view
    const days = Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i))
    const dayWidth = 50 // Slightly wider columns
  
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

    // Drag & Drop Logic
    const handleMouseMove = React.useCallback((e) => {
        if (!dragging) return
    
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
      }, [dragging, setProjects])
    
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

    return (
        <div className="flex flex-col h-full bg-gradient-to-r from-[#2D4485] to-[#3D56A6]">
          {/* Date Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-30">
             <div className="flex items-center gap-4">
                 <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                     <button onClick={() => setStartDate(d => addWeeks(d, -1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronLeft size={16} /></button>
                     <button onClick={() => setStartDate(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))} className="px-4 py-1 text-xs font-bold text-slate-700 uppercase tracking-wide">Today</button>
                     <button onClick={() => setStartDate(d => addWeeks(d, 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronRight size={16} /></button>
                 </div>
                 <span className="text-lg font-bold text-slate-800 tracking-tight">
                     {format(startDate, "MMMM yyyy")}
                 </span>
             </div>
             <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mr-4">
                     <div className="w-3 h-3 rounded bg-indigo-500"></div> Project
                     <div className="w-3 h-3 rounded bg-emerald-500 ml-2"></div> Done
                     <div className="w-3 h-3 rounded bg-amber-500 ml-2"></div> Blocked
                 </div>
             </div>
          </div>
    
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar bg-white">
               {/* Header */}
               <div className="flex border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-20 shadow-sm">
                  <div className="w-80 shrink-0 p-4 pl-8 text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center bg-white border-r border-slate-100">
                      Project / Task
                  </div>
                  <div className="flex">
                     {days.map(day => {
                        const isWknd = isWeekend(day);
                        return (
                            <div key={day.toString()} style={{ width: dayWidth }} className={`shrink-0 border-r border-slate-100/50 p-2 text-center flex flex-col justify-center items-center ${isWknd ? 'bg-slate-50/80' : ''}`}>
                               <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider text-slate-400`}>{format(day, "EEE")}</div>
                               <div className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all text-slate-700 hover:bg-slate-100`}>
                                   {format(day, "d")}
                               </div>
                            </div>
                        )
                     })}
                  </div>
               </div>
    
               {/* Projects */}
               <div className="relative pb-20">
                  {/* Background Grid & Today Line */}
                  <div className="absolute inset-0 flex ml-80 pointer-events-none z-0">
                     {days.map(day => {
                         return (
                            <div key={`grid-${day}`} style={{ width: dayWidth }} className={`shrink-0 border-r border-dashed border-slate-200 h-full relative ${isWeekend(day) ? 'bg-slate-50/40' : ''}`}>
                            </div>
                         )
                     })}
                  </div>

                  {projects.map(project => (
                     <React.Fragment key={project.id}>
                        {/* Project Row */}
                        <div className="group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative z-10">
                           <div className="w-80 shrink-0 py-4 px-6 flex items-center gap-3 bg-white border-r border-slate-100 relative group-hover:bg-slate-50/30 transition-colors">
                               <button onClick={() => toggleProject(project.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                   {project.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                               </button>
                               <div className="flex-1 min-w-0">
                                   <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                                       {project.name}
                                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                   </div>
                                   <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                                       <span>{project.subtasks?.length || 0} tasks</span>
                                       <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                       <span>{getColorMeaning(project.color)}</span>
                                   </div>
                               </div>
                               <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                   <button onClick={() => onEdit(project)} className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-md transition-all" title="Edit Project">
                                       <Edit size={14} />
                                   </button>
                                   <button onClick={() => onAddSubtask(project.id)} className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-md transition-all" title="Add Subtask">
                                       <Plus size={16} />
                                   </button>
                               </div>
                           </div>
    
                           {/* Project Bar */}
                           <div className="relative h-14 flex-1">
                               <div 
                                       className="absolute h-8 top-3 rounded-full shadow-md group-hover:shadow-lg transition-all flex items-center justify-between px-3 overflow-visible"
                                       style={{ 
                                           left: left(project.start), 
                                           width: width(project.start, project.end),
                                           background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)`
                                       }}
                                       onMouseEnter={() => setHoveredTask(project.id)}
                                       onMouseLeave={() => setHoveredTask(null)}
                                   >
                                   <span className="text-[11px] font-bold truncate text-white drop-shadow-sm">{project.name}</span>
                                   
                                   {/* Assignee Avatars */}
                                   <div className="flex -space-x-1.5 mr-1">
                                        <div className="w-5 h-5 rounded-full border border-white/20 bg-white/20 flex items-center justify-center text-[8px] text-white font-bold backdrop-blur-sm">
                                            {project.name.charAt(0)}
                                        </div>
                                        <div className="w-5 h-5 rounded-full border border-white/20 bg-white flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm">
                                            B
                                        </div>
                                        <div className="w-5 h-5 rounded-full border border-white/20 bg-white flex items-center justify-center text-[7px] font-bold text-slate-400 shadow-sm">
                                            +2
                                        </div>
                                   </div>

                                   {/* Hover Info */}
                                   {hoveredTask === project.id && !dragging && (
                                       <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                                           <div className="font-bold">{project.name}</div>
                                           <div className="text-[10px] text-slate-300 font-normal">
                                               {format(new Date(project.start), 'MMM d')} - {format(new Date(project.end), 'MMM d')}
                                           </div>
                                           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                       </div>
                                   )}

                                   {/* Resize Handles */}
                                   <div 
                                       className="absolute left-0 top-0 bottom-0 w-4 rounded-l-full"
                                   />
                                   <div 
                                       className="absolute right-0 top-0 bottom-0 w-4 rounded-r-full"
                                   />
                               </div>
                           </div>
                        </div>
    
                        {/* Subtasks */}
                        {project.expanded && project.subtasks?.map((subtask, index) => (
                            <div key={subtask.id} className="group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative z-10">
                                <div className="w-80 shrink-0 py-3 pl-12 pr-6 flex items-center gap-3 bg-white border-r border-slate-100 relative">
                                    <div className="w-2 h-2 rounded-full border border-slate-300 bg-white relative z-10"></div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                                        <div className="font-medium text-slate-600 text-xs truncate hover:text-indigo-600 transition-colors cursor-pointer">{subtask.name}</div>
                                        <button onClick={() => onEdit(subtask)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded-md transition-all" title="Edit Subtask">
                                            <Edit size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative h-12 flex-1">
                                    <div 
                                        className="absolute h-6 top-3 rounded-full shadow-sm flex items-center justify-between px-2.5 overflow-visible transition-all hover:shadow-md hover:-translate-y-0.5"
                                        style={{ 
                                            left: left(subtask.start), 
                                            width: width(subtask.start, subtask.end),
                                            background: `linear-gradient(90deg, ${subtask.color}, ${subtask.color}dd)`,
                                            opacity: dragging?.id === subtask.id ? 0.8 : 1
                                        }}
                                        onMouseEnter={() => setHoveredTask(subtask.id)}
                                        onMouseLeave={() => setHoveredTask(null)}
                                    >
                                        <span className="text-[9px] font-bold text-white truncate drop-shadow-sm">{subtask.name}</span>
                                        
                                        {/* Assignee Avatars Subtask */}
                                        {width(subtask.start, subtask.end) > 100 && (
                                            <div className="flex -space-x-1 mr-1">
                                                <div className="w-4 h-4 rounded-full border border-white/20 bg-white/20 flex items-center justify-center text-[6px] text-white font-bold backdrop-blur-sm">
                                                    {subtask.name.charAt(0)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hover Info Subtask */}
                                        {hoveredTask === subtask.id && !dragging && (
                                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                                               <div className="font-bold">{subtask.name}</div>
                                               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                           </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                     </React.Fragment>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )
}

function ProjectApp() {
  const [projects, setProjects] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return initialProjects
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : initialProjects
    } catch (e) {
      console.error("Failed to load projects", e)
      return initialProjects
    }
  })

  
  const [today] = React.useState(new Date())
  const [startDate, setStartDate] = React.useState(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))
  const [dragging, setDragging] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [draftParentId, setDraftParentId] = React.useState(null)
  const [editingId, setEditingId] = React.useState(null)
  const [draft, setDraft] = React.useState({ name: "", description: "", priority: "medium", budget: "", assignee: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
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

  const notifyTeam = (msg, type) => {
    console.log(`[Team Notification] ${type}: ${msg}`)
    showNotification(msg)
  }




  const handleAddSubtask = (parentId) => {
      setDraftParentId(parentId)
      setDraft({ name: "", description: "", priority: "medium", budget: "", assignee: "", start: format(new Date(), "yyyy-MM-dd"), end: format(addDays(new Date(), 5), "yyyy-MM-dd"), status: "todo", color: DEFAULT_COLOR })
      setIsModalOpen(true)
  }

  const handleEditProject = (project) => {
      setDraft({ 
          name: project.name, 
          description: project.description || "", 
          priority: project.priority || "medium", 
          budget: project.budget || "", 
          assignee: project.assignee || "", 
          start: project.start, 
          end: project.end, 
          status: project.status, 
          color: project.color 
      })
      setEditingId(project.id)
      setDraftParentId(null)
      setIsModalOpen(true)
  }

  const handleDeleteProject = (id) => {
      if (confirm('Are you sure you want to delete this project?')) {
          setProjects(prev => prev.filter(p => p.id !== id))
          showNotification('Project deleted successfully')
      }
  }

  const handleAddWithStatus = (status) => {
      setDraft({ name: "", description: "", priority: "medium", budget: "", assignee: "", start: format(new Date(), "yyyy-MM-dd"), end: format(addDays(new Date(), 5), "yyyy-MM-dd"), status, color: DEFAULT_COLOR })
      setDraftParentId(null)
      setEditingId(null)
      setIsModalOpen(true)
  }

  const saveProject = () => {
    if (!draft.name || !draft.start || !draft.end) return
    
    if (editingId) {
        setProjects(prev => prev.map(p => {
            if (p.id === editingId) {
                return { ...p, ...draft }
            }
            // Check if it's a subtask update
            if (p.subtasks && p.subtasks.some(s => s.id === editingId)) {
                return {
                    ...p,
                    subtasks: p.subtasks.map(s => s.id === editingId ? { ...s, ...draft } : s)
                }
            }
            return p
        }))
    } else if (draftParentId) {
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
    showNotification(editingId ? 'Project updated successfully' : 'Project created successfully')
    setIsModalOpen(false)
    setDraft({ name: "", description: "", priority: "medium", budget: "", assignee: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
    setDraftParentId(null)
    setEditingId(null)
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
    <main className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <Navigation />

      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {notification.message}
        </div>
      )}

      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">Project Management</h1>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg ml-6">
                <button 
                    onClick={() => setView('timeline')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layout size={16} /> Timeline
                </button>
                <button 
                    onClick={() => setView('kanban')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={16} /> Kanban
                </button>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            <span className="mr-3">Active: {activeProjectsCount}</span>
            <span className="mr-3">Done: {doneProjectsCount}</span>
            <span>Total: {totalProjectsCount}</span>
            <button 
                onClick={() => { setDraftParentId(null); setIsModalOpen(true) }}
                className="ml-4 px-4 py-2 bg-gradient-to-r from-[#2D4485] to-[#3D56A6] text-white rounded-lg text-sm font-bold shadow hover:shadow-lg transition-all"
            >
                + New Project
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'kanban' ? (
            <KanbanBoard projects={projects} setProjects={setProjects} showNotification={showNotification} notifyTeam={notifyTeam} onEdit={handleEditProject} onDelete={handleDeleteProject} onAdd={handleAddWithStatus} />
        ) : (
            <GanttChart projects={projects} setProjects={setProjects} onAddSubtask={handleAddSubtask} onEdit={handleEditProject} />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md group">
                {/* Creative Decorative Glows */}
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-700"></div>

                {/* Main Creative Box Frame */}
                <div className="relative p-[2px] rounded-[2rem] bg-gradient-to-br from-white/80 via-white/20 to-white/60 shadow-2xl backdrop-blur-3xl">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[1.9rem] overflow-hidden relative h-full">
                        {/* Inner Bevel Border */}
                        <div className="absolute inset-0 rounded-[1.9rem] border border-white/50 pointer-events-none z-10"></div>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100/50 flex justify-between items-center relative z-20 bg-gradient-to-r from-white/50 to-transparent">
                            <h3 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                {editingId ? 'Edit Project' : draftParentId ? 'New Subtask' : 'New Project'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 hover:shadow-sm transition-all duration-300"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-20">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    placeholder="e.g. Design Phase"
                                    value={draft.name}
                                    onChange={e => setDraft({...draft, name: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                                <textarea 
                                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium min-h-[60px] resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    placeholder="Add project details..."
                                    value={draft.description}
                                    onChange={e => setDraft({...draft, description: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium appearance-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] cursor-pointer"
                                            value={draft.priority}
                                            onChange={e => setDraft({...draft, priority: e.target.value})}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Budget</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                        placeholder="0.00"
                                        value={draft.budget}
                                        onChange={e => setDraft({...draft, budget: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Assignee</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    placeholder="e.g. John Doe"
                                    value={draft.assignee}
                                    onChange={e => setDraft({...draft, assignee: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                        value={draft.start}
                                        onChange={e => setDraft({...draft, start: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                        value={draft.end}
                                        onChange={e => setDraft({...draft, end: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Color Tag</label>
                                <div className="flex gap-3 p-2 bg-white/50 rounded-xl border border-gray-200/60 w-fit">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c.hex}
                                            className={`w-6 h-6 rounded-full border-2 transition-all duration-300 hover:scale-110 shadow-sm ${draft.color === c.hex ? 'border-gray-900 scale-110 shadow-md ring-2 ring-gray-100' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.hex }}
                                            onClick={() => setDraft({...draft, color: c.hex})}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100/50 flex justify-end gap-3 relative z-20 backdrop-blur-sm">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveProject}
                                disabled={!draft.name || !draft.start || !draft.end}
                                className="relative overflow-hidden px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group/btn"
                            >
                                <span className="relative z-10">{editingId ? 'Update Changes' : draftParentId ? 'Add Task' : 'Create Project'}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      {/* Toolbar and stats can go here if needed */}
    </main>
  )
}

export default ProjectApp

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectApp />
  </React.StrictMode>
)