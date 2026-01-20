import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal, ChevronDown, CornerDownRight, Layout, List, X } from "lucide-react"
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
                      className={`w-80 flex flex-col rounded-2xl ${col.color} border border-gray-200/60 shadow-sm backdrop-blur-sm transition-colors`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                  >
                      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
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
                                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                              >
                                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: project.color }}></div>
                                  <div className="flex items-start justify-between mb-3 pl-2">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0" style={{ backgroundColor: project.color }}>
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
                                                           style={{ minWidth: '12px', backgroundColor: isDone ? subtask.color : undefined }}
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

const GanttChart = ({ projects, setProjects, onAddSubtask }) => {
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
        <div className="flex flex-col h-full bg-slate-50/50">
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
                        const isToday = isSameDay(day, new Date());
                        const isWknd = isWeekend(day);
                        return (
                            <div key={day.toString()} style={{ width: dayWidth }} className={`shrink-0 border-r border-slate-100/50 p-2 text-center flex flex-col justify-center items-center ${isWknd ? 'bg-slate-50/80' : ''} ${isToday ? 'bg-indigo-50/30' : ''}`}>
                               <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{format(day, "EEE")}</div>
                               <div className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'text-slate-700 hover:bg-slate-100'}`}>
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
                         const isToday = isSameDay(day, new Date());
                         return (
                            <div key={`grid-${day}`} style={{ width: dayWidth }} className={`shrink-0 border-r border-dashed border-slate-200 h-full relative ${isWeekend(day) ? 'bg-slate-50/40' : ''}`}>
                                {isToday && <div className="absolute inset-y-0 left-1/2 w-0.5 bg-indigo-500/20 -translate-x-1/2"></div>}
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
                               <button onClick={() => onAddSubtask(project.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1.5 hover:bg-indigo-50 rounded-md">
                                   <Plus size={16} />
                               </button>
                           </div>
    
                           {/* Project Bar */}
                           <div className="relative h-14 flex-1">
                               <div 
                                   className="absolute h-8 top-3 rounded-full shadow-md group-hover:shadow-lg transition-all cursor-move flex items-center justify-between px-3 overflow-visible"
                                   style={{ 
                                       left: left(project.start), 
                                       width: width(project.start, project.end),
                                       background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)`
                                   }}
                                   onMouseEnter={() => setHoveredTask(project.id)}
                                   onMouseLeave={() => setHoveredTask(null)}
                                   onMouseDown={(e) => {
                                       e.preventDefault()
                                       setDragging({ id: project.id, initialMouseX: e.clientX, initialStart: project.start, initialEnd: project.end, type: 'move' })
                                   }}
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
                                       className="absolute left-0 top-0 bottom-0 w-4 cursor-w-resize hover:bg-white/10 rounded-l-full"
                                       onMouseDown={(e) => {
                                           e.stopPropagation()
                                           setDragging({ id: project.id, initialMouseX: e.clientX, initialStart: project.start, initialEnd: project.end, type: 'resize-start' })
                                       }}
                                   />
                                   <div 
                                       className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize hover:bg-white/10 rounded-r-full"
                                       onMouseDown={(e) => {
                                           e.stopPropagation()
                                           setDragging({ id: project.id, initialMouseX: e.clientX, initialStart: project.start, initialEnd: project.end, type: 'resize-end' })
                                       }}
                                   />
                               </div>
                           </div>
                        </div>
    
                        {/* Subtasks */}
                        {project.expanded && project.subtasks?.map((subtask, index) => (
                            <div key={subtask.id} className="group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative z-10">
                                <div className="w-80 shrink-0 py-3 pl-12 pr-6 flex items-center gap-3 bg-white border-r border-slate-100 relative">
                                    <div className="w-2 h-2 rounded-full border border-slate-300 bg-white relative z-10"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-600 text-xs truncate hover:text-indigo-600 transition-colors cursor-pointer">{subtask.name}</div>
                                    </div>
                                </div>
                                <div className="relative h-12 flex-1">
                                    <div 
                                        className="absolute h-6 top-3 rounded-full shadow-sm cursor-move flex items-center justify-between px-2.5 overflow-visible transition-all hover:shadow-md hover:-translate-y-0.5"
                                        style={{ 
                                            left: left(subtask.start), 
                                            width: width(subtask.start, subtask.end),
                                            background: `linear-gradient(90deg, ${subtask.color}, ${subtask.color}dd)`,
                                            opacity: dragging?.id === subtask.id ? 0.8 : 1
                                        }}
                                        onMouseEnter={() => setHoveredTask(subtask.id)}
                                        onMouseLeave={() => setHoveredTask(null)}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            setDragging({ id: subtask.id, initialMouseX: e.clientX, initialStart: subtask.start, initialEnd: subtask.end, type: 'move' })
                                        }}
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
 
                                         {/* Resize Handles */}
                                         <div 
                                             className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize hover:bg-white/20 rounded-l-full"
                                             onMouseDown={(e) => {
                                                 e.stopPropagation()
                                                 setDragging({ id: subtask.id, initialMouseX: e.clientX, initialStart: subtask.start, initialEnd: subtask.end, type: 'resize-start' })
                                             }}
                                         />
                                         <div 
                                             className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize hover:bg-white/20 rounded-r-full"
                                             onMouseDown={(e) => {
                                                 e.stopPropagation()
                                                 setDragging({ id: subtask.id, initialMouseX: e.clientX, initialStart: subtask.start, initialEnd: subtask.end, type: 'resize-end' })
                                             }}
                                         />
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
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialProjects
  })
  
