import React from "react"
import ReactDOM from "react-dom/client"
import {
  format,
  startOfWeek,
  addDays,
  isWeekend,
  differenceInDays,
  addWeeks,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns"
import { ChevronLeft, ChevronRight, ChevronDown, Download, X, Trash2, AlertTriangle, FileSpreadsheet } from "lucide-react"
import html2pdf from "html2pdf.js"
import { utils, writeFile } from "xlsx"
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
    name: "PDF FILE DESIGN PROJECT",
    start: "2024-07-01",
    end: "2024-09-05",
    status: "in_progress",
    color: "#6366f1",
    expanded: true,
    subtasks: [
      { id: 101, name: "Requirements Gathering", start: "2024-07-01", end: "2024-07-10", status: "done", color: "#0277BD" }, // Blue
      { id: 102, name: "Content Creation", start: "2024-07-11", end: "2024-07-25", status: "in_progress", color: "#009688" }, // Teal
      { id: 103, name: "Layout & Visual Design", start: "2024-07-26", end: "2024-08-10", status: "todo", color: "#4CAF50" }, // Green
      { id: 104, name: "Interactive Elements", start: "2024-08-11", end: "2024-08-25", status: "todo", color: "#FDD835" }, // Yellow
      { id: 105, name: "Review & Finalize", start: "2024-08-26", end: "2024-08-31", status: "todo", color: "#00838F" }, // Teal/Cyan
      { id: 106, name: "Final Delivery", start: "2024-09-01", end: "2024-09-05", status: "todo", color: "#CDDC39" }, // Lime
    ],
  }
]

