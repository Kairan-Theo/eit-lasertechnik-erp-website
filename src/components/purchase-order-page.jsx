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
  Calendar as CalendarIcon,
  ShoppingCart
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

// DateField component helper (copied from billing-note.jsx style)
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
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
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
        <div onMouseDown={(e) => e.stopPropagation()} className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+2px)] z-50 bg-white border border-slate-200 rounded-[22px] shadow-xl p-4 w-[340px]">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return
              const v = format(d, "yyyy-MM-dd")
              onChange(v)
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
              today: `bg-[#D6E4FF] text-[#2D4485] font-semibold ${defaultClassNames.today}`,
              outside: `text-slate-400 ${defaultClassNames.outside}`,
              disabled: `${defaultClassNames.disabled}`,
            }}
            modifiersClassNames={{
              selected: "border-2 border-[#2D4485]/30 !bg-transparent text-[#2D4485] font-semibold",
            }}
          />
        </div>
      )}
    </div>
  )
}

function THBText(num) {
  if (!num || num === 0) return "ศูนย์บาทถ้วน"
  num = Number(num).toFixed(2)
  let [baht, satang] = num.split(".")
  const thaiNum = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
  const unit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"]

  function convert(n) {
    let res = ""
    let len = n.length
    for (let i = 0; i < len; i++) {
      let digit = parseInt(n.charAt(i))
      let pos = len - i - 1
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1) res += "เอ็ด"
        else if (pos === 1 && digit === 2) res += "ยี่"
        else if (pos === 1 && digit === 1) res += ""
        else res += thaiNum[digit]

        if (pos === 0) res += ""
        else if (pos === 1) res += "สิบ"
        else res += unit[pos]
      }
    }
    return res
  }

  let text = ""
  if (parseInt(baht) > 0) {
    if (baht.length > 6) {
       let millions = baht.substring(0, baht.length - 6)
       let remainder = baht.substring(baht.length - 6)
       text += convert(millions) + "ล้าน" + convert(remainder)
    } else {
       text += convert(baht)
    }
    text += "บาท"
  }

  if (parseInt(satang) > 0) {
    text += convert(satang) + "สตางค์"
  } else {
    text += "ถ้วน"
  }
  return text
}

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

  return { vendor, setVendor, details, setDetails, eitOptions, items, setItems, addItem, removeItem, updateItem, subtotal, taxTotal, total }
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(poList.map(po => po.poNumber))
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

  const handleBatchDelete = () => {
    const next = poList.filter(po => !selectedRows.includes(po.poNumber))
    setPoList(next)
    localStorage.setItem("poList", JSON.stringify(next))
    setSelectedRows([])
    setOpenDeleteConfirm(false)
  }

  // Load PO List
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(data)) setPoList(data)
    } catch {}
  }, [])

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
    // API Save if source is API
    if (q.sourceKey === 'api' && q.sourceIndex) {
       try {
          const payload = {
              po_code: q.details.poNumber,
              order_date: q.details.orderDate,
              delivery_date: q.details.deliveryDate,
              ref_quotation: q.details.refQuotation,
              payment_terms: q.details.paymentTerms,
              delivery_to: q.details.deliveryTo,
              
              // EIT
              eit: q.details.eit,
              eit_name: q.details.eitName,
              eit_address: q.details.eitAddress,
              eit_phone: q.details.eitPhone,
              eit_fax: q.details.eitFax,
              eit_mobile: q.details.eitMobile,
              
              remark: q.details.remark,
              currency: q.details.currency,
              
              // Vendor
              vendor_company: q.vendor.company,
              vendor_name: q.vendor.name,
              vendor_email: q.vendor.email,
              vendor_company_email: q.vendor.companyEmail,
              vendor_phone: q.vendor.phone,
              vendor_company_phone: q.vendor.companyPhone,
              vendor_address: q.vendor.address,
              
              items: q.items.map(it => ({
                  description: it.description,
                  product: it.product,
                  quantity: it.qty,
                  unit_price: it.price,
                  unit: it.unit,
                  tax: it.tax,
                  note: it.note
              }))
          }

          const response = await fetch(`${API_BASE_URL}/api/purchase_orders/${q.sourceIndex}/`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          })

          if (response.ok) {
              alert("Purchase Order saved successfully!")
              window.location.href = "/admin.html"
          } else {
              const err = await response.json()
              alert("Error saving Purchase Order: " + JSON.stringify(err))
          }
       } catch (e) {
          console.error(e)
          alert("Error saving Purchase Order")
       }
       return
    }

    try {
      const newPo = {
        poNumber: q.details.poNumber,
        customer: q.vendor, // Keeping 'customer' key for compatibility
        extraFields: {
          refQuotation: q.details.refQuotation,
          orderDate: q.details.orderDate,
          deliveryDate: q.details.deliveryDate,
          paymentTerms: q.details.paymentTerms,
          deliveryTo: q.details.deliveryTo
        },
        items: q.items,
        details: q.details, // Save full details
        updatedAt: new Date().toISOString()
      }

      let next = [...poList]
      const idx = next.findIndex(p => p.poNumber === newPo.poNumber)
      if (idx >= 0) {
        next[idx] = newPo
      } else {
        next.unshift(newPo)
      }
      setPoList(next)
      localStorage.setItem("poList", JSON.stringify(next))
      setShowForm(false)
    } catch (e) {
      console.error("Save error", e)
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
               <button onClick={handleSave} className="bg-[#2D4485] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1E3A8A] transition-colors shadow-sm">
                 Save Purchase Order
               </button>
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
                 <input value={q.details.refQuotation} onChange={(e) => q.setDetails({ ...q.details, refQuotation: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="QO Number" />
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
                       q.setDetails({
                         ...q.details,
                         eit: selected.id,
                         eitName: selected.organization_name,
                         eitAddress: selected.address || "",
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
                    <tr key={po.poNumber} className={`hover:bg-gray-50 ${selectedRows.includes(po.poNumber) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                          checked={selectedRows.includes(po.poNumber)}
                          onChange={() => handleSelectRow(po.poNumber)}
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
                      <td className="p-3">{po.extraFields?.deliveryDate || "-"}</td>
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
    </div>
  )
}