<<<<<<< Updated upstream
  const [today] = React.useState(new Date())
  const [startDate, setStartDate] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dragging, setDragging] = React.useState(null)
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const toggleProject = (id) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p))
  }

  // --- UI Helper Components ---
  
  const ProjectRow = ({ item, isSubtask = false, onToggle }) => (
    <div className="group flex items-center h-14 relative hover:bg-gray-50/50 transition-colors">
                     
        {/* Sidebar Item */}
        <div className={`w-80 flex-none px-6 flex items-center gap-3 z-20 bg-white/80 backdrop-blur-[2px] border-r border-gray-100 group-hover:bg-white group-hover:shadow-[8px_0_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 ${isSubtask ? 'pl-12' : ''}`}>
        
        {/* Expand Toggle (only for parents with subtasks) */}
        {!isSubtask && (
            <button 
                onClick={() => onToggle(item.id)}
                className={`p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors ${item.subtasks?.length ? '' : 'invisible'}`}
            >
                {item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
        )}
        
        {isSubtask && <CornerDownRight size={14} className="text-gray-300 mr-1" />}

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`} style={{ backgroundColor: item.color, transform: isSubtask ? 'scale(0.85)' : 'none' }}>
            {item.name.charAt(0)}
        </div>
        
        <div className="min-w-0 flex-1 group/info">
            <div className="flex items-center justify-between">
                <span className={`block text-sm ${isSubtask ? 'font-medium text-gray-600' : 'font-bold text-gray-800'} truncate`}>{item.name}</span>
                {!isSubtask && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAddSubtask(item.id) }}
                        className="opacity-0 group-hover/info:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-all"
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
            {!isSubtask && <ProgressBar progress={65} color={item.color} />}
        </div>
        </div>

        {/* Bar Area */}
        <div className="absolute left-80 right-0 h-full flex items-center py-1">
        <div
            className={`absolute rounded-xl shadow-sm flex items-center px-3 relative group/bar transition-all duration-300 border border-white/10 hover:shadow-lg hover:-translate-y-0.5 select-none`}
            style={{
            height: isSubtask ? '24px' : '36px',
            left: left(item.start),
            width: Math.max(width(item.start, item.end), 40),
            backgroundColor: item.color,
            opacity: isSubtask ? 0.8 : 1,
            boxShadow: `0 4px 6px -1px ${item.color}30`
            }}
        >
            {/* Bar Texture */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

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
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-xl opacity-0 group-hover/bar:opacity-100 transition-opacity"
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
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-xl opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.35), rgba(255,255,255,0))' }}
              title="Resize end"
            />
            
            {/* Bar Content */}
            <div className="relative flex items-center justify-between w-full overflow-hidden">
                <span className="text-[10px] font-bold text-white truncate drop-shadow-md select-none tracking-wide px-1">
                    {width(item.start, item.end) > 60 && item.name}
                </span>
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

  const ProgressBar = ({ progress = 65, color }) => (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
       <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
=======
  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50">
             <button 
                onClick={() => setView("timeline")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${view === "timeline" ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
             >
                <Layout size={14} />
                Timeline
             </button>
             <button 
                onClick={() => setView("kanban")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${view === "kanban" ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
             >
                <List size={14} />
                Kanban
             </button>
=======
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
                className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition-all"
            >
                + New Project
            </button>
>>>>>>> Stashed changes
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-900/20 active:scale-95 hover:shadow-xl"
          >
            <Plus size={18} strokeWidth={3} />
            <span>New Project</span>
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Toolbar */}
      <div className="px-8 py-4 flex items-center justify-between bg-transparent sticky top-[88px] z-30">
         <div className="flex items-center gap-4">
            {view === 'timeline' && (
                <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                    <button onClick={() => setStartDate(d => addWeeks(d, -1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
                       <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-4 py-1.5 text-xs font-bold text-gray-700 hover:text-indigo-600 transition-colors uppercase tracking-wide">
                       Today
                    </button>
                    <button onClick={() => setStartDate(d => addWeeks(d, 1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
                       <ChevronRight size={18} />
                    </button>
                </div>
            )}
            <span className="text-lg font-bold text-gray-800 tracking-tight">
               {view === 'timeline' ? format(startDate, "MMMM yyyy") : 'Board View'}
            </span>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all shadow-sm hover:border-gray-300"
               />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
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
             <div className="min-w-max">
               {/* Background Columns */}
               <div className="absolute inset-0 flex pl-80 pointer-events-none">
                 {days.map((d, i) => (
                   <div 
                     key={i} 
                     style={{ width: dayWidth }}
                     className={`flex-none border-r border-dashed border-gray-100 h-full ${isWeekend(d) ? 'bg-gray-50/40' : ''} ${isSameDay(d, today) ? 'bg-indigo-50/5' : ''}`}
                   />
                 ))}
                 {/* Today Line */}
                 <div 
                     className="absolute top-0 bottom-0 w-px bg-indigo-500/50 z-10"
                     style={{ left: left(today) + (dayWidth/2) }} 
                 >
                    <div className="absolute top-0 -translate-x-1/2 w-full h-full bg-indigo-500/5 blur-[2px]" />
                 </div>
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
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
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
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input 
                      type="date" 
                      value={draft.end}
                      onChange={e => setDraft(d => ({ ...d, end: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
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
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveProject}
                disabled={!draft.name || !draft.start || !draft.end}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
=======
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' ? (
            <KanbanBoard projects={projects} setProjects={setProjects} showNotification={showNotification} notifyTeam={notifyTeam} />
        ) : (
            <GanttChart projects={projects} setProjects={setProjects} onAddSubtask={handleAddSubtask} />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-96 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">{draftParentId ? 'New Subtask' : 'New Project'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                            placeholder="e.g. Design Phase"
                            value={draft.name}
                            onChange={e => setDraft({...draft, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                value={draft.start}
                                onChange={e => setDraft({...draft, start: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                value={draft.end}
                                onChange={e => setDraft({...draft, end: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button 
                                    key={c.hex}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${draft.color === c.hex ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c.hex }}
                                    onClick={() => setDraft({...draft, color: c.hex})}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveProject}
                        disabled={!draft.name || !draft.start || !draft.end}
                        className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
      )}
    </main>
>>>>>>> Stashed changes
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectApp />
  </React.StrictMode>,
)
