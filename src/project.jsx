import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal, ChevronDown, CornerDownRight, X, Trash2, Edit, AlertTriangle } from "lucide-react"
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



const GanttChart = ({ projects, setProjects, onAddSubtask, onEdit }) => {
    const [startDate, setStartDate] = React.useState(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))
    const [dragging, setDragging] = React.useState(null)
  const [hoveredTask, setHoveredTask] = React.useState(null)
  const [focusedId, setFocusedId] = React.useState(null)
  const lighten = (hex, ratio = 0.5) => {
    const h = hex.replace('#', '')
    const n = parseInt(h, 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    const lr = Math.round(r + (255 - r) * ratio)
    const lg = Math.round(g + (255 - g) * ratio)
    const lb = Math.round(b + (255 - b) * ratio)
    const toHex = (x) => x.toString(16).padStart(2, '0')
    return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`
  }

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
                  sub.id === dragging.id ? (() => {
                    const u = updateItem(sub)
                    const ps = new Date(p.start)
                    const pe = new Date(p.end)
                    const us = new Date(u.start)
                    const ue = new Date(u.end)
                    const cs = us < ps ? ps : us
                    const ce = ue > pe ? pe : ue
                    if (cs > ce) {
                      return { 
                        ...sub, 
                        start: format(ps, "yyyy-MM-dd"), 
                        end: format(pe, "yyyy-MM-dd") 
                      }
                    }
                    return { 
                      ...u, 
                      start: format(cs, "yyyy-MM-dd"), 
                      end: format(ce, "yyyy-MM-dd") 
                    }
                  })() : sub
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
            <div className="flex-1 overflow-auto custom-scrollbar bg-white relative">
               {focusedId && (
                 <div className="absolute top-0 bottom-0 right-0 z-20 pointer-events-none backdrop-blur-2xl bg-white/30" style={{ left: '20rem' }} />
               )}
               {/* Header */}
               <div className="flex border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-40 shadow-sm">
                  <div className="w-80 shrink-0 p-4 pl-8 text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center bg-white border-r border-slate-100 sticky left-0 z-50">
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
                        <div className={`group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative ${focusedId && project.id === focusedId ? 'z-30' : 'z-10'}`}>
                           <div
                             onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                             className={`w-80 shrink-0 py-4 px-6 flex items-center gap-3 bg-white border-r border-slate-100 relative sticky left-0 z-50 group-hover:bg-slate-50/30 transition-colors`}
                           >
                               <button onClick={() => toggleProject(project.id)} className={`w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all ${focusedId && project.id !== focusedId ? 'pointer-events-none' : ''}`}>
                                   {project.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                               </button>
                               <div className="flex-1 min-w-0">
                                   <div className="font-extrabold text-slate-900 text-base truncate flex items-center gap-2">
                                       <span onClick={() => setFocusedId(project.id)} className="relative z-50 pointer-events-auto cursor-pointer">{project.name}</span>
                                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                   </div>
                                   <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                                       <span>{project.subtasks?.length || 0} tasks</span>
                                       <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                       <span>{getColorMeaning(project.color)}</span>
                                   </div>
                               </div>
                               <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all ${focusedId && project.id !== focusedId ? 'pointer-events-none opacity-0' : ''}`}>
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
                                       onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                                       className={`absolute h-8 top-3 rounded-full transition-all flex items-center justify-between px-3 overflow-visible ${focusedId && project.id !== focusedId ? 'pointer-events-none' : ''}`}
                                       style={{ 
                                           left: left(project.start), 
                                           width: width(project.start, project.end)
                                       }}
                                       onMouseEnter={() => setHoveredTask(project.id)}
                                       onMouseLeave={() => setHoveredTask(null)}
                                    >
                                    <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)` }} />
                                    {focusedId && project.id !== focusedId && (
                                      <div className="absolute inset-0 rounded-full pointer-events-none border border-white/40 shadow-md group-hover:shadow-lg backdrop-blur-2xl bg-white/30" />
                                    )}
                                    <span className={`relative z-40 text-[11px] font-bold truncate text-white drop-shadow-sm ${focusedId && project.id !== focusedId ? 'opacity-0' : ''}`}>{project.name}</span>
                                   


                                   
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
                                    <div className="relative z-20 absolute left-0 top-0 bottom-0 w-4 rounded-l-full" />
                                    <div className="relative z-20 absolute right-0 top-0 bottom-0 w-4 rounded-r-full" />
                               </div>
                           </div>
                        </div>
    
                        {/* Subtasks */}
                        {project.expanded && project.subtasks?.map((subtask, index) => (
                            <div key={subtask.id} className={`group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative ${focusedId && project.id === focusedId ? 'z-30' : 'z-10'}`}>
                                <div className="w-80 shrink-0 py-3 pl-12 pr-6 flex items-center gap-3 bg-white border-r border-slate-100 relative sticky left-0 z-20">
                                    <div className="w-2 h-2 rounded-full border border-slate-300 bg-white relative z-10"></div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                                        <div className="font-medium text-slate-600 text-xs truncate hover:text-indigo-600 transition-colors cursor-pointer"><span className={`relative z-40 ${focusedId && project.id !== focusedId ? 'opacity-0 pointer-events-none' : ''}`}>{subtask.name}</span></div>
                                        <button onClick={() => onEdit(subtask)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded-md transition-all" title="Edit Subtask">
                                            <Edit size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative h-12 flex-1">
                                    <div 
                                        className={`absolute h-6 top-3 rounded-full flex items-center justify-between px-2.5 overflow-visible transition-all hover:shadow-md hover:-translate-y-0.5 ${focusedId && project.id !== focusedId ? 'pointer-events-none' : ''}`}
                                        style={{ 
                                            left: left(subtask.start), 
                                            width: width(subtask.start, subtask.end),
                                            opacity: dragging?.id === subtask.id ? 0.8 : 1
                                        }}
                                        onMouseEnter={() => setHoveredTask(subtask.id)}
                                        onMouseLeave={() => setHoveredTask(null)}
                                    >
                                        <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, ${lighten(project.color, 0.6)}, ${lighten(project.color, 0.8)})` }} />
                                        {focusedId && project.id !== focusedId && (
                                          <div className="absolute inset-0 rounded-full pointer-events-none border border-white/40 backdrop-blur-2xl bg-white/30" />
                                        )}
                                        <span className={`relative z-40 text-[9px] font-bold text-slate-700 truncate ${focusedId && project.id !== focusedId ? 'opacity-0' : ''}`}>{subtask.name}</span>
                                        


                                        
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
  const [draft, setDraft] = React.useState({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
  const [notification, setNotification] = React.useState({ show: false, message: "" })
  const [validationError, setValidationError] = React.useState("")

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

  React.useEffect(() => {
    if (!isModalOpen) {
      setValidationError("")
      return
    }
    if (draftParentId) {
      const parent = projects.find(p => p.id === draftParentId)
      if (!parent) {
        setValidationError("")
        return
      }
      const ps = new Date(parent.start)
      const pe = new Date(parent.end)
      const ds = new Date(draft.start)
      const de = new Date(draft.end)
      if (isNaN(ds) || isNaN(de)) {
        setValidationError("Please select valid dates")
      } else if (ds > de) {
        setValidationError("Start date must be before end date")
      } else if (ds < ps) {
        setValidationError("Task starts earlier than parent")
      } else if (de > pe) {
        setValidationError("Task ends later than parent")
      } else {
        setValidationError("")
      }
    } else {
      setValidationError("")
    }
  }, [isModalOpen, draftParentId, draft.start, draft.end, projects])



  const handleAddSubtask = (parentId) => {
      setDraftParentId(parentId)
      const parent = projects.find(p => p.id === parentId)
      const ps = parent ? new Date(parent.start) : new Date()
      const pe = parent ? new Date(parent.end) : addDays(new Date(), 5)
      const initStart = format(ps, "yyyy-MM-dd")
      const initEnd = format(pe, "yyyy-MM-dd")
      setDraft({ name: "", start: initStart, end: initEnd, status: "todo", color: DEFAULT_COLOR })
      setIsModalOpen(true)
  }

  const handleEditProject = (project) => {
      setDraft({ 
          name: project.name, 
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
      setDraft({ name: "", start: format(new Date(), "yyyy-MM-dd"), end: format(addDays(new Date(), 5), "yyyy-MM-dd"), status, color: DEFAULT_COLOR })
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
                const ps = new Date(p.start)
                const pe = new Date(p.end)
                const ds = new Date(draft.start)
                const de = new Date(draft.end)
                const cs = ds < ps ? ps : ds
                const ce = de > pe ? pe : de
                const fixed = cs > ce ? { start: format(ps, "yyyy-MM-dd"), end: format(pe, "yyyy-MM-dd") } : { start: format(cs, "yyyy-MM-dd"), end: format(ce, "yyyy-MM-dd") }
                return {
                    ...p,
                    subtasks: p.subtasks.map(s => s.id === editingId ? { ...s, ...draft, ...fixed } : s)
                }
            }
            return p
        }))
    } else if (draftParentId) {
        if (validationError) {
          showNotification(validationError)
          return
        }
        setProjects(prev => prev.map(p => {
            if (p.id === draftParentId) {
                const ps = new Date(p.start)
                const pe = new Date(p.end)
                const ds = new Date(draft.start)
                const de = new Date(draft.end)
                const cs = ds < ps ? ps : ds
                const ce = de > pe ? pe : de
                const fixedStart = cs > ce ? ps : cs
                const fixedEnd = cs > ce ? pe : ce
                return {
                    ...p,
                    subtasks: [
                        ...(p.subtasks || []),
                        { id: Date.now(), ...draft, start: format(fixedStart, "yyyy-MM-dd"), end: format(fixedEnd, "yyyy-MM-dd") }
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
    setDraft({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
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
          <GanttChart projects={projects} setProjects={setProjects} onAddSubtask={handleAddSubtask} onEdit={handleEditProject} />
      </div>

      {/* Modal */}
      {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl p-4 animate-in fade-in duration-200">
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
                            {!!validationError && (
                              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold">
                                <AlertTriangle size={14} />
                                <span>{validationError}</span>
                              </div>
                            )}
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
                                disabled={!draft.name || !draft.start || !draft.end || !!validationError}
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
