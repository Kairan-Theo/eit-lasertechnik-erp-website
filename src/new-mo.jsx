import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import Navigation from "./components/navigation.jsx"
import "./index.css"
import { API_BASE_URL } from "./config"
import { JobOrderTemplate } from "./components/job-order-template.jsx"
import { DateField } from "./components/ui/date-field"
import { Plus, Trash, ArrowLeft } from "lucide-react"
// Comment: Import customer combobox to enable typing + select against Customer DB
import { CustomerCombobox } from "./components/customer-combobox"

function computeComponentStatusFromItems(items, inventory) {
  if (!Array.isArray(items) || !items.length) return ""
  // inventory is passed in, expected to be a map { key: qty }
  const requiredTotals = {}
  for (const it of items) {
    const key = String(it.description || "").trim().toLowerCase()
    if (!key) continue
    const qty = Number(it.qty)
    if (!Number.isFinite(qty) || qty <= 0) continue
    requiredTotals[key] = (requiredTotals[key] || 0) + qty
  }
  const keys = Object.keys(requiredTotals)
  if (!keys.length) return ""
  for (const key of keys) {
    const available = Number(inventory[key] || 0)
    const required = Number(requiredTotals[key] || 0)
    // Debug log to trace status calculation
    console.debug(`[Status Check] Item: "${key}", Required: ${required}, Available: ${available}`)
    
    if (!Number.isFinite(available) || required >= available) {
      console.debug(`[Status Check] -> Not Available (Insufficient: ${available} <= ${required})`)
      return "Not Available"
    }
  }
  return "Available"
}

