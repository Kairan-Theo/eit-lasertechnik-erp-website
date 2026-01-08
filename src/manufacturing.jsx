import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { JobOrderTemplate } from "./components/job-order-template.jsx"
import "./index.css"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"

  function DateField({ value, onChange, placeholder = "DD/MM/YYYY" }) {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef(null)
    const defaultClassNames = getDefaultClassNames()
    const selected = (() => {
      try {
        return value ? parseISO(value) : undefined
      } catch {
        return undefined
    }
  })()
  const display = (() => {
    try {
      return selected ? format(selected, "dd/MM/yyyy") : ""
    } catch {
      return ""
    }
  })()
    React.useEffect(() => {
      if (!open) return
      const handle = (e) => {
        const el = containerRef.current
        if (el && !el.contains(e.target)) setOpen(false)
      }
      const handleKey = (e) => {
        if (e.key === "Escape") setOpen(false)
      }
      document.addEventListener("mousedown", handle)
      document.addEventListener("touchstart", handle, { passive: true })
      document.addEventListener("keydown", handleKey)
      return () => {
        document.removeEventListener("mousedown", handle)
        document.removeEventListener("touchstart", handle)
        document.removeEventListener("keydown", handleKey)
      }
    }, [open])
    return (
      <div ref={containerRef} className="relative inline-block w-full">
        <input
          type="text"
          value={display}
          placeholder={placeholder}
          onClick={() => setOpen((o) => !o)}
          readOnly
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          aria-label="Open calendar"
        >
          <CalendarIcon className="size-4" aria-hidden="true" />
        </button>
        {open && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 bg-white border border-slate-200 rounded-[22px] shadow-xl p-4 w-[340px]">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (!d) return
                const v = format(d, "yyyy-MM-dd")
                onChange(v)
                setOpen(false)
              }}
              captionLayout="buttons"
              classNames={{
                root: `w-fit ${defaultClassNames.root}`,
                months: `flex flex-col ${defaultClassNames.months}`,
                month: `rounded-2xl pt-8 ${defaultClassNames.month}`,
                caption: `relative h-8 ${defaultClassNames.caption}`,
                nav: `absolute left-3 right-3 top-0 flex items-center justify-between ${defaultClassNames.nav}`,
                nav_button: `p-2 rounded-full hover:bg-slate-100 ${defaultClassNames.nav_button}`,
                nav_button_previous: `${defaultClassNames.nav_button_previous}`,
                nav_button_next: `${defaultClassNames.nav_button_next}`,
                caption_label: `absolute left-1/2 -translate-x-1/2 top-0 h-8 leading-8 text-center font-semibold uppercase tracking-wide text-[#2D4485] ${defaultClassNames.caption_label}`,
                table: `w-full border-collapse`,
                weekdays: `flex justify-between border-b border-slate-200 pb-2 ${defaultClassNames.weekdays}`,
                weekday: `text-slate-500 flex-1 text-sm text-center ${defaultClassNames.weekday}`,
                week: `grid grid-cols-7 mt-2 ${defaultClassNames.week}`,
                day: `mx-auto size-10 flex items-center justify-center rounded-full hover:bg-blue-50 ${defaultClassNames.day}`,
                today: `bg-[#E7F1FF] text-[#2D4485] ${defaultClassNames.today}`,
                outside: `text-slate-400 ${defaultClassNames.outside}`,
                disabled: `${defaultClassNames.disabled}`,
              }}
              modifiersClassNames={{
                selected: "bg-[#E7F1FF] text-[#2D4485]",
              }}
            />
          </div>
        )}
      </div>
    )
}

