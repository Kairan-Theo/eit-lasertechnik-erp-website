import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import Navigation from "./components/navigation.jsx"
import "./index.css"
import { API_BASE_URL } from "./config"
import { JobOrderTemplate } from "./components/job-order-template.jsx"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash } from "lucide-react"

function NewMOPage() {
  const [orders, setOrders] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("mfgOrders") || "[]") } catch { return [] }
  })
  const [isEditMode, setIsEditMode] = React.useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return !!params.get('mfgId')
    } catch {
      return false
    }
  })
  const [remoteJobCodes, setRemoteJobCodes] = React.useState([])
  const [poList, setPoList] = React.useState([])
  const [crmPoNumbers, setCrmPoNumbers] = React.useState([])
  const [showPoSuggestions, setShowPoSuggestions] = React.useState(false)
  const [newOrder, setNewOrder] = React.useState({
    product: "",
    productNo: "",
    jobOrderCode: "",
    purchaseOrder: "",
    quantity: 1,
    scheduledDate: "",
    completedDate: "",
    productionTime: "",
    responsible: "",
    priority: "None",
    customer: "",
    salesDepartment: "",
    productionDepartment: "",
    supplier: "",
    supplierDate: "",
    recipient: "",
    recipientDate: ""
  })
  const [items, setItems] = React.useState(() => {
    if (!isEditMode) {
      try {
        const draft = JSON.parse(localStorage.getItem("newMoDraftItems") || "null")
        if (Array.isArray(draft) && draft.length) {
          return draft.map((x, i) => ({ ...x, itemCode: x.itemCode || String(i + 1) }))
        }
      } catch {}
    }
    return [{ itemCode: "1", description: "", qty: "1", unit: "Unit" }]
  })
  const [itemsTouched, setItemsTouched] = React.useState(false)
  const [previewOrder, setPreviewOrder] = React.useState(null)
  const [printOrder, setPrintOrder] = React.useState(null)
  const [previewZoom, setPreviewZoom] = React.useState(0.5)
  const [previewOrientation, setPreviewOrientation] = React.useState("portrait")

  const syncItemsFromBOM = React.useCallback(() => {
    const key = String(newOrder.productNo || "").trim().toLowerCase()
    if (!key) return false
    try {
      const bomList = JSON.parse(localStorage.getItem("mfgBOMs") || "[]")
      if (!Array.isArray(bomList) || !bomList.length) return
      const match = bomList.find(b => String(b.product || "").trim().toLowerCase() === key)
      if (!match) return false
      const pt = match.productTree
      const systems = pt && !Array.isArray(pt)
        ? (pt.systems || [])
        : Array.isArray(pt)
          ? pt
          : []
      const comps = systems.flatMap(s => (s.components || []).map(c => ({
        itemCode: "",
        description: String(c.name || "").trim(),
        qty: String(Number(c.qty) || 1),
        unit: "Unit",
      })))
      if (comps.length) {
        setItems(comps.map((x, idx) => ({ ...x, itemCode: x.itemCode || String(idx + 1) })))
        return true
      }
      return false
    } catch {
      return false
    }
  }, [newOrder.productNo])

  React.useEffect(() => {
    const isDefault = items.length === 1 && !String(items[0]?.description || "").trim() && String(items[0]?.qty || "") === "1" && String(items[0]?.unit || "") === "Unit"
    if (!isEditMode && !itemsTouched && isDefault) {
      syncItemsFromBOM()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrder.productNo, itemsTouched, isEditMode])
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)

  React.useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        if (!isEditMode && !itemsTouched) syncItemsFromBOM()
      }
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [itemsTouched, syncItemsFromBOM, isEditMode])

  React.useEffect(() => {
    localStorage.setItem("newMoDraftItems", JSON.stringify(items))
  }, [items])
  React.useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem("newMoDraftItems") || "null")
      if (!isEditMode && Array.isArray(draft) && draft.length) setItemsTouched(true)
    } catch {}
  }, [isEditMode])

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

  React.useEffect(() => {
    const handleAfterPrint = () => {
      setPrintOrder(null)
    }
    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [])
  React.useEffect(() => {
    if (printOrder) {
      setTimeout(() => window.print(), 120)
    }
  }, [printOrder])
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/`)
        if (!res.ok) return
        const data = await res.json()
        const codes = (Array.isArray(data) ? data : []).map(d => String(d.job_order_code || "").trim()).filter(Boolean)
        const list = Array.isArray(data) ? data : []
        setRemoteJobCodes(codes)
        window.__remoteManufacturingOrders = list
        if (!isEditMode) {
          const nums = codes
            .map(s => {
              const m = s.match(/^JO[-/ ]?(\d{1,5})$/i)
              return m ? parseInt(m[1], 10) : null
            })
            .filter(n => Number.isFinite(n))
          const next = (nums.length ? Math.max(...nums) + 1 : 1)
          const auto = `JO-${String(next).padStart(3, "0")}`
          setNewOrder(prev => ({ ...prev, jobOrderCode: auto }))
        }
      } catch {
        if (!isEditMode) {
          const auto = `JO-${String(1).padStart(3, "0")}`
          setNewOrder(prev => ({ ...prev, jobOrderCode: auto }))
        }
      }
    })()
  }, [isEditMode])
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('mfgId')
      if (id) {
        ;(async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${id}/`)
            if (!res.ok) return
            const m = await res.json()
            setNewOrder(prev => ({
              ...prev,
              jobOrderCode: m.job_order_code || prev.jobOrderCode,
              purchaseOrder: m.po_number || prev.purchaseOrder,
              customer: m.customer_name || prev.customer,
              productNo: m.product_no || prev.productNo,
              quantity: Number(m.quantity) || prev.quantity,
              scheduledDate: m.start_date || prev.scheduledDate,
              completedDate: m.complete_date || prev.completedDate,
              productionTime: m.production_time || prev.productionTime,
              salesDepartment: m.responsible_sales_person || m.sales_department || prev.salesDepartment,
              productionDepartment: m.responsible_production_person || m.production_department || prev.productionDepartment,
              supplier: m.supplier || prev.supplier,
              supplierDate: m.supplier_date || prev.supplierDate,
              recipient: m.recipient || prev.recipient,
              recipientDate: m.recipient_date || prev.recipientDate,
            }))
            const its = Array.isArray(m.items)
              ? m.items.map(x => ({
                  itemCode: String(x.item ?? x.itemCode ?? "").trim(),
                  description: String(x.item_description ?? x.description ?? "").trim(),
                  qty: String(x.item_quantity ?? x.qty ?? ""),
                  unit: String(x.item_unit ?? x.unit ?? "Unit")
                }))
              : []
            if (its.length) {
              setItems(its.map((x, idx) => ({ ...x, itemCode: x.itemCode || String(idx + 1) })))
              setItemsTouched(true)
            }
          } catch {}
        })()
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(data)) setPoList(data)
    } catch {}
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
    }
    setNewOrder(next)
    setShowPoSuggestions(false)
  }, [newOrder, poList])

  const createOrderData = async () => {
    const token = localStorage.getItem("authToken")
    const headers = { "Content-Type": "application/json" }
    if (token) headers["Authorization"] = `Token ${token}`
    const toDateOrNull = (s) => {
      const v = String(s || "").trim()
      return v ? v : null
    }
    const normalizedItems = items.map((x, i) => ({ ...x, itemCode: x.itemCode || String(i + 1) }))
    const payload = {
      job_order_code: String(newOrder.jobOrderCode || "").trim(),
      po_number: String(newOrder.purchaseOrder || "").trim(),
      write_customer_name: String(newOrder.customer || "").trim(),
      product: String(newOrder.product || "").trim(),
      product_no: String(newOrder.productNo || "").trim(),
      quantity: Number(newOrder.quantity) || 1,
      start_date: toDateOrNull(newOrder.scheduledDate),
      complete_date: toDateOrNull(newOrder.completedDate),
      production_time: String(newOrder.productionTime || "").trim(),
      responsible_sales_person: String(newOrder.salesDepartment || "").trim(),
      responsible_production_person: String(newOrder.productionDepartment || "").trim(),
      supplier: String(newOrder.supplier || "").trim(),
      supplier_date: toDateOrNull(newOrder.supplierDate),
      recipient: String(newOrder.recipient || "").trim(),
      recipient_date: toDateOrNull(newOrder.recipientDate),
      items: normalizedItems.map(it => ({
        item: String(it.itemCode || "").trim(),
        item_description: String(it.description || "").trim(),
        item_quantity: String(it.qty || "").trim(),
        item_unit: String(it.unit || "Unit").trim(),
      })),
      item_description: String((normalizedItems[0]?.description) || "").trim(),
      item_quantity: String((normalizedItems[0]?.qty) || "").trim(),
      item_unit: String((normalizedItems[0]?.unit) || "Unit").trim(),
    }
    try {
      const params = new URLSearchParams(window.location.search)
      const editId = params.get('mfgId')
      let targetId = editId
      if (!targetId && payload.job_order_code) {
        try {
          const resList = await fetch(`${API_BASE_URL}/api/manufacturing_orders/`, { headers })
          if (resList.ok) {
            const dataList = await resList.json()
            const list = Array.isArray(dataList) ? dataList : []
            const existing = list.find(d => String(d.job_order_code || "").trim() === payload.job_order_code)
            if (existing) targetId = String(existing.id || "")
          }
        } catch {}
      }
      const endpoint = targetId ? `${API_BASE_URL}/api/manufacturing_orders/${targetId}/` : `${API_BASE_URL}/api/manufacturing_orders/`
      const method = targetId ? "PATCH" : "POST"
      const res = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(typeof err === "object" && err ? JSON.stringify(err) : `HTTP ${res.status}`)
      }
      const result = await res.json().catch(() => null)
      if (result) {
        const its = Array.isArray(result.items)
          ? result.items.map(x => ({
              itemCode: String(x.item ?? x.itemCode ?? "").trim(),
              description: String(x.item_description ?? x.description ?? "").trim(),
              qty: String(x.item_quantity ?? x.qty ?? ""),
              unit: String(x.item_unit ?? x.unit ?? "Unit")
            }))
          : normalizedItems
        const orderData = {
          jobOrderCode: result.job_order_code || newOrder.jobOrderCode,
          productNo: result.product_no || newOrder.productNo,
          customer: result.customer_name || newOrder.customer,
          start: result.start_date || newOrder.scheduledDate,
          completedDate: result.complete_date || newOrder.completedDate,
          totalQuantity: Number(result.quantity) || Number(newOrder.quantity) || 1,
          quantity: Number(result.quantity) || Number(newOrder.quantity) || 1,
          productionTime: result.production_time || newOrder.productionTime,
          items: its,
          responsible: [
            String(result.responsible_sales_person || "").trim(),
            String(result.responsible_production_person || "").trim(),
          ].filter(Boolean).join(" / "),
          responsibleSales: String(result.responsible_sales_person || "").trim(),
          responsibleProduction: String(result.responsible_production_person || "").trim(),
        }
        return orderData
      } else {
        const orderData = {
          jobOrderCode: newOrder.jobOrderCode,
          productNo: newOrder.productNo,
          customer: newOrder.customer,
          start: newOrder.scheduledDate,
          completedDate: newOrder.completedDate,
          totalQuantity: Number(newOrder.quantity) || 1,
          quantity: Number(newOrder.quantity) || 1,
          productionTime: newOrder.productionTime,
          items: normalizedItems,
          responsible: [
            String(newOrder.salesDepartment || "").trim(),
            String(newOrder.productionDepartment || "").trim(),
          ].filter(Boolean).join(" / "),
          responsibleSales: String(newOrder.salesDepartment || "").trim(),
          responsibleProduction: String(newOrder.productionDepartment || "").trim(),
        }
        return orderData
      }
    } catch (e) {
      alert("Failed to create Manufacturing Order: " + (e?.message || "Unknown error"))
      return null
    }
  }
  const saveAndExit = async () => {
    const orderData = await createOrderData()
    if (orderData) {
      setPrintOrder(orderData)
      // Keep draft so edits remain visible after download; user can discard or save later
    }
  }
  const saveOnly = async () => {
    const orderData = await createOrderData()
    if (orderData) {
      setOpenCreateConfirm(false)
      localStorage.removeItem("newMoDraftItems")
      window.location.href = "/manufacturing.html"
    }
  }

  const addItem = () => { setItems(prev => [...prev, { itemCode: String(prev.length + 1), description: "", qty: "1", unit: "Unit" }]); setItemsTouched(true) }
  const removeItem = (i) => { setItems(prev => prev.filter((_, idx) => idx !== i).map((row, idx) => ({ ...row, itemCode: row.itemCode || String(idx + 1) }))); setItemsTouched(true) }
  const updateItem = (i, field, value) => { setItems(prev => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))); setItemsTouched(true) }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Manufacturing Order</h1>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Codes</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Job Order Code</label>
                  <input value={newOrder.jobOrderCode} onChange={(e)=>setNewOrder({...newOrder, jobOrderCode:e.target.value})} placeholder="e.g. JO-001" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">PO Number</label>
                  <div className="relative">
                    <input
                      value={newOrder.purchaseOrder}
                      onChange={(e)=>{ setNewOrder({...newOrder, purchaseOrder:e.target.value}); setShowPoSuggestions(true) }}
                      onFocus={()=>setShowPoSuggestions(true)}
                      placeholder="e.g. PO-1234"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
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
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Customer</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                  <input value={newOrder.customer} onChange={(e)=>setNewOrder({...newOrder, customer:e.target.value})} placeholder="Company name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Product</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Product No</label>
                  <input value={newOrder.productNo} onChange={(e)=>setNewOrder({...newOrder, productNo:e.target.value})} placeholder="e.g. LCM-001" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Order Quantity</label>
                  <input value={newOrder.quantity} onChange={(e)=>setNewOrder({...newOrder, quantity:e.target.value})} placeholder="1" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Date</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <DateField value={newOrder.scheduledDate} onChange={(v)=>setNewOrder({...newOrder, scheduledDate:v})} placeholder="DD/MM/YYYY" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Complete Date</label>
                  <DateField value={newOrder.completedDate} onChange={(v)=>setNewOrder({...newOrder, completedDate:v})} placeholder="DD/MM/YYYY" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Time of Production</label>
                  <input value={newOrder.productionTime} onChange={(e)=>setNewOrder({...newOrder, productionTime:e.target.value})} placeholder="e.g. 2 weeks" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Responsible Person</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sales Department</label>
                  <input value={newOrder.salesDepartment} onChange={(e)=>setNewOrder({...newOrder, salesDepartment:e.target.value})} placeholder="Sales person" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Production Department</label>
                  <input value={newOrder.productionDepartment} onChange={(e)=>setNewOrder({...newOrder, productionDepartment:e.target.value})} placeholder="Production lead" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Supplier & Recipient</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
                  <input value={newOrder.supplier} onChange={(e)=>setNewOrder({...newOrder, supplier:e.target.value})} placeholder="Supplier company/person" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Supplier Date</label>
                  <DateField value={newOrder.supplierDate} onChange={(v)=>setNewOrder({...newOrder, supplierDate:v})} placeholder="DD/MM/YYYY" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Recipient</label>
                  <input value={newOrder.recipient} onChange={(e)=>setNewOrder({...newOrder, recipient:e.target.value})} placeholder="Recipient name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Recipient Date</label>
                  <DateField value={newOrder.recipientDate} onChange={(v)=>setNewOrder({...newOrder, recipientDate:v})} placeholder="DD/MM/YYYY" />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">Items Description</div>
                <button onClick={addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
                  <Plus className="size-4" aria-hidden="true" />
                  <span className="text-sm font-medium">Add Item</span>
                </button>
              </div>
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
                    {items.map((it, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                        <td className="p-3">
                          <input value={it.itemCode} onChange={(e)=>updateItem(i, "itemCode", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Code" />
                        </td>
                        <td className="p-3">
                          <input value={it.description} onChange={(e)=>updateItem(i, "description", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Item description" />
                        </td>
                        <td className="p-3">
                          <input value={it.qty} onChange={(e)=>updateItem(i, "qty", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="1" />
                        </td>
                        <td className="p-3">
                          <input value={it.unit} onChange={(e)=>updateItem(i, "unit", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Unit" />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={()=>removeItem(i)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                            aria-label="Delete item"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400">No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href="/manufacturing.html"}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create MO Form</button>
          </div>
        </div>
      </section>
      {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Create MO Form</h3>
                  <div className="text-sm text-gray-600 mt-1">Choose how you want to proceed</div>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenCreateConfirm(false)}>✕</button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <button
                  className="w-full px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 min-w-[140px]"
                  onClick={() => { setOpenCreateConfirm(false); window.location.href = "/manufacturing.html" }}
                >
                  Discard
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] min-w-[140px]"
                  onClick={saveOnly}
                >
                  Save Changes
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center"
                  onClick={async () => { setOpenCreateConfirm(false); await saveAndExit() }}
                >
                  Download Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {printOrder && createPortal(
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
                @page { margin: 0; size: A4 ${previewOrientation}; }
              }
              .print-portal { display: none; }
            `}
          </style>
          <JobOrderTemplate order={printOrder} />
        </div>,
        document.body
      )}
      {previewOrder && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setPreviewOrder(null)}>
          <div className="absolute inset-0 flex items-start justify-center" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-6">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Job Order Preview</h3>
                  <span className="text-gray-500">#{previewOrder.jobOrderCode || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => setPreviewZoom(z => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
                    >
                      -
                    </button>
                    <span className="text-sm text-gray-700 w-14 text-center">{Math.round(previewZoom * 100)}%</span>
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => setPreviewZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
                    >
                      +
                    </button>
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => setPreviewZoom(1)}
                    >
                      Reset
                    </button>
                    <select
                      value={previewOrientation}
                      onChange={(e)=>setPreviewOrientation(e.target.value)}
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => { setTimeout(()=>window.print(),100) }}>Print</button>
                  <button className="text-gray-500 hover:text-gray-900" onClick={() => setPreviewOrder(null)}>✕</button>
                </div>
              </div>
              <div className="p-4">
                <style>
                  {`@media print { @page { size: A4 ${previewOrientation}; margin: 0 } }`}
                </style>
                {(() => {
                  const pageWidth = previewOrientation === "portrait" ? 794 : 1123
                  const pageHeight = previewOrientation === "portrait" ? 1123 : 794
                  const vh = Math.max(600, window.innerHeight - 220)
                  const fit = Math.min(1, vh / pageHeight)
                  const zoom = Math.max(0.4, Math.min(2, previewZoom || fit))
                  return (
                <div style={{ width: pageWidth * zoom, height: pageHeight * zoom, margin: "0 auto", overflow: "hidden" }}>
                  <div style={{ width: pageWidth, height: pageHeight, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                    <JobOrderTemplate order={previewOrder} />
                  </div>
                </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NewMOPage />
  </React.StrictMode>
)

