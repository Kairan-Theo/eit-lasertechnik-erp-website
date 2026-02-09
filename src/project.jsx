import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
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

const calculateProgress = (project) => {
  const subtasks = project.subtasks || []
  if (subtasks.length === 0) return 0
  const completed = subtasks.filter(t => t.status === "done").length
  return Math.round((completed / subtasks.length) * 100)
}

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

// ======= EXPORT: Spreadsheet Style Gantt Chart (Consolidated) =======
const exportProjectsAsSinglePDF = (list, company = 'EIT') => {
    // 1. Determine Global Date Range from ALL projects
    let minDateRaw = null
    let maxDateRaw = null

    const processDates = (s, e) => {
        const start = new Date(s)
        const end = new Date(e)
        if (!minDateRaw || start < minDateRaw) minDateRaw = start
        if (!maxDateRaw || end > maxDateRaw) maxDateRaw = end
    }

    list.forEach(project => {
        processDates(project.start, project.end)
        if (project.subtasks) {
            project.subtasks.forEach(sub => processDates(sub.start, sub.end))
        }
    })

    // Default if empty
    if (!minDateRaw) minDateRaw = new Date()
    if (!maxDateRaw) maxDateRaw = addDays(new Date(), 14)

    // Snap to Week Start (Monday) and End (Sunday) with buffer
    const minDate = startOfWeek(addWeeks(minDateRaw, -1), { weekStartsOn: 1 }) // 1 week before
    const maxDate = endOfWeek(addWeeks(maxDateRaw, 2), { weekStartsOn: 1 })   // 2 weeks after

    const totalDays = differenceInDays(maxDate, minDate) + 1
    const days = Array.from({ length: totalDays }).map((_, i) => addDays(minDate, i))
    
    // Constants for A4 Landscape Optimization
    const PAGE_WIDTH_PX = 1123 // ~297mm at 96 DPI
    const NAME_COL_WIDTH = 380 // px
    const HEADER_HEIGHT = 50 // px
    const ROW_HEIGHT = 45 // px

    // Dynamic Column Width to fit A4
    const availableDateSpace = PAGE_WIDTH_PX - NAME_COL_WIDTH - 60 // 60px padding/margin safety
    let calcColWidth = Math.floor(availableDateSpace / totalDays)
    const COL_WIDTH = Math.max(24, Math.min(40, calcColWidth)) // Daily width
    
    const TOTAL_WIDTH = NAME_COL_WIDTH + (totalDays * COL_WIDTH)
    
    // Header width should match table width (but min 700px for text)
    const HEADER_WIDTH = Math.max(TOTAL_WIDTH, 700)
    // Page container needs to be wide enough
    const PAGE_CONTAINER_WIDTH = Math.max(PAGE_WIDTH_PX, TOTAL_WIDTH + 80)

    // Colors (Spreadsheet Style)
    const COLORS = {
        headerBlue: '#4472C4', 
        headerOrange: '#FFC000', 
        headerDateBg: '#FFFFFF', 
        groupBg: '#A5A5A5', 
        taskBar: '#ED7D31', 
        border: '#000000', // Black border
        grid: '#000000' // Black grid lines
    }

    // Invoice Header Data
    const headerImgSrc = window.location.origin + (company === 'Einstein' ? "/Einstein%20header.png" : "/EIT%20header.png")
    
    const companyDetails = {
        EIT: {
            thaiName: "บริษัท อีไอที เลเซอร์เทคนิค จำกัด",
            engName: "EIT LASERTECHNIK CO.,LTD",
            address: "118/20 Soi Ramkhamhaeng 184, Minburi, Minburi, Bangkok 10510 Thailand",
            tel: "02-xxx-xxxx",
            fax: "02-xxx-xxxx",
            taxId: "010555xxxxxxx"
        },
        Einstein: {
            thaiName: "บริษัท ไอน์สไตน์ อินดัสเตรียล เทคนิค คอร์ปอเรชั่น จำกัด",
            engName: "Einstein Industrial Technic Corporation Co., Ltd.",
            address: "1/120 Soi Ramkhamhaeng 184, Minburi, Minburi, Bangkok 10510 Thailand",
            tel: "02-052-9544",
            fax: "02-052-9544",
            taxId: "0105547001928"
        }
    }

    const details = companyDetails[company] || companyDetails.EIT

    const invoiceHeader = `
        <div style="margin-bottom: 15px; font-family: sans-serif;">
            <div style="display: flex; justify-content: flex-start; margin-bottom: 15px; height: 80px;">
                <img src="${headerImgSrc}" style="height: 100%; width: auto; object-fit: contain;" />
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; align-items: flex-start;">
                 <div style="border: 1px solid #000; padding: 8px; width: 60%; border-radius: 4px;">
                    <div style="font-weight: bold; font-size: 10px;">${details.thaiName}</div>
                    <div style="font-weight: bold; font-size: 10px;">${details.engName}</div>
                    <div style="margin-top: 4px;">${details.address}</div>
                    <div style="margin-top: 2px;">TEL : ${details.tel}    Fax : ${details.fax}</div>
                    <div style="display: flex; gap: 10px; margin-top: 2px;">
                        <span>Tax ID : ${details.taxId}</span>
                        <span>(Head Office)</span>
                    </div>
                 </div>
                 <div style="text-align: right; width: 35%;">
                    <div style="font-size: 14px; font-weight: bold; color: ${COLORS.headerBlue}; margin-bottom: 5px;">PROJECT PLAN</div>
                    <div>Date: ${format(new Date(), 'dd/MM/yyyy')}</div>
                 </div>
            </div>
        </div>
    `

    // 2. Generate Date Headers (Double Row: Month | Week)
    // Group days by month
    const months = []
    let currentMonth = null
    let count = 0
    days.forEach(d => {
        const mStr = format(d, 'MMMM yyyy')
        if (mStr !== currentMonth) {
            if (currentMonth) months.push({ name: currentMonth, count })
            currentMonth = mStr
            count = 1
        } else {
            count++
        }
    })
    if (currentMonth) months.push({ name: currentMonth, count })

    const monthHeaderCells = months.map(m => `
        <div style="
            width: ${m.count * COL_WIDTH}px; 
            min-width: ${m.count * COL_WIDTH}px;
            text-align: center; 
            border-right: 1px solid ${COLORS.grid}; 
            font-size: 13px;
            font-weight: bold;
            padding: 6px 0;
            background: ${COLORS.headerDateBg};
            color: #222;
        ">
            ${m.name}
        </div>
    `).join('')

    const dayHeaderCells = days.map(d => `
        <div style="
            width: ${COL_WIDTH}px; 
            min-width: ${COL_WIDTH}px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid ${COLORS.grid}; 
            font-size: 11px;
            background: white;
            color: #444;
            font-weight: 600;
        ">
            ${format(d, 'd')}
        </div>
    `).join('')

    // 3. Generate ALL Rows (Consolidated)
    const allRowsHtml = list.map(project => {
        const subtasks = project.subtasks || []
        
        // Subtask Rows
        const subtaskRows = subtasks.map(sub => {
            const start = new Date(sub.start)
            const end = new Date(sub.end)
            
            const offsetDays = differenceInDays(start, minDate)
            const durationDays = differenceInDays(end, start) + 1
            
            const left = offsetDays * COL_WIDTH
            const width = durationDays * COL_WIDTH
            
            return `
                <div class="sheet-row" style="display: flex; height: ${ROW_HEIGHT}px; border-bottom: 1px solid ${COLORS.grid}; page-break-inside: avoid;">
                    <div style="
                        width: ${NAME_COL_WIDTH}px; 
                        min-width: ${NAME_COL_WIDTH}px;
                        padding: 0 15px; 
                        display: flex; 
                        align-items: center; 
                        font-size: 11px;
                        border-right: 1px solid ${COLORS.grid};
                        background: #ffffff;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    ">
                        ${sub.name}
                    </div>
                    <div style="flex: 1; position: relative; display: flex;">
                        <!-- Task Bar -->
                        <div style="
                            position: absolute;
                            left: ${left}px;
                            top: 0;
                            width: ${width}px;
                            height: 100%;
                            background: ${COLORS.taskBar};
                        "></div>

                        <!-- Grid Lines -->
                        ${days.map(() => `
                            <div style="
                                width: ${COL_WIDTH}px; 
                                min-width: ${COL_WIDTH}px;
                                height: 100%; 
                                border-right: 1px solid ${COLORS.grid};
                                position: relative;
                                z-index: 1;
                            "></div>
                        `).join('')}
                    </div>
                </div>
            `
        }).join('')

        // Project Header Row
        const projectRow = `
            <div class="sheet-row" style="display: flex; height: ${ROW_HEIGHT}px; border-bottom: 1px solid ${COLORS.grid}; background: white; color: black; page-break-inside: avoid;">
                <div style="
                    width: ${NAME_COL_WIDTH}px; 
                    min-width: ${NAME_COL_WIDTH}px;
                    padding: 0 15px; 
                    display: flex; 
                    align-items: center; 
                    font-weight: bold; 
                    font-size: 12px;
                    border-right: 1px solid ${COLORS.grid};
                ">
                    ${project.name}
                </div>
                 <div style="flex: 1; position: relative; display: flex;">
                    <div style="
                        position: absolute;
                        left: ${differenceInDays(new Date(project.start), minDate) * COL_WIDTH}px;
                        top: 0;
                        width: ${(differenceInDays(new Date(project.end), new Date(project.start)) + 1) * COL_WIDTH}px;
                        height: 100%;
                        background: #c0504d; 
                    "></div>

                    ${days.map(() => `
                        <div style="
                            width: ${COL_WIDTH}px; 
                            min-width: ${COL_WIDTH}px;
                            height: 100%; 
                            border-right: 1px solid ${COLORS.grid};
                            position: relative;
                            z-index: 1;
                        "></div>
                    `).join('')}
                </div>
            </div>
        `
        return projectRow + subtaskRows
    }).join('')

    const content = `
      <section class="page spreadsheet-page" style="width: ${PAGE_CONTAINER_WIDTH}px; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
        
        <!-- Invoice Header -->
        <div style="width: ${HEADER_WIDTH}px; max-width: 100%; margin-bottom: 20px;">
           ${invoiceHeader}
        </div>
        
        <!-- Table Container -->
        <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
            <div style="
                width: ${TOTAL_WIDTH}px; 
                margin: 0 auto;
                border: 1px solid ${COLORS.border}; 
                border-radius: 4px; 
                background: white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            ">
            <!-- Main Title Header -->
            <div style="
                background: white; 
                color: black; 
                text-align: center; 
                font-weight: bold; 
                padding: 10px; 
                font-size: 14px;
                letter-spacing: 1px;
                text-transform: uppercase;
                border-bottom: 1px solid ${COLORS.grid};
            ">
                Project Schedule
            </div>

            <!-- Date Headers Container -->
            <div style="display: flex; border-bottom: 1px solid ${COLORS.grid};">
                <!-- Empty Corner for Task Names -->
                <div style="
                    width: ${NAME_COL_WIDTH}px; 
                    min-width: ${NAME_COL_WIDTH}px;
                    background: white; 
                    border-right: 1px solid ${COLORS.grid};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: black;
                    font-size: 12px;
                ">
                    TASK NAME
                </div>
                
                <!-- Date Columns -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <!-- Month Row -->
                    <div style="display: flex; border-bottom: 1px solid ${COLORS.grid}; background: ${COLORS.headerDateBg};">
                        ${monthHeaderCells}
                    </div>
                    <!-- Day Row -->
                    <div style="display: flex; background: white;">
                        ${dayHeaderCells}
                    </div>
                </div>
            </div>

            <!-- Rows Container -->
            <div style="background: white;">
                ${allRowsHtml}
            </div>
        </div>
      </section>
    `

  const element = document.createElement("div")
  element.className = "print-container"
  element.innerHTML = `
    <style id="gantt-print-styles">
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      
      .print-container {
        font-family: 'Inter', sans-serif;
        background: white;
        color: black;
        box-sizing: border-box;
      }

      .print-container * {
        box-sizing: border-box;
      }
      
      .page {
        padding: 10mm;
        box-sizing: border-box;
        page-break-after: always;
        background: white;
      }
      .page:last-child { page-break-after: auto; }
      
      /* Print-specific adjustments */
      @media print {
        .page { margin: 0; border: initial; width: initial; min-height: initial; box-shadow: initial; background: initial; page-break-after: always; }
      }
    </style>
    ${content}
  `
  document.body.appendChild(element)

  // Generate PDF (Dynamic Width based on Content)
  // Calculate width in mm (1 px = 0.264583 mm)
  const contentWidthMM = (TOTAL_WIDTH + 80) * 0.2645833333
  const minWidthMM = 297 // A4 Landscape width
  const finalWidthMM = Math.max(minWidthMM, contentWidthMM)

  const opt = {
    margin: 0, // Manual padding in CSS
    filename: `Project_Plan_${format(new Date(), "yyyyMMdd")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { 
      scale: 2.5, // Higher scale for crisp text
      useCORS: true,
      scrollY: 0,
      windowWidth: TOTAL_WIDTH + 100, // Ensure ample space for capture
      ignoreElements: (element) => {
        if (element.tagName === 'STYLE' || element.tagName === 'LINK') {
            if (element.id !== 'gantt-print-styles') return true;
        }
        return false;
      },
      onclone: (clonedDoc) => {
        const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(style => {
          if (style.id !== 'gantt-print-styles') style.remove();
        });
        clonedDoc.body.className = '';
        clonedDoc.documentElement.className = '';
        clonedDoc.documentElement.style.cssText = 'background: white; color: black; margin: 0; padding: 0;';
        clonedDoc.body.style.cssText = 'background: white; color: black; margin: 0; padding: 0;';
      }
    },
    jsPDF: { unit: "mm", format: [finalWidthMM, 210], orientation: "landscape" }, 
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      document.body.removeChild(element)
      console.log("PDF generated successfully")
    })
    .catch((err) => {
      console.error("PDF Generation Error:", err)
      alert("Failed to generate PDF.")
      if (document.body.contains(element)) {
        document.body.removeChild(element)
      }
    })
}

const GanttChart = ({ projects, setProjects, onAddSubtask, onEdit, startDate, setStartDate, focusedId, setFocusedId, selectedProjects, toggleSelection, toggleAll }) => {
  const [dragging, setDragging] = React.useState(null)
  const [hoveredTask, setHoveredTask] = React.useState(null)


  // ======= EXPORT: Visual Gantt Chart (Reference Style) =======
  // (Moved to module scope and ProjectApp)


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
    // Calculate total range needed to show all projects
    const allItems = React.useMemo(() => {
        let items = [...projects]
        projects.forEach(p => {
            if (p.subtasks) items = [...items, ...p.subtasks]
        })
        return items
    }, [projects])

    const maxEndDate = React.useMemo(() => {
        if (allItems.length === 0) return addDays(new Date(), 28)
        const dates = allItems.map(p => new Date(p.end || p.endDate))
        return new Date(Math.max(...dates))
    }, [allItems])

    const minStartDate = React.useMemo(() => {
        if (allItems.length === 0) return startOfWeek(new Date(), { weekStartsOn: 1 })
        const dates = allItems.map(p => new Date(p.start || p.startDate))
        return new Date(Math.min(...dates))
    }, [allItems])

    const daysNeeded = differenceInDays(maxEndDate, startDate) + 14 // Add 2 weeks buffer
    const daysToShow = Math.max(28, daysNeeded) // Ensure at least 4 weeks
    
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
                     <button onClick={() => setStartDate(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))} className="px-3 py-1 text-xs font-bold text-slate-700 uppercase tracking-wide border-r border-slate-200 mr-1">Today</button>
                     <button onClick={() => setStartDate(d => addWeeks(d, 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 ml-1"><ChevronRight size={16} /></button>
                 </div>
                 <span className="text-lg font-bold text-slate-800 tracking-tight">
                     {format(startDate, "MMMM yyyy")}
                 </span>
             </div>
             <div className="flex items-center gap-4">
                 {/* Export button moved to ProjectApp header */}
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
                               
                               {/* Edit & Add Subtask Buttons */}
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                                       className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                       title="Edit Project"
                                   >
                                       <Edit size={14} />
                                   </button>
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); onAddSubtask(project.id); }}
                                       className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                       title="Add Subtask"
                                   >
                                       <Plus size={14} />
                                   </button>
                               </div>
                           </div>
    
                           {/* Project Bar */}
                           <div className="relative h-14 flex-1">
                               <div 
                                       onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                                       className={`absolute h-8 top-3 rounded-full ${dragging?.id === project.id ? 'transition-none' : 'transition-all'} flex items-center justify-between px-3 overflow-visible`}
                                       style={{ 
                                           left: left(project.start), 
                                           width: width(project.start, project.end)
                                       }}
                                       onMouseEnter={() => setHoveredTask(project.id)}
                                       onMouseLeave={() => setHoveredTask(null)}
                                    >
                                    <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)` }} />
                                    <span className={`relative z-40 text-[11px] font-bold truncate text-white drop-shadow-sm`}>{project.name}</span>
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
                                        
                                        {/* Edit Subtask Button */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEdit(subtask); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                            title="Edit Subtask"
                                        >
                                            <Edit size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative h-12 flex-1">
                                    <div 
                                        className={`absolute h-6 top-3 rounded-full flex items-center justify-between px-2.5 overflow-visible ${dragging?.id === subtask.id ? 'transition-none' : 'transition-all'} hover:shadow-md hover:-translate-y-0.5`}
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
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [draftParentId, setDraftParentId] = React.useState(null)
  const [editingId, setEditingId] = React.useState(null)
  const [draft, setDraft] = React.useState({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
  const [notification, setNotification] = React.useState({ show: false, message: "" })
  const [validationError, setValidationError] = React.useState("")
  const [focusedId, setFocusedId] = React.useState(null)
  const [selectedProjects, setSelectedProjects] = React.useState(new Set())

  const toggleSelection = (id) => {
    const newSet = new Set(selectedProjects)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedProjects(newSet)
  }

  const toggleAll = () => {
    if (selectedProjects.size === projects.length && projects.length > 0) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id)))
    }
  }

  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)

  const handleExport = (format) => {
    // Check if anything is selected to export
    let hasSelection = focusedId || selectedProjects.size > 0
    // If no selection, we assume "all" - but logic below says "list = projects" if no selection. 
    // Wait, original logic was:
    // if focusedId -> export one
    // else if selectedProjects > 0 -> export selected
    // else -> export ALL
    // So there is always something to export unless projects.length is 0.
    if (projects.length === 0) return
    setIsExportModalOpen(true)
  }

  const confirmExport = (company) => {
    let list = []
    
    // 1. Priority: Selected projects (checkboxes)
    if (selectedProjects.size > 0) {
      list = projects.filter((p) => selectedProjects.has(p.id))
    } 
    // 2. Priority: Focused project (zoomed in)
    else if (focusedId) {
      const one = projects.find((p) => p.id === focusedId)
      if (one) list = [one]
    } 
    // 3. Priority: All projects
    else {
      list = projects
    }
    
    if (list.length > 0) {
      exportProjectsAsSinglePDF(list, company)
    }
    setIsExportModalOpen(false)
  }

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
                // Update subtask
                const updatedSubtasks = p.subtasks.map(s => s.id === editingId ? { ...s, ...draft } : s)
                
                // Auto-expand Project to fit subtasks
                const ps = new Date(p.start)
                const pe = new Date(p.end)
                const ds = new Date(draft.start)
                const de = new Date(draft.end)
                
                let newStart = ps
                let newEnd = pe
                if (ds < ps) newStart = ds
                if (de > pe) newEnd = de
                
                return {
                    ...p,
                    start: format(newStart, "yyyy-MM-dd"),
                    end: format(newEnd, "yyyy-MM-dd"),
                    subtasks: updatedSubtasks
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
                
                // Auto-expand Project
                let newStart = ps
                let newEnd = pe
                if (ds < ps) newStart = ds
                if (de > pe) newEnd = de

                return {
                    ...p,
                    start: format(newStart, "yyyy-MM-dd"),
                    end: format(newEnd, "yyyy-MM-dd"),
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
          <div className="text-sm text-slate-500 flex items-center">
            <span className="mr-3">Active: {activeProjectsCount}</span>
            <span className="mr-3">Done: {doneProjectsCount}</span>
            <span>Total: {totalProjectsCount}</span>
            
            <div className="relative ml-4">
                <button 
                    onClick={() => handleExport('pdf')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${selectedProjects.size > 0 || focusedId ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Download size={16} />
                    Export PDF
                </button>

                {isExportModalOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-[105] cursor-default" 
                            onClick={() => setIsExportModalOpen(false)}
                        />
                        <div className="absolute top-full right-0 mt-2 z-[110] bg-white rounded-xl shadow-2xl w-[260px] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                           <div className="py-1">
                               <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                                   Select Header
                               </div>
                               
                               <button 
                                   onClick={() => confirmExport('EIT')}
                                   className="w-full flex items-center px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                               >
                                   <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3 group-hover:bg-blue-200 transition-colors">
                                       EIT
                                   </div>
                                   <div className="text-left">
                                       <div className="text-sm font-semibold text-slate-700">EIT Lasertechnik</div>
                                       <div className="text-[10px] text-slate-400">Default</div>
                                   </div>
                               </button>

                               <button 
                                   onClick={() => confirmExport('Einstein')}
                                   className="w-full flex items-center px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                               >
                                   <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold mr-3 group-hover:bg-purple-200 transition-colors">
                                       EIN
                                   </div>
                                   <div className="text-left">
                                       <div className="text-sm font-semibold text-slate-700">Einstein Industrial</div>
                                       <div className="text-[10px] text-slate-400">Alternative</div>
                                   </div>
                               </button>
                           </div>
                        </div>
                    </>
                )}
            </div>

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
          <GanttChart 
            projects={projects} 
            setProjects={setProjects} 
            onAddSubtask={handleAddSubtask} 
            onEdit={handleEditProject}
            startDate={startDate}
            setStartDate={setStartDate}
            focusedId={focusedId}
            setFocusedId={setFocusedId}
            selectedProjects={selectedProjects}
            toggleSelection={toggleSelection}
            toggleAll={toggleAll}
          />
      </div>

      {/* Export Menu Modal (Compact) Removed */}

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

const container = document.getElementById("root")

if (!window.__reactRoot) {
  window.__reactRoot = ReactDOM.createRoot(container)
}

window.__reactRoot.render(<ProjectApp />)