function ManufacturingOrderPage() {
  const [orders, setOrders] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("mfgOrders") || "[]") } catch { return [] }
  })
  const [openStatusId, setOpenStatusId] = React.useState(null)
  const [openActivityId, setOpenActivityId] = React.useState(null)
  const [openScheduleForId, setOpenScheduleForId] = React.useState(null)
  const [scheduleDueInput, setScheduleDueInput] = React.useState("")
  const [scheduleText, setScheduleText] = React.useState("")
  const [showNew, setShowNew] = React.useState(false)
  const [newOrder, setNewOrder] = React.useState({ product: "", productNo: "", jobOrderCode: "", purchaseOrder: "", unit: "Unit", quantity: 1, totalQuantity: 1, scheduledDate: "", completedDate: "", productionTime: "", responsible: "", priority: "None", customer: "" })
  const [editingCustomerId, setEditingCustomerId] = React.useState(null)
  const [editingCustomerValue, setEditingCustomerValue] = React.useState("")
  const [editingProductId, setEditingProductId] = React.useState(null)
  const [editingProductValue, setEditingProductValue] = React.useState("")
  const [editingJobOrderCodeId, setEditingJobOrderCodeId] = React.useState(null)
  const [editingJobOrderCodeValue, setEditingJobOrderCodeValue] = React.useState("")
  const [openStateId, setOpenStateId] = React.useState(null)
  const [editingQtyId, setEditingQtyId] = React.useState(null)
  const [editingQtyValue, setEditingQtyValue] = React.useState("")
  const [editingTotalQtyId, setEditingTotalQtyId] = React.useState(null)
  const [editingTotalQtyValue, setEditingTotalQtyValue] = React.useState("")
  const [openPriorityId, setOpenPriorityId] = React.useState(null)
  const [openDeleteId, setOpenDeleteId] = React.useState(null)
  const [openSortMenu, setOpenSortMenu] = React.useState(false)
  const [sortKey, setSortKey] = React.useState("default")
  const [editingStartId, setEditingStartId] = React.useState(null)
  const [editingStartValue, setEditingStartValue] = React.useState("")
  const [remoteLoaded, setRemoteLoaded] = React.useState(false)
  const [openJobFormId, setOpenJobFormId] = React.useState(null)
  const [jobForm, setJobForm] = React.useState(null)
  const [jobFormItems, setJobFormItems] = React.useState([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [columnModes, setColumnModes] = React.useState({})
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openBulkDelete, setOpenBulkDelete] = React.useState(false)
  const [openScheduleMenuKey, setOpenScheduleMenuKey] = React.useState(null)
  const [editingScheduleKey, setEditingScheduleKey] = React.useState(null)
  const [selectedScheduleKey, setSelectedScheduleKey] = React.useState(null)
  const popoverRef = React.useRef(null)
  const [draggingScheduleKey, setDraggingScheduleKey] = React.useState(null)
  const [dragOverIdx, setDragOverIdx] = React.useState(null)
  const [inventoryItems, setInventoryItems] = React.useState([])
  const [showProductDropdown, setShowProductDropdown] = React.useState(false)
  const [printingOrder, setPrintingOrder] = React.useState(null)
  const [poList, setPoList] = React.useState([])
  const [showPoSuggestions, setShowPoSuggestions] = React.useState(false)
  const [crmPoNumbers, setCrmPoNumbers] = React.useState([])
  const applyPoSuggestion = React.useCallback((val) => {
    const s = String(val || "").trim()
    let next = { ...newOrder, purchaseOrder: s }
    const p = poList.find((x) => String(x.poNumber || "").trim() === s)
    if (p) {
      const cname = String((p.customer && (p.customer.company || p.customer.name)) || "").trim()
      if (cname) next.customer = cname
      const it = Array.isArray(p.items) && p.items.length ? p.items[0] : null
      if (it) {
        if (!String(next.product || "").trim()) next.product = String(it.product || it.description || "").trim()
        const q = Number(it.qty)
        if (!Number(next.quantity) && Number.isFinite(q) && q > 0) next.quantity = q
      }
    } else {
      const o = orders.find((x) => String(x.ref || "").trim() === s)
      if (o) {
        if (String(o.customer || "").trim()) next.customer = o.customer
        if (!String(next.product || "").trim() && String(o.product || "").trim()) next.product = o.product
        if (!String(next.productNo || "").trim() && String(o.productNo || "").trim()) next.productNo = o.productNo
        const q1 = Number(o.quantity)
        const q2 = Number(o.totalQuantity)
        if (!Number(next.quantity) && Number.isFinite(q1) && q1 > 0) next.quantity = q1
        if (!Number(next.totalQuantity) && Number.isFinite(q2) && q2 > 0) next.totalQuantity = q2
      }
    }
    setNewOrder(next)
    setShowPoSuggestions(false)
  }, [newOrder, poList, orders])

  const handlePrint = (o) => {
    setPrintingOrder(o)
    setTimeout(() => {
      window.print()
      setPrintingOrder(null)
    }, 100)
  }

  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
      if (Array.isArray(data)) {
        setInventoryItems(data)
      }
    } catch {}
  }, [])
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(data)) setPoList(data)
    } catch {}
  }, [])
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}` } : {}
        const res = await fetch(`${API_BASE_URL}/api/deals/`, { headers })
        if (!res.ok) return
        const data = await res.json()
        const nums = Array.from(new Set((data || []).map(d => String(d.po_number || "").trim()).filter(Boolean)))
        setCrmPoNumbers(nums)
      } catch {}
    })()
  }, [])
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/`)
        if (!res.ok) return
        const data = await res.json()
          const mapped = (Array.isArray(data) ? data : []).map((m) => ({
            id: m.id,
            ref: m.job_order_code,
            jobOrderCode: m.job_order_code || "",
            purchaseOrder: m.po_number || "",
            productNo: m.product_no || "",
            product: m.product || "",
            quantity: Number(m.quantity) || 1,
            totalQuantity: Number(m.quantity) || Number(m.totalQuantity) || Number(m.quantity) || 1,
            start: m.start_date || "",
            completedDate: m.complete_date || "",
            productionTime: m.production_time || "",
            responsible: [
              String(m.responsible_sales_person || "").trim(),
              String(m.responsible_production_person || "").trim(),
            ].filter(Boolean).join(" / "),
            responsibleSales: String(m.responsible_sales_person || "").trim(),
            responsibleProduction: String(m.responsible_production_person || "").trim(),
            customer: m.customer_name || "",
            componentStatus: m.component_status || "",
            state: m.state || "",
            favorite: false,
            selected: false,
            activitySchedules: [],
            items: Array.isArray(m.items)
              ? m.items.map(x => ({
                  itemCode: String((x.item ?? x.itemCode ?? "")).trim(),
                  description: String((x.item_description ?? x.description ?? "")).trim(),
                  qty: String((x.item_quantity ?? x.qty ?? "")),
                  unit: String((x.item_unit ?? x.unit ?? "Unit")),
                }))
              : [],
          }))
        setOrders(mapped)
        setRemoteLoaded(true)
      } catch {}
    })()
  }, [])
  React.useEffect(() => {
    if (!openJobFormId) return
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${openJobFormId}/`)
        if (!res.ok) return
        const m = await res.json()
        setJobForm({
          id: m.id,
          job_order_code: m.job_order_code || "",
          po_number: m.po_number || "",
          customer_name: m.customer_name || "",
          product_no: m.product_no || "",
          quantity: Number(m.quantity) || 1,
          start_date: m.start_date || "",
          complete_date: m.complete_date || "",
          production_time: m.production_time || "",
          sales_department: m.responsible_sales_person || m.sales_department || "",
          production_department: m.responsible_production_person || m.production_department || "",
          supplier: m.supplier || "",
          supplier_date: m.supplier_date || "",
          recipient: m.recipient || "",
          recipient_date: m.recipient_date || "",
        })
        setJobFormItems(Array.isArray(m.items)
          ? m.items.map(x => ({
              itemCode: String((x.item ?? x.itemCode ?? "")).trim(),
              description: String((x.item_description ?? x.description ?? "")).trim(),
              qty: String((x.item_quantity ?? x.qty ?? "")),
              unit: String((x.item_unit ?? x.unit ?? "Unit")),
            }))
          : [])
      } catch {}
    })()
  }, [openJobFormId])
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const mfgId = params.get('mfgId')
      if (mfgId) {
        const idNum = Number(mfgId)
        setOpenJobFormId(Number.isFinite(idNum) ? idNum : mfgId)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!orders.length && !remoteLoaded) {
      const seed = [
        { id: 1, ref: "WH/MO/00001", jobOrderCode: "JO-001", start: new Date(Date.now() - 2*24*60*60*1000).toISOString(), product: "Laser Cladding Machine", nextActivity: "", customer: "Big C Supercenter PLC", componentStatus: "", quantity: 1, totalQuantity: 1, state: "", favorite: false, selected: false },
        { id: 2, ref: "WH/MO/00002", jobOrderCode: "JO-002", start: new Date(Date.now() - 1*24*60*60*1000).toISOString(), product: "Laser Welding Machine", nextActivity: "", customer: "SIANGHAI EITING TRADING COMPANY", componentStatus: "", quantity: 1, totalQuantity: 1, state: "", favorite: true, selected: false },
        { id: 3, ref: "WH/MO/00003", jobOrderCode: "JO-003", start: new Date().toISOString(), product: "Cake", nextActivity: "", customer: "METRO MACHINERY", componentStatus: "", quantity: 10, totalQuantity: 10, state: "", favorite: false, selected: false },
        { id: 4, ref: "WH/MO/00004", jobOrderCode: "JO-004", start: new Date().toISOString(), product: "mohinga", nextActivity: "", customer: "Konvy", componentStatus: "", quantity: 5, totalQuantity: 5, state: "", favorite: false, selected: false },
      ]
      setOrders(seed)
      localStorage.setItem("mfgOrders", JSON.stringify(seed))
    }
  }, [remoteLoaded, orders.length])
  React.useEffect(() => {
    try {
      const pf = JSON.parse(localStorage.getItem("mfgPreFill") || "null")
      if (pf && pf.product) {
        setNewOrder((prev) => ({ ...prev, product: pf.product || pf.sku || prev.product, quantity: Number(pf.quantity) || 1 }))
        setShowNew(true)
        localStorage.removeItem("mfgPreFill")
      }
    } catch {}
  }, [])
  const setAndPersist = (next) => { setOrders(next); localStorage.setItem("mfgOrders", JSON.stringify(next)) }
  const toggleFavorite = (id) => setAndPersist(orders.map(o => o.id===id ? { ...o, favorite: !o.favorite } : o))
  const toggleSelected = (id) => setAndPersist(orders.map(o => o.id===id ? { ...o, selected: !o.selected } : o))
  const totalQty = orders.reduce((a,b)=>a+(parseInt(b.quantity,10)||0),0)
  const totalTotalQty = orders.reduce((a,b)=>a+(parseInt(b.totalQuantity,10)||0),0)
  const relStart = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const diffDays = Math.floor((today.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / (24*60*60*1000))
    if (diffDays<=0) return "Today"
    if (diffDays===1) return "Yesterday"
    return `${diffDays} days ago`
  }
  const relDueInfo = (ms) => {
    const due = new Date(ms)
    const today = new Date()
    const diffDays = Math.floor((new Date(due).setHours(0,0,0,0) - new Date(today).setHours(0,0,0,0)) / (24*60*60*1000))
    if (diffDays===0) return { text: "Today", cls: "text-green-600" }
    if (diffDays===1) return { text: "Tomorrow", cls: "text-blue-600" }
    if (diffDays<0) {
      if (diffDays===-1) return { text: "Yesterday", cls: "text-orange-600" }
      return { text: `${Math.abs(diffDays)} days ago`, cls: "text-red-600" }
    }
    return { text: `In ${diffDays} days`, cls: "text-blue-600" }
  }
  const stateClass = (s) => (s==='Processing' ? 'bg-blue-50 text-[#2D4485]' : s==='Finished' ? 'bg-green-100 text-green-700' : s==='Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700')
  const componentStatusClass = (s) => (s==='Not Available' ? 'bg-red-100 text-red-700' : s==='Available' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700')
  const priorityClass = (p) => (
    p==='High'
      ? 'bg-red-500 text-white ring-2 ring-red-100'
      : p==='Medium'
      ? 'bg-orange-400 text-white ring-2 ring-orange-100'
      : p==='Low'
      ? 'bg-[#2D4485] text-white ring-2 ring-blue-100'
      : 'bg-slate-400 text-white ring-2 ring-slate-200'
  )
  const priorityRank = (p) => (p==='High'?3:p==='Medium'?2:p==='Low'?1:0)
  const nextDueMs = (o) => {
    const arr = (o.activitySchedules||[]).map((it)=>new Date(it.dueAt ?? it.startAt).getTime()).filter((n)=>Number.isFinite(n))
    if (!arr.length) return null
    const now = Date.now()
    const upcoming = arr.filter((t)=>t>=now)
    const pool = upcoming.length ? upcoming : arr
    return Math.min(...pool)
  }
  const nextStartMs = (o) => {
    const arr = (o.activitySchedules||[]).map((it)=>new Date(it.startAt ?? it.dueAt).getTime()).filter((n)=>Number.isFinite(n))
    if (!arr.length) return null
    const now = Date.now()
    const upcoming = arr.filter((t)=>t>=now)
    const pool = upcoming.length ? upcoming : arr
    return Math.min(...pool)
  }
  const nextSchedule = (o) => {
    const arr = (o.activitySchedules||[]).map((s)=>({ s, t: new Date(s.dueAt ?? s.startAt).getTime() })).filter((x)=>Number.isFinite(x.t))
    if (!arr.length) return null
    const now = Date.now()
    const upcoming = arr.filter((x)=>x.t>=now)
    const pool = upcoming.length ? upcoming : arr
    const targetT = Math.min(...pool.map((x)=>x.t))
    const found = pool.find((x)=>x.t===targetT) || arr.find((x)=>x.t===targetT)
    return found ? found.s : null
  }
  const truncate = (str, n) => {
    if (!str) return ""
    return str.length > n ? str.slice(0, n-1) + "…" : str
  }
  const formatActivityPreviewText = (s) => {
    if (!s) return ""
    const t = String(s).trim()
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""
  }
  const moveScheduleUp = (orderId, idx) => {
    const target = orders.find((x)=>x.id===orderId)
    if (!target) return
    const arr = [...(target.activitySchedules||[])]
    if (idx<=0) return
    const tmp = arr[idx-1]
    arr[idx-1] = arr[idx]
    arr[idx] = tmp
    const next = orders.map((x)=>x.id===orderId ? { ...x, activitySchedules: arr } : x)
    setAndPersist(next)
  }
  const moveScheduleDown = (orderId, idx) => {
    const target = orders.find((x)=>x.id===orderId)
    if (!target) return
    const arr = [...(target.activitySchedules||[])]
    if (idx>=arr.length-1) return
    const tmp = arr[idx+1]
    arr[idx+1] = arr[idx]
    arr[idx] = tmp
    const next = orders.map((x)=>x.id===orderId ? { ...x, activitySchedules: arr } : x)
    setAndPersist(next)
  }
  const patchOrder = async (id, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) return
      const m = await res.json()
      setAndPersist(orders.map(x => x.id === id ? {
        ...x,
        componentStatus: m.component_status ?? x.componentStatus,
        state: m.state ?? x.state,
      } : x))
    } catch {}
  }
  const reorderSchedule = (orderId, fromIdx, toIdx) => {
    if (fromIdx===toIdx || fromIdx==null || toIdx==null) return
    const target = orders.find((x)=>x.id===orderId)
    if (!target) return
    const arr = [...(target.activitySchedules||[])]
    const [item] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, item)
    const next = orders.map((x)=>x.id===orderId ? { ...x, activitySchedules: arr } : x)
    setAndPersist(next)
  }
  const isThisWeek = (ms) => {
    if (!ms) return false
    const d = new Date(ms)
    const today = new Date()
    const start = new Date(today)
    start.setHours(0,0,0,0)
    const dow = start.getDay()
    const mondayOffset = (dow+6)%7
    const monday = new Date(start)
    monday.setDate(start.getDate()-mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate()+6)
    return d>=monday && d<=sunday
  }
  const fmtDue = (ms) => {
    if (!ms) return ""
    const d = new Date(ms)
    return d.toLocaleString(undefined, { month: "short", day: "numeric" })
  }
  const fmtFullDate = (ms) => {
    if (!ms) return ""
    const d = new Date(ms)
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }
  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase()
    return [
      o.product,
      o.customer,
      o.jobOrderCode,
      o.ref,
      o.purchaseOrder
    ].some(v => String(v || "").toLowerCase().includes(term))
  })
  const displayOrders = React.useMemo(() => {
    const arr = [...filteredOrders]
    switch (sortKey) {
      case "start_asc":
        return arr.sort((a,b)=> new Date(a.start||0) - new Date(b.start||0))
      case "start_desc":
        return arr.sort((a,b)=> new Date(b.start||0) - new Date(a.start||0))
      case "quantity_asc":
        return arr.sort((a,b)=> (parseInt(a.quantity,10)||0) - (parseInt(b.quantity,10)||0))
      case "quantity_desc":
        return arr.sort((a,b)=> (parseInt(b.quantity,10)||0) - (parseInt(a.quantity,10)||0))
      case "product_az":
        return arr.sort((a,b)=> String(a.product||"").localeCompare(String(b.product||"")))
      case "product_za":
        return arr.sort((a,b)=> String(b.product||"").localeCompare(String(a.product||"")))
      default:
        return arr
    }
  }, [filteredOrders, sortKey])
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredOrders.map(d => d.id))
    } else {
      setSelectedRows([])
    }
  }
  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const handleBulkDelete = async () => {
    if (!selectedRows.length) return
    const ids = [...selectedRows]
    try {
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${id}/`, { method: "DELETE" })
          if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
        } catch {}
      }))
    } finally {
      const next = orders.filter(o => !ids.includes(o.id))
      setAndPersist(next)
      setSelectedRows([])
    }
  }
  const columns = [
    { id: 'index', label: 'Index', width: 'w-16' },
    { id: 'ref', label: 'Job Order' },
    { id: 'productNo', label: 'Product No', defaultClass: 'max-w-xs truncate' },
    { id: 'quantity', label: 'Quantity', defaultClass: 'font-mono text-sm' },
    { id: 'componentStatus', label: 'Component Status' },
    { id: 'state', label: 'State' },
    { id: 'customer', label: 'Customer' },
    { id: 'jobOrderCode', label: 'PO Number' },
    { id: 'responsible', label: 'Responsible' },
    { id: 'start', label: 'Start' },
    { id: 'completedDate', label: 'Completed Date' },
    { id: 'productionTime', label: 'Production Time' },
  ]
  const toggleMode = (id, mode) => {
    setColumnModes(prev => ({
      ...prev,
      [id]: prev[id] === mode ? undefined : mode
    }))
  }
  const renderCellContent = (col, o, index) => {
    if (columnModes[col.id] === 'folded') return <span className="text-gray-300">•</span>
    switch (col.id) {
      case 'index': return <span className="font-medium text-gray-800">{index + 1}</span>
      case 'ref': return (
        <button
          className="text-[#3D56A6] hover:underline font-medium"
          onClick={() => { window.location.href = `/new-mo.html?mfgId=${o.id}` }}
        >
          {o.jobOrderCode || "-"}
        </button>
      )
      case 'jobOrderCode': return <span className="text-gray-800">{o.purchaseOrder || "-"}</span>
      case 'productNo': return <span className="text-gray-800">{o.productNo || "-"}</span>
      case 'quantity': return <span className="text-gray-800">{String(parseInt(o.quantity, 10) || 0)}</span>
      case 'start': return <span className="text-gray-700">{o.start ? fmtFullDate(new Date(o.start).getTime()) : "-"}</span>
      case 'completedDate': return <span className="text-gray-700">{o.completedDate ? fmtFullDate(new Date(o.completedDate).getTime()) : "-"}</span>
      case 'productionTime': return <span className="text-gray-700">{o.productionTime || "-"}</span>
      case 'responsible': return <span className="text-gray-700">{o.responsible || "-"}</span>
      case 'customer': return <span className="text-gray-800">{o.customer || "-"}</span>
      case 'componentStatus':
        return (
          <div className="relative inline-block">
            <button
              className={`${componentStatusClass(o.componentStatus)} px-2 py-1 rounded-full text-xs`}
              onClick={()=>setOpenStatusId(openStatusId===o.id?null:o.id)}
              title="Change component status"
            >
              {o.componentStatus || 'Set Status'}
            </button>
            {openStatusId===o.id && (
              <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-md">
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-green-700"
                  onClick={()=>{ setOpenStatusId(null); patchOrder(o.id, { component_status: 'Available' }) }}
                >
                  Available
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                  onClick={()=>{ setOpenStatusId(null); patchOrder(o.id, { component_status: 'Not Available' }) }}
                >
                  Not Available
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={()=>{ setOpenStatusId(null); patchOrder(o.id, { component_status: '' }) }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )
      case 'state':
        return (
          <div className="relative inline-block">
            <button
              className={`${stateClass(o.state)} px-2 py-1 rounded-full text-xs`}
              onClick={()=>setOpenStateId(openStateId===o.id?null:o.id)}
              title="Change state"
            >
              {o.state || 'Set State'}
            </button>
            {openStateId===o.id && (
              <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-md">
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={()=>{ setOpenStateId(null); patchOrder(o.id, { state: 'Processing' }) }}
                >
                  Processing
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-green-700"
                  onClick={()=>{ setOpenStateId(null); patchOrder(o.id, { state: 'Finished' }) }}
                >
                  Finished
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                  onClick={()=>{ setOpenStateId(null); patchOrder(o.id, { state: 'Cancelled' }) }}
                >
                  Cancelled
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={()=>{ setOpenStateId(null); patchOrder(o.id, { state: '' }) }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )
      default: return <span>-</span>
    }
  }

  const nextJobOrderCode = () => {
    const nums = orders
      .map(o => String(o.jobOrderCode || ""))
      .map(s => {
        const m = s.match(/^JO[-/ ]?(\d{1,5})$/i)
        return m ? parseInt(m[1], 10) : null
      })
      .filter(n => Number.isFinite(n))
    const next = (nums.length ? Math.max(...nums) + 1 : 1)
    return `JO-${String(next).padStart(3, "0")}`
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full bg-gray-50">
        <div className="w-full mx-auto p-6 min-h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800">Manufacturing Orders</h2>
              <button
                className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                title="New MO"
                onClick={() => { window.location.href = "/new-mo.html" }}
              >
                New MO
              </button>
              <div className="relative">
                <button
                  onClick={() => setOpenSortMenu(v => !v)}
                  className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  title="Sort"
                >
                  Sort
                </button>
                {openSortMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-md z-20 w-44">
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("default"); setOpenSortMenu(false)}}>Default</button>
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("start_asc"); setOpenSortMenu(false)}}>Start Date ↑</button>
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("start_desc"); setOpenSortMenu(false)}}>Start Date ↓</button>
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("quantity_asc"); setOpenSortMenu(false)}}>Quantity ↑</button>
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("quantity_desc"); setOpenSortMenu(false)}}>Quantity ↓</button>
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("product_az"); setOpenSortMenu(false)}}>Product A–Z</button>
                    <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setSortKey("product_za"); setOpenSortMenu(false)}}>Product Z–A</button>
                  </div>
                )}
              </div>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Bills of Materials"
                onClick={() => window.location.href = "/bom.html"}
              >
                Bills of Materials
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Components"
                onClick={() => window.location.href = "/products.html"}
              >
                Components
              </button>
            </div>
            <div className="flex items-center gap-6">
              {selectedRows.length > 0 && (
                <button
                  onClick={() => setOpenBulkDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Delete ({selectedRows.length})</span>
                </button>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Product, Customer, JO or MO..."
                  className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear Search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="text-slate-500 font-medium text-sm">
                {searchTerm ? (
                  <span>Showing <span className="text-slate-900 font-bold">{filteredOrders.length}</span> of <span className="text-slate-900 font-bold">{orders.length}</span> orders</span>
                ) : (
                  <span>Total: <span className="text-slate-900 font-bold">{orders.length}</span> orders</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4 border-b w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      onChange={handleSelectAll}
                      checked={filteredOrders.length > 0 && selectedRows.length === filteredOrders.length}
                      ref={input => {
                        if (input) input.indeterminate = selectedRows.length > 0 && selectedRows.length < filteredOrders.length
                      }}
                    />
                  </th>
                  {columns.map(col => {
                    const mode = columnModes[col.id]
                    return (
                      <th 
                        key={col.id} 
                        className={`p-4 border-b transition-all duration-300 group relative align-top ${
                          mode === 'folded' ? 'w-12 max-w-[3rem]' : mode === 'expanded' ? 'min-w-[300px]' : 'whitespace-nowrap'
                        }`}
                      >
                        <div className={`flex items-center justify-between gap-2 ${mode === 'folded' ? 'justify-center' : ''}`}>
                          {mode !== 'folded' && <span>{col.label}</span>}
                          <div className={`flex items-center gap-1 bg-white rounded-md shadow-md border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                            mode === 'folded' ? 'opacity-100 absolute left-1/2 -translate-x-1/2 top-2' : ''
                          }`}>
                            {mode !== 'folded' && (
                              <button 
                                onClick={() => toggleMode(col.id, 'folded')}
                                className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                                title="Fold Column"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            {mode !== 'expanded' ? (
                              <button 
                                onClick={() => toggleMode(col.id, 'expanded')}
                                className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                                title="Fully Expand"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12a1 1 0 01-1-1z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M16 16a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L13.586 13.586V12a1 1 0 012 0v4zM4 12a1 1 0 011 1v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 13.586H8a1 1 0 010 2H4a1 1 0 01-1-1v-4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            ) : (
                              <button 
                                onClick={() => toggleMode(col.id, undefined)}
                                className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                                title="Reset to Default"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayOrders.map((o, index) => (
                  <tr key={o.id} className={`transition border-b border-gray-100 ${selectedRows.includes(o.id) ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                        onChange={() => handleSelectRow(o.id)}
                        checked={selectedRows.includes(o.id)}
                      />
                    </td>
                    {columns.map(col => {
                      const mode = columnModes[col.id]
                      return (
                        <td 
                          key={col.id} 
                          className={`p-4 transition-all duration-300 align-top ${
                            mode === 'folded' 
                              ? 'w-12 max-w-[3rem] text-center overflow-hidden p-2' 
                              : mode === 'expanded'
                                ? 'min-w-[300px] whitespace-normal break-words text-gray-600'
                                : `whitespace-nowrap text-gray-600 ${col.defaultClass || ''}`
                          }`}
                        >
                          {renderCellContent(col, o, index)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">
                      {searchTerm ? "No matching orders found." : "No manufacturing orders."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {openDeleteId && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenDeleteId(null)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border-2 border-white">
              <div className="px-4 py-3 border-b-2 border-white">
                <h3 className="font-semibold text-gray-900">Confirm Delete</h3>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-800">Delete this order?</div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenDeleteId(null)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${openDeleteId}/`, { method: "DELETE" })
                      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
                    } catch {}
                    setAndPersist(orders.filter((x)=>x.id!==openDeleteId))
                    setOpenDeleteId(null)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openBulkDelete && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenBulkDelete(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border-2 border-white">
              <div className="px-4 py-3 border-b-2 border-white">
                <h3 className="font-semibold text-gray-900">Confirm Delete</h3>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-800">Delete {selectedRows.length} orders?</div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenBulkDelete(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={async () => { await handleBulkDelete(); setOpenBulkDelete(false) }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openJobFormId && jobForm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setOpenJobFormId(null); setJobForm(null); setJobFormItems([]) }}>
          <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[1000px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Job Order</h3>
                  <span className="text-gray-500">#{jobForm.job_order_code || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      const o = orders.find(x => x.id === openJobFormId)
                      if (o) {
                        setPrintingOrder({
                          ...o,
                          totalQuantity: o.totalQuantity || o.quantity || 1,
                          productNo: o.productNo || "",
                          completedDate: o.completedDate || "",
                        })
                        setTimeout(() => { window.print(); setPrintingOrder(null) }, 100)
                      }
                    }}
                  >
                    Print
                  </button>
                  <button className="text-gray-500 hover:text-gray-900" onClick={() => { setOpenJobFormId(null); setJobForm(null); setJobFormItems([]) }}>✕</button>
                </div>
              </div>
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Customer Name</div>
                    <input value={jobForm.customer_name} onChange={(e)=>setJobForm({...jobForm, customer_name:e.target.value})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Start Date</div>
                    <DateField
                      value={jobForm.start_date}
                      onChange={(v)=>setJobForm({...jobForm, start_date:v})}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Order Quantity</div>
                    <input value={jobForm.quantity} onChange={(e)=>setJobForm({...jobForm, quantity:e.target.value})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Product No</div>
                    <input value={jobForm.product_no} onChange={(e)=>setJobForm({...jobForm, product_no:e.target.value})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Completed Date</div>
                    <DateField
                      value={jobForm.complete_date}
                      onChange={(v)=>setJobForm({...jobForm, complete_date:v})}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Supplier Date</div>
                    <DateField
                      value={jobForm.supplier_date}
                      onChange={(v)=>setJobForm({...jobForm, supplier_date:v})}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Recipient Date</div>
                    <DateField
                      value={jobForm.recipient_date}
                      onChange={(v)=>setJobForm({...jobForm, recipient_date:v})}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Time of Production</div>
                    <input value={jobForm.production_time} onChange={(e)=>setJobForm({...jobForm, production_time:e.target.value})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Product Items Description</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                        <tr>
                          <th className="p-3 border-b">Item Code</th>
                          <th className="p-3 border-b">Description</th>
                          <th className="p-3 border-b">Quantity</th>
                          <th className="p-3 border-b">Unit</th>
                          <th className="p-3 border-b w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {jobFormItems.map((it, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                            <td className="p-3">
                              <input value={it.itemCode} onChange={(e)=>setJobFormItems(prev=>prev.map((row,idx)=>idx===i?{...row,itemCode:e.target.value}:row))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Code" />
                            </td>
                            <td className="p-3">
                              <input value={it.description} onChange={(e)=>setJobFormItems(prev=>prev.map((row,idx)=>idx===i?{...row,description:e.target.value}:row))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Item description" />
                            </td>
                            <td className="p-3">
                              <input value={it.qty} onChange={(e)=>setJobFormItems(prev=>prev.map((row,idx)=>idx===i?{...row,qty:e.target.value}:row))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="1" />
                            </td>
                            <td className="p-3">
                              <input value={it.unit} onChange={(e)=>setJobFormItems(prev=>prev.map((row,idx)=>idx===i?{...row,unit:e.target.value}:row))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Unit" />
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={()=>setJobFormItems(prev=>prev.filter((_,idx)=>idx!==i))} className="px-2 py-1 rounded-md text-red-600 hover:bg-red-50">Delete</button>
                            </td>
                          </tr>
                        ))}
                        {jobFormItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-400">No items</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <button onClick={()=>setJobFormItems(prev=>[...prev,{ itemCode:"", description:"", qty:"1", unit:"Unit"}])} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Add Item</button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => { setOpenJobFormId(null); setJobForm(null); setJobFormItems([]) }}>Cancel</button>
                  <button
                    className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                    onClick={async () => {
                      const payload = {
                        job_order_code: String(jobForm.job_order_code || "").trim(),
                        po_number: String(jobForm.po_number || "").trim(),
                        write_customer_name: String(jobForm.customer_name || "").trim(),
                        product_no: String(jobForm.product_no || "").trim(),
                        quantity: Number(jobForm.quantity) || 1,
                        start_date: jobForm.start_date || null,
                        complete_date: jobForm.complete_date || null,
                        supplier: String(jobForm.supplier || "").trim(),
                        supplier_date: jobForm.supplier_date || null,
                        recipient: String(jobForm.recipient || "").trim(),
                        recipient_date: jobForm.recipient_date || null,
                        production_time: String(jobForm.production_time || "").trim(),
                        responsible_sales_person: String(jobForm.sales_department || "").trim(),
                        responsible_production_person: String(jobForm.production_department || "").trim(),
                        items: jobFormItems,
                      }
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${jobForm.id}/`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        })
                        if (!res.ok) return
                        const updated = await res.json()
                        setOrders(prev => prev.map(x => x.id===openJobFormId ? {
                          ...x,
                          jobOrderCode: updated.job_order_code || x.jobOrderCode,
                          purchaseOrder: updated.po_number || x.purchaseOrder,
                          productNo: updated.product_no || x.productNo,
                          quantity: Number(updated.quantity) || x.quantity,
                          start: updated.start_date || x.start,
                          completedDate: updated.complete_date || x.completedDate,
                          productionTime: updated.production_time || x.productionTime,
                          responsible: [
                            String(updated.responsible_sales_person || "").trim(),
                            String(updated.responsible_production_person || "").trim(),
                          ].filter(Boolean).join(" / ") || x.responsible,
                          customer: updated.customer_name || x.customer,
                          supplierDate: updated.supplier_date ?? x.supplierDate,
                          recipientDate: updated.recipient_date ?? x.recipientDate,
                          items: Array.isArray(updated.items) ? updated.items : x.items,
                        } : x))
                        setOpenJobFormId(null)
                        setJobForm(null)
                        setJobFormItems([])
                      } catch {}
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setShowNew(false)}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[960px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">New Manufacturing Order</h3>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setShowNew(false)}>✕</button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Job Order Code</div>
                    <input value={newOrder.jobOrderCode} onChange={(e)=>setNewOrder({...newOrder, jobOrderCode:e.target.value})} placeholder="e.g. JO-001" className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Purchase Order</div>
                    <div className="relative">
                      <input
                        value={newOrder.purchaseOrder}
                        onChange={(e)=>{ setNewOrder({...newOrder, purchaseOrder:e.target.value}); setShowPoSuggestions(true) }}
                        onFocus={()=>setShowPoSuggestions(true)}
                        placeholder="e.g. PO-1234"
                        className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none"
                      />
                      {showPoSuggestions && newOrder.purchaseOrder && (() => {
                        const q = newOrder.purchaseOrder.toLowerCase()
                        const candidates = Array.from(new Set([
                          ...orders.map(o => String(o.ref || "").trim()).filter(Boolean),
                          ...poList.map(p => String(p.poNumber || "").trim()).filter(Boolean),
                          ...crmPoNumbers,
                        ])).filter(x => x.toLowerCase().includes(q)).slice(0, 8)
                        return candidates.length ? (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                            {candidates.map((val, i) => (
                              <button
                                key={`${val}-${i}`}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                onClick={() => applyPoSuggestion(val)}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Item code</div>
                    <input value={newOrder.productNo} onChange={(e)=>setNewOrder({...newOrder, productNo:e.target.value})} placeholder="e.g. LCM-001" className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Product</div>
                    <div className="flex items-center gap-2">
                      <input value={newOrder.product} onChange={(e)=>setNewOrder({...newOrder, product:e.target.value})} placeholder="Product to build..." className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                      <button className="btn-pill px-3">▾</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Unit</div>
                    <input value={newOrder.unit} onChange={(e)=>setNewOrder({...newOrder, unit:e.target.value})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Quantity</div>
                    <div className="flex items-center gap-3">
                      <input type="number" value={newOrder.quantity} onChange={(e)=>setNewOrder({...newOrder, quantity:Number(e.target.value)})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Total Quantity</div>
                    <div className="flex items-center gap-3">
                      <input type="number" value={newOrder.totalQuantity} onChange={(e)=>setNewOrder({...newOrder, totalQuantity:Number(e.target.value)})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Start Date</div>
                    <input type="datetime-local" value={newOrder.scheduledDate} onChange={(e)=>setNewOrder({...newOrder, scheduledDate:e.target.value})} className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Completed Date</div>
                    <input type="datetime-local" value={newOrder.completedDate} onChange={(e)=>setNewOrder({...newOrder, completedDate:e.target.value})} className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Production Time</div>
                    <input value={newOrder.productionTime} onChange={(e)=>setNewOrder({...newOrder, productionTime:e.target.value})} placeholder="e.g. 2 Days" className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Responsible</div>
                    <input value={newOrder.responsible} onChange={(e)=>setNewOrder({...newOrder, responsible:e.target.value})} placeholder="Person responsible" className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Customer Company</div>
                    <input value={newOrder.customer} onChange={(e)=>setNewOrder({...newOrder, customer:e.target.value})} placeholder="Add customer company" className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Priority</div>
                    <select value={newOrder.priority} onChange={(e)=>setNewOrder({...newOrder, priority:e.target.value})} className="w-64 rounded-md border border-gray-300 px-2 py-1">
                      <option value="None">None</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                    <button className="btn-pill" onClick={() => setShowNew(false)}>Cancel</button>
                    <button
                      className="btn-pill"
                      onClick={() => {
                        const ref = (newOrder.purchaseOrder && newOrder.purchaseOrder.trim()) ? newOrder.purchaseOrder.trim() : `WH/MO/${String((orders[0]?.id||0)+1).padStart(5,'0')}`
                        const o = {
                          id: Date.now(),
                          ref,
                          jobOrderCode: newOrder.jobOrderCode || "",
                          start: newOrder.scheduledDate || new Date().toISOString(),
                          productNo: newOrder.productNo || "",
                          product: newOrder.product || "Untitled",
                          unit: newOrder.unit || "Unit",
                          completedDate: newOrder.completedDate || "",
                          productionTime: newOrder.productionTime || "",
                          responsible: newOrder.responsible || "",
                          nextActivity: "",
                          customer: newOrder.customer || "",
                          componentStatus: "",
                          quantity: Number(newOrder.quantity) || 1,
                          totalQuantity: Number(newOrder.totalQuantity) || 1,
                          state: "",
                          priority: newOrder.priority || "None",
                          favorite: false,
                          selected: false,
                        }
                        const next = [o, ...orders]
                        setOrders(next)
                        localStorage.setItem("mfgOrders", JSON.stringify(next))
                        setShowNew(false)
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {printingOrder && createPortal(
        <div className="print-portal">
          <style>
            {`
              @media print {
                body > *:not(.print-portal) { display: none !important; }
                .print-portal { 
                  display: block !important; 
                  position: absolute; 
                  top: 0; 
                  left: 0; 
                  width: 100%; 
                  background: white; 
                  z-index: 9999;
                }
                @page { margin: 0; size: auto; }
              }
              .print-portal { display: none; }
            `}
          </style>
          <JobOrderTemplate order={printingOrder} />
        </div>,
        document.body
      )}
    </main>
      )
    }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ManufacturingOrderPage />
    </LanguageProvider>
  </React.StrictMode>,
)
