import React from "react"
import ReactDOM from "react-dom/client"
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isWeekend, differenceInDays, addWeeks } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, MoreHorizontal, ChevronDown, CornerDownRight, X, Trash2, Edit, AlertTriangle, Download } from "lucide-react"
import html2pdf from "html2pdf.js"
import { utils, writeFile } from "xlsx"
import Navigation from "./components/navigation.jsx"
// Import API base URL for backend connectivity
import { API_BASE_URL } from "./config.js"
import "./index.css"

const STORAGE_KEY = "eit-projects-v2"

// Replace grey with pink and define grouping semantics:
// - In Progress: blue, red, pink
// - Finished: green
// - Cancelled: orange
const COLORS = [
  { hex: "#f43f5e", name: "Red" },       // In Progress
  { hex: "#6366f1", name: "Blue" },      // In Progress
  { hex: "#10b981", name: "Green" },     // Finished
  { hex: "#ec4899", name: "Pink" },      // In Progress
  { hex: "#f59e0b", name: "Orange" },    // Cancelled
]

const getColorGroup = (hex) => {
  switch (hex) {
    case "#10b981": return "Finished"
    case "#f59e0b": return "Cancelled"
    case "#f43f5e":
    case "#6366f1":
    case "#ec4899":
      return "In Progress"
    default:
      return "In Progress"
  }
}
const getColorMeaning = getColorGroup
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
    const ROW_HEIGHT = 60 // px

    // Dynamic Column Width to fit A4
    const availableDateSpace = PAGE_WIDTH_PX - NAME_COL_WIDTH - 60 // 60px padding/margin safety
    let calcColWidth = Math.floor(availableDateSpace / totalDays)
    const COL_WIDTH = Math.max(30, Math.min(60, calcColWidth)) // Daily width
    
    const TOTAL_WIDTH = NAME_COL_WIDTH + (totalDays * COL_WIDTH)
    
    // Header width should match table width (but min 700px for text)
    const HEADER_WIDTH = Math.max(TOTAL_WIDTH, 700)
    // Page container needs to be wide enough
    const PAGE_CONTAINER_WIDTH = Math.max(PAGE_WIDTH_PX, TOTAL_WIDTH + 80)

    // Colors (EIT Modern Theme)
    const COLORS = {
        headerBlue: '#2D4485', // EIT Blue
        headerLight: '#F8FAFC', // Very light slate
        headerDateBg: '#2D4485', // Dark blue for month header
        headerDateText: '#FFFFFF',
        grid: '#E2E8F0', // Light slate grid
        taskBar: '#2D4485', // EIT Blue for subtasks
        projectBar: '#1E3A8A', // Dark blue for project bar
        text: '#334155', // Slate 700
        border: '#CBD5E1', // Slate 300
        groupBg: '#F1F5F9'
    }

    // Invoice Header Data
    const headerImgSrc = window.location.origin + (company === 'Einstein' ? "/Einstein%20header.png" : "/EIT%20header.png")
    
    const companyDetails = {
        EIT: {
            thaiName: "บริษัท อีไอที เลเซอร์เทคนิค จำกัด",
            engName: "EIT LASERTECHNIK CO.,LTD",
            address: "118/20 Soi Ramkhamhaeng 184, Minburi, Minburi, Bangkok 10510 Thailand",
            tel: "02-052-9544",
            fax: "02-052-9544",
            taxId: "0105560138141"
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
        <div style="margin-bottom: 25px; font-family: 'Inter', sans-serif;">
            <div style="margin-bottom: 20px;">
                <img src="${headerImgSrc}" style="width: 50%; height: auto;" />
            </div>
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 800; color: ${COLORS.headerBlue}; letter-spacing: -0.5px;">PROJECT PLAN</div>
                    <div style="color: ${COLORS.text}; font-size: 12px; margin-top: 4px;">Date: ${format(new Date(), 'dd MMM yyyy')}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 20px; font-size: 10px; color: ${COLORS.text}; border-top: 2px solid ${COLORS.headerBlue}; padding-top: 15px;">
                 <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">${details.thaiName}</div>
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 4px;">${details.engName}</div>
                    <div>${details.address}</div>
                 </div>
                 <div style="text-align: right;">
                    <div style="margin-bottom: 2px;">TEL : ${details.tel}</div>
                    <div style="margin-bottom: 2px;">Fax : ${details.fax}</div>
                    <div style="font-weight: 600;">Tax ID : ${details.taxId} (Head Office)</div>
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
            border-right: 1px solid rgba(255,255,255,0.2); 
            font-size: 14px;
            font-weight: 600;
            padding: 8px 0;
            background: ${COLORS.headerDateBg};
            color: ${COLORS.headerDateText};
            text-transform: uppercase;
            letter-spacing: 0.5px;
        ">
            ${m.name}
        </div>
    `).join('')

    const dayHeaderCells = days.map(d => `
        <div style="
            width: ${COL_WIDTH}px; 
            min-width: ${COL_WIDTH}px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid ${COLORS.grid}; 
            font-size: 12px;
            background: ${COLORS.headerLight};
            color: ${COLORS.text};
            font-weight: 600;
        ">
            ${format(d, 'd')}
        </div>
    `).join('')

    const tableHeaderHtml = `
        <!-- Date Headers Container -->
        <div style="display: flex; flex-direction: column;">
             <!-- Month Row -->
             <div style="display: flex; width: 100%;">
                <div style="width: ${NAME_COL_WIDTH}px; min-width: ${NAME_COL_WIDTH}px; background: white; border-right: 1px solid ${COLORS.grid};"></div>
                <div style="display: flex; flex: 1; background: ${COLORS.headerDateBg};">
                    ${monthHeaderCells}
                </div>
             </div>
             
             <!-- Day Row & Task Label -->
             <div style="display: flex; border-bottom: 1px solid ${COLORS.grid};">
                <div style="
                    width: ${NAME_COL_WIDTH}px; 
                    min-width: ${NAME_COL_WIDTH}px;
                    background: ${COLORS.headerLight}; 
                    border-right: 1px solid ${COLORS.grid};
                    display: flex;
                    align-items: center;
                    padding-left: 15px;
                    font-weight: 700;
                    color: ${COLORS.text};
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    Task Name
                </div>
                <div style="flex: 1; display: flex; background: ${COLORS.headerLight};">
                    ${dayHeaderCells}
                </div>
             </div>
        </div>
    `

    // 3. Generate Flattened Rows (Project + Subtasks)
    const rows = []
    
    list.forEach(project => {
        // Project Header Row
        const projectRowHtml = `
            <div class="sheet-row" style="display: flex; height: ${ROW_HEIGHT}px; border-bottom: 1px solid ${COLORS.grid}; background: ${COLORS.groupBg}; color: black; page-break-inside: avoid;">
                <div style="
                    width: ${NAME_COL_WIDTH}px; 
                    min-width: ${NAME_COL_WIDTH}px;
                    padding: 0 15px; 
                    display: flex; 
                    align-items: center; 
                    font-weight: 700; 
                    font-size: 14px;
                    color: ${COLORS.projectBar};
                    border-right: 1px solid ${COLORS.grid};
                ">
                    ${project.name}
                </div>
                 <div style="flex: 1; position: relative; display: flex;">
                    <div style="
                        position: absolute;
                        left: ${differenceInDays(new Date(project.start), minDate) * COL_WIDTH}px;
                        top: 12px;
                        bottom: 12px;
                        width: ${(differenceInDays(new Date(project.end), new Date(project.start)) + 1) * COL_WIDTH}px;
                        background: ${COLORS.projectBar}; 
                        border-radius: 4px;
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
        rows.push({ html: projectRowHtml })
        
        if (project.subtasks) {
            project.subtasks.forEach(sub => {
                const start = new Date(sub.start)
                const end = new Date(sub.end)
                const offsetDays = differenceInDays(start, minDate)
                const durationDays = differenceInDays(end, start) + 1
                const left = offsetDays * COL_WIDTH
                const width = durationDays * COL_WIDTH
                
                const subtaskRowHtml = `
                    <div class="sheet-row" style="display: flex; height: ${ROW_HEIGHT}px; border-bottom: 1px solid ${COLORS.grid}; page-break-inside: avoid; transition: background 0.2s;">
                        <div style="
                            width: ${NAME_COL_WIDTH}px; 
                            min-width: ${NAME_COL_WIDTH}px;
                            padding: 0 15px; 
                            display: flex; 
                            align-items: center; 
                            font-size: 13px;
                            border-right: 1px solid ${COLORS.grid};
                            background: #ffffff;
                            color: ${COLORS.text};
                            font-weight: 500;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        ">
                            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.taskBar}; margin-right: 8px;"></span>
                            ${sub.name}
                        </div>
                        <div style="flex: 1; position: relative; display: flex;">
                            <!-- Task Bar -->
                            <div style="
                                position: absolute;
                                left: ${left}px;
                                top: 10px;
                                bottom: 10px;
                                width: ${width}px;
                                background: ${COLORS.taskBar};
                                border-radius: 12px;
                                box-shadow: 0 2px 4px rgba(45, 68, 133, 0.3);
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
                rows.push({ html: subtaskRowHtml })
            })
        }
    })

    // 4. Pagination Logic
    const pages = []
    let currentPageRows = []
    let currentHeight = 0
    
    // Page constraints (Approximate)
    const PAGE_HEIGHT_PX = 700 // Reduced from 793 to prevent overflow (210mm @ 96dpi is ~793px)
    const PADDING_Y = 80 // 40px top + 40px bottom
    const INVOICE_HEIGHT = 300 // Increased estimate to account for image and text
    const TABLE_HEADER_HEIGHT = 100 // Increased estimate for safety
    
    // First page available height
    let availableHeight = PAGE_HEIGHT_PX - PADDING_Y - INVOICE_HEIGHT - TABLE_HEADER_HEIGHT

    rows.forEach((row) => {
        if (currentHeight + ROW_HEIGHT > availableHeight) {
            // Push current page
            pages.push({ rows: currentPageRows, isFirst: pages.length === 0 })
            
            // Reset for next page
            currentPageRows = []
            currentHeight = 0
            // Next pages don't have invoice header
            availableHeight = PAGE_HEIGHT_PX - PADDING_Y - TABLE_HEADER_HEIGHT 
        }
        currentPageRows.push(row)
        currentHeight += ROW_HEIGHT
    })
    
    // Push last page
    if (currentPageRows.length > 0) {
        pages.push({ rows: currentPageRows, isFirst: pages.length === 0 })
    }

    // 5. Generate Content HTML
    const content = pages.map((page, index) => {
        const rowsHtml = page.rows.map(r => r.html).join('')
        
        return `
            <section class="page spreadsheet-page" style="width: ${PAGE_CONTAINER_WIDTH}px; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; page-break-after: always;">
                
                ${page.isFirst ? `
                <!-- Invoice Header (First Page Only) -->
                <div style="width: ${HEADER_WIDTH}px; max-width: 100%; margin-bottom: 40px;">
                   ${invoiceHeader}
                </div>
                ` : ''}
                
                <!-- Table Container -->
                <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                    <div style="
                        width: ${TOTAL_WIDTH}px; 
                        margin: 0 auto;
                        border: 1px solid ${COLORS.grid}; 
                        border-radius: 8px; 
                        background: white;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                        overflow: hidden;
                    ">
                    
                    ${tableHeaderHtml}

                    <!-- Rows Container -->
                    <div style="background: white;">
                        ${rowsHtml}
                    </div>
                </div>
                </div>
            </section>
        `
    }).join('')

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
      scale: 1.5, // Reduced scale for better stability
      useCORS: true,
      scrollY: 0,
      windowWidth: TOTAL_WIDTH + 100, // Ensure ample space for capture
      onclone: (clonedDoc) => {
        // 1. Remove incompatible styles (Tailwind's oklch colors cause crashes)
        const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(style => {
          const isPrintStyle = style.id === 'gantt-print-styles';
          const isGoogleFont = style.tagName === 'LINK' && style.href && style.href.includes('fonts.googleapis');
          
          if (!isPrintStyle && !isGoogleFont) {
            style.remove();
          }
        });

        // 2. Force white background to prevent black PDF issues
        const element = clonedDoc.querySelector('.print-container');
        if (element) {
          element.style.background = 'white';
          element.style.backgroundColor = 'white';
        }
        clonedDoc.body.style.background = 'white';
        clonedDoc.body.style.backgroundColor = 'white';
        
        // 3. Reset CSS variables on root just in case
        clonedDoc.documentElement.style.cssText = '';
        clonedDoc.documentElement.style.setProperty('--background', 'white');
        clonedDoc.documentElement.style.setProperty('--foreground', 'black');
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
      alert(`Failed to generate PDF: ${err.message || err}`)
      if (document.body.contains(element)) {
        document.body.removeChild(element)
      }
    })
}

// Add onDelete to support delete actions from list rows
const GanttChart = ({ projects, setProjects, onAddSubtask, onEdit, onDelete, startDate, setStartDate, focusedId, setFocusedId, selectedProjects, toggleSelection, toggleAll }) => {
  const [hoveredTask, setHoveredTask] = React.useState(null)
  const [showExportMenu, setShowExportMenu] = React.useState(false)

  const toggleProject = (id) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, expanded: !p.expanded } : p
    ))
  }

  const handleExportPDF = () => {
    let projectsToExport = []
    if (focusedId) {
      const p = projects.find((proj) => proj.id === focusedId)
      if (p) projectsToExport = [p]
    } else if (selectedProjects.size > 0) {
      projectsToExport = projects.filter((p) => selectedProjects.has(p.id))
    } else {
      // If nothing selected, maybe export all? 
      // The UI says "Export Selected (0)" so maybe nothing.
      // But let's check logic elsewhere. 
      // If we follow handleExportExcel logic:
      return
    }

    if (projectsToExport.length === 0) return

    exportProjectsAsSinglePDF(projectsToExport)
    setShowExportMenu(false)
  }


  // ======= EXPORT: Visual Gantt Chart (Reference Style) =======
  // (Moved to module scope and ProjectApp)


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

    // Drag & Drop Logic removed


    return (
      <>
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
               {/* Legend: explain color meanings (In progress: Red/Blue/Pink; Finished: Green; Cancel: Orange) */}
               <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mr-4">
                   <span className="text-slate-600">In progress</span>
                   <div className="w-3 h-3 rounded bg-rose-500"></div>
                   <div className="w-3 h-3 rounded bg-indigo-500"></div>
                   <div className="w-3 h-3 rounded bg-pink-500"></div>
                   <span className="text-slate-300">|</span>
                   <span className="text-slate-600">Finished</span>
                   <div className="w-3 h-3 rounded bg-emerald-500"></div>
                   <span className="text-slate-300">|</span>
                   <span className="text-slate-600">Cancel</span>
                   <div className="w-3 h-3 rounded bg-amber-500"></div>
               </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* Main scroll container: disable horizontal touch scrolling to force button use */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white relative"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Header */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-30 shadow-sm">
            <div className="sticky left-0 z-[60] w-80 shrink-0 p-4 pl-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-3 bg-white border-r border-slate-200">
              <input
                type="checkbox"
                checked={selectedProjects.size === projects.length && projects.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                    className={`shrink-0 border-r border-slate-200 p-2 text-center flex flex-col justify-center items-center ${
                      isWknd ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="text-[10px] font-bold mb-1 uppercase tracking-wider text-slate-500">{format(day, "EEE")}</div>
                    <div className="text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all text-slate-700 hover:bg-slate-100">
                      {format(day, "d")}
                    </div>
                  </div>
                )
              })}
            </div>
            {focusedId && <div className="absolute top-0 bottom-0 right-0 left-80 bg-black/5 z-50" />}
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
                  className={`shrink-0 border-r border-dashed border-slate-200 h-full relative ${isWeekend(day) ? "bg-slate-50/50" : ""}`}
                />
              ))}
            </div>

            {projects.map((project) => (
              <React.Fragment key={project.id}>
                        {/* Project Row */}
                        <div className={`group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative ${focusedId && project.id === focusedId ? 'z-30' : 'z-10'}`}>
                            {/* Sticky Project Name Column - Use solid background on hover to prevent underlying text from showing through */}
                            <div
                              onClick={() => setFocusedId(focusedId === project.id ? null : project.id)}
                              className={`sticky left-0 z-[50] w-80 shrink-0 py-4 pl-4 pr-6 flex items-center gap-3 bg-white border-r border-slate-100 group-hover:bg-slate-50 transition-colors`}
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
                                       {/* Add native tooltip so long names can be read on hover */}
                                       <span 
                                         onClick={() => setFocusedId(project.id)} 
                                         className="relative z-50 pointer-events-auto cursor-pointer"
                                         title={project.name}
                                       >
                                         {project.name}
                                       </span>
                                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                   </div>
                                   <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                                       <span>{project.subtasks?.length || 0} tasks</span>
                                       <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                       <span>{getColorMeaning(project.color)}</span>
                                   </div>
                               </div>
                               
                              {/* Edit, Add Subtask, and Delete Project Buttons */}
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
                                  {/* Delete project: calls shared delete handler */}
                                  <button 
                                       onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                                       className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                       title="Delete Project"
                                   >
                                       <Trash2 size={14} />
                                   </button>
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
                                    {/* Add tooltip on bar label to reveal full long project name */}
                                    <span className={`relative z-40 text-[11px] font-bold truncate text-white drop-shadow-sm`} title={project.name}>{project.name}</span>
                               </div>
                           </div>
                        </div>
    
                        {/* Subtasks */}
                        {project.expanded && project.subtasks?.map((subtask, index) => (
                            <div key={subtask.id} className={`group flex items-center hover:bg-slate-50/30 transition-colors border-b border-slate-100 relative ${focusedId && project.id === focusedId ? 'z-30' : 'z-10'}`}>
                                {/* Sticky Subtask Name Column - Use solid background on hover to prevent underlying text from showing through */}
                                <div className="sticky left-0 z-[50] w-80 shrink-0 py-3 pl-16 pr-6 flex items-center gap-3 bg-white border-r border-slate-100 group-hover:bg-slate-50 transition-colors">
                                    <div className="w-2 h-2 rounded-full border border-slate-300 bg-white relative z-10"></div>
                                    {/* Place name and action icons closely to avoid large spacing */}
                                    <div className="flex-1 min-w-0 flex items-center gap-2 pr-2">
                                        <div className="font-medium text-slate-600 text-xs truncate hover:text-indigo-600 transition-colors cursor-pointer"><span className={`relative z-40`}>{subtask.name}</span></div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            {/* Edit Subtask */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onEdit(subtask); }}
                                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                title="Edit Subtask"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            {/* Delete Subtask */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDelete(subtask.id); }}
                                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                title="Delete Subtask"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative h-12 flex-1">
                                    <div 
                                        className={`absolute h-6 top-3 rounded-full flex items-center justify-between px-2.5 overflow-visible transition-all hover:shadow-md hover:-translate-y-0.5`}
                                        style={{ 
                                            left: left(subtask.start), 
                                            width: width(subtask.start, subtask.end),
                                            opacity: 1
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
    </>
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

  
  const [today] = React.useState(new Date())
  const [startDate, setStartDate] = React.useState(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), -1))
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [draftParentId, setDraftParentId] = React.useState(null)
  const [editingId, setEditingId] = React.useState(null)
  const [draft, setDraft] = React.useState({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
  const [notification, setNotification] = React.useState({ show: false, message: "" })
  // Track explicit modal mode to avoid title mixing between actions
  // Modes: 'createProject' | 'editProject' | 'addSubtask' | 'editSubtask'
  const [modalMode, setModalMode] = React.useState('createProject')
  // Cache parent project for subtask modal context (name + date range)
  const parentProject = React.useMemo(() => projects.find(p => p.id === draftParentId), [projects, draftParentId])
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

  // Group counts derived from color grouping
  const finishedProjectsCount = projects.filter((p) => getColorGroup(p.color) === "Finished").length
  const cancelledProjectsCount = projects.filter((p) => getColorGroup(p.color) === "Cancelled").length
  const inProgressProjectsCount = projects.filter((p) => getColorGroup(p.color) === "In Progress").length
  // For legacy UI labels, map to "Done"/"Active" semantics
  const doneProjectsCount = finishedProjectsCount
  const activeProjectsCount = inProgressProjectsCount
  const totalProjectsCount = projects.length

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  const showNotification = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  // Build list of API candidates and helper to call backend
  // This tries API_BASE_URL first, then common localhost ports, returning the first response (even if not OK),
  // so we can surface error messages from the backend.
  const API_CANDIDATES = React.useMemo(() => {
    const proto = window.location.protocol === "https:" ? "https" : "http"
    const host = window.location.hostname || "127.0.0.1"
    return Array.from(new Set([
      API_BASE_URL,
      `${proto}://${host}:8000`,
      `${proto}://${host}:8001`,
      `${proto}://${host}:8002`,
    ]))
  }, [])

  const tryFetch = async (path, options) => {
    for (const base of API_CANDIDATES) {
      try {
        const res = await fetch(`${base}${path}`, options)
        return { res, base }
      } catch {}
    }
    throw new Error("All API endpoints unreachable")
  }

  // Load PMProject/PMTask from backend and map into UI structure
  React.useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const { res: pRes } = await tryFetch(`/api/pm_projects/`)
        const { res: tRes } = await tryFetch(`/api/pm_tasks/`)
        const apiProjects = pRes.ok ? await pRes.json() : []
        const apiTasks = tRes.ok ? await tRes.json() : []
        const mapped = apiProjects.map((proj) => ({
          id: proj.id,
          name: proj.name,
          start: proj.start_date,
          end: proj.end_date,
          task_total: proj.task_total,
          status: proj.status || "active",
          color: proj.color || DEFAULT_COLOR,
          expanded: true,
          apiId: proj.id,
          api: true,
          subtasks: apiTasks
            .filter((t) => t.project === proj.id)
            .map((t) => ({
              id: t.id,
              name: t.name || `Task ${t.id}`,
              start: t.task_start_date,
              end: t.task_end_date,
              status: "todo",
              color: DEFAULT_COLOR,
              apiId: t.id,
              api: true,
            }))
        }))
        if (mapped.length > 0) {
          setProjects(mapped)
        }
      } catch (e) {
        console.error("Failed to load PM data", e)
      }
    }
    loadFromBackend()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper: persist a project to PM_project table (create or update)
  const persistProjectToAPI = async (project) => {
    const statusByColor = (hex) => {
      if (hex === "#10b981") return "done"
      if (hex === "#f59e0b") return "cancelled"
      return "active"
    }
    const payload = {
      name: project.name,
      start_date: project.start,
      end_date: project.end,
      task_total: Array.isArray(project.subtasks) ? project.subtasks.length : 0,
      color: project.color || DEFAULT_COLOR,
      status: statusByColor(project.color || DEFAULT_COLOR),
    }
    if (project.apiId) {
      const { res, base } = await tryFetch(`/api/pm_projects/${project.apiId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        console.error("Project PATCH failed", res.status, txt)
        showNotification(`Failed to update backend (${base}): ${res.status}`)
      }
      return project.apiId
    } else {
      const { res, base } = await tryFetch(`/api/pm_projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const created = await res.json()
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, apiId: created.id, api: true } : p))
        return created.id
      } else {
        const txt = await res.text().catch(() => "")
        console.error("Project POST failed", res.status, txt)
        showNotification(`Failed to save to backend (${base}): ${res.status}`)
        return null
      }
    }
  }

  // Helper: persist a subtask to PM_task table (create or update)
  const persistSubtaskToAPI = async (parentProject, subtask) => {
    const projectId = await persistProjectToAPI(parentProject)
    if (!projectId) return null
    const payload = {
      project: projectId,
      name: subtask.name || "",
      task_start_date: subtask.start,
      task_end_date: subtask.end,
    }
    if (subtask.apiId) {
      const { res, base } = await tryFetch(`/api/pm_tasks/${subtask.apiId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        console.error("Task PATCH failed", res.status, txt)
        showNotification(`Failed to update task (${base}): ${res.status}`)
      }
      return subtask.apiId
    } else {
      const { res, base } = await tryFetch(`/api/pm_tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const created = await res.json()
        setProjects(prev => prev.map(p => {
          if (p.id !== parentProject.id) return p
          return {
            ...p,
            subtasks: (p.subtasks || []).map(s => s.id === subtask.id ? { ...s, apiId: created.id, api: true } : s)
          }
        }))
        // Task total is maintained by backend; no manual patch here
        return created.id
      } else {
        const txt = await res.text().catch(() => "")
        console.error("Task POST failed", res.status, txt)
        showNotification(`Failed to save task (${base}): ${res.status}`)
        return null
      }
    }
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
      if (isNaN(ds) || isNaN(de)) {
        setValidationError("Please select valid dates")
      } else if (ds > de) {
        setValidationError("Start date must be before end date")
      } else if (ds < ps || de > pe) {
        // Subtask must be within the parent project date window
        setValidationError("Subtask dates must be within project start/end")
      } else {
        setValidationError("")
      }
    } else {
      setValidationError("")
    }
  }, [isModalOpen, draftParentId, draft.start, draft.end, projects])

  const handleEditProject = (item) => {
    // Decide whether we're editing a project or a subtask based on where the id exists
    const isProject = projects.some(p => p.id === item.id)
    if (isProject) {
      // Edit Project: clear subtask context and set appropriate mode
      setModalMode('editProject')
      setDraftParentId(null)
      setEditingId(item.id)
      setDraft({
        name: item.name,
        start: item.start,
        end: item.end,
        status: item.status || "todo",
        color: item.color || DEFAULT_COLOR
      })
      setIsModalOpen(true)
      return
    }
    // Edit Subtask: find parent project, set subtask context for title and date bounds
    const parent = projects.find(p => Array.isArray(p.subtasks) && p.subtasks.some(s => s.id === item.id))
    if (parent) {
      setModalMode('editSubtask')
      setEditingId(item.id)
      setDraftParentId(parent.id)
      setDraft({
        name: item.name || "",
        start: item.start || "",
        end: item.end || "",
        status: item.status || "todo",
        color: item.color || DEFAULT_COLOR
      })
      setIsModalOpen(true)
    }
  }

  const handleAddSubtask = (parentId) => {
    // Add Subtask: ensure mode and context are correct
    setModalMode('addSubtask')
    // Clear any stale edit id from previous actions
    setEditingId(null)
    setDraftParentId(parentId)
    setDraft({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
    setIsModalOpen(true)
  }

  const handleDeleteProject = async (id) => {
    // Delete either a project or a subtask and sync with backend PM_* tables
    if (!confirm("Are you sure you want to delete this item?")) return
    const project = projects.find(p => p.id === id)
    if (project) {
      // Delete a full project
      try {
        if (project.apiId) {
          const { res, base } = await tryFetch(`/api/pm_projects/${project.apiId}/`, { method: "DELETE" })
          if (!res.ok) {
            const txt = await res.text().catch(() => "")
            console.error("Project delete failed", res.status, txt)
            showNotification(`Failed to delete project (${base}): ${res.status}`)
          }
        }
      } catch {}
      setProjects(prev => prev.filter(p => p.id !== id))
      setIsModalOpen(false)
      setEditingId(null)
      showNotification("Project deleted successfully")
      return
    }
    // Delete a subtask inside a project
    const parent = projects.find(p => Array.isArray(p.subtasks) && p.subtasks.some(s => s.id === id))
    if (parent) {
      const sub = (parent.subtasks || []).find(s => s.id === id)
      try {
        if (sub && sub.apiId) {
          const { res, base } = await tryFetch(`/api/pm_tasks/${sub.apiId}/`, { method: "DELETE" })
          if (!res.ok) {
            const txt = await res.text().catch(() => "")
            console.error("Subtask delete failed", res.status, txt)
            showNotification(`Failed to delete task (${base}): ${res.status}`)
          }
        }
        // Task total is maintained by backend; no manual patch here
      } catch {}
      setProjects(prev => prev.map(p => p.id === parent.id ? { ...p, subtasks: (p.subtasks || []).filter(s => s.id !== id) } : p))
      setIsModalOpen(false)
      setEditingId(null)
      showNotification("Subtask deleted successfully")
    }
  }

  const saveProject = async () => {
    if (!draft.name || !draft.start || !draft.end) return

    if (editingId) {
        // Update either a project or an existing subtask
        setProjects(prev => prev.map(p => {
            if (p.id === editingId) {
                return { ...p, ...draft }
            }
            // Check if it's a subtask update
            if (p.subtasks && p.subtasks.some(s => s.id === editingId)) {
                // Update subtask without color changes (color applies to projects only)
                const updatedSubtasks = p.subtasks.map(s => s.id === editingId ? { ...s, name: draft.name, start: draft.start, end: draft.end } : s)
                // Do not change project range when editing a subtask
                return { ...p, subtasks: updatedSubtasks }
            }
            return p
        }))
        // Persist to backend
        const targetProject = projects.find(p => p.id === editingId)
        if (targetProject) {
          await persistProjectToAPI({ ...targetProject, ...draft })
        } else {
          const parent = projects.find(p => Array.isArray(p.subtasks) && p.subtasks.some(s => s.id === editingId))
          if (parent) {
            // Ensure subtask remains within parent range
            const ds = new Date(draft.start); const de = new Date(draft.end)
            const ps = new Date(parent.start); const pe = new Date(parent.end)
            if (isNaN(ds) || isNaN(de) || ds > de || ds < ps || de > pe) {
              showNotification("Subtask dates must be within project start/end")
              return
            }
            const updated = { ...draft, id: editingId }
            await persistSubtaskToAPI(parent, updated)
          }
        }
    } else if (draftParentId) {
        if (validationError) {
          showNotification(validationError)
          return
        }
        // Add a new subtask to an existing project (no color for subtasks), and persist to backend
        let newSubtaskId = Date.now()
        setProjects(prev => prev.map(p => {
        if (p.id === draftParentId) {
                const ds = new Date(draft.start)
                const de = new Date(draft.end)
                // Do not change project date range when adding subtask
                return {
                    ...p,
                    subtasks: [
                        ...(p.subtasks || []),
                        { id: newSubtaskId, name: draft.name, start: draft.start, end: draft.end }
                    ],
                    expanded: true
                }
            }
            return p
        }))
        const parent = projects.find(p => p.id === draftParentId)
        if (parent) {
          // Ensure new subtask is within parent range
          const ds = new Date(draft.start); const de = new Date(draft.end)
          const ps = new Date(parent.start); const pe = new Date(parent.end)
          if (isNaN(ds) || isNaN(de) || ds > de || ds < ps || de > pe) {
            showNotification("Subtask dates must be within project start/end")
            return
          }
          // Persist only core fields for subtask (no color)
          await persistSubtaskToAPI(parent, { id: newSubtaskId, name: draft.name, start: draft.start, end: draft.end })
        }
    } else {
      // Create a new project and persist to backend
      const newId = Date.now()
      const projectToCreate = { id: newId, ...draft, subtasks: [], expanded: true }
      setProjects((p) => [...p, projectToCreate])
      await persistProjectToAPI(projectToCreate)
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
          <div className="text-sm text-slate-500 flex items-center">
            {/* Show grouped counters based on color */}
            <span className="mr-3">In Progress: {inProgressProjectsCount}</span>
            <span className="mr-3">Finished: {finishedProjectsCount}</span>
            <span className="mr-3">Cancelled: {cancelledProjectsCount}</span>
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
                onClick={() => { 
                  // New Project: open modal in create mode, clear any previous context
                  setModalMode('createProject')
                  setEditingId(null)
                  setDraftParentId(null)
                  setDraft({ name: "", start: "", end: "", status: "todo", color: DEFAULT_COLOR })
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
          <GanttChart 
            projects={projects} 
            setProjects={setProjects} 
            onAddSubtask={handleAddSubtask} 
            onEdit={handleEditProject}
            // Wire delete to shared deletion handler (works for projects and subtasks)
            onDelete={handleDeleteProject}
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
          {/* Increase modal max width to make the pop up box bigger */}
          <div className="relative w-full max-w-2xl group">
            <div className="relative p-[2px] rounded-[2rem] bg-gradient-to-br from-white/80 via-white/20 to-white/60 shadow-2xl backdrop-blur-3xl">
              <div className="bg-white/90 backdrop-blur-2xl rounded-[1.9rem] overflow-hidden relative h-full">
                {/* Increase padding in header for a roomier look */}
                <div className="px-8 py-6 border-b border-gray-100/50 flex justify-between items-center relative z-20 bg-gradient-to-r from-white/50 to-transparent">
                  <div>
                    {/* Modal title reflects current action */}
                    <h3 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      {modalMode === 'editProject' ? "Edit Project" : modalMode === 'editSubtask' ? "Edit Subtask" : modalMode === 'addSubtask' ? "Add Sub Task" : "New Project"}
                    </h3>
                    {/* Parent project context: show name and (Start → End) range for subtask flows */}
                    {(modalMode === 'addSubtask' || modalMode === 'editSubtask') && (
                      <div className="mt-0.5 text-xs font-medium text-slate-500">
                        <span>{parentProject?.name || "Selected Project"}</span>
                        <span className="mx-1">•</span>
                        <span>
                          {parentProject ? `${format(new Date(parentProject.start), "yyyy-MM-dd")} → ${format(new Date(parentProject.end), "yyyy-MM-dd")}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { 
                      // Reset modal state to avoid mixed titles between modes without page refresh
                      setIsModalOpen(false)
                      setEditingId(null)
                      setDraftParentId(null)
                      setModalMode('createProject')
                      setValidationError("")
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/80 hover:shadow-sm transition-all duration-300"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Increase body padding and vertical spacing; allow slightly taller viewport */}
                <div className="p-8 space-y-6 max-h-[85vh] overflow-y-visible relative z-20">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Name</label>
                    {/* Slightly taller input for better readability */}
                    <input
                      autoFocus
                      type="text"
                      className="w-full px-5 py-3 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Design Phase"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>

                  {/* Increase gap between date inputs */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                      {/* Constrain subtask date pickers to the parent project's range */}
                      <input
                        type="date"
                        className="w-full px-5 py-3 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium"
                        value={draft.start}
                        onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                        min={draftParentId ? parentProject?.start : undefined}
                        max={draftParentId ? parentProject?.end : undefined}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                      {/* Constrain subtask date pickers to the parent project's range */}
                      <input
                        type="date"
                        className="w-full px-5 py-3 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-white outline-none transition-all text-sm font-medium"
                        value={draft.end}
                        onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                        min={draftParentId ? parentProject?.start : undefined}
                        max={draftParentId ? parentProject?.end : undefined}
                      />
                    </div>
                  </div>

                  {!!validationError && (
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold">
                      <AlertTriangle size={14} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Show color picker only when creating/editing a project (not for subtasks) */}
                  {(modalMode === 'createProject' || modalMode === 'editProject') && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Color</label>
                      {/* Single-line layout: place group labels and their color options on one row */}
                      {/* Prevent wrapping; hide horizontal overflow to avoid side arrows */}
                      <div className="flex items-center gap-3 flex-nowrap overflow-x-hidden whitespace-nowrap">
                        {/* In progress group with Red/Blue/Pink */}
                        <span className="text-xs font-semibold text-slate-600">In progress</span>
                        {COLORS.filter(c => getColorGroup(c.hex) === "In Progress").map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => setDraft({ ...draft, color: c.hex })}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${draft.color === c.hex ? "border-indigo-500 scale-110 shadow-md" : "border-transparent"}`}
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} • In progress`}
                          />
                        ))}
                        {/* Spacer between groups */}
                        <span className="mx-2 text-slate-300">|</span>
                        {/* Finished group with Green */}
                        <span className="text-xs font-semibold text-slate-600">Finished</span>
                        {COLORS.filter(c => getColorGroup(c.hex) === "Finished").map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => setDraft({ ...draft, color: c.hex })}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${draft.color === c.hex ? "border-indigo-500 scale-110 shadow-md" : "border-transparent"}`}
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} • Finished`}
                          />
                        ))}
                        {/* Spacer between groups */}
                        <span className="mx-2 text-slate-300">|</span>
                        {/* Cancel group with Orange */}
                        <span className="text-xs font-semibold text-slate-600">Cancel</span>
                        {COLORS.filter(c => getColorGroup(c.hex) === "Cancelled").map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => setDraft({ ...draft, color: c.hex })}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${draft.color === c.hex ? "border-indigo-500 scale-110 shadow-md" : "border-transparent"}`}
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} • Cancel`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Increase footer padding to balance the larger modal */}
                <div className="p-8 pt-2 relative z-20">
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
                      {modalMode === 'editProject' || modalMode === 'editSubtask' ? "Save Changes" : modalMode === 'addSubtask' ? "Add Sub Task" : "Create Project"}
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
