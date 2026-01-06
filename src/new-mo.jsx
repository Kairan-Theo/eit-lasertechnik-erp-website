import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import Navigation from "./components/navigation.jsx"
import "./index.css"
import { API_BASE_URL } from "./config"
import { JobOrderTemplate } from "./components/job-order-template.jsx"

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
  const [items, setItems] = React.useState([{ itemCode: "", description: "", qty: "1", unit: "Unit" }])
  const [previewOrder, setPreviewOrder] = React.useState(null)
  const [printOrder, setPrintOrder] = React.useState(null)
  const [previewZoom, setPreviewZoom] = React.useState(0.5)
  const [previewOrientation, setPreviewOrientation] = React.useState("portrait")
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)

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
        setRemoteJobCodes(codes)
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
              salesDepartment: m.sales_department || prev.salesDepartment,
              productionDepartment: m.production_department || prev.productionDepartment,
              supplier: m.supplier || prev.supplier,
              supplierDate: m.supplier_date || prev.supplierDate,
              recipient: m.recipient || prev.recipient,
              recipientDate: m.recipient_date || prev.recipientDate,
            }))
            const its = Array.isArray(m.items) ? m.items.map(x => ({ itemCode: x.itemCode || "", description: x.description || "", qty: String(x.qty || ""), unit: x.unit || "Unit" })) : []
            if (its.length) setItems(its)
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
      sales_department: String(newOrder.salesDepartment || "").trim(),
      production_department: String(newOrder.productionDepartment || "").trim(),
      supplier: String(newOrder.supplier || "").trim(),
      supplier_date: toDateOrNull(newOrder.supplierDate),
      recipient: String(newOrder.recipient || "").trim(),
      recipient_date: toDateOrNull(newOrder.recipientDate),
      items,
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(typeof err === "object" && err ? JSON.stringify(err) : `HTTP ${res.status}`)
      }
      const created = await res.json().catch(() => null)
      if (created) {
        const its = Array.isArray(created.items) ? created.items.map(x => ({ itemCode: x.itemCode || "", description: x.description || "", qty: String(x.qty || ""), unit: x.unit || "Unit" })) : items
        const orderData = {
          jobOrderCode: created.job_order_code || newOrder.jobOrderCode,
          productNo: created.product_no || newOrder.productNo,
          customer: created.customer_name || newOrder.customer,
          start: created.start_date || newOrder.scheduledDate,
          completedDate: created.complete_date || newOrder.completedDate,
          totalQuantity: Number(created.quantity) || Number(newOrder.quantity) || 1,
          quantity: Number(created.quantity) || Number(newOrder.quantity) || 1,
          productionTime: created.production_time || newOrder.productionTime,
          items: its,
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
          items,
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
    if (orderData) setPrintOrder(orderData)
  }
  const saveOnly = async () => {
    const orderData = await createOrderData()
    if (orderData) {
      setOpenCreateConfirm(false)
      window.location.href = "/manufacturing.html"
    }
  }

  const addItem = () => setItems(prev => [...prev, { itemCode: "", description: "", qty: "1", unit: "Unit" }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => setItems(prev => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">New Manufacturing Order</h1>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => window.location.href="/manufacturing.html"}>Cancel</button>
                <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create MO Form</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Codes</div>
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
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Customer</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                  <input value={newOrder.customer} onChange={(e)=>setNewOrder({...newOrder, customer:e.target.value})} placeholder="Company name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Product</div>
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
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Date</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input value={newOrder.scheduledDate} onChange={(e)=>setNewOrder({...newOrder, scheduledDate:e.target.value})} placeholder="YYYY-MM-DD" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Complete Date</label>
                  <input value={newOrder.completedDate} onChange={(e)=>setNewOrder({...newOrder, completedDate:e.target.value})} placeholder="YYYY-MM-DD" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Time of Production</label>
                  <input value={newOrder.productionTime} onChange={(e)=>setNewOrder({...newOrder, productionTime:e.target.value})} placeholder="e.g. 2 weeks" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Responsible Person</div>
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
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Supplier & Recipient</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
                  <input value={newOrder.supplier} onChange={(e)=>setNewOrder({...newOrder, supplier:e.target.value})} placeholder="Supplier company/person" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Supplier Date</label>
                  <input value={newOrder.supplierDate} onChange={(e)=>setNewOrder({...newOrder, supplierDate:e.target.value})} placeholder="YYYY-MM-DD" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Recipient</label>
                  <input value={newOrder.recipient} onChange={(e)=>setNewOrder({...newOrder, recipient:e.target.value})} placeholder="Recipient name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Recipient Date</label>
                  <input value={newOrder.recipientDate} onChange={(e)=>setNewOrder({...newOrder, recipientDate:e.target.value})} placeholder="YYYY-MM-DD" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Product Items Description</div>
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
                          <button onClick={()=>removeItem(i)} className="px-2 py-1 rounded-md text-red-600 hover:bg-red-50">Delete</button>
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
              <div className="mt-3">
                <button onClick={addItem} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Add Item</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Create MO Form</h3>
                <div className="text-sm text-gray-600 mt-1">Choose how you want to proceed</div>
              </div>
              <div className="p-4 grid gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => { setOpenCreateConfirm(false); window.location.href = "/manufacturing.html" }}>Quit without saving</button>
                <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={saveOnly}>Save</button>
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={async () => { setOpenCreateConfirm(false); await saveAndExit() }}>Download MO Form</button>
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

