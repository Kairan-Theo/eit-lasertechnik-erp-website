import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { JobOrderTemplate } from "./components/job-order-template.jsx"
import "./index.css"
import { API_BASE_URL } from "./config"

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
    if (!orders.length) {
      const seed = [
        { id: 1, ref: "WH/MO/00001", jobOrderCode: "JO-001", start: new Date(Date.now() - 2*24*60*60*1000).toISOString(), product: "Laser Cladding Machine", nextActivity: "", customer: "Big C Supercenter PLC", componentStatus: "", quantity: 1, totalQuantity: 1, state: "", favorite: false, selected: false },
        { id: 2, ref: "WH/MO/00002", jobOrderCode: "JO-002", start: new Date(Date.now() - 1*24*60*60*1000).toISOString(), product: "Laser Welding Machine", nextActivity: "", customer: "SIANGHAI EITING TRADING COMPANY", componentStatus: "", quantity: 1, totalQuantity: 1, state: "", favorite: true, selected: false },
        { id: 3, ref: "WH/MO/00003", jobOrderCode: "JO-003", start: new Date().toISOString(), product: "Cake", nextActivity: "", customer: "METRO MACHINERY", componentStatus: "", quantity: 10, totalQuantity: 10, state: "", favorite: false, selected: false },
        { id: 4, ref: "WH/MO/00004", jobOrderCode: "JO-004", start: new Date().toISOString(), product: "mohinga", nextActivity: "", customer: "Konvy", componentStatus: "", quantity: 5, totalQuantity: 5, state: "", favorite: false, selected: false },
      ]
      setOrders(seed)
      localStorage.setItem("mfgOrders", JSON.stringify(seed))
    }
  }, [])
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

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manufacturing Order</h1>
              <button
                className="inline-flex items-center justify-center min-w-[150px] btn-pill"
                title="New MO"
                onClick={() => setShowNew(true)}
              >
                New MO
              </button>
              <div className="relative">
                <button
                  className="btn-pill shadow-sm"
                  title="Sort and group"
                  onClick={()=>setOpenSortMenu((v)=>!v)}
                >
                  Sort ▾
                </button>
                {openSortMenu && (
                  <div className="absolute z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                    <button
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortKey==='default'?'text-[#3D56A6] font-semibold':''}`}
                      onClick={()=>{ setSortKey("default"); setOpenSortMenu(false) }}
                    >
                      Default
                    </button>
                    <button
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortKey==='priority'?'text-[#3D56A6] font-semibold':''}`}
                      onClick={()=>{ setSortKey("priority"); setOpenSortMenu(false) }}
                    >
                      By Priority
                    </button>
                  </div>
                )}
              </div>
              <button
                className="btn-pill"
                title="Component"
                onClick={() => window.location.href = "/products.html"}
              >
                Component
              </button>
              <button
                className="btn-pill"
                title="Bill of Materials"
                onClick={() => window.location.href = "/bom.html"}
              >
                Bill of Materials
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-700 bg-gray-50">
                  <th className="p-3 w-8"></th>
                  <th className="p-3 text-left font-medium">Priority</th>
                  <th className="p-3 text-left font-medium">Job Order</th>
                  <th className="p-3 text-left font-medium">Purchase Order</th>
                  <th className="p-3 text-left font-medium">Item code</th>
                  <th className="p-3 text-left font-medium">Product</th>
                  <th className="p-3 text-left font-medium">Unit</th>
                  <th className="p-3 text-right font-medium">Quantity</th>
                  <th className="p-3 text-right font-medium">Total Quantity</th>
                  <th className="p-3 text-left font-medium">Start</th>
                  <th className="p-3 text-left font-medium">Completed Date</th>
                  <th className="p-3 text-left font-medium">Production Time</th>
                  <th className="p-3 text-left font-medium">Responsible</th>
                  <th className="p-3 text-left font-medium">Customer</th>
                  <th className="p-3 text-left font-medium">Component Status</th>
                  <th className="p-3 text-left font-medium">State</th>
                  <th className="p-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {[...orders].sort((a,b)=>{
                  if (sortKey==="priority") {
                    const ra = priorityRank(a.priority)
                    const rb = priorityRank(b.priority)
                    return rb - ra || String(a.ref).localeCompare(String(b.ref))
                  }
                  return String(a.ref).localeCompare(String(b.ref))
                }).map((o)=> (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={o.selected} onChange={()=>toggleSelected(o.id)} />
                    </td>
                    <td className="p-3">
                      <div className="relative inline-block">
                        <button
                          className={`${priorityClass(o.priority)} px-2 py-1 rounded-full text-xs`}
                          onClick={()=>setOpenPriorityId(openPriorityId===o.id?null:o.id)}
                          title="Change priority"
                        >
                          {o.priority && o.priority!=='None' ? o.priority : 'Set Priority'}
                        </button>
                        {openPriorityId===o.id && (
                          <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-md">
                            <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-yellow-700" onClick={()=>{setOpenPriorityId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, priority:'Low'}:x))}}>Low</button>
                            <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-orange-700" onClick={()=>{setOpenPriorityId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, priority:'Medium'}:x))}}>Medium</button>
                            <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-700" onClick={()=>{setOpenPriorityId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, priority:'High'}:x))}}>High</button>
                            <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{setOpenPriorityId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, priority:'None'}:x))}}>Clear</button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {editingJobOrderCodeId===o.id ? (
                        <input
                          autoFocus
                          value={editingJobOrderCodeValue}
                          onChange={(e)=>setEditingJobOrderCodeValue(e.target.value)}
                          onBlur={()=>{
                            const v = editingJobOrderCodeValue.trim()
                            const next = orders.map(x=>x.id===o.id?{...x, jobOrderCode:v}:x)
                            setAndPersist(next)
                            setEditingJobOrderCodeId(null)
                            setEditingJobOrderCodeValue("")
                          }}
                          onKeyDown={(e)=>{
                            if (e.key==='Enter') {
                              e.preventDefault()
                              const v = editingJobOrderCodeValue.trim()
                              const next = orders.map(x=>x.id===o.id?{...x, jobOrderCode:v}:x)
                              setAndPersist(next)
                              setEditingJobOrderCodeId(null)
                              setEditingJobOrderCodeValue("")
                            } else if (e.key==='Escape') {
                              setEditingJobOrderCodeId(null)
                              setEditingJobOrderCodeValue("")
                            }
                          }}
                          className="w-32 rounded-md border border-gray-300 px-2 py-1"
                        />
                      ) : (
                        <button
                          className="text-[#3D56A6] hover:underline"
                          onClick={()=>{ setEditingJobOrderCodeId(o.id); setEditingJobOrderCodeValue(o.jobOrderCode || "") }}
                          title="Edit Job Order"
                        >
                          {o.jobOrderCode || '-'}
                        </button>
                      )}
                    </td>
                    <td className="p-3">
                      <a className="text-[#3D56A6] hover:underline font-medium" href="#">{o.ref}</a>
                    </td>
                    <td className="p-3 text-gray-700">{o.productNo || '-'}</td>
                    <td className="p-3">
                      {editingProductId===o.id ? (
                        <input
                          autoFocus
                          value={editingProductValue}
                          onChange={(e)=>setEditingProductValue(e.target.value)}
                          onBlur={()=>{
                            const v = editingProductValue.trim()
                            const next = orders.map(x=>x.id===o.id?{...x, product:v || "Untitled"}:x)
                            setAndPersist(next)
                            setEditingProductId(null)
                            setEditingProductValue("")
                          }}
                          onKeyDown={(e)=>{
                            if (e.key==='Enter') {
                              e.preventDefault()
                              const v = editingProductValue.trim()
                              const next = orders.map(x=>x.id===o.id?{...x, product:v || "Untitled"}:x)
                              setAndPersist(next)
                              setEditingProductId(null)
                              setEditingProductValue("")
                            } else if (e.key==='Escape') {
                              setEditingProductId(null)
                              setEditingProductValue("")
                            }
                          }}
                          className="w-72 rounded-md border border-gray-300 px-2 py-1"
                          placeholder="Add product"
                        />
                      ) : (
                        <button
                          className="text-[#3D56A6] hover:underline"
                          onClick={()=>{ setEditingProductId(o.id); setEditingProductValue(o.product || "") }}
                          title="Edit product"
                        >
                          {o.product || 'Add product'}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingQtyId===o.id ? (
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          step="1"
                          value={editingQtyValue}
                          onChange={(e)=>setEditingQtyValue(e.target.value)}
                          onBlur={()=>{ 
                            const v = Math.max(0, Math.floor(Number(editingQtyValue||0)))
                            const next = orders.map(x=>x.id===o.id?{...x, quantity:v}:x)
                            setAndPersist(next)
                            setEditingQtyId(null)
                            setEditingQtyValue("")
                          }}
                          onKeyDown={(e)=>{
                            if (e.key==='Enter') {
                              e.preventDefault()
                              const v = Math.max(0, Math.floor(Number(editingQtyValue||0)))
                              const next = orders.map(x=>x.id===o.id?{...x, quantity:v}:x)
                              setAndPersist(next)
                              setEditingQtyId(null)
                              setEditingQtyValue("")
                            } else if (e.key==='Escape') {
                              setEditingQtyId(null)
                              setEditingQtyValue("")
                            }
                          }}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right bg-white"
                          placeholder="0"
                        />
                      ) : (
                        <button
                          className="text-[#3D56A6] font-medium hover:underline"
                          onClick={()=>{ setEditingQtyId(o.id); setEditingQtyValue(String(parseInt(o.quantity,10)||0)) }}
                          title="Edit quantity"
                        >
                          {String(parseInt(o.quantity,10)||0)}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">{o.unit || 'Unit'}</td>
                    <td className="p-3 text-right">
                      {editingTotalQtyId===o.id ? (
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          step="1"
                          value={editingTotalQtyValue}
                          onChange={(e)=>setEditingTotalQtyValue(e.target.value)}
                          onBlur={()=>{
                            const v = Math.max(0, Math.floor(Number(editingTotalQtyValue||0)))
                            const next = orders.map(x=>x.id===o.id?{...x, totalQuantity:v}:x)
                            setAndPersist(next)
                            setEditingTotalQtyId(null)
                            setEditingTotalQtyValue("")
                          }}
                          onKeyDown={(e)=>{
                            if (e.key==='Enter') {
                              e.preventDefault()
                              const v = Math.max(0, Math.floor(Number(editingTotalQtyValue||0)))
                              const next = orders.map(x=>x.id===o.id?{...x, totalQuantity:v}:x)
                              setAndPersist(next)
                              setEditingTotalQtyId(null)
                              setEditingTotalQtyValue("")
                            } else if (e.key==='Escape') {
                              setEditingTotalQtyId(null)
                              setEditingTotalQtyValue("")
                            }
                          }}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right bg-white"
                          placeholder="0"
                        />
                      ) : (
                        <button
                          className="text-[#3D56A6] font-medium hover:underline"
                          onClick={()=>{ setEditingTotalQtyId(o.id); setEditingTotalQtyValue(String(parseInt(o.totalQuantity,10)||0)) }}
                          title="Edit total quantity"
                        >
                          {String(parseInt(o.totalQuantity,10)||0)}
                        </button>
                      )}
                    </td>
                    <td className="p-3">
                      {editingStartId===o.id ? (
                        <input
                          autoFocus
                          type="datetime-local"
                          value={editingStartValue}
                          onChange={(e)=>setEditingStartValue(e.target.value)}
                          onBlur={()=>{
                            const iso = editingStartValue ? new Date(editingStartValue).toISOString() : o.start
                            const next = orders.map(x=>x.id===o.id?{...x, start: iso}:x)
                            setAndPersist(next)
                            setEditingStartId(null)
                            setEditingStartValue("")
                          }}
                          onKeyDown={(e)=>{
                            if (e.key==='Enter') {
                              e.preventDefault()
                              const iso = editingStartValue ? new Date(editingStartValue).toISOString() : o.start
                              const next = orders.map(x=>x.id===o.id?{...x, start: iso}:x)
                              setAndPersist(next)
                              setEditingStartId(null)
                              setEditingStartValue("")
                            } else if (e.key==='Escape') {
                              setEditingStartId(null)
                              setEditingStartValue("")
                            }
                          }}
                          className="w-56 rounded-md border border-gray-300 px-2 py-1"
                        />
                      ) : (
                        <button
                          className="text-gray-700 hover:underline"
                          onClick={()=>{
                            const v = (o.start || "").slice(0,16)
                            setEditingStartId(o.id)
                            setEditingStartValue(v)
                          }}
                          title="Edit start"
                        >
                          {o.start ? fmtFullDate(new Date(o.start).getTime()) : (relStart(o.start))}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">{o.completedDate ? fmtFullDate(new Date(o.completedDate).getTime()) : '-'}</td>
                    <td className="p-3 text-gray-700">{o.productionTime || '-'}</td>
                    <td className="p-3 text-gray-700">{o.responsible || '-'}</td>
                    <td className="p-3">
                      {editingCustomerId===o.id ? (
                        <input
                          autoFocus
                          value={editingCustomerValue}
                          onChange={(e)=>setEditingCustomerValue(e.target.value)}
                          onBlur={()=>{
                            const v = editingCustomerValue.trim()
                            const next = orders.map(x=>x.id===o.id?{...x, customer:v}:x)
                            setAndPersist(next)
                            setEditingCustomerId(null)
                            setEditingCustomerValue("")
                          }}
                          onKeyDown={(e)=>{
                            if (e.key==='Enter') {
                              e.preventDefault()
                              const v = editingCustomerValue.trim()
                              const next = orders.map(x=>x.id===o.id?{...x, customer:v}:x)
                              setAndPersist(next)
                              setEditingCustomerId(null)
                              setEditingCustomerValue("")
                            } else if (e.key==='Escape') {
                              setEditingCustomerId(null)
                              setEditingCustomerValue("")
                            }
                          }}
                          className="w-72 rounded-md border border-gray-300 px-2 py-1"
                          placeholder="Add customer"
                        />
                      ) : (
                        <button
                          className={`text-left ${o.customer ? 'text-gray-800' : 'text-gray-400'} hover:underline`}
                          onClick={()=>{ setEditingCustomerId(o.id); setEditingCustomerValue(o.customer || "") }}
                          title="Edit customer"
                        >
                          {o.customer || 'Add customer'}
                        </button>
                      )}
                    </td>
                    <td className="p-3">
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
                              onClick={()=>{setOpenStatusId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, componentStatus:'Available'}:x))}}
                            >
                              Available
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                              onClick={()=>{setOpenStatusId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, componentStatus:'Not Available'}:x))}}
                            >
                              Not Available
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={()=>{setOpenStatusId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, componentStatus:''}:x))}}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
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
                              onClick={()=>{ setOpenStateId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, state:'Processing'}:x)) }}
                            >
                              Processing
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-green-700"
                              onClick={()=>{ setOpenStateId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, state:'Finished'}:x)) }}
                            >
                              Finished
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                              onClick={()=>{ setOpenStateId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, state:'Cancelled'}:x)) }}
                            >
                              Cancelled
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={()=>{ setOpenStateId(null); setAndPersist(orders.map(x=>x.id===o.id?{...x, state:''}:x)) }}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="relative inline-block">
                        <button
                          aria-label="Delete order"
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-900 hover:text-white shadow-sm"
                          onClick={()=>setOpenDeleteId(openDeleteId===o.id?null:o.id)}
                          title="Delete order"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td className="p-3" colSpan={7}></td>
                  <td className="p-3 text-right font-bold text-gray-900">{String(parseInt(totalQty,10)||0)}</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-bold text-gray-900">{String(parseInt(totalTotalQty,10)||0)}</td>
                  <td className="p-3" colSpan={8}></td>
                </tr>
              </tfoot>
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
                  onClick={() => { setAndPersist(orders.filter((x)=>x.id!==openDeleteId)); setOpenDeleteId(null) }}
                >
                  Delete
                </button>
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