function NewMOPage() {
  const [inventory, setInventory] = React.useState({})
  const [bomList, setBomList] = React.useState([])
  const [moList, setMoList] = React.useState([])
  
  const [isEditMode, setIsEditMode] = React.useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return !!params.get('mfgId')
    } catch {
      return false
    }
  })
  const [remoteJobCodes, setRemoteJobCodes] = React.useState([])
  const [crmPoNumbers, setCrmPoNumbers] = React.useState([])
  const [customerPurchaseOrders, setCustomerPurchaseOrders] = React.useState([]) // Store full CPO objects
  const [showPoSuggestions, setShowPoSuggestions] = React.useState(false)
  const [showBomSuggestions, setShowBomSuggestions] = React.useState(false)
  const bomSuggestionRef = React.useRef(null)
  // Comment: Container ref for PO suggestions to support click-outside dismissal
  const poSuggestionRef = React.useRef(null)
  // Comment: Customer options loaded from Customer DB for Company combobox
  const [customerOptions, setCustomerOptions] = React.useState([])
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
    responsibleSalesPerson: "",
    responsibleProductionPerson: "",
    supplier: "",
    supplierDate: "",
    recipient: "",
    recipientDate: "",
    poFile: null,
    poFileName: ""
  })
  const [items, setItems] = React.useState([])
  const [itemsTouched, setItemsTouched] = React.useState(false)
  const [previewOrder, setPreviewOrder] = React.useState(null)
  const [printOrder, setPrintOrder] = React.useState(null)
  const [previewZoom, setPreviewZoom] = React.useState(0.5)
  const [previewOrientation, setPreviewOrientation] = React.useState("portrait")
  
  const fileInputRef = React.useRef(null)
  const filePreviewUrl = React.useMemo(() => {
    if (newOrder.poFile) {
      return URL.createObjectURL(newOrder.poFile)
    }
    return null
  }, [newOrder.poFile])

  React.useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl)
      }
    }
  }, [filePreviewUrl])

  const printJobOrder = React.useCallback((orderData) => {
    setPrintOrder(orderData)
  }, [])

  const syncItemsFromBOM = React.useCallback(() => {
    const key = String(newOrder.productNo || "").trim().toLowerCase()
    console.log("syncItemsFromBOM called with key:", key)
    if (!key) {
      setItems([])
      return false
    }
    try {
      // Use bomList state
      console.log("bomList length:", bomList.length)
      if (!Array.isArray(bomList) || !bomList.length) return
      
      const match = bomList.find(b => String(b.product || "").trim().toLowerCase() === key)  
      console.log("BOM match found:", match)
      
      if (!match) return false
      
      let pt = match.productTree
      console.log("Raw productTree:", pt)
      
      // Handle case where productTree might be a JSON string
      if (typeof pt === 'string') {
        try {
          pt = JSON.parse(pt)
          console.log("Parsed productTree:", pt)
        } catch (e) {
          console.error("Failed to parse productTree JSON:", e)
        }
      }

      const systems = pt && !Array.isArray(pt)
        ? (pt.systems || [])
        : Array.isArray(pt)
          ? pt
          : []

      console.log("Extracted systems:", systems)
      
      const comps = systems.flatMap(s => (s.components || []).map(c => ({
        itemCode: "",
        description: String(c.name || "").trim(),
        qty: String(Number(c.qty) || 1),
        unit: "Unit",
      })))
      
      console.log("Extracted components:", comps)
      
      if (comps.length) {
        setItems(comps.map((x, idx) => ({ ...x, itemCode: x.itemCode || String(idx + 1) }))) 
        return true
      }
      return false
    } catch (e) {
      console.error("Error in syncItemsFromBOM:", e)
      return false
    }
  }, [newOrder.productNo, bomList])

  React.useEffect(() => {
    if (isEditMode) return
    const key = String(newOrder.productNo || "").trim()
    if (!key) {
      if (!itemsTouched) {
        setItems([])
      }
    } else if (!itemsTouched) {
      // If items haven't been manually modified, try to sync from BOM if a match is found.  
      // This will check if the entered product name matches any BOM product and populate items.
      syncItemsFromBOM()
    }
  }, [newOrder.productNo, itemsTouched, isEditMode, syncItemsFromBOM])



  React.useEffect(() => {
    if (!showBomSuggestions) return
    const handleClickOutside = (event) => {
      const el = bomSuggestionRef.current
      if (el && !el.contains(event.target)) {
        setShowBomSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showBomSuggestions])
  // Comment: When PO suggestions are open, clicking outside the PO input/suggestion panel hides them
  React.useEffect(() => {
    if (!showPoSuggestions) return
    const handleClickOutside = (event) => {
      const el = poSuggestionRef.current
      if (el && !el.contains(event.target)) {
        setShowPoSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showPoSuggestions])
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
      setTimeout(() => window.print(), 500)
    }
  }, [printOrder])
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}` } : {}
        const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/`, { headers })
        if (!res.ok) return
        const data = await res.json()
        const codes = (Array.isArray(data) ? data : []).map(d => String(d.job_order_code || "").trim()).filter(Boolean)
        const list = Array.isArray(data) ? data : []
        setRemoteJobCodes(codes)
        setMoList(list)
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
            const token = localStorage.getItem("authToken")
            const headers = token ? { "Authorization": `Token ${token}` } : {}
            const res = await fetch(`${API_BASE_URL}/api/manufacturing_orders/${id}/`, { headers })
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
              responsibleSalesPerson: m.responsible_sales_person || prev.responsibleSalesPerson,
              responsibleProductionPerson: m.responsible_production_person || prev.responsibleProductionPerson,
              supplier: m.supplier || prev.supplier,
              supplierDate: m.supplier_date || prev.supplierDate,
              recipient: m.recipient || prev.recipient,
              recipientDate: m.recipient_date || prev.recipientDate,
              poFileName: m.po_file_name || prev.poFileName,
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
    // Fetch Inventory
    const token = localStorage.getItem("authToken")
    const headers = token ? { "Authorization": `Token ${token}` } : {}
    fetch(`${API_BASE_URL}/api/component_entries/`, { headers })
      .then(res => res.json())
      .then(data => {
         const map = {}
         for (const p of (Array.isArray(data) ? data : [])) {
           const key = String(p.component_name || "").trim().toLowerCase()
           if (key) map[key] = (map[key] || 0) + (Number(p.quantity) || 0)
         }
         setInventory(map)
      })
      .catch(console.error)

    // BOMs - backend only
    setBomList([])

    // Fetch BOMs to allow auto-filling items based on product name.
    // When a user enters a product name that matches a BOM product, we fetch its components.
    // We also use localStorage as a fallback, similar to bom.jsx
    const loadBoms = async () => {
        let list = []
        try {
            const res = await fetch(`${API_BASE_URL}/api/bom/`, { headers })
            if (res.ok) {
                const data = await res.json()
                list = Array.isArray(data) ? data : []
            }
        } catch (e) {
            console.error("Error fetching BOMs from API:", e)
        }

        // If API list is empty, try localStorage
        if (!list.length) {
            try {
                const raw = JSON.parse(localStorage.getItem("mfgBOMs") || "[]")
                list = Array.isArray(raw) ? raw : []
                console.log("Loaded BOMs from localStorage:", list.length)
            } catch (e) {
                console.error("Error loading BOMs from localStorage:", e)
            }
        } else {
             console.log("Loaded BOMs from API:", list.length)
        }
        
        setBomList(list)
    }
    loadBoms()

    ;(async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}` } : {}
        
        // Fetch Deals POs
        const resDeals = await fetch(`${API_BASE_URL}/api/deals/`, { headers })
        let dealsPos = []
        if (resDeals.ok) {
          const data = await resDeals.json()
          dealsPos = (data || []).map(d => String(d.po_number || "").trim()).filter(Boolean)
        }

        // Fetch Customer Purchase Orders
        const resCPO = await fetch(`${API_BASE_URL}/api/customer_purchase_orders/`, { headers })
        if (resCPO.ok) {
          const cpoData = await resCPO.json()
          setCustomerPurchaseOrders(cpoData || [])
          
          // Combine PO numbers from both sources
          const cpoPos = (cpoData || []).map(c => String(c.po_number || "").trim()).filter(Boolean)
          const combined = Array.from(new Set([...dealsPos, ...cpoPos]))
          setCrmPoNumbers(combined)
        } else {
          // Fallback if CPO fetch fails, just use deals
           const combined = Array.from(new Set(dealsPos))
           setCrmPoNumbers(combined)
        }
      } catch (err) {
        console.error("Error fetching PO numbers:", err)
      }
    })()
  }, [])

  // Comment: Load canonical customers for Company input; normalize to {label,value}
  React.useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/customers/`)
        if (!res.ok) {
          setCustomerOptions([])
          return
        }
        const data = await res.json()
        if (Array.isArray(data)) {
          const normalized = data.map(c => ({
            ...c,
            label: c.company_name || c.customer_name || "",
            value: c.id
          }))
          setCustomerOptions(normalized)
        } else {
          setCustomerOptions([])
        }
      } catch {
        setCustomerOptions([])
      }
    }
    loadCustomers()
  }, [])

  const applyPoSuggestion = React.useCallback((val) => {
    const s = String(val || "").trim()
    let next = { ...newOrder, purchaseOrder: s }
    
    // Check if this PO exists in customerPurchaseOrders to auto-fill file
    const matchedCPO = customerPurchaseOrders.find(c => String(c.po_number || "").trim().toLowerCase() === s.toLowerCase())
    if (matchedCPO && matchedCPO.po_file_name) {
      // Construct download URL
      const fileUrl = `${API_BASE_URL}/api/customer_purchase_orders/${matchedCPO.id}/download/`
      
      next = { 
        ...next, 
        poFileName: matchedCPO.po_file_name,
        poFile: null, // Clear any manual upload
        linkedCpoId: matchedCPO.id, // Store ID if needed
        linkedCpoFileUrl: fileUrl // Store URL for preview
      }
    } else {
         // Clear linked file if no match or no file
         next = {
             ...next,
             linkedCpoId: null,
             linkedCpoFileUrl: null,
         }
         // If we found a CPO but it has no file, we should clear the file fields
         // to avoid showing the previous MO file or manual upload as if it belongs to this CPO.
         // Also if we are just typing a custom PO, we probably shouldn't auto-clear unless we want to enforce re-upload.
         // But for now, let's clear if we matched a CPO and it has no file.
         if (matchedCPO) {
             next.poFileName = ""
             next.poFile = null
         } else if (newOrder.linkedCpoFileUrl) {
             // If we previously had a linked file, and now we typed something else (no match),
             // we should clear the linked file.
             next.poFileName = ""
             next.poFile = null
         }
    }

    setNewOrder(next)
    setShowPoSuggestions(false)
  }, [newOrder, customerPurchaseOrders])

  const createOrderData = async () => {
    const token = localStorage.getItem("authToken")
    const headers = {}
    if (token) headers["Authorization"] = `Token ${token}`

    if (newOrder.poFile) {
      const fileSizeMB = newOrder.poFile.size / (1024 * 1024)
      if (fileSizeMB > 8) {
        alert("File size exceeds 8 MB. Please upload a smaller file.")
        return null
      }
    }

    const toDateOrNull = (s) => {
      const v = String(s || "").trim()
      return v ? v : ""
    }
    const normalizedItems = items.map((x, i) => ({ ...x, itemCode: x.itemCode || String(i + 1) }))
    const componentStatus = computeComponentStatusFromItems(normalizedItems, inventory)
    
    const formData = new FormData()
    formData.append("job_order_code", String(newOrder.jobOrderCode || "").trim())
    formData.append("po_number", String(newOrder.purchaseOrder || "").trim())
    formData.append("write_customer_name", String(newOrder.customer || "").trim())
    formData.append("product", String(newOrder.product || "").trim())
    formData.append("product_no", String(newOrder.productNo || "").trim())
    formData.append("quantity", String(Number(newOrder.quantity) || 1))
    
    if (newOrder.scheduledDate) formData.append("start_date", newOrder.scheduledDate)
    if (newOrder.completedDate) formData.append("complete_date", newOrder.completedDate)
    
    formData.append("production_time", String(newOrder.productionTime || "").trim())
    formData.append("responsible_sales_person", String(newOrder.responsibleSalesPerson || "").trim())
    formData.append("responsible_production_person", String(newOrder.responsibleProductionPerson || "").trim())
    formData.append("supplier", String(newOrder.supplier || "").trim())
    
    if (newOrder.supplierDate) formData.append("supplier_date", newOrder.supplierDate)
    
    formData.append("recipient", String(newOrder.recipient || "").trim())
    
    if (newOrder.recipientDate) formData.append("recipient_date", newOrder.recipientDate)
    
    const itemsPayload = normalizedItems.map(it => ({
      item: String(it.itemCode || "").trim(),
      item_description: String(it.description || "").trim(),
      item_quantity: String(it.qty || "").trim(),
      item_unit: String(it.unit || "Unit").trim(),
    }))
    formData.append("items", JSON.stringify(itemsPayload))
    
    formData.append("item_description", String((normalizedItems[0]?.description) || "").trim())
    formData.append("item_quantity", String((normalizedItems[0]?.qty) || "").trim())
    formData.append("item_unit", String((normalizedItems[0]?.unit) || "Unit").trim())
    formData.append("component_status", componentStatus)

    if (newOrder.poFile) {
      formData.append("po_file", newOrder.poFile)
    }
    if (newOrder.linkedCpoId) {
        formData.append("linked_cpo_id", String(newOrder.linkedCpoId))
    }
    // Append po_file_name so backend knows if we cleared it
    formData.append("po_file_name", String(newOrder.poFileName || ""))

    try {
      const params = new URLSearchParams(window.location.search)
      const editId = params.get('mfgId')
      let targetId = editId
      // Check for existing if creating new
      if (!targetId && newOrder.jobOrderCode) {
        try {
          const resList = await fetch(`${API_BASE_URL}/api/manufacturing_orders/`, { headers })
          if (resList.ok) {
            const dataList = await resList.json()
            const list = Array.isArray(dataList) ? dataList : []
            const existing = list.find(d => String(d.job_order_code || "").trim() === String(newOrder.jobOrderCode || "").trim())
            if (existing) targetId = String(existing.id || "")
          }
        } catch {}
      }
      const endpoint = targetId ? `${API_BASE_URL}/api/manufacturing_orders/${targetId}/` : `${API_BASE_URL}/api/manufacturing_orders/`
      const method = targetId ? "PATCH" : "POST"
      
      const res = await fetch(endpoint, { method, headers, body: formData })
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
          supplier: result.supplier || newOrder.supplier,
          supplierDate: result.supplier_date || newOrder.supplierDate,
          recipient: result.recipient || newOrder.recipient,
          recipientDate: result.recipient_date || newOrder.recipientDate,
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
          supplier: newOrder.supplier,
          supplierDate: newOrder.supplierDate,
          recipient: newOrder.recipient,
          recipientDate: newOrder.recipientDate,
          items: normalizedItems,
          responsible: [
            String(newOrder.responsibleSalesPerson || "").trim(),
            String(newOrder.responsibleProductionPerson || "").trim(),
          ].filter(Boolean).join(" / "),
          responsibleSales: String(newOrder.responsibleSalesPerson || "").trim(),
          responsibleProduction: String(newOrder.responsibleProductionPerson || "").trim(),
        }
        return orderData
      }
    } catch (e) {
      const msg = e?.message || "Unknown error"
      if (msg.includes("Invalid token") || msg.includes("HTTP 401") || msg.includes("HTTP 403")) {
        alert("Your session has expired. Please log in again.")
        localStorage.removeItem("authToken")
        window.location.href = "/login.html"
        return null
      }
      alert("Failed to create Manufacturing Order: " + msg)
      return null
    }
  }
  const saveAndExit = async () => {
    const orderData = await createOrderData()
    if (orderData) {
      printJobOrder(orderData)
      // Keep draft so edits remain visible after download; user can discard or save later
    }
  }
  const saveOnly = async () => {
    const orderData = await createOrderData()
    if (orderData) {
      setOpenCreateConfirm(false)
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
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.href = "/manufacturing.html"}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                  title="Back to List"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">Manufacturing Order</h1>
              </div>
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
                  {/* Comment: Wrap PO input and suggestion list; used for click-outside detection */}
                  <div className="relative" ref={poSuggestionRef}>
                    <input
                      value={newOrder.purchaseOrder}
                      onChange={(e)=>{ setNewOrder({...newOrder, purchaseOrder:e.target.value}); setShowPoSuggestions(true) }}
                      onFocus={()=>setShowPoSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowPoSuggestions(false)
                      }}
                      placeholder="e.g. PO-1234"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                    />
                    {showPoSuggestions && (() => {
                      const q = (newOrder.purchaseOrder || "").toLowerCase()
                      const candidates = Array.from(new Set([
                        ...moList.map(o => String(o.po_number || "").trim()).filter(Boolean),
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
                  {/* Comment: Replace plain input with CustomerCombobox (typing + select from Customer DB) */}
                  <CustomerCombobox
                    value={newOrder.customer || ""}
                    options={customerOptions}
                    // Comment: onChange supports free typing; keep text as-is
                    onChange={(val) => setNewOrder({ ...newOrder, customer: val })}
                    // Comment: onSelect gives ID; store label and keep ID for later if needed
                    onSelect={({ label, value }) => {
                      setNewOrder(prev => ({ ...prev, customer: label, selectedCustomerId: value }))
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">PO File</label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept=".pdf,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewOrder({...newOrder, poFile: e.target.files[0]})
                        }
                      }}
                    />
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Choose File
                    </button>
                    
                    {newOrder.poFile ? (
                      <div className="flex items-center gap-2 max-w-[calc(100%-120px)]">
                        <a 
                          href={filePreviewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm underline hover:text-blue-800 truncate"
                        >
                          {newOrder.poFile.name}
                        </a>
                        <button 
                            type="button"
                            onClick={() => {
                                setNewOrder({...newOrder, poFile: null})
                                if (fileInputRef.current) fileInputRef.current.value = ""
                            }}
                            className="text-red-500 hover:text-red-700 shrink-0"
                            title="Remove file"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ) : newOrder.poFileName ? (
                       <div className="flex items-center gap-2 max-w-[calc(100%-120px)]">
                        {(() => {
                          const params = new URLSearchParams(window.location.search)
                          const mfgId = params.get('mfgId')
                          
                          // Check if it's a linked CPO file (Prioritize this, as user might have switched PO in edit mode)
                          if (newOrder.linkedCpoFileUrl) {
                            return (
                               <a 
                                 href={newOrder.linkedCpoFileUrl}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-600 text-sm underline hover:text-blue-800 truncate"
                               >
                                 {newOrder.poFileName}
                               </a>
                            )
                          }

                          // Fallback: Check if we can find this PO in the CPO list (for existing orders where file might not be copied or link lost)
                          if (newOrder.purchaseOrder && newOrder.poFileName && customerPurchaseOrders.length > 0) {
                              const matched = customerPurchaseOrders.find(c => 
                                  String(c.po_number || "").trim().toLowerCase() === String(newOrder.purchaseOrder).trim().toLowerCase()
                              )
                              // If matched and file name matches (or we just trust the PO number match)
                              // Let's trust the PO number match if the file name is also present in CPO
                              if (matched && matched.po_file_name) {
                                   return (
                                       <a 
                                         href={`${API_BASE_URL}/api/customer_purchase_orders/${matched.id}/download/`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="text-blue-600 text-sm underline hover:text-blue-800 truncate"
                                       >
                                         {newOrder.poFileName}
                                       </a>
                                   )
                              }
                          }
                          
                          if (mfgId) {
                             return (
                               <a 
                                 href={`${API_BASE_URL}/api/manufacturing_orders/${mfgId}/download/`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-600 text-sm underline hover:text-blue-800 truncate"
                               >
                                 {newOrder.poFileName}
                               </a>
                             )
                          }
                          
                          return <span className="text-sm text-gray-700 truncate">{newOrder.poFileName}</span>
                        })()}
                        <button 
                            type="button"
                            onClick={() => setNewOrder({...newOrder, poFileName: "", poFile: null, linkedCpoId: null, linkedCpoFileUrl: null})}
                            className="text-red-500 hover:text-red-700 shrink-0"
                            title="Remove file"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                       </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No file chosen</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Product</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Product No</label>
                  <div className="relative" ref={bomSuggestionRef}>
                    <input
                      value={newOrder.productNo}
                      onChange={(e) => {
                        setNewOrder({ ...newOrder, productNo: e.target.value })
                        setShowBomSuggestions(true)
                      }}
                      onFocus={() => setShowBomSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowBomSuggestions(false)
                      }}
                      placeholder="e.g. Laser Marking Machine"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                    />
                    {showBomSuggestions && String(newOrder.productNo || "").trim() && (() => {
                      const q = String(newOrder.productNo || "").trim().toLowerCase()
                      // Use bomList state
                      const candidates = Array.from(new Set(
                        (Array.isArray(bomList) ? bomList : [])
                          .map(b => String(b?.product || "").trim())
                          .filter(Boolean)
                      ))
                        .filter(x => x.toLowerCase().includes(q))
                        .slice(0, 8)
                      return candidates.length ? (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                          {candidates.map((val, i) => (
                            <button
                              key={`${val}-${i}`}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => {
                                setNewOrder({ ...newOrder, productNo: val })
                                setItems([])
                                setItemsTouched(false)
                                setShowBomSuggestions(false)
                              }}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      ) : null
                    })()}
                  </div>
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
                  <label className="block text-xs font-medium text-slate-500 mb-1">Responsible Sales Person</label>
                  <input value={newOrder.responsibleSalesPerson} onChange={(e)=>setNewOrder({...newOrder, responsibleSalesPerson:e.target.value})} placeholder="Sales person" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Responsible Production Person</label>
                  <input value={newOrder.responsibleProductionPerson} onChange={(e)=>setNewOrder({...newOrder, responsibleProductionPerson:e.target.value})} placeholder="Production lead" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
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
                .print-portal {
                  display: block !important;
                }
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
                  <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => printJobOrder(previewOrder)}>Print</button>
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