const GanttChart = ({ projects, setProjects }) => {
  // Initialize start date to the first project's start date or today
  const [startDate, setStartDate] = React.useState(() => {
    if (projects.length > 0) {
      return addWeeks(startOfWeek(new Date(projects[0].start), { weekStartsOn: 1 }), -1)
    }
    return addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1)
  })
  const [dragging, setDragging] = React.useState(null)
  const [hoveredTask, setHoveredTask] = React.useState(null)
  const [focusedId, setFocusedId] = React.useState(null)
  const [selectedProjects, setSelectedProjects] = React.useState(new Set())
  const [showExportMenu, setShowExportMenu] = React.useState(false)

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedProjects(newSelected)
  }

  const toggleAll = () => {
    if (selectedProjects.size === projects.length) setSelectedProjects(new Set())
    else setSelectedProjects(new Set(projects.map((p) => p.id)))
  }

  const toggleProject = (id) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, expanded: !p.expanded } : p)))
  }

  const lighten = (hex, ratio = 0.5) => {
    const h = hex.replace("#", "")
    const n = parseInt(h, 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    const lr = Math.round(r + (255 - r) * ratio)
    const lg = Math.round(g + (255 - g) * ratio)
    const lb = Math.round(b + (255 - b) * ratio)
    const toHex = (x) => x.toString(16).padStart(2, "0")
    return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`
  }

  // ======= ✅ EXPORT: Visual Gantt Chart (Reference Style) =======
  const exportProjectsAsSinglePDF = (list) => {
    const buildProjectHTML = (project) => {
      // 1. Determine Date Range
      let minDate = new Date(project.start)
      let maxDate = new Date(project.end)
      const subtasks = project.subtasks || []
      
      subtasks.forEach(sub => {
        const s = new Date(sub.start)
        const e = new Date(sub.end)
        if (s < minDate) minDate = s
        if (e > maxDate) maxDate = e
      })

      const totalDays = differenceInDays(maxDate, minDate) + 5 // +buffer
      const durationActual = differenceInDays(maxDate, minDate) + 1
      const taskCount = subtasks.length
      const completedCount = subtasks.filter(t => t.status === "done").length
      const progress = calculateProgress(project)
      const ROW_HEIGHT = 50 // px
      const BAR_HEIGHT = 36 // px
      const BAR_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2
      const uniqueColors = Array.from(new Set(subtasks.map(s => s.color || project.color || DEFAULT_COLOR)))
      const legendHtml = uniqueColors.map(hex => `
        <div class="chip legend">
          <span class="dot" style="background:${hex}"></span>
          ${getColorMeaning(hex)}
        </div>
      `).join('')

      // 2. Pre-calculate Coordinates for Connectors
      const taskCoords = subtasks.map((sub, i) => {
        const start = new Date(sub.start)
        const end = new Date(sub.end)
        const offsetDays = differenceInDays(start, minDate)
        const durationDays = differenceInDays(end, start) + 1
        
        const leftPct = (offsetDays / totalDays) * 100
        const widthPct = (durationDays / totalDays) * 100
        const rightPct = leftPct + widthPct
        
        const y = i * ROW_HEIGHT + BAR_HEIGHT / 2 + BAR_OFFSET
        
        return { leftPct, rightPct, y, color: sub.color || project.color || "#3D56A6" }
      })

      // 3. Generate Connectors (HTML divs)
      const svgLines = taskCoords.map((curr, i) => {
        if (i === taskCoords.length - 1) return ''
        const next = taskCoords[i + 1]
        
        const isNextAfter = next.leftPct > curr.rightPct
        const midX = isNextAfter 
          ? curr.rightPct + (next.leftPct - curr.rightPct)/2 
          : curr.rightPct + 2 
          
        const lineColor = '#ffffff'; // White connector
        const lineWidth = '2px';
          
        return `
          <!-- Connector ${i} to ${i+1} -->
          <div class="connector-path">
              <!-- Horizontal from current -->
              <div style="position: absolute; left: ${curr.rightPct}%; top: ${curr.y}px; width: ${Math.abs(midX - curr.rightPct)}%; height: ${lineWidth}; background: ${lineColor};"></div>
              
              <!-- Vertical down -->
              <div style="position: absolute; left: ${midX}%; top: ${curr.y}px; height: ${next.y - curr.y}px; width: ${lineWidth}; background: ${lineColor};"></div>
              
              <!-- Horizontal to next -->
              <div style="position: absolute; left: ${Math.min(midX, next.leftPct)}%; top: ${next.y}px; width: ${Math.abs(next.leftPct - midX)}%; height: ${lineWidth}; background: ${lineColor};"></div>
              
              <!-- Arrowhead at destination -->
              <div style="
                position: absolute; 
                left: ${next.leftPct}%; 
                top: ${next.y - 4}px; 
                width: 0; 
                height: 0; 
                border-top: 5px solid transparent; 
                border-bottom: 5px solid transparent; 
                border-left: 8px solid ${lineColor};
              "></div>
          </div>
        `
      }).join('')

      // 4. Generate Axis Ticks (Fixed 5-day interval for cleaner look)
      const tickInterval = 5
      const ticks = []
      for (let i = 0; i <= totalDays; i += tickInterval) {
        const date = addDays(minDate, i)
        if (date > maxDate) break
        const leftPct = (i / totalDays) * 100
        ticks.push(`
          <div class="timeline-tick" style="left: ${leftPct}%">
            <div class="tick-label">${format(date, 'MMMM d')}</div>
            <div class="tick-mark"></div>
            <div class="tick-grid-line"></div>
          </div>
        `)
      }

      // 5. Generate Bars
      const barsHtml = subtasks.map((sub, index) => {
        const coords = taskCoords[index]
        const color = sub.color || '#3D56A6'
        const isFinal = index === subtasks.length - 1
        
        return `
          <div class="gantt-row" style="height: ${ROW_HEIGHT}px;">
            <div class="gantt-bar-container" style="
              left: ${coords.leftPct}%; 
              width: ${coords.rightPct - coords.leftPct}%;
              top: ${BAR_OFFSET}px;
              height: ${BAR_HEIGHT}px;
            ">
              <div class="gantt-bar-visual" style="
                background: ${color}; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.1);
                overflow: visible;
              ">
                <div class="bar-gloss" style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 50%;
                  background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
                  pointer-events: none;
                  border-top-left-radius: 20px;
                  border-top-right-radius: 20px;
                "></div>
                <span class="gantt-bar-text" style="font-weight: 800; text-transform: none;">${sub.name}</span>
                ${isFinal ? `
                  <div class="sparkle" style="
                    position: absolute;
                    right: -10px;
                    bottom: -10px;
                    width: 24px;
                    height: 24px;
                    background: radial-gradient(circle, #ffffff 10%, transparent 60%);
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                    opacity: 0.8;
                    z-index: 100;
                  "></div>
                ` : ''}
              </div>
            </div>
          </div>
        `
      }).join('')

      const stripesHtml = subtasks.map((_, i) => `
        <div class="row-stripe" style="
          position: absolute;
          left: 0;
          right: 0;
          top: ${i * ROW_HEIGHT}px;
          height: ${ROW_HEIGHT}px;
          background: ${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'};
        "></div>
      `).join('')

      return `
        <section class="page gantt-page">
          <div class="gantt-header-modern">
            <div class="header-icon">
              <span>PDF</span>
            </div>
            <div class="header-text">
              <h1>PDF FILE DESIGN PROJECT - Q${Math.ceil((minDate.getMonth() + 1) / 3)} ${minDate.getFullYear()}</h1>
            </div>
          </div>

          <div class="chart-wrapper">
            <div class="timeline-axis">
              ${ticks.join('')}
            </div>
            
            <div class="chart-body">
              <div class="connectors-layer">
                ${svgLines}
              </div>
              
              <div class="bars-layer">
                ${barsHtml}
              </div>
            </div>
          </div>
        </section>
      `
    }

    const element = document.createElement("div")
    element.className = "print-container"
    element.innerHTML = `
      <style id="gantt-print-styles">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        .print-container {
          font-family: 'Inter', sans-serif;
          width: 297mm;
          background: linear-gradient(135deg, #2b2b2b 0%, #4a4a4a 100%); /* Dark Gray Gradient */
          color: #ffffff;
        }
        
        .page {
          padding: 10mm 15mm;
          min-height: 210mm;
          box-sizing: border-box;
          position: relative;
          page-break-after: always;
        }
        .page:last-child { page-break-after: auto; }

        /* Modern Header */
        .gantt-header-modern {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          border-bottom: 2px solid #555555;
          padding-bottom: 20px;
        }
        
        .header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ef4444;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 14px;
          min-width: 40px;
        }
        
        .header-text h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -1px;
        }

        /* Chart Structure */
        .chart-wrapper {
          position: relative;
          width: 100%;
        }
        /* header accent removed to match reference */

        .timeline-axis {
          position: relative;
          height: 40px;
          border-bottom: 1px solid #555555;
          margin-bottom: 10px;
        }

        .timeline-tick {
          position: absolute;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .tick-label {
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 8px;
        }
        
        .tick-mark {
          width: 1px;
          height: 8px;
          background: #ffffff;
        }
        
        .tick-grid-line { display: none; }

        .chart-body {
          position: relative;
          min-height: 500px;
        }
        /* stripes overlay removed to match reference */

        .gantt-row {
          position: relative;
          width: 100%;
          z-index: 20;
        }

        .gantt-bar-container {
          position: absolute;
          z-index: 30;
        }

        .gantt-bar-visual {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 0 12px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .gantt-bar-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Connectors */
        .connectors-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 15;
          pointer-events: none;
        }
        /* footer removed to match reference */
      </style>
      ${list.map(buildProjectHTML).join("")}
    `
    document.body.appendChild(element)

    // Generate PDF (Landscape)
    const opt = {
      margin: 0,
      filename: `Project_Plan_Gantt_${format(new Date(), "yyyyMMdd")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        onclone: (clonedDoc) => {
          // 1. Remove all stylesheets to prevent Tailwind oklch errors,
          // BUT keep our specific print styles
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(style => {
            if (style.id !== 'gantt-print-styles') {
              style.remove();
            }
          });
          
          // 2. Scrub global classes that might trigger Tailwind
          clonedDoc.body.className = '';
          clonedDoc.documentElement.className = '';
          
          // 3. Force reset styles on body and html to ensure no oklch inheritance (Dark Background)
          clonedDoc.documentElement.style.cssText = 'background: linear-gradient(135deg, #2b2b2b 0%, #4a4a4a 100%); color: #ffffff; margin: 0; padding: 0;';
          clonedDoc.body.style.cssText = 'background: linear-gradient(135deg, #2b2b2b 0%, #4a4a4a 100%); color: #ffffff; margin: 0; padding: 0;';
        }
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
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



  const handleExportPDF = () => {
    // Focused: export only that project
    if (focusedId) {
      const one = projects.find((p) => p.id === focusedId)
      if (!one) return
      exportProjectsAsSinglePDF([one])
      setShowExportMenu(false)
      return
    }

    // Export all projects when none selected
    let list = []
    if (selectedProjects.size > 0) {
      list = projects.filter((p) => selectedProjects.has(p.id))
    } else {
      list = projects
    }
    if (list.length === 0) return
    exportProjectsAsSinglePDF(list)
    setShowExportMenu(false)
  }

  const handleExportExcel = () => {
    // Determine which projects to export
    let projectsToExport = []
    if (focusedId) {
      const p = projects.find((proj) => proj.id === focusedId)
      if (p) projectsToExport = [p]
    } else if (selectedProjects.size > 0) {
      projectsToExport = projects.filter((p) => selectedProjects.has(p.id))
    }

    if (projectsToExport.length === 0) return

    try {
      console.log("Starting Excel export...")
      const wb = utils.book_new()

      projectsToExport.forEach((project) => {
        // Sanitize sheet name (max 31 chars)
        const sheetName = (project.name || "Project").substring(0, 30).replace(/[:\\\/?*\[\]]/g, "")
        
        const rows = []
        
        // Project Header
        rows.push(["PROJECT DETAILS"])
        rows.push(["Name", project.name])
        rows.push(["Status", getColorMeaning(project.color)])
        rows.push(["Start Date", format(new Date(project.start), "yyyy-MM-dd")])
        rows.push(["End Date", format(new Date(project.end), "yyyy-MM-dd")])
        rows.push(["Progress", `${calculateProgress(project)}%`])
        rows.push([]) // spacer
        
        // Tasks Header
        rows.push(["TASKS LIST"])
        rows.push(["#", "Task Name", "Start Date", "End Date", "Duration (Days)", "Status"])

        // Tasks Data
        if (project.subtasks && project.subtasks.length > 0) {
          project.subtasks.forEach((sub, index) => {
            const duration = differenceInDays(new Date(sub.end), new Date(sub.start)) + 1
            rows.push([
              index + 1,
              sub.name,
              format(new Date(sub.start), "yyyy-MM-dd"),
              format(new Date(sub.end), "yyyy-MM-dd"),
              duration,
              getColorMeaning(sub.color)
            ])
          })
        } else {
          rows.push(["No tasks defined"])
        }

        const ws = utils.aoa_to_sheet(rows)
        
        // Set column widths
        const wscols = [
          { wch: 5 },  // #
          { wch: 40 }, // Task Name
          { wch: 15 }, // Start
          { wch: 15 }, // End
          { wch: 15 }, // Duration
          { wch: 20 }  // Status
        ]
        ws["!cols"] = wscols

        utils.book_append_sheet(wb, ws, sheetName)
      })

      // Save file
      const filename = focusedId 
        ? `Project_${projectsToExport[0].name.replace(/\s+/g, '_')}_Report.xlsx`
        : `Projects_Export_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`
        
      writeFile(wb, filename)
      setShowExportMenu(false)
    } catch (error) {
      console.error("Export Excel Error:", error)
      alert("Failed to export Excel file. Please try again.")
    }
  }
  // ======= END EXPORT =======

  // Calendar calculations
  const daysToShow = 28
  const days = Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i))
  const dayWidth = 50

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

  // (drag logic kept minimal; your UI works without it)
  const handleMouseMove = React.useCallback(
    (e) => {
      if (!dragging) return
      // You can re-add your full dragging logic here if you want
    },
    [dragging]
  )
  const handleMouseUp = React.useCallback(() => setDragging(null), [])

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#2b2b2b] to-[#4a4a4a] text-white">
      {/* Date Controls */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-600 bg-[#333333] shadow-sm z-[60]">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-700 rounded-lg p-1 border border-gray-600">
            <button
              onClick={() => setStartDate((d) => addWeeks(d, -1))}
              className="p-1.5 hover:bg-gray-600 hover:shadow-sm rounded-md transition-all text-gray-300"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setStartDate(addWeeks(startOfWeek(new Date(projects[0]?.start || new Date()), { weekStartsOn: 1 }), -1))}
              className="px-4 py-1 text-xs font-bold text-gray-200 uppercase tracking-wide"
            >
              Reset
            </button>
            <button
              onClick={() => setStartDate((d) => addWeeks(d, 1))}
              className="p-1.5 hover:bg-gray-600 hover:shadow-sm rounded-md transition-all text-gray-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">{format(startDate, "MMMM yyyy")}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={selectedProjects.size === 0 && !focusedId}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                selectedProjects.size > 0 || focusedId
                  ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Download size={14} />
              Export {focusedId ? "Focused" : `Selected (${selectedProjects.size})`}
              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-[70] animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">PDF</span>
                  Report (PDF)
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-bold">XLS</span>
                  Excel Sheet
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
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#2b2b2b] relative">
          {/* Header */}
          <div className="flex border-b border-gray-700 sticky top-0 bg-[#333333]/95 backdrop-blur-sm z-30 shadow-sm">
            <div className="w-80 shrink-0 p-4 pl-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-3 bg-[#333333] border-r border-gray-700">
              <input
                type="checkbox"
                checked={selectedProjects.size === projects.length && projects.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              Project / Task
            </div>
            <div className="flex">
              {days.map((day) => {
                const isWknd = isWeekend(day)
                return (
                  <div
                    key={day.toString()}
                    style={{ width: dayWidth }}
                    className={`shrink-0 border-r border-gray-700/50 p-2 text-center flex flex-col justify-center items-center ${
                      isWknd ? "bg-gray-800/50" : ""
                    }`}
                  >
                    <div className="text-[10px] font-bold mb-1 uppercase tracking-wider text-gray-400">{format(day, "EEE")}</div>
                    <div className="text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all text-gray-300 hover:bg-gray-700">
                      {format(day, "d")}
                    </div>
                  </div>
                )
              })}
            </div>
            {focusedId && <div className="absolute top-0 bottom-0 right-0 left-80 bg-black/50 z-50" />}
          </div>

          {/* Projects */}
          <div className="relative pb-20">
            {focusedId && (
              <div
                className="absolute top-0 bottom-0 right-0 left-80 z-[15]"
                style={{ backgroundColor: "white" }}
                onClick={() => setFocusedId(null)}
              />
            )}

            {/* Background Grid */}
            <div className="absolute inset-0 flex ml-80 pointer-events-none z-0">
              {days.map((day) => (
                <div
                  key={`grid-${day}`}
                  style={{ width: dayWidth }}
                  className={`shrink-0 border-r border-dashed border-gray-700 h-full relative ${isWeekend(day) ? "bg-gray-800/30" : ""}`}
                />
              ))}
            </div>

            {projects.map((project) => (
              <React.Fragment key={project.id}>
                {/* Project Row */}
                <div
                  className={`group flex items-center hover:bg-gray-700/30 transition-colors border-b border-gray-700 relative ${
                    focusedId && project.id === focusedId ? "z-20" : "z-10"
                  }`}
                >
                  <div
                    onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                    className="w-80 shrink-0 py-4 pl-4 pr-6 flex items-center gap-3 bg-[#333333] border-r border-gray-700 group-hover:bg-gray-700/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(project.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelection(project.id)
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProject(project.id)
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-400 hover:bg-gray-700 transition-all"
                    >
                      {project.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-white text-base truncate flex items-center gap-2">
                        <span className="relative z-50 pointer-events-auto cursor-pointer">{project.name}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1.5">
                        <span>{project.subtasks?.length || 0} tasks</span>
                        <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
                        <span>{getColorMeaning(project.color)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Bar */}
                  <div className="relative h-14 flex-1">
                    <div
                      onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                      className="absolute h-8 top-3 rounded-full transition-all flex items-center justify-between px-3 overflow-visible"
                      style={{
                        left: left(project.start),
                        width: width(project.start, project.end),
                      }}
                      onMouseEnter={() => setHoveredTask(project.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      <div
                        className="absolute inset-0 rounded-full shadow-sm"
                        style={{
                          background: project.color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                      </div>
                      <span className="relative z-40 text-xs font-bold text-white truncate drop-shadow-sm">{project.name}</span>
                    </div>
                  </div>
                </div>

                {/* Subtasks */}
                {project.expanded &&
                  project.subtasks?.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`group flex items-center hover:bg-gray-700/30 transition-colors border-b border-gray-700 relative ${
                        focusedId && project.id === focusedId ? "z-20" : "z-10"
                      }`}
                    >
                      <div className="w-80 shrink-0 py-3 pl-16 pr-6 flex items-center gap-3 bg-[#333333] border-r border-gray-700">
                        <div className="w-2 h-2 rounded-full border border-gray-500 bg-gray-700 relative z-10"></div>
                        <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                          <div className="font-medium text-gray-300 text-xs truncate hover:text-indigo-400 transition-colors cursor-pointer">
                            <span className="relative z-40">{subtask.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative h-12 flex-1">
                        <div
                          className="absolute h-6 top-3 rounded-full flex items-center justify-between px-2.5 overflow-visible transition-all hover:shadow-md hover:-translate-y-0.5"
                          style={{
                            left: left(subtask.start),
                            width: width(subtask.start, subtask.end),
                          }}
                          onMouseEnter={() => setHoveredTask(subtask.id)}
                          onMouseLeave={() => setHoveredTask(null)}
                        >
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: subtask.color || project.color,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            }}
                          >
                             <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                          </div>
                          <span className="relative z-40 text-[9px] font-bold text-white truncate drop-shadow-sm">{subtask.name}</span>
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

export default function ProjectApp() {
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

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [draftParentId, setDraftParentId] = React.useState(null)
  const [editingId, setEditingId] = React.useState(null)
  const [draft, setDraft] = React.useState({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
  const [notification, setNotification] = React.useState({ show: false, message: "" })
  const [validationError, setValidationError] = React.useState("")

  const activeProjectsCount = projects.filter((p) => (p.status || "todo") !== "done").length
  const doneProjectsCount = projects.filter((p) => (p.status || "todo") === "done").length
  const totalProjectsCount = projects.length

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  const showNotification = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  React.useEffect(() => {
    if (!isModalOpen) {
      setValidationError("")
      return
    }
    if (draftParentId) {
      const parent = projects.find((p) => p.id === draftParentId)
      if (!parent) {
        setValidationError("")
        return
      }
      const ps = new Date(parent.start)
      const pe = new Date(parent.end)
      const ds = new Date(draft.start)
      const de = new Date(draft.end)
      if (isNaN(ds) || isNaN(de)) setValidationError("Please select valid dates")
      else if (ds > de) setValidationError("Start date must be before end date")
      else if (ds < ps) setValidationError("Task starts earlier than parent")
      else if (de > pe) setValidationError("Task ends later than parent")
      else setValidationError("")
    } else {
      setValidationError("")
    }
  }, [isModalOpen, draftParentId, draft.start, draft.end, projects])

  const handleDeleteProject = (id) => {
    if (confirm("Are you sure you want to delete this project?")) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      showNotification("Project deleted successfully")
    }
  }

  const saveProject = () => {
    if (!draft.name || !draft.start || !draft.end) return

    if (editingId) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === editingId) return { ...p, ...draft }
          if (p.subtasks && p.subtasks.some((s) => s.id === editingId)) {
            const ps = new Date(p.start)
            const pe = new Date(p.end)
            const ds = new Date(draft.start)
            const de = new Date(draft.end)
            const cs = ds < ps ? ps : ds
            const ce = de > pe ? pe : de
            const fixed = cs > ce ? { start: format(ps, "yyyy-MM-dd"), end: format(pe, "yyyy-MM-dd") } : { start: format(cs, "yyyy-MM-dd"), end: format(ce, "yyyy-MM-dd") }
            return { ...p, subtasks: p.subtasks.map((s) => (s.id === editingId ? { ...s, ...draft, ...fixed } : s)) }
          }
          return p
        })
      )
    } else if (draftParentId) {
      if (validationError) {
        showNotification(validationError)
        return
      }
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== draftParentId) return p
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
            subtasks: [...(p.subtasks || []), { id: Date.now(), ...draft, start: format(fixedStart, "yyyy-MM-dd"), end: format(fixedEnd, "yyyy-MM-dd") }],
            expanded: true,
          }
        })
      )
    } else {
      setProjects((p) => [...p, { id: Date.now(), ...draft, subtasks: [], expanded: true }])
    }

    showNotification(editingId ? "Project updated successfully" : "Project created successfully")
    setIsModalOpen(false)
    setDraft({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
    setDraftParentId(null)
    setEditingId(null)
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
              onClick={() => {
                setDraftParentId(null)
                setEditingId(null)
                setDraft({ name: "", start: format(new Date(), "yyyy-MM-dd"), end: format(addDays(new Date(), 5), "yyyy-MM-dd"), status: "todo", color: DEFAULT_COLOR })
                setIsModalOpen(true)
              }}
              className="ml-4 px-4 py-2 bg-gradient-to-r from-[#2D4485] to-[#3D56A6] text-white rounded-lg text-sm font-bold shadow hover:shadow-lg transition-all"
            >
              + New Project
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <GanttChart projects={projects} setProjects={setProjects} />
      </div>

      {/* Modal (kept from your code, simplified) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md group">
            <div className="relative p-[2px] rounded-[2rem] bg-gradient-to-br from-white/80 via-white/20 to-white/60 shadow-2xl backdrop-blur-3xl">
              <div className="bg-white/90 backdrop-blur-2xl rounded-[1.9rem] overflow-hidden relative h-full">
                <div className="px-6 py-4 border-b border-gray-100/50 flex justify-between items-center relative z-20 bg-gradient-to-r from-white/50 to-transparent">
                  <h3 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    {editingId ? "Edit Project" : draftParentId ? "New Subtask" : "New Project"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 hover:shadow-sm transition-all duration-300"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-20">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Name</label>
                    <input
                      autoFocus
                      type="text"
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Design Phase"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium"
                        value={draft.start}
                        onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium"
                        value={draft.end}
                        onChange={(e) => setDraft({ ...draft, end: e.target.value })}
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
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setDraft({ ...draft, color: c.hex })}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            draft.color === c.hex ? "border-indigo-500 scale-110 shadow-md" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

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
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg"
                    >
                      {editingId ? "Save Changes" : "Create Project"}
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
  
// Fix for "container has already been passed to createRoot" warning
const container = document.getElementById("root")
if (container) {
  // Check if we've already created a root for this container
  if (!container._reactRoot) {
    const root = ReactDOM.createRoot(container)
    container._reactRoot = root
    root.render(<ProjectApp />)
  } else {
    // Reuse existing root
    container._reactRoot.render(<ProjectApp />)
  }
}
