import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal } from "lucide-react"
import Navigation from "./components/navigation.jsx"
import "./index.css"

const STORAGE_KEY = "eit-projects-v1"

// Modern color palette
const COLORS = [
  { hex: "#6366f1", name: "Indigo" },
  { hex: "#8b5cf6", name: "Purple" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#f43f5e", name: "Rose" },
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#10b981", name: "Emerald" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#64748b", name: "Slate" },
]

const initialProjects = [
  { id: 1, name: "Website Redesign", start: "2026-01-06", end: "2026-01-20", color: "#6366f1" },
  { id: 2, name: "Mobile App Development", start: "2026-01-15", end: "2026-02-10", color: "#8b5cf6" },
  { id: 3, name: "Marketing Campaign", start: "2026-01-25", end: "2026-02-05", color: "#ec4899" },
  { id: 4, name: "Database Migration", start: "2026-02-01", end: "2026-02-15", color: "#f59e0b" },
]

function ProjectApp() {
  const [projects, setProjects] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialProjects
  })
  
  const [today] = React.useState(new Date())
  const [startDate, setStartDate] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dragging, setDragging] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [draft, setDraft] = React.useState({ name: "", start: "", end: "", color: COLORS[0].hex })
  const [view, setView] = React.useState("timeline") // timeline, list

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

    setProjects(prev => prev.map(p => {
      if (p.id !== dragging.id) return p

      const newStart = new Date(dragging.initialStart)
      const newEnd = new Date(dragging.initialEnd)

      if (dragging.type === 'move') {
        newStart.setDate(newStart.getDate() + daysDiff)
        newEnd.setDate(newEnd.getDate() + daysDiff)
      } else if (dragging.type === 'resize-start') {
        newStart.setDate(newStart.getDate() + daysDiff)
        if (newStart >= newEnd) return p // Prevent inversion
      } else if (dragging.type === 'resize-end') {
        newEnd.setDate(newEnd.getDate() + daysDiff)
        if (newEnd <= newStart) return p // Prevent inversion
      }

      return {
        ...p,
        start: format(newStart, "yyyy-MM-dd"),
        end: format(newEnd, "yyyy-MM-dd")
      }
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

  const saveProject = () => {
    if (!draft.name || !draft.start || !draft.end) return
    
    setProjects(p => [...p, {
      id: Date.now(),
      ...draft
    }])
    setIsModalOpen(false)
    setDraft({ name: "", start: "", end: "", color: COLORS[0].hex })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      <Navigation />
      
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Project Management</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Track timelines and deliverables</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
             <button 
                onClick={() => setView("timeline")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "timeline" ? "bg-white shadow-sm text-gray-900 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700"}`}
             >
                Timeline
             </button>
             <button 
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "list" ? "bg-white shadow-sm text-gray-900 ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700"}`}
             >
                List View
             </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 hover:shadow-md ring-1 ring-indigo-500/20"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-[73px] z-20">
         <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200/60">
                <button onClick={() => setStartDate(d => addWeeks(d, -1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all">
                   <ChevronLeft size={16} />
                </button>
                <button onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
                   Today
                </button>
                <button onClick={() => setStartDate(d => addWeeks(d, 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all">
                   <ChevronRight size={16} />
                </button>
            </div>
            <span className="text-sm font-bold text-gray-800 ml-3">
               {format(startDate, "MMMM yyyy")}
            </span>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white w-64 transition-all"
               />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
               <Filter size={14} />
               Filter
            </button>
         </div>
      </div>

      {/* Gantt Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-gray-50/30">
        
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 bg-white z-10 shadow-sm/[0.02]">
            {/* Sidebar Header */}
            <div className="flex-none w-72 px-6 py-4 flex items-end bg-gray-50/50 border-r border-gray-100 backdrop-blur-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project Name</span>
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
                      className={`flex-none flex flex-col justify-end pb-3 pt-4 text-center border-r border-gray-100/50 relative ${weekend ? 'bg-gray-50/80' : ''}`}
                    >
                      <span className={`text-[10px] font-bold uppercase mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {format(d, "EEE")}
                      </span>
                      <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-gray-700'}`}>
                        {format(d, "d")}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto relative">
             <div className="min-w-max">
               {/* Background Columns */}
               <div className="absolute inset-0 flex pl-72 pointer-events-none">
                 {days.map((d, i) => (
                   <div 
                     key={i} 
                     style={{ width: dayWidth }}
                     className={`flex-none border-r border-dashed border-gray-200/60 h-full ${isWeekend(d) ? 'bg-gray-50/50' : ''} ${isSameDay(d, today) ? 'bg-indigo-50/5' : ''}`}
                   />
                 ))}
                 {/* Today Line */}
                 <div 
                     className="absolute top-0 bottom-0 w-px bg-indigo-500 z-10 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                     style={{ left: left(today) + (dayWidth/2) }} 
                 >
                    <div className="absolute top-0 -translate-x-1/2 -mt-1 w-2 h-2 bg-indigo-500 rounded-full" />
                 </div>
               </div>

               {/* Projects List */}
               <div className="py-4 space-y-1">
                 {projects.map(p => (
                   <div key={p.id} className="group flex items-center h-14 relative hover:bg-white transition-colors">
                     
                     {/* Sidebar Item */}
                     <div className="w-72 flex-none px-6 flex items-center gap-3 z-10 bg-white/50 backdrop-blur-[2px] border-r border-gray-100 group-hover:bg-white group-hover:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all">
                       <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: p.color }}>
                          {p.name.charAt(0)}
                       </div>
                       <div className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-700 truncate">{p.name}</span>
                          <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                             {format(new Date(p.start), "MMM d")} - {format(new Date(p.end), "MMM d")}
                          </span>
                       </div>
                     </div>

                     {/* Bar Area */}
                     <div className="absolute left-72 right-0 h-full flex items-center">
                       <div
                         className={`absolute h-8 rounded-lg shadow-sm flex items-center px-3 cursor-grab relative group/bar transition-all border border-white/20 ${
                           dragging?.id === p.id ? 'cursor-grabbing shadow-xl ring-2 ring-indigo-500/20 z-20 scale-[1.02]' : 'hover:shadow-md hover:-translate-y-0.5'
                         }`}
                         style={{
                           left: left(p.start),
                           width: Math.max(width(p.start, p.end), 32),
                           backgroundColor: p.color,
                           opacity: dragging?.id === p.id ? 0.9 : 1
                         }}
                         onMouseDown={(e) => {
                           e.preventDefault()
                           setDragging({
                             id: p.id,
                             initialMouseX: e.clientX,
                             initialStart: p.start,
                             initialEnd: p.end,
                             type: 'move'
                           })
                         }}
                       >
                         {/* Bar Label (visible if wide enough) */}
                         <span className="text-[11px] font-semibold text-white truncate drop-shadow-sm opacity-90 select-none">
                            {width(p.start, p.end) > 60 && p.name}
                         </span>

                         {/* Resize Handles */}
                         <div 
                           className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 flex items-center justify-center"
                           onMouseDown={(e) => {
                             e.stopPropagation(); e.preventDefault();
                             setDragging({ id: p.id, initialMouseX: e.clientX, initialStart: p.start, initialEnd: p.end, type: 'resize-start' })
                           }}
                         >
                            <div className="w-1 h-3 bg-white/30 rounded-full" />
                         </div>
                         <div 
                           className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 flex items-center justify-center"
                           onMouseDown={(e) => {
                             e.stopPropagation(); e.preventDefault();
                             setDragging({ id: p.id, initialMouseX: e.clientX, initialStart: p.start, initialEnd: p.end, type: 'resize-end' })
                           }}
                         >
                            <div className="w-1 h-3 bg-white/30 rounded-full" />
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
        </div>
      </div>

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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Color Label</label>
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
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectApp />
  </React.StrictMode>,
)
