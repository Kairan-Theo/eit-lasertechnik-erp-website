import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal, ChevronDown, CornerDownRight, X, Trash2, Edit, AlertTriangle, Download } from "lucide-react"
import html2pdf from "html2pdf.js"
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
  const [selectedProjects, setSelectedProjects] = React.useState(new Set())
  const [exportFormat, setExportFormat] = React.useState('pdf')
  const [showExportMenu, setShowExportMenu] = React.useState(false)

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(id)) {
        newSelected.delete(id)
    } else {
        newSelected.add(id)
    }
    setSelectedProjects(newSelected)
  }

  const toggleAll = () => {
    if (selectedProjects.size === projects.length) {
        setSelectedProjects(new Set())
    } else {
        setSelectedProjects(new Set(projects.map(p => p.id)))
    }
  }

  const exportProject = (project, formatType) => {
    // 1. Calculate Timeline Bounds
    let minDate = new Date(project.start)
    let maxDate = new Date(project.end)
    
    // Only include subtasks in bounds calculation if project is expanded
    if (project.expanded && project.subtasks && project.subtasks.length > 0) {
        project.subtasks.forEach(sub => {
            const s = new Date(sub.start)
            const e = new Date(sub.end)
            if (s < minDate) minDate = s
            if (e > maxDate) maxDate = e
        })
    }
    
    // Add buffer (1 week before, 2 weeks after)
    const bufferDaysBefore = 7
    const bufferDaysAfter = 14
    minDate = addDays(minDate, -bufferDaysBefore)
    maxDate = addDays(maxDate, bufferDaysAfter)
    
    const totalDays = differenceInDays(maxDate, minDate) + 1
    const dayWidth = 25 // px per day for Export
    
    // Helper for positioning
    const getPos = (dateStr) => differenceInDays(new Date(dateStr), minDate) * dayWidth
    const getLen = (start, end) => (differenceInDays(new Date(end), new Date(start)) + 1) * dayWidth

    // 2. Prepare HTML Elements
    const element = document.createElement('div')
    const totalWidth = 200 + (totalDays * dayWidth) // 200px sidebar + timeline
    element.style.width = `${Math.max(1100, totalWidth)}px` // Minimum 1100px for A4 landscape ratio
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '0'
    document.body.appendChild(element)
    
    // Generate Grid Lines (Weekly) with cleaner style
    let gridLinesHtml = ''
    for (let i = 0; i < totalDays; i += 7) { 
        const left = i * dayWidth
        const d = addDays(minDate, i)
        // Check if it's the last week to avoid right border overflow if needed, but absolute positioning handles it.
        gridLinesHtml += `
            <div style="position: absolute; left: ${left}px; top: 0; bottom: 0; border-left: 1px solid #000; display: flex; flex-direction: column;">
                <div style="font-size: 10px; color: #000; font-weight: bold; padding: 4px; border-bottom: 1px solid #000; width: ${dayWidth * 7}px; text-align: center; box-sizing: border-box;">
                    Week ${format(d, 'w')} (${format(d, 'MMM d')})
                </div>
                <div style="flex: 1; display: flex;">
                   ${Array.from({length: 7}).map((_, dayIndex) => `
                        <div style="flex: 1; border-right: ${dayIndex < 6 ? '1px solid #ccc' : 'none'}; display: flex; justify-content: center; align-items: flex-start; padding-top: 4px; font-size: 10px; color: #333;">
                             ${format(addDays(d, dayIndex), 'EE')[0]}
                        </div>
                   `).join('')}
                </div>
            </div>
        `
    }

    // Generate Rows
    const rowHeight = 40
    const headerHeight = 50
    const projectRowHeight = 45

    const subtasksHtml = project.expanded ? (project.subtasks?.map(sub => `
        <div style="height: ${rowHeight}px; position: relative; border-bottom: 1px solid #eee;">
            <div style="
                position: absolute; 
                left: ${getPos(sub.start)}px; 
                width: ${getLen(sub.start, sub.end)}px; 
                top: 12px; 
                height: 16px; 
                background: ${project.color}; 
                opacity: 0.6;
                border: 1px solid #000;
                display: flex;
                align-items: center;
                padding-left: 4px;
            ">
                <span style="font-size: 9px; color: #000; font-weight: bold; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${sub.name}</span>
            </div>
        </div>
    `).join('') || '') : ''

    const subtasksNamesHtml = project.expanded ? (project.subtasks?.map(sub => `
        <div style="height: ${rowHeight}px; padding: 0 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; font-size: 12px; color: #000;">
            - ${sub.name}
        </div>
    `).join('') || '') : ''

    // 3. Construct Full HTML - Document Style
    element.innerHTML = `
        <div style="padding: 40px; font-family: 'Arial', sans-serif; background: white; color: black;">
            <!-- Header Section -->
            <div style="margin-bottom: 30px;">
                <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: black;">Project: ${project.name}</h1>
                <div style="font-size: 14px; margin-bottom: 5px;">
                    <strong>Status:</strong> ${getColorMeaning(project.color)}
                </div>
                <div style="font-size: 14px;">
                    <strong>Duration:</strong> ${project.start} to ${project.end} (${differenceInDays(new Date(project.end), new Date(project.start)) + 1} days)
                </div>
            </div>

            <!-- Task List Section (if expanded) -->
            ${project.expanded && project.subtasks ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">Task Breakdown</h3>
                    <ul style="list-style-type: disc; padding-left: 20px; font-size: 13px;">
                        ${project.subtasks.map(s => `
                            <li style="margin-bottom: 4px;">
                                <strong>${s.name}</strong>: ${s.start} - ${s.end}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Gantt Chart Section -->
            <div>
                <h3 style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 20px;">Timeline View</h3>
                
                <div style="border: 2px solid #000; display: flex; background: white;">
                    
                    <!-- Task Names Column -->
                    <div style="width: 200px; border-right: 2px solid #000; flex-shrink: 0;">
                        <div style="height: ${headerHeight}px; background: #f0f0f0; border-bottom: 2px solid #000; padding: 0 10px; display: flex; align-items: center; font-weight: bold; font-size: 13px;">
                            Task
                        </div>
                        <div style="height: ${projectRowHeight}px; border-bottom: 1px solid #eee; padding: 0 10px; display: flex; align-items: center; font-weight: bold; font-size: 13px;">
                            ${project.name}
                        </div>
                        ${subtasksNamesHtml}
                    </div>

                    <!-- Timeline Column -->
                    <div style="flex: 1; position: relative; overflow: hidden;">
                        <!-- Grid Layer -->
                        <div style="position: absolute; inset: 0; background: #fff; z-index: 0;">
                            ${gridLinesHtml}
                        </div>

                        <!-- Bars Layer -->
                        <div style="position: relative; z-index: 5;">
                             <!-- Header Spacer -->
                            <div style="height: ${headerHeight}px; border-bottom: 2px solid #000;"></div>

                            <!-- Project Bar -->
                            <div style="height: ${projectRowHeight}px; position: relative; border-bottom: 1px solid #eee;">
                                <div style="
                                    position: absolute; 
                                    left: ${getPos(project.start)}px; 
                                    width: ${getLen(project.start, project.end)}px; 
                                    top: 10px; 
                                    height: 24px; 
                                    background: ${project.color}; 
                                    border: 1px solid #000;
                                    display: flex;
                                    align-items: center;
                                    padding-left: 8px;
                                ">
                                    <span style="font-size: 11px; color: white; font-weight: bold; text-shadow: 0 0 2px black;">${project.name}</span>
                                </div>
                            </div>

                            <!-- Subtask Bars -->
                            ${subtasksHtml}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size: 10px; color: #666; text-align: right;">
                Exported on ${new Date().toLocaleDateString()}
            </div>
        </div>
    `

    const opt = {
        margin: [0.5, 0.5],
        filename: `${project.name.replace(/\s+/g, '_')}_gantt.${formatType === 'jpeg' ? 'jpg' : formatType}`,
        image: { type: formatType === 'png' ? 'png' : 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    if (formatType === 'pdf') {
        html2pdf().set(opt).from(element).save().then(() => {
            document.body.removeChild(element)
        });
    } else {
        html2pdf()
            .set(opt)
            .from(element)
            .toImg()
            .output('dataurlstring')
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `${project.name.replace(/\s+/g, '_')}_gantt.${formatType === 'jpeg' ? 'jpg' : formatType}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                document.body.removeChild(element);
            })
            .catch(() => {
                document.body.removeChild(element);
            });
    }
  }

  const handleExport = (format) => {
    if (selectedProjects.size === 0) return
    selectedProjects.forEach(projectId => {
        const project = projects.find(p => p.id === projectId)
        if (project) exportProject(project, format)
    })
    setShowExportMenu(false)
  }

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
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-50">
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
             <div className="flex items-center gap-4">
                 <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={selectedProjects.size === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedProjects.size > 0 ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        <Download size={14} />
                        Export Selected ({selectedProjects.size})
                        <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button 
                                onClick={() => handleExport('pdf')}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px]">PDF</span>
                                Document
                            </button>
                            <button 
                                onClick={() => handleExport('png')}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">PNG</span>
                                Image
                            </button>
                            <button 
                                onClick={() => handleExport('jpeg')}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[10px]">JPG</span>
                                Image
                            </button>
                        </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mr-4">
                     <div className="w-3 h-3 rounded bg-indigo-500"></div> Project
                     <div className="w-3 h-3 rounded bg-emerald-500 ml-2"></div> Done
                     <div className="w-3 h-3 rounded bg-amber-500 ml-2"></div> Blocked
                 </div>
             </div>
          </div>
    
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar bg-white relative">
               {/* Header */}
               <div className="flex border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-40 shadow-sm">
                  <div className="w-80 shrink-0 p-4 pl-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-3 bg-white border-r border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={selectedProjects.size === projects.length && projects.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
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
                  {/* Focus Overlay - Restored with pointer-events-none for click-through */}
                  {focusedId && (
                    <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] pointer-events-none transition-all duration-300" />
                  )}

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
                             className={`w-80 shrink-0 py-4 pl-4 pr-6 flex items-center gap-3 bg-white border-r border-slate-100 group-hover:bg-slate-50/30 transition-colors`}
                           >
                               <input 
                                    type="checkbox" 
                                    checked={selectedProjects.has(project.id)}
                                    onChange={(e) => { e.stopPropagation(); toggleSelection(project.id); }}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                               <button onClick={(e) => { e.stopPropagation(); toggleProject(project.id); }} className={`w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all`}>
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
                           </div>
    
                           {/* Project Bar */}
                           <div className="relative h-14 flex-1">
                               <div 
                                       onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                                       className={`absolute h-8 top-3 rounded-full transition-all flex items-center justify-between px-3 overflow-visible`}
                                       style={{ 
                                           left: left(project.start), 
                                           width: width(project.start, project.end)
                                       }}
                                       onMouseEnter={() => setHoveredTask(project.id)}
                                       onMouseLeave={() => setHoveredTask(null)}
                                    >
                                    <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)` }} />
                                    <span className={`relative z-40 text-[11px] font-bold truncate text-white drop-shadow-sm`}>{project.name}</span>

                                   {/* Resize Handles */}
                                    <div className="relative z-20 absolute left-0 top-0 bottom-0 w-4 rounded-l-full" />
                                    <div className="relative z-20 absolute right-0 top-0 bottom-0 w-4 rounded-r-full" />
                               </div>
                           </div>
                        </div>
    
                        {/* Subtasks */}
                        {project.expanded && project.subtasks?.map((subtask, index) => (
                            <div key={subtask.id} className={`group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative ${focusedId && project.id === focusedId ? 'z-30' : 'z-10'}`}>
                                <div className="w-80 shrink-0 py-3 pl-16 pr-6 flex items-center gap-3 bg-white border-r border-slate-100">
                                    <div className="w-2 h-2 rounded-full border border-slate-300 bg-white relative z-10"></div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                                        <div className="font-medium text-slate-600 text-xs truncate hover:text-indigo-600 transition-colors cursor-pointer"><span className={`relative z-40`}>{subtask.name}</span></div>
                                </div>
                                </div>
                                <div className="relative h-12 flex-1">
                                    <div 
                                        className={`absolute h-6 top-3 rounded-full flex items-center justify-between px-2.5 overflow-visible transition-all hover:shadow-md hover:-translate-y-0.5`}
                                        style={{ 
                                            left: left(subtask.start), 
                                            width: width(subtask.start, subtask.end),
                                            opacity: dragging?.id === subtask.id ? 0.8 : 1
                                        }}
                                        onMouseEnter={() => setHoveredTask(subtask.id)}
                                        onMouseLeave={() => setHoveredTask(null)}
                                    >
                                        <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, ${lighten(project.color, 0.6)}, ${lighten(project.color, 0.8)})` }} />
                                        <span className={`relative z-40 text-[9px] font-bold text-slate-700 truncate`}>{subtask.name}</span>
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
      <Navigation require="Project Management" />

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
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['todo', 'in_progress', 'review', 'done'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setDraft({...draft, status: s})}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold capitalize border transition-all ${draft.status === s ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.hex}
                                            onClick={() => setDraft({...draft, color: c.hex})}
                                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${draft.color === c.hex ? 'border-indigo-500 scale-110 shadow-md' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-2 relative z-20">
                            <div className="flex gap-3">
                                {editingId && (
                                    <button 
                                        onClick={() => handleDeleteProject(editingId)}
                                        className="px-4 py-2.5 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-sm transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={saveProject}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
                                >
                                    {editingId ? 'Save Changes' : 'Create Project'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<ProjectApp />)
