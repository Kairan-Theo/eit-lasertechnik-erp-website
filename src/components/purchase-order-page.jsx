import React from "react"
import { createPortal } from "react-dom"
import { PurchaseOrderTemplate } from "./purchase-order-template.jsx"
import Navigation from "./navigation.jsx"
import { API_BASE_URL } from "../config"
import { 
  ArrowLeft, 
  Plus, 
  Trash, 
  Search,
  ShoppingCart
} from "lucide-react"
import { DateField } from "./ui/date-field"
import { THBText } from "../utils/currency"



function usePurchaseOrderState() {
  const [vendor, setVendor] = React.useState({
    company: "",
    name: "",
    email: "",
    companyEmail: "",
    phone: "",
    companyPhone: "",
    address: ""
  })

  const [details, setDetails] = React.useState({
    poNumber: "",
    orderDate: new Date().toISOString().slice(0, 10),
    deliveryDate: "",
    refQuotation: "",
    paymentTerms: "",
    deliveryTo: "",
    eit: null,
    eitName: "EIT LASERTECHNIK CO.,LTD",
    eitAddress: "1/120 ซอยรามคําแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510",
    eitPhone: "02-052-9544",
    eitFax: "02-052 9544",
    eitMobile: "000-000-0000",
    salesPerson: "",
    remark: "",
    currency: "THB"
  })

  const [eitOptions, setEitOptions] = React.useState([])

  // Load EIT options
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/eits/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEitOptions(data)
        } else {
          console.error("EIT data is not an array:", data)
          setEitOptions([])
        }
      })
      .catch(err => {
        console.error("Error loading EITs", err)
        setEitOptions([])
      })
  }, [])

  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
  const [sourceKey, setSourceKey] = React.useState(null)
  const [sourceIndex, setSourceIndex] = React.useState(null)

  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.qty) || 0
    const price = Number(it.price) || 0
    return sum + (qty * price)
  }, 0)
  const taxTotal = subtotal * 0.07
  const total = subtotal + taxTotal

  const addItem = () => setItems(prev => [...prev, { product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => setItems(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  return { vendor, setVendor, details, setDetails, eitOptions, items, setItems, addItem, removeItem, updateItem, subtotal, taxTotal, total, sourceKey, setSourceKey, sourceIndex, setSourceIndex }
}

export default function PurchaseOrderPage() {
  const q = usePurchaseOrderState()
  const [poList, setPoList] = React.useState([])
  const [showForm, setShowForm] = React.useState(false)
  const [printingPo, setPrintingPo] = React.useState(null)
  const prefilledRef = React.useRef(false)
  const saveTimer = React.useRef(null)
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)

  // Customer Purchase Orders State
  const [activeTab, setActiveTab] = React.useState("po") // 'po' or 'customer_po'
  const [customerPoList, setCustomerPoList] = React.useState([])
  const [newCustomerPo, setNewCustomerPo] = React.useState(null) // If adding new one
  const [customerOptions, setCustomerOptions] = React.useState([])
  
  // Edit & Delete State
  const [customerPoToDelete, setCustomerPoToDelete] = React.useState(null)
  const [editingCustomerPoId, setEditingCustomerPoId] = React.useState(null)
  const [editingCustomerPoData, setEditingCustomerPoData] = React.useState({})

  // Load Customers
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/customers/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomerOptions(data)
      })
      .catch(console.error)
  }, [])
  
  // Load Quotations
  const [quotationOptions, setQuotationOptions] = React.useState([])
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/quotations/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQuotationOptions(data)
      })
      .catch(console.error)
  }, [])
  
  // Load Customer PO List
  const fetchCustomerPos = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer_purchase_orders/`)
      if (res.ok) {
        const data = await res.json()
        setCustomerPoList(data)
      }
    } catch (e) {
      console.error("Failed to load customer POs", e)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === "customer_po") {
      fetchCustomerPos()
    }
  }, [activeTab, fetchCustomerPos])

  const handleCustomerPoFileUpload = async (id, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append("po_file", file)
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer_purchase_orders/${id}/`, {
        method: "PATCH",
        body: formData,
      })
      if (res.ok) {
        fetchCustomerPos()
      }
    } catch (e) {
      console.error("Upload failed", e)
      alert("Upload failed")
    }
  }

  const handleCreateCustomerPo = async (data) => {
    try {
      const formData = new FormData()
      if (data.write_customer_name) formData.append('write_customer_name', data.write_customer_name)
      if (data.po_number) formData.append('po_number', data.po_number)
      if (data.po_file) formData.append('po_file', data.po_file)

      const res = await fetch(`${API_BASE_URL}/api/customer_purchase_orders/`, {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        setNewCustomerPo(null)
        fetchCustomerPos()
      } else {
        const err = await res.json()
        alert("Failed to create Customer Purchase Order: " + JSON.stringify(err))
      }
    } catch (e) {
      console.error("Create failed", e)
      alert("Failed to create Customer Purchase Order")
    }
  }

  const handleDeleteCustomerPo = (id) => {
    setCustomerPoToDelete(id)
  }

  const confirmDeleteCustomerPo = async () => {
    if (!customerPoToDelete) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer_purchase_orders/${customerPoToDelete}/`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchCustomerPos()
        setCustomerPoToDelete(null)
      }
    } catch (e) {
      console.error("Delete failed", e)
    }
  }

  const startEditingCustomerPo = (po) => {
    setEditingCustomerPoId(po.id)
    setEditingCustomerPoData({
      write_customer_name: po.customer_name || po.customer_details?.company_name || "",
      po_number: po.po_number || ""
    })
  }

  const saveEditingCustomerPo = async () => {
    if (!editingCustomerPoId) return
    try {
      const formData = new FormData()
      if (editingCustomerPoData.write_customer_name) formData.append('write_customer_name', editingCustomerPoData.write_customer_name)
      if (editingCustomerPoData.po_number) formData.append('po_number', editingCustomerPoData.po_number)

      const res = await fetch(`${API_BASE_URL}/api/customer_purchase_orders/${editingCustomerPoId}/`, {
        method: "PATCH",
        body: formData,
      })
      if (res.ok) {
        fetchCustomerPos()
        setEditingCustomerPoId(null)
        setEditingCustomerPoData({})
      } else {
         const err = await res.json()
         alert("Failed to update: " + JSON.stringify(err))
      }
    } catch (e) {
      console.error("Update failed", e)
      alert("Update failed")
    }
  }


  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(poList.map(po => po.sourceIndex))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(prev => prev.filter(x => x !== id))
    } else {
      setSelectedRows(prev => [...prev, id])
    }
  }

  const handleBatchDelete = async () => {
    try {
        await Promise.all(selectedRows.map(id => 
            fetch(`${API_BASE_URL}/api/purchase_orders/${id}/`, { method: 'DELETE' })
        ))
        fetchPurchaseOrders()
        setSelectedRows([])
        setOpenDeleteConfirm(false)
    } catch (e) {
        console.error("Batch delete failed", e)
        alert("Batch delete failed")
    }
  }

  const fetchPurchaseOrders = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/purchase_orders/`)
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map(po => ({
            poNumber: po.number,
            customer: po.customer,
            items: po.items,
            details: {
                poNumber: po.number,
                eit: po.eit_details?.id || po.eit,
                eitName: po.extra_fields?.eitName || po.eit_details?.organization_name || "",
                eitAddress: po.extra_fields?.eitAddress || po.eit_details?.address || "",
                ...po.extra_fields
            },
            extraFields: po.extra_fields,
            updatedAt: po.updated_at,
            sourceKey: 'api',
            sourceIndex: po.id
        }))
        setPoList(mapped)
      }
    } catch (e) {
      console.error("Failed to fetch POs", e)
    }
  }, [])

  // Load PO List
  React.useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  // Load from API if query params present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")
    const index = params.get("index")

    if (key && index) {
      q.setSourceKey(key)
      q.setSourceIndex(index)

      if (key === "api") {
        fetch(`${API_BASE_URL}/api/purchase_orders/${index}/`)
          .then(res => res.json())
          .then(data => {
            q.setDetails(prev => ({
              ...prev,
              poNumber: data.po_code || "",
              orderDate: data.order_date || new Date().toISOString().slice(0, 10),
              deliveryDate: data.delivery_date || "",
              refQuotation: data.ref_quotation || "",
              paymentTerms: data.payment_terms || "",
              deliveryTo: data.delivery_to || "",
              
              eit: data.eit_details?.id || null,
              eitName: data.eit_details?.organization_name || "EIT LASERTECHNIK CO.,LTD",
              eitAddress: data.eit_details?.address || "",
              eitPhone: data.eit_details?.eit_telephone || "",
              eitFax: data.eit_details?.eit_fax || "",
              eitMobile: data.eit_details?.eit_mobile || "",
              
              salesPerson: data.sales_person || "",
              remark: data.remark || "",
              currency: data.currency || "THB"
            }))
            
            q.setVendor({
              company: data.vendor_company || "",
              name: data.vendor_name || "",
              email: data.vendor_email || "",
              companyEmail: data.vendor_company_email || "",
              phone: data.vendor_phone || "",
              companyPhone: data.vendor_company_phone || "",
              address: data.vendor_address || ""
            })
            
            if (Array.isArray(data.items)) {
               q.setItems(data.items)
            }
            setShowForm(true)
          })
          .catch(err => console.error("Error loading PO from API:", err))
      }
    }
  }, [])

  const generatePoNumber = React.useCallback(() => {
    const nums = poList
      .map(po => String(po.poNumber || po.details?.poNumber || ""))
      .map(s => {
        const m = s.match(/^PO[-/ ]?(\d{1,5})$/i)
        return m ? parseInt(m[1], 10) : null
      })
      .filter(n => Number.isFinite(n))
    const next = (nums.length ? Math.max(...nums) + 1 : 1)
    return `PO-${String(next).padStart(3, "0")}`
  }, [poList])
  React.useEffect(() => {
    if (!showForm) return
    if (!q.details.poNumber) {
      const num = generatePoNumber()
      q.setDetails(prev => ({ ...prev, poNumber: num }))
    }
  }, [showForm, q.details.poNumber, generatePoNumber])

  const keyForCustomer = React.useCallback(() => {
    const e = (q.vendor.email || "").trim().toLowerCase()
    if (e) return e
    const ce = (q.vendor.companyEmail || "").trim().toLowerCase()
    if (ce) return ce
    const p = (q.vendor.phone || "").trim()
    if (p) return p
    const n = (q.vendor.name || "").trim().toLowerCase()
    if (n) return n
    return ""
  }, [q.vendor])

  React.useEffect(() => {
    if (!showForm) return
    const k = keyForCustomer()
    if (!k) return
    if (!prefilledRef.current) {
      try {
        const raw = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
        const h = (raw && typeof raw === 'object') ? raw : {}
        if (h.customer) {
          q.setVendor((prev) => ({
            ...prev,
            name: prev.name || h.customer.name || "",
            company: prev.company || h.customer.company || "",
            email: prev.email || h.customer.email || "",
            companyEmail: prev.companyEmail || h.customer.companyEmail || "",
            phone: prev.phone || h.customer.phone || "",
            companyPhone: prev.companyPhone || h.customer.companyPhone || "",
            address: prev.address || h.customer.address || "",
          }))
          if (h.customer.deliveryTo) {
             q.setDetails(prev => ({...prev, deliveryTo: prev.deliveryTo || h.customer.deliveryTo}))
          }
          prefilledRef.current = true
        }
      } catch {}
    }
    
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
        const h = (raw && typeof raw === 'object') ? raw : {}
        const payload = {
          ...h,
          customer: { ...q.vendor, deliveryTo: q.details.deliveryTo },
          quotations: Array.isArray(h.quotations) ? h.quotations : [],
          invoices: Array.isArray(h.invoices) ? h.invoices : [],
          emails: Array.isArray(h.emails) ? h.emails : [],
        }
        localStorage.setItem(`history:${k}`, JSON.stringify(payload))
      } catch {}
    }, 500)
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
    }
  }, [showForm, q.vendor, q.details.deliveryTo, keyForCustomer])
  const persistPoList = React.useCallback((next) => {
    setPoList(next)
    try {
      localStorage.setItem("poList", JSON.stringify(next))
    } catch {}
  }, [])

  const startNew = () => {
    q.setSourceKey(null)
    q.setSourceIndex(null)
    q.setDetails({
      poNumber: generatePoNumber(),
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: "",
      refQuotation: "",
      paymentTerms: "",
      deliveryTo: "",
      eit: null,
      eitName: "EIT LASERTECHNIK CO.,LTD",
      eitAddress: "1/120 ซอยรามคําแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510",
      eitPhone: "02-052-9544",
      eitFax: "02-052 9544",
      eitMobile: "000-000-0000",
      salesPerson: "",
      remark: "",
      currency: "THB"
    })
    q.setVendor({
      company: "",
      name: "",
      email: "",
      companyEmail: "",
      phone: "",
      companyPhone: "",
      address: ""
    })
    q.setItems([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
    prefilledRef.current = false
    setShowForm(true)
  }

  const editPo = (idx) => {
    const p = poList[idx]
    if (!p) return
    q.setSourceKey(p.sourceKey)
    q.setSourceIndex(p.sourceIndex)
    q.setDetails({
       poNumber: p.poNumber || "",
       orderDate: p.extraFields?.orderDate || "",
       deliveryDate: p.extraFields?.deliveryDate || "",
       refQuotation: p.extraFields?.refQuotation || "",
       paymentTerms: p.extraFields?.paymentTerms || "",
       deliveryTo: p.extraFields?.deliveryTo || "",
       eit: p.details?.eit || null,
       eitName: "EIT LASERTECHNIK CO.,LTD", // Defaults
       eitAddress: "1/120 ซอยรามคําแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510",
       eitPhone: "02-052-9544",
       eitFax: "02-052 9544",
       eitMobile: "000-000-0000",
       salesPerson: "",
       remark: "",
       currency: "THB",
       ...p.details // Overwrite if exists
    })
    q.setVendor(p.customer || { company: "", name: "", email: "", companyEmail: "", phone: "", companyPhone: "", address: "" })
    q.setItems(Array.isArray(p.items) && p.items.length ? p.items : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
    setShowForm(true)
  }

  const handleSave = async () => {
    const payload = {
        number: q.details.poNumber,
        customer: q.vendor,
        eit: q.details.eit,
        eit_name: q.details.eitName,
        items: q.items,
        extra_fields: {
            orderDate: q.details.orderDate,
            deliveryDate: q.details.deliveryDate,
            refQuotation: q.details.refQuotation,
            paymentTerms: q.details.paymentTerms,
            deliveryTo: q.details.deliveryTo,
            remark: q.details.remark,
            currency: q.details.currency,
            salesPerson: q.details.salesPerson,
            eitName: q.details.eitName,
            eitAddress: q.details.eitAddress,
            eitPhone: q.details.eitPhone,
            eitFax: q.details.eitFax,
            eitMobile: q.details.eitMobile
        },
        totals: {}
    }

    try {
        let url = `${API_BASE_URL}/api/purchase_orders/`
        let method = 'POST'
        
        if (q.sourceKey === 'api' && q.sourceIndex) {
            url += `${q.sourceIndex}/`
            method = 'PUT'
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (response.ok) {
            alert("Purchase Order saved successfully!")
            fetchPurchaseOrders()
            setShowForm(false)
        } else {
            const err = await response.json()
            alert("Error saving Purchase Order: " + JSON.stringify(err))
        }
    } catch (e) {
        console.error(e)
        alert("Error saving Purchase Order")
    }
  }

  const handlePrint = (po) => {
    setPrintingPo(po)
  }

  // Auto-print effect
  React.useEffect(() => {
    if (printingPo) {
      const handleAfterPrint = () => {
        setPrintingPo(null)
      }
      window.addEventListener("afterprint", handleAfterPrint)

      // Small delay to ensure render
      const timer = setTimeout(() => {
        window.print()
      }, 500)

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint)
        clearTimeout(timer)
      }
    }
  }, [printingPo])

  // Render Form
  if (showForm) {
    return (
      <div className="h-full">
        {printingPo && createPortal(
          <div id="print-overlay" className="fixed inset-0 z-[50] bg-white">
             <style>{`
               #print-overlay {
                  display: none;
               }
               @media print {
                 body {
                   visibility: hidden !important;
                 }
                 #print-overlay { 
                   visibility: visible !important;
                   display: block !important; 
                   position: absolute !important;
                   top: 0 !important;
                   left: 0 !important;
                   width: 100% !important;
                   height: 100% !important;
                   overflow: visible !important;
                   background: white !important;
                   z-index: 2147483647 !important;
                   padding: 0 !important;
                 }
                 #print-overlay * {
                   visibility: visible !important;
                 }
                 #print-overlay .print-content {
                   width: 100% !important;
                   margin: 0 !important;
                   box-shadow: none !important;
                 }
                 html, body {
                   height: auto !important;
                   overflow: visible !important;
                   background: white !important;
                 }
                 @page {
                   size: auto;
                   margin: 0mm;
                 }
               }
             `}</style>
             
             <div className="print-content bg-white p-0 relative">
               <PurchaseOrderTemplate q={printingPo} />
             </div>
          </div>,
          document.body
        )}

        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowForm(false)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                title="Back to List"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 text-[#2D4485]">
                <ShoppingCart className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Purchase Order</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
               
            </div>
          </div>

          {/* Code Box */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
             <h2 className="text-xl font-bold text-[#2D4485]">Purchase Order Information</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                 <input value={q.details.poNumber} onChange={(e) => q.setDetails({ ...q.details, poNumber: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="PO Number" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">QO Number</label>
                 <select 
                    value={q.details.refQuotation} 
                    onChange={(e) => {
                        const val = e.target.value
                        q.setDetails({ ...q.details, refQuotation: val })
                        
                        // Try to auto-fill if user selects a valid quotation (case-insensitive)
                         const found = quotationOptions.find(qo => qo.qo_code?.toLowerCase() === val?.toLowerCase())
                         if (found) {
                             // Map quotation data to PO fields
                             q.setDetails(prev => ({
                                ...prev,
                                refQuotation: found.qo_code,
                                // paymentTerms: found.payment_terms || prev.paymentTerms, // Removed auto-fill per user request
                                // deliveryTo: found.shipment_location || prev.deliveryTo, // Removed auto-fill per user request
                                // Map EIT details if available
                                 eit: found.eit || prev.eit,
                                 eitName: found.eit_details?.organization_name || prev.eitName,
                                 eitAddress: found.eit_details?.address || prev.eitAddress,
                                 eitPhone: found.eit_details?.eit_telephone || prev.eitPhone,
                                 eitFax: found.eit_details?.eit_fax || prev.eitFax,
                                 eitMobile: found.eit_details?.eit_mobile || prev.eitMobile,
                             }))
                             
                        }
                    }} 
                     className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                  >
                     <option value="">Select QO Number</option>
                     {q.details.refQuotation && !quotationOptions.find(o => o.qo_code === q.details.refQuotation) && (
                        <option value={q.details.refQuotation}>{q.details.refQuotation} (Manual/Legacy)</option>
                     )}
                     {quotationOptions.map(qo => (
                         <option key={qo.id} value={qo.qo_code}>
                             {qo.qo_code}
                         </option>
                     ))}
                  </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                 <DateField value={q.details.orderDate} onChange={(val) => q.setDetails({ ...q.details, orderDate: val })} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                 <DateField value={q.details.deliveryDate} onChange={(val) => q.setDetails({ ...q.details, deliveryDate: val })} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                 <input value={q.details.paymentTerms} onChange={(e) => q.setDetails({ ...q.details, paymentTerms: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Payment Terms" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Delivery To</label>
                 <input value={q.details.deliveryTo} onChange={(e) => q.setDetails({ ...q.details, deliveryTo: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Delivery To" />
               </div>
            </div>
          </div>

          {/* EIT Box */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
             <h2 className="text-xl font-bold text-[#2D4485]">Buyer (EIT)</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                 <select 
                   value={q.details.eit || ""} 
                   onChange={(e) => {
                     const val = e.target.value
                     if (!val) {
                       q.setDetails({
                         ...q.details,
                         eit: null,
                         eitName: "",
                         eitAddress: "",
                         eitPhone: "",
                         eitFax: "",
                         eitMobile: ""
                       })
                       return
                     }
                     const selected = q.eitOptions.find(o => String(o.id) === val)
                     if (selected) {
                       // Fix: EIT Lasertechnik address is incorrect in API, use hardcoded one matching Einstein
                       let addr = selected.address || ""
                       if (selected.organization_name && (selected.organization_name.toLowerCase().includes("eit lasertechnik") || selected.organization_name.toLowerCase().includes("einstein"))) {
                          addr = "1/120 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510"
                       }

                       q.setDetails({
                         ...q.details,
                         eit: selected.id,
                         eitName: selected.organization_name,
                         eitAddress: addr,
                         eitPhone: selected.eit_telephone || "",
                         eitFax: selected.eit_fax || "",
                         eitMobile: selected.eit_mobile || ""
                       })
                     }
                   }} 
                   className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                 >
                   <option value="">Select Organization</option>
                   {q.eitOptions.map(opt => (
                     <option key={opt.id} value={opt.id}>{opt.organization_name}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                 <textarea value={q.details.eitAddress} onChange={(e) => q.setDetails({ ...q.details, eitAddress: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                 <input value={q.details.eitMobile} onChange={(e) => q.setDetails({ ...q.details, eitMobile: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                 <input value={q.details.eitPhone} onChange={(e) => q.setDetails({ ...q.details, eitPhone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                 <input value={q.details.eitFax} onChange={(e) => q.setDetails({ ...q.details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
               </div>
             </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
            <h2 className="text-xl font-bold text-[#2D4485]">Vendor Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                 <input value={q.vendor.company} onChange={(e) => q.setVendor({ ...q.vendor, company: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Company name" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                 <input value={q.vendor.name} onChange={(e) => q.setVendor({ ...q.vendor, name: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Contact name" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input value={q.vendor.phone} onChange={(e) => q.setVendor({ ...q.vendor, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={q.vendor.email} onChange={(e) => q.setVendor({ ...q.vendor, email: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Email" />
              </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                 <textarea value={q.vendor.address} onChange={(e) => q.setVendor({ ...q.vendor, address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
               </div>
            </div>
          </div>

          {/* Items Box */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-[#2D4485]">Items</h2>
               <button onClick={q.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
                 <Plus className="w-4 h-4" />
                 <span className="text-sm font-medium">Add Item</span>
               </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-5 text-[#2D4485] uppercase text-xs font-bold">
                   <tr>
                     <th className="p-3 border-b w-12">No.</th>
                     <th className="p-3 border-b">Description</th>
                     <th className="p-3 border-b w-24">Qty</th>
                     <th className="p-3 border-b w-24">Unit</th>
                     <th className="p-3 border-b w-32">Price</th>
                     <th className="p-3 border-b w-32">Amount</th>
                     <th className="p-3 border-b w-12"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {q.items.map((item, i) => (
                     <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                       <td className="p-3 text-center text-sm text-gray-700">{i + 1}</td>
                       <td className="p-3">
                        <input value={item.description} onChange={(e) => q.updateItem(i, "description", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none text-gray-700" placeholder="Description" />
                       </td>
                       <td className="p-3">
                         <input type="number" value={item.qty} onChange={(e) => q.updateItem(i, "qty", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none text-right" />
                       </td>
                       <td className="p-3">
                         <input value={item.unit} onChange={(e) => q.updateItem(i, "unit", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none text-center" />
                       </td>
                       <td className="p-3">
                         <input type="number" value={item.price} onChange={(e) => q.updateItem(i, "price", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none text-right" />
                       </td>
                       <td className="p-3 text-right font-medium">
                         {((Number(item.qty)||0) * (Number(item.price)||0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className="p-3 text-center">
                         <button onClick={() => q.removeItem(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                           <Trash className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             <div className="mt-6 flex justify-end">
                <div className="w-auto min-w-[250px] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{q.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (7%)</span>
                    <span className="font-medium">{q.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span className="text-[#2D4485]">Total</span>
                    <span className="text-[#2D4485]">{q.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-4 mb-8">
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 rounded-lg border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 font-medium transition-colors bg-white"
            >
              Cancel
            </button>
            <button
              onClick={() => setOpenCreateConfirm(true)}
              className="px-6 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] font-medium transition-colors shadow-sm"
            >
              Create PO Form
            </button>
          </div>

          {openCreateConfirm && (
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw]" onClick={(e)=>e.stopPropagation()}>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Create PO Form</h3>
                      <div className="text-sm text-gray-600 mt-1">Choose how you want to proceed</div>
                    </div>
                    <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenCreateConfirm(false)}>✕</button>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <button
                      className="w-full px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 min-w-[140px]"
                      onClick={() => { setOpenCreateConfirm(false); setShowForm(false) }}
                    >
                      Discard
                    </button>
                    <button
                      className="w-full px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] min-w-[140px]"
                      onClick={() => {
                        setOpenCreateConfirm(false)
                        handleSave()
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center"
                      onClick={() => {
                        setOpenCreateConfirm(false)
                        const tempPo = {
                            poNumber: q.details.poNumber,
                            customer: q.vendor,
                            extraFields: {
                              refQuotation: q.details.refQuotation,
                              orderDate: q.details.orderDate,
                              deliveryDate: q.details.deliveryDate,
                              paymentTerms: q.details.paymentTerms,
                              deliveryTo: q.details.deliveryTo
                            },
                            items: q.items,
                            details: q.details,
                            updatedAt: new Date().toISOString()
                        }
                        handlePrint(tempPo)
                      }}
                    >
                      Download Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render List
  return (
    <div className="h-full">
      {printingPo && createPortal(
        <div id="print-overlay" className="fixed inset-0 z-[50] bg-white">
           <style>{`
             #print-overlay {
                display: none;
             }
             @media print {
               body {
                 visibility: hidden !important;
               }
               #print-overlay { 
                 visibility: visible !important;
                 display: block !important; 
                 position: absolute !important;
                 top: 0 !important;
                 left: 0 !important;
                 width: 100% !important;
                 height: 100% !important;
                 overflow: visible !important;
                 background: white !important;
                 z-index: 2147483647 !important;
                 padding: 0 !important;
               }
               #print-overlay * {
                 visibility: visible !important;
               }
               #print-overlay .print-content {
                 width: 100% !important;
                 margin: 0 !important;
                 box-shadow: none !important;
               }
               html, body {
                 height: auto !important;
                 overflow: visible !important;
                 background: white !important;
               }
               @page {
                 size: auto;
                 margin: 0mm;
               }
             }
           `}</style>
           
           <div className="print-content bg-white p-0 relative">
             <PurchaseOrderTemplate q={printingPo} />
           </div>
        </div>,
        document.body
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button onClick={()=>setActiveTab('po')} className={`pb-3 text-sm font-medium transition-colors relative ${activeTab==='po' ? 'text-[#2D4485]' : 'text-gray-500 hover:text-gray-700'}`}>
            Purchase Orders
            {activeTab==='po' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D4485]" />}
          </button>
          <button onClick={()=>setActiveTab('customer_po')} className={`pb-3 text-sm font-medium transition-colors relative ${activeTab==='customer_po' ? 'text-[#2D4485]' : 'text-gray-500 hover:text-gray-700'}`}>
            Customer Purchase Orders
            {activeTab==='customer_po' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D4485]" />}
          </button>
        </div>

        {activeTab === 'po' && (
        <div className="bg-white rounded-xl border shadow-sm p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#2D4485]">
                <ShoppingCart className="w-6 h-6" />
                <h1 className="text-xl font-bold">Purchase Orders</h1>
              </div>
              {selectedRows.length > 0 && (
                <button 
                  onClick={() => setOpenDeleteConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash className="w-4 h-4" />
                  Delete ({selectedRows.length})
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={startNew} className="inline-flex items-center gap-2 px-3 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors shadow-sm text-sm font-medium">
                <Plus className="w-4 h-4" />
                <span>New PO</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700 border-b">
                  <th className="p-3 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      checked={poList.length > 0 && selectedRows.length === poList.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left w-16">Index</th>
                  <th className="p-3 text-left">PO Number</th>
                  <th className="p-3 text-left">Vendor</th>
                  <th className="p-3 text-left">Order Date</th>
                  <th className="p-3 text-left">Delivery Date</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {poList.map((po, i) => {
                  const total = (po.items || []).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0)
                  const tax = total * 0.07
                  const grandTotal = total + tax
                  
                  return (
                    <tr key={po.sourceIndex} className={`hover:bg-gray-50 ${selectedRows.includes(po.sourceIndex) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                          checked={selectedRows.includes(po.sourceIndex)}
                          onChange={() => handleSelectRow(po.sourceIndex)}
                        />
                      </td>
                      <td className="p-3 text-gray-500">{i + 1}</td>
                      <td className="p-3 font-medium">
                        <button onClick={() => editPo(i)} className="text-[#2D4485] hover:underline text-left">
                          {po.poNumber}
                        </button>
                      </td>
                      <td className="p-3">{po.customer?.company || po.customer?.name || "-"}</td>
                      <td className="p-3">{po.extraFields?.orderDate || "-"}</td>
                      <td className="p-3 text-green-600">{po.extraFields?.deliveryDate || "-"}</td>
                      <td className="p-3 text-right font-medium">
                        {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })}
                {poList.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No purchase orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === 'customer_po' && (
          <div className="bg-white rounded-xl border shadow-sm p-6 relative">
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold text-[#2D4485]">Customer Purchase Orders</h1>
               </div>
               <button onClick={() => setNewCustomerPo({})} className="inline-flex items-center gap-2 px-3 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors shadow-sm text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  <span>New Customer PO</span>
               </button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="min-w-full text-sm">
                 <thead>
                   <tr className="bg-gray-50 text-gray-700 border-b">
                     <th className="p-3 text-left w-10">No.</th>
                     <th className="p-3 text-left">Customer Company</th>
                     <th className="p-3 text-left">Customer PO Number</th>
                     <th className="p-3 text-left">PO Form</th>
                     <th className="p-3 w-12"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {newCustomerPo && (
                     <tr className="bg-blue-50/50">
                        <td className="p-3">-</td>
                        <td className="p-3">
                           <select 
                              autoFocus
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                              value={newCustomerPo.write_customer_name || ""}
                              onChange={e => setNewCustomerPo({...newCustomerPo, write_customer_name: e.target.value})}
                           >
                              <option value="">Select Customer</option>
                              {customerOptions.map(c => (
                                <option key={c.id} value={c.company_name}>{c.company_name}</option>
                              ))}
                           </select>
                        </td>
                        <td className="p-3">
                           <input 
                              placeholder="Customer PO Number"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                              value={newCustomerPo.po_number || ""}
                              onChange={e => setNewCustomerPo({...newCustomerPo, po_number: e.target.value})}
                           />
                        </td>
                        <td className="p-3">
                           <div className="flex items-center gap-2">
                              <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 rounded border border-blue-100 transition-colors">
                                 {newCustomerPo.po_file ? "File Selected" : "Upload File"}
                                 <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => setNewCustomerPo({...newCustomerPo, po_file: e.target.files[0]})} 
                                 />
                              </label>
                              {newCustomerPo.po_file && (
                                 <span className="text-xs text-gray-600 truncate max-w-[150px]">{newCustomerPo.po_file.name}</span>
                              )}
                           </div>
                        </td>
                        <td className="p-3 flex items-center gap-2">
                           <button onClick={() => handleCreateCustomerPo(newCustomerPo)} className="text-green-600 hover:text-green-800 font-medium">Save</button>
                           <button onClick={() => setNewCustomerPo(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                        </td>
                     </tr>
                   )}

                   {customerPoList.map((po, i) => {
                     const isEditing = editingCustomerPoId === po.id
                     return (
                     <tr key={po.id} className="hover:bg-gray-50">
                       <td className="p-3 text-gray-500">{i + 1}</td>
                       <td className="p-3 font-medium text-gray-900" onClick={() => !isEditing && startEditingCustomerPo(po)}>
                          {isEditing ? (
                             <select 
                                autoFocus
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                                value={editingCustomerPoData.write_customer_name || ""}
                                onChange={e => setEditingCustomerPoData({...editingCustomerPoData, write_customer_name: e.target.value})}
                             >
                                <option value="">Select Customer</option>
                                {customerOptions.map(c => (
                                  <option key={c.id} value={c.company_name}>{c.company_name}</option>
                                ))}
                             </select>
                          ) : (
                             <div className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -ml-2">
                               {po.customer_name || po.customer_details?.company_name || "-"}
                             </div>
                          )}
                       </td>
                       <td className="p-3 text-gray-600" onClick={() => !isEditing && startEditingCustomerPo(po)}>
                          {isEditing ? (
                             <input 
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                                value={editingCustomerPoData.po_number || ""}
                                onChange={e => setEditingCustomerPoData({...editingCustomerPoData, po_number: e.target.value})}
                             />
                          ) : (
                             <div className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -ml-2">
                               {po.po_number || "-"}
                             </div>
                          )}
                       </td>
                       <td className="p-3">
                          <div className="flex items-center gap-3">
                             {po.po_file_name ? (
                               <>
                                 <a 
                                   href={`${API_BASE_URL}/api/customer_purchase_orders/${po.id}/download/`} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline font-medium text-sm truncate max-w-[200px]"
                                 >
                                   {po.po_file_name}
                                 </a>
                                 <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 rounded border border-blue-100 transition-colors">
                                    Replace
                                    <input type="file" className="hidden" onChange={(e) => handleCustomerPoFileUpload(po.id, e.target.files[0])} />
                                 </label>
                               </>
                             ) : (
                               <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 rounded border border-blue-100 transition-colors">
                                  Upload
                                  <input type="file" className="hidden" onChange={(e) => handleCustomerPoFileUpload(po.id, e.target.files[0])} />
                               </label>
                             )}
                          </div>
                       </td>
                       <td className="p-3 text-center">
                         {isEditing ? (
                           <div className="flex items-center gap-2">
                             <button onClick={saveEditingCustomerPo} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                             <button onClick={() => setEditingCustomerPoId(null)} className="text-gray-500 hover:text-gray-700 text-xs">Cancel</button>
                           </div>
                         ) : (
                           <button onClick={() => handleDeleteCustomerPo(po.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                             <Trash className="w-4 h-4" />
                           </button>
                         )}
                       </td>
                     </tr>
                   )})}
                   
                   {!newCustomerPo && customerPoList.length === 0 && (
                     <tr><td colSpan={5} className="p-8 text-center text-gray-500">No customer purchase orders found</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>

      {openDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOpenDeleteConfirm(false)}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Purchase Orders</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete {selectedRows.length} selected purchase orders?</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setOpenDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleBatchDelete}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {customerPoToDelete && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setCustomerPoToDelete(null)}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Purchase Orders</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete 1 selected purchase orders?</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setCustomerPoToDelete(null)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDeleteCustomerPo}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
