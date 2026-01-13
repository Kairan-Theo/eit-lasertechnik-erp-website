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

const KanbanBoard = ({ projects, setProjects }) => {
  const [draggedItem, setDraggedItem] = React.useState(null)

  const columns = [
      { id: 'todo', title: 'To Do', color: 'bg-gray-100/50' },
      { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50/50' },
      { id: 'review', title: 'Review', color: 'bg-amber-50/50' },
      { id: 'done', title: 'Done', color: 'bg-emerald-50/50' }
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

  const handleDrop = (e, status) => {
      e.preventDefault()
      if (!draggedItem) return

      setProjects(prev => prev.map(p => {
          if (p.id === draggedItem.id) {
              return { ...p, status }
          }
          return p
      }))
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
                      <div className="p-3 border-b border-gray-200/50 flex items-center justify-between">
                          <h3 className="font-bold text-gray-700 text-sm tracking-wide">{col.title}</h3>
                          <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-full text-gray-500 shadow-sm border border-gray-100">
                              {getProjectsByStatus(col.id).length}
                          </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                          {getProjectsByStatus(col.id).map(project => (
                              <div
                                  key={project.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, project)}
                                  className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                              >
                                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: project.color }}></div>
                                  <div className="flex items-start justify-between mb-2 pl-2">
                                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0" style={{ backgroundColor: project.color }}>
                                          {project.name.charAt(0)}
                                      </div>
                                      <button className="text-gray-300 hover:text-gray-600 transition-colors">
                                          <MoreHorizontal size={16} />
                                      </button>
                                  </div>
                                  <h4 className="font-bold text-gray-800 text-sm mb-1.5 pl-2 leading-tight">{project.name}</h4>
                                  <div className="text-[11px] text-gray-400 mb-3 pl-2 font-medium flex items-center gap-1.5">
                                      <Calendar size={12} />
                                      {format(new Date(project.start), "MMM d")} - {format(new Date(project.end), "MMM d")}
                                  </div>
                                  {project.subtasks && project.subtasks.length > 0 && (
                                      <div className="ml-2 flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full rounded-full transition-all" 
                                                style={{ 
                                                  width: `${(project.subtasks.filter(s => s.status === 'done').length / project.subtasks.length) * 100}%`,
                                                  backgroundColor: project.color 
                                                }} 
                                              />
                                          </div>
                                          <span className="font-semibold">{project.subtasks.filter(s => s.status === 'done').length}/{project.subtasks.length} done</span>
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

  const activeProjectsCount = projects.filter((p) => (p.status || "todo") !== "done").length
  const doneProjectsCount = projects.filter((p) => (p.status || "todo") === "done").length
  const totalProjectsCount = projects.length

  // Keep existing saved colors; do not auto-overwrite based on status

  // Persist projects
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

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

  // --- UI Helper Components ---
  
  const ProjectRow = ({ item, isSubtask = false, onToggle }) => {
    let progress = 0
    let readOnly = false
    
    if (item.subtasks && item.subtasks.length > 0) {
        const done = item.subtasks.filter(s => s.status === 'done').length
        progress = Math.round((done / item.subtasks.length) * 100)
        readOnly = true
    } else {
        progress = typeof item.progress === 'number' ? item.progress : (
            item.status === 'done' ? 100 :
            item.status === 'review' ? 80 :
            item.status === 'in_progress' ? 50 : 0
        )
        readOnly = false
    }

    const barRef = React.useRef(null)

    const handleProgressDragStart = (e) => {
        if (readOnly) return
        e.preventDefault()
        e.stopPropagation()
        
        const rect = barRef.current.getBoundingClientRect()
        
        const handleMouseMove = (moveEvent) => {
             const x = moveEvent.clientX - rect.left
             const newProgress = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)))
             handleProgressChange(item.id, newProgress)
        }
        
        const handleMouseUp = () => {
             window.removeEventListener('mousemove', handleMouseMove)
             window.removeEventListener('mouseup', handleMouseUp)
        }
        
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    return (
    <div className="group flex items-center h-14 relative hover:bg-gray-50/50 transition-colors">
                     
        {/* Sidebar Item */}
        <div className={`sticky left-0 w-80 flex-none px-6 flex items-center gap-3 z-20 bg-white/80 backdrop-blur-[2px] border-r border-gray-100 group-hover:bg-white group-hover:shadow-[8px_0_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 ${isSubtask ? 'pl-12' : ''}`}>
        
        {/* Expand Toggle (only for parents with subtasks) */}
        {!isSubtask && (
            <button 
                onClick={() => onToggle(item.id)}
                className={`p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors ${item.subtasks?.length ? '' : 'invisible'}`}
            >
                {item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
        )}
        
        {isSubtask && <CornerDownRight size={14} className="text-gray-300 mr-1" />}

        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`} style={{ backgroundColor: item.color, transform: isSubtask ? 'scale(0.85)' : 'none' }}>
            {item.name.charAt(0)}
        </div>
        
        <div className="min-w-0 flex-1 group/info">
            <div className="flex items-center justify-between">
                <span className={`block text-sm ${isSubtask ? 'font-medium text-gray-600' : 'font-bold text-gray-800'} truncate`}>{item.name}</span>
                {!isSubtask && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAddSubtask(item.id) }}
                        className="opacity-0 group-hover/info:opacity-100 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-all"
                        title="Add Subtask"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400 font-medium">
                {format(new Date(item.start), "MMM d")} - {format(new Date(item.end), "MMM d")}
                </span>
            </div>
        </div>
        </div>

        {/* Bar Area */}
        <div className="absolute left-80 right-0 h-full flex items-center py-1">
        <div
            ref={barRef}
            onMouseDown={(e) => {
                if (e.button !== 0) return
                e.preventDefault()
                e.stopPropagation()
                setDragging({
                  id: item.id,
                  type: 'move',
                  initialMouseX: e.clientX,
                  initialStart: item.start,
                  initialEnd: item.end
                })
            }}
            className={`absolute rounded-full shadow-sm flex items-center px-3 relative group/bar transition-all duration-300 border border-white/10 hover:shadow-lg hover:-translate-y-0.5 select-none cursor-grab active:cursor-grabbing`}
            style={{
            height: isSubtask ? '20px' : '28px',
            left: left(item.start),
            width: Math.max(width(item.start, item.end), 40),
            backgroundColor: item.color,
            opacity: isSubtask ? 0.8 : 1,
            boxShadow: `0 4px 6px -1px ${item.color}30`
            }}
        >
            {/* Bar Texture */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            
            {/* Progress Fill */}
            <div 
                className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-l-full transition-all duration-200" 
                style={{ width: `${progress}%`, borderRadius: progress === 100 ? '9999px' : '9999px 0 0 9999px' }} 
            />

            {/* Progress Handle */}
            {!readOnly && (
                <div
                    onMouseDown={handleProgressDragStart}
                    className="absolute bottom-0 w-3 h-3 -ml-1.5 bg-white border-2 border-indigo-600 rounded-full cursor-col-resize opacity-0 group-hover/bar:opacity-100 transition-opacity z-10 shadow-sm hover:scale-125"
                    style={{ left: `${progress}%`, bottom: '-4px' }}
                    title={`Progress: ${progress}%`}
                />
            )}

            <div
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragging({
                  id: item.id,
                  type: 'resize-start',
                  initialMouseX: e.clientX,
                  initialStart: item.start,
                  initialEnd: item.end
                })
              }}
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-full opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.35), rgba(255,255,255,0))' }}
              title="Resize start"
            />
            <div
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragging({
                  id: item.id,
                  type: 'resize-end',
                  initialMouseX: e.clientX,
                  initialStart: item.start,
                  initialEnd: item.end
                })
              }}
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-full opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.35), rgba(255,255,255,0))' }}
              title="Resize end"
            />
            
              {/* Bar Content */}
            <div className="relative flex items-center justify-between w-full overflow-hidden px-1">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] font-bold text-white truncate drop-shadow-md select-none tracking-wide">
                        {width(item.start, item.end) > 60 && item.name}
                    </span>
                    {width(item.start, item.end) > 120 && (
                        <span className="text-[9px] text-white/90 font-medium select-none bg-black/20 px-1.5 rounded-full">
                            {progress}%
                        </span>
                    )}
                </div>
                {!isSubtask && width(item.start, item.end) > 120 && (
                   <div className="opacity-90 scale-75 origin-right">
                      <AvatarGroup color={item.color} count={2} />
                   </div>
                )}
            </div>
        </div>
        </div>
    </div>
  )
  }

  const AvatarGroup = ({ count = 3, color }) => (
    <div className="flex -space-x-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 shadow-sm" style={{ backgroundColor: i === 0 ? color + '20' : undefined, color: i === 0 ? color : undefined }}>
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-medium text-gray-400 shadow-sm">
        +2
      </div>
    </div>
  )

  const ProgressBar = ({ progress = 0, color, onChange, readOnly = false }) => {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navigation />
      
      {/* Top Bar */}
      <div className="bg-transparent px-6 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-40 transition-all duration-200">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <Calendar className="text-indigo-600 shrink-0" size={24} strokeWidth={2.5} />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-gray-900 truncate">Project Management</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeProjectsCount} Active
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/70 text-gray-700 ring-1 ring-black/10 text-xs font-bold">
                {doneProjectsCount} Done
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/15 text-xs font-bold">
                {totalProjectsCount} Total
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
             <button 
                onClick={() => setView("timeline")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${view === "timeline" ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
             >
                <Layout size={14} />
                Timeline
             </button>
             <button 
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${view === "kanban" ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
             >
                <List size={14} />
                Kanban
             </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#2D4485] to-[#3D56A6] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-[#2D4485]/20 active:scale-95 hover:opacity-90 hover:shadow-xl"
          >
            <Plus size={16} strokeWidth={3} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 flex items-center justify-between bg-transparent sticky top-[88px] z-30">
         <div className="flex items-center gap-4">
            {view === 'timeline' && (
                <div className="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm gap-1">
                    <button onClick={() => setStartDate(d => addWeeks(d, -1))} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-700 transition-all">
                       <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setStartDate(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))}
                        className="px-3 py-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors text-xs font-medium border border-gray-200"
                    >
                        Today
                    </button>
                    <button onClick={() => setStartDate(d => addWeeks(d, 1))} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-700 transition-all">
                       <ChevronRight size={16} />
                    </button>
                </div>
            )}
            <span className="text-lg font-bold text-gray-800 tracking-tight">
               {view === 'timeline' ? format(startDate, "MMMM yyyy") : 'Board View'}
            </span>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-indigo-500 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="pl-9 pr-4 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56 transition-all shadow-sm hover:border-gray-300"
               />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
               <Filter size={14} />
               Filters
            </button>
         </div>
      </div>

      <div className="px-8 pt-4 bg-white/60 backdrop-blur-sm border-b border-gray-200/40">
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mr-2">Color Meaning</span>
          {COLORS.map((c) => (
            <div key={c.hex} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200/60 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
              <span className="text-[11px] font-bold text-gray-700">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Area */}
      {view === 'timeline' ? (
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 bg-white z-20 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]">
            {/* Sidebar Header */}
            <div className="flex-none w-80 px-8 py-5 flex items-end bg-gray-50/30 border-r border-gray-200/60">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Project Name & Status</span>
            </div>
            
            {/* Calendar Header */}
            <div className="flex-1 overflow-hidden relative">
              <div className="flex">
                {days.map((d, i) => {
                  const isToday = isSameDay(d, today)
                  const weekend = isWeekend(d)
                  return (
                    <div 
                      key={i} 
                      style={{ width: dayWidth }} 
                      className={`flex-none flex flex-col justify-end pb-4 pt-5 text-center border-r border-dashed border-gray-100 relative group ${weekend ? 'bg-gray-50/50' : 'bg-white'}`}
                    >
                      <span className={`text-[10px] font-bold uppercase mb-1.5 transition-colors ${isToday ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {format(d, "EEE")}
                      </span>
                      <div className={`mx-auto w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110' : 'text-gray-700 group-hover:bg-gray-100'}`}>
                        {format(d, "d")}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto relative bg-white">
             <div className="min-w-max min-h-full relative" style={{ minWidth: (days.length * dayWidth) + 320 }}>
               {/* Background Columns */}
               <div className="absolute inset-0 flex pl-80 pointer-events-none">
                 {days.map((d, i) => (
                   <div 
                     key={i} 
                     style={{ width: dayWidth }}
                     className={`flex-none border-r border-dashed border-gray-100 h-full ${isWeekend(d) ? 'bg-gray-50/40' : ''} ${isSameDay(d, today) ? 'bg-indigo-50/5' : ''}`}
                   />
                 ))}

               </div>

               {/* Projects List */}
               <div className="py-6 space-y-1">
                 {projects.map((p, idx) => (
                   <div key={p.id}>
                       <ProjectRow item={p} onToggle={toggleProject} />
                       
                       {/* Subtasks */}
                       {p.expanded && p.subtasks && (
                           <div className="relative">
                               {/* Tree connector line */}
                               <div className="absolute left-[38px] top-0 bottom-4 w-px bg-gray-200 z-0"></div>
                               
                               {p.subtasks.map(sub => (
                                   <ProjectRow key={sub.id} item={sub} isSubtask={true} />
                               ))}
                           </div>
                       )}
                   </div>
                 ))}
               </div>
             </div>
        </div>
      </div>
      ) : (
        <KanbanBoard projects={projects} setProjects={setProjects} />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                  placeholder="e.g. Q1 Marketing Plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input 
                      type="date" 
                      value={draft.start}
                      onChange={e => setDraft(d => ({ ...d, start: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input 
                      type="date" 
                      value={draft.end}
                      onChange={e => setDraft(d => ({ ...d, end: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Color Meaning</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setDraft(d => ({ ...d, color: c.hex }))}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${draft.color === c.hex ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100">
                    {getColorMeaning(draft.color)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveProject}
                disabled={!draft.name || !draft.start || !draft.end}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectApp />
  </React.StrictMode>,
)