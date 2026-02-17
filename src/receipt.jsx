import React from "react"
import { API_BASE_URL } from "./config"
import { Plus, Trash, ArrowLeft, Receipt, ClipboardList } from "lucide-react"
import Navigation from "./components/navigation.jsx"
import { CustomerCombobox } from "./components/customer-combobox"
import { Combobox } from "./components/combobox"
import { DateField } from "./components/ui/date-field"
import { THBText } from "./utils/currency"
import "./index.css"

function useReceiptState() {
  const [customer, setCustomer] = React.useState({
    company: "",
    address: "",
    taxId: "",
    telephone: "",
    fax: "",
    attn: "",
    div: "",
    mobile: "",
    email: ""
  })

  // Helper to get next receipt number
  const getNextReceiptNumber = () => {
    const receipts = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("history:")) {
          try {
            const item = JSON.parse(localStorage.getItem(key))
            if (item && Array.isArray(item.receipts)) {
              receipts.push(...item.receipts)
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Error reading localStorage", e)
    }

    const currentYear = new Date().getFullYear()
    const nums = receipts
      .map(n => String(n.number || n.details?.number || ""))
      .map(s => {
        const m = s.match(new RegExp(`^TAX ${currentYear}-(\\d{4})$`, 'i'))
        return m ? parseInt(m[1], 10) : null
      })
      .filter(n => Number.isFinite(n))
    const next = (nums.length ? Math.max(...nums) + 1 : 1)
    return `TAX ${currentYear}-${String(next).padStart(4, "0")}`
  }

  React.useEffect(() => {
    document.title = "Tax Invoice"
  }, [])

  const [details, setDetails] = React.useState({
    number: getNextReceiptNumber(),
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    poNo: "",
    paymentType: "",
    currency: "THB",
    notes: "",
    paymentTermsDays: 7,
    sourceInvoiceNumber: "",
    salesPerson: "",
    eit: null,
    eitAddress: "",
    eitTelephone: "",
    eitFax: "",
    eitMobile: "",
    onBehalfOf: ""
  })

  const [eitOptions, setEitOptions] = React.useState([])
  const [customerOptions, setCustomerOptions] = React.useState([])
  const [poOptions, setPoOptions] = React.useState([])

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

  // Load Customer options from Deals
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/deals/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const unique = {}
          data.forEach(d => {
            if (d.customer_name && !unique[d.customer_name]) {
              unique[d.customer_name] = d
            }
          })
          setCustomerOptions(Object.values(unique))
        }
      })
      .catch(err => console.error("Error loading deals for customers", err))
  }, [])

  // Load PO options from CustomerPurchaseOrder
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/customer_purchase_orders/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const uniquePos = [...new Set(data.map(item => item.po_number).filter(Boolean))]
          setPoOptions(uniquePos)
        }
      })
      .catch(err => console.error("Error loading customer purchase orders", err))
  }, [])

  const [items, setItems] = React.useState([{ item: "", model: "", description: "", qty: 1, price: 0 }])
  const [sourceKey, setSourceKey] = React.useState(null)
  const [sourceIndex, setSourceIndex] = React.useState(null)

  // Initialization: load from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")
    const index = params.get("index")

    if (key && index) {
      setSourceKey(key)
      setSourceIndex(index)

      if (key === 'api') {
        fetch(`${API_BASE_URL}/api/receipts/${index}/`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
          })
          .then(data => {
            setCustomer(data.customer || {
              company: "",
              address: "",
              taxId: "",
              telephone: "",
              fax: "",
              attn: "",
              div: "",
              mobile: "",
              email: ""
            })
            setDetails(prev => ({
              ...prev,
              ...data.details,
              number: data.number,
              eit: data.eit || data.eit_details?.id || "",
              salesPerson: data.details?.salesPerson || data.eit_details?.organization_name || "",
              onBehalfOf: data.details?.onBehalfOf || data.eit_details?.organization_name || "",
              eitAddress: data.details?.eitAddress || data.eit_details?.address || "",
              eitTelephone: data.details?.eitTelephone || data.eit_details?.eit_telephone || "",
              eitFax: data.details?.eitFax || data.eit_details?.eit_fax || "",
              eitMobile: data.details?.eitMobile || data.eit_details?.eit_mobile || ""
            }))
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items.map(i => ({
                item: i.item || i.product || "",
                model: i.model || "",
                description: i.description || "",
                qty: i.qty || 1,
                price: i.price || 0
              })))
            }
          })
          .catch(err => console.error("Error loading receipt from API", err))
      } else {
        // Load from localStorage history
        try {
          const storedItem = JSON.parse(localStorage.getItem(key))
          if (storedItem) {
             const receiptList = storedItem.receipts || []
             if (receiptList[index]) {
               const rec = receiptList[index]
               setCustomer(rec.customer || {
                 company: "",
                 address: "",
                 taxId: "",
                 telephone: "",
                 fax: "",
                 attn: "",
                 div: "",
                 mobile: "",
                 email: ""
               })
               setDetails(prev => ({ ...prev, ...(rec.details || {}) }))
               if (rec.items) {
                 setItems(rec.items.map(i => ({
                   item: i.item || i.product || "",
                   model: i.model || "",
                   description: i.description || "",
                   qty: i.qty || 1,
                   price: i.price || 0
                 })))
               }
             }
          }
        } catch (e) {
          console.error("Error loading from localStorage", e)
        }
      }
      return
    }

    // Default initialization
    setDetails((prev) => {
      const d = new Date(prev.date || new Date().toISOString().slice(0, 10))
      const number = prev.number || getNextReceiptNumber()
      const due = new Date(d)
      due.setDate(due.getDate() + Number(prev.paymentTermsDays || 0))
      return { ...prev, number, dueDate: due.toISOString().slice(0, 10) }
    })
  }, [])

  // Recalculate dueDate when date or paymentTermsDays change
  React.useEffect(() => {
    try {
      const base = new Date(details.date)
      if (isNaN(base.getTime())) return
      const due = new Date(base)
      due.setDate(due.getDate() + Number(details.paymentTermsDays || 0))
      const dueStr = due.toISOString().slice(0, 10)
      setDetails((prev) => ({ ...prev, dueDate: dueStr }))
    } catch {}
  }, [details.date, details.paymentTermsDays])

  const subtotal = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const taxTotal = subtotal * 0.07
  const total = subtotal + taxTotal

  const addItem = () => setItems((prev) => [...prev, { item: "", model: "", description: "", qty: 1, price: 0 }])
  
  const insertRow = (index) => {
    setItems((prevItems) => {
      const newItems = [...prevItems]
      newItems.splice(index + 1, 0, { item: "", model: "", description: "", qty: 1, price: 0 })
      return newItems
    })
  }

  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) =>
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === i ? { ...row, [field]: field === "qty" || field === "price" ? (value === "" ? "" : Number(value)) : value } : row,
      ),
    )

  const confirm = async () => {
    const payload = { customer, details, items, totals: { subtotal, taxTotal, total } }
    localStorage.setItem("receiptDraft", JSON.stringify(payload))
    try {
      const key = `history:${customer.email || customer.telephone || customer.company || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const receipts = Array.isArray(existing.receipts) ? existing.receipts : []
      receipts.push({ ...payload, savedAt: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, receipts }))
    } catch {}
    try {
      const token = localStorage.getItem("authToken")
      
      const body = {
        number: details.number,
        customer,
        items, // Backend likely flexible, or will accept 'item' key
        details,
        totals: { subtotal, taxTotal, total, thaiText: THBText(total) },
        eit_name: details.salesPerson,
        eit_address: details.eitAddress,
        eit_phone: details.eitTelephone,
        eit_fax: details.eitFax,
        eit_mobile: details.eitMobile
      }

      if (details.eit != null) {
        body.eit = details.eit
      }
      let url = `${API_BASE_URL}/api/receipts/`
      let method = "POST"

      if (sourceKey === 'api' && sourceIndex) {
          url = `${API_BASE_URL}/api/receipts/${sourceIndex}/`
          method = "PUT"
      }

      const headers = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Token ${token}`

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(body)
      })

      if (response.ok) {
        alert("Tax Invoice saved to database successfully!")
        return true
      } else {
        const errText = await response.text()
        console.error("Failed to save receipt to API:", response.status, errText)
        alert(`Failed to save to database: ${response.status}`)
        return false
      }
    } catch (e) {
      console.error("Error in confirm function:", e)
      alert("Network error saving to database")
      return false
    }
  }

  const print = () => window.print()

  const parseNumber = (val) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    return parseFloat(String(val).replace(/,/g, ''))
  }

  const exportPdf = async () => {
    try {
      const payload = {
        details,
        customer,
        items: items.map(i => ({
          ...i,
          qty: parseNumber(i.qty),
          price: parseNumber(i.price)
        })),
        totals: { subtotal, taxTotal, total, thaiText: THBText(total) }
      }

      const response = await fetch(`${API_BASE_URL}/api/generate-receipt-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }, 500)

      setTimeout(() => {
        document.body.removeChild(iframe)
        window.URL.revokeObjectURL(url)
      }, 60000)

    } catch (err) {
      console.error("PDF generation failed", err)
      alert("Failed to generate PDF (Feature might not be available yet)")
    }
  }

  const emailTo = () => {
    if (!customer.email) {
      return { ok: false, message: "No customer email provided" }
    }
    const subject = encodeURIComponent(`Tax Invoice ${details.number}`)
    const addr = customer.address || "-"
    const body = encodeURIComponent(
      `Dear ${customer.attn || customer.company},\n\nPlease find your tax invoice ${details.number} dated ${details.date}.\n\nTotal: ${total.toFixed(2)} ${details.currency}\nDue Date: ${details.dueDate || "-"}\nTax Invoice Address:\n${addr}\n\nNotes:\n${details.notes || "-"}\n\nRegards,\nEIT Lasertechnik`,
    )
    const link = `mailto:${customer.email}?subject=${subject}&body=${body}`
    window.location.href = link
    try {
      const key = `history:${customer.email || customer.telephone || customer.company || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const emails = Array.isArray(existing.emails) ? existing.emails : []
      emails.push({ type: "receipt", number: details.number, sentAt: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, emails }))
    } catch {}
    return { ok: true }
  }

  return {
    customer,
    setCustomer,
    details,
    setDetails,
    eitOptions,
    customerOptions,
    poOptions,
    items,
    addItem,
    insertRow,
    removeItem,
    updateItem,
    subtotal,
    taxTotal,
    total,
    confirm,
    print,
    exportPdf,
    emailTo,
  }
}

function ReceiptPage() {
  const {
    customer,
    setCustomer,
    details,
    setDetails,
    eitOptions,
    customerOptions,
    poOptions,
    items,
    addItem,
    insertRow,
    removeItem,
    updateItem,
    subtotal,
    taxTotal,
    total,
    confirm,
    print,
    exportPdf,
    emailTo,
  } = useReceiptState()

  const handleEitChange = (val) => {
    // If val is empty, reset
    if (!val) {
        setDetails(prev => ({
            ...prev,
            salesPerson: "",
            eit: null,
            eitAddress: "",
            eitTelephone: "",
            eitFax: "",
            eitMobile: "",
            onBehalfOf: ""
        }))
        return
    }

    // Check if val is an ID (from select value) or name
    const selected = eitOptions.find(e => String(e.id) === val || e.organization_name === val)
    
    if (selected) {
      setDetails(prev => ({
        ...prev,
        salesPerson: selected.organization_name,
        eit: selected.id,
        eitAddress: selected.address || "",
        eitTelephone: selected.eit_telephone || "",
        eitFax: selected.eit_fax || "",
        eitMobile: selected.eit_mobile || "",
        onBehalfOf: selected.organization_name
      }))
    } else {
      // Manual entry fallback
      setDetails(prev => ({
        ...prev,
        salesPerson: val,
        eit: null
      }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <Navigation />
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:max-w-none">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
             <button
              onClick={() => window.location.href = "/admin.html"}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Back to List"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2D4485] rounded-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">New Tax Invoice</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportPdf}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-down"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
              PDF
            </button>
            <button
              onClick={confirm}
              className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Tax Invoice
            </button>
          </div>
        </div>

        {/* Codes Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">Codes</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tax Invoice Number</label>
               <input value={details.number} onChange={(e) => setDetails({ ...details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Tax Invoice Number" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
               <DateField value={details.date} onChange={(val) => setDetails({ ...details, date: val })} />
             </div>
          </div>
        </div>

        {/* EIT Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">EIT/Einstein organization</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
               <select 
                 value={details.eit || ""} 
                 onChange={(e) => handleEitChange(e.target.value)} 
                 className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
               >
                 <option value="">Select Organization</option>
                 {eitOptions.map(opt => (
                   <option key={opt.id} value={opt.id}>{opt.organization_name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
               <input value={details.eitMobile} onChange={(e) => setDetails({ ...details, eitMobile: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
               <input value={details.eitTelephone} onChange={(e) => setDetails({ ...details, eitTelephone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
               <input value={details.eitFax} onChange={(e) => setDetails({ ...details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
             </div>
           </div>
        </div>

        {/* Customer Information Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
          
          <h3 className="text-base font-bold text-gray-900 pt-2">Customer Company</h3>

          {/* Company Name & Tax ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <CustomerCombobox
                  value={customer.company}
                  options={customerOptions}
                  onChange={(val) => {
                    const match = customerOptions.find(c => c.customer_name === val)
                    if (match) {
                      setCustomer({ 
                        ...customer, 
                        company: val,
                        taxId: match.tax_id || customer.taxId,
                        address: match.billing_address || match.customer_address || customer.address,
                        telephone: match.phone || customer.telephone,
                        attn: match.contact_person || customer.attn,
                        email: match.email || customer.email,
                        fax: match.fax || customer.fax,
                        mobile: match.mobile || customer.mobile
                      })
                    } else {
                      setCustomer({ ...customer, company: val })
                    }
                  }}
                />
              </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
               <input value={customer.taxId} onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Tax ID" />
             </div>
          </div>

          {/* Attn, Div, Mobile, Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attn.</label>
                <input value={customer.attn} onChange={(e) => setCustomer({ ...customer, attn: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Attn." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Div.</label>
                <input value={customer.div} onChange={(e) => setCustomer({ ...customer, div: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Div." />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Email" />
            </div>
          </div>

          {/* Telephone / Fax / Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input value={customer.telephone} onChange={(e) => setCustomer({ ...customer, telephone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input value={customer.fax} onChange={(e) => setCustomer({ ...customer, fax: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
            </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
             </div>
          </div>
        </div>

        {/* Tax Invoice Description (Items) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
            <h2 className="text-xl font-bold text-[#2D4485]">Tax Invoice Description</h2>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-3 border-b w-16">Item</th>
                  <th className="p-3 border-b">Model</th>
                  <th className="p-3 border-b">Description</th>
                  <th className="p-3 border-b w-32">Price</th>
                  <th className="p-3 border-b w-20">Quantity</th>
                  <th className="p-3 border-b w-32">Total (Baht)</th>
                  <th className="p-3 border-b w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100 group">
                    <td className="p-3 align-top">
                        <input
                            value={item.item}
                            onChange={(e) => updateItem(i, "item", e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-900 focus:ring-0 placeholder:text-slate-300"
                            placeholder="Item"
                        />
                    </td>
                    <td className="p-3 align-top">
                        <input
                            value={item.model}
                            onChange={(e) => updateItem(i, "model", e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm text-slate-900 focus:ring-0 placeholder:text-slate-300"
                            placeholder="Model"
                        />
                    </td>
                    <td className="p-3 align-top">
                        <textarea
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 placeholder:text-slate-300 resize-none"
                            placeholder="Description"
                            rows={1}
                            style={{ minHeight: "24px" }}
                        />
                    </td>
                    <td className="p-3 align-top">
                         <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(i, "price", e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm text-right text-slate-900 focus:ring-0"
                        />
                    </td>
                    <td className="p-3 align-top">
                         <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(i, "qty", e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm text-right text-slate-900 focus:ring-0"
                        />
                    </td>
                    <td className="p-3 align-top text-right text-sm font-medium text-slate-900">
                        {((Number(item.qty) || 0) * (Number(item.price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => insertRow(i)} className="text-[#2D4485] hover:text-[#1a2c5e]" title="Insert Item Below"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => removeItem(i)} className="text-red-600 hover:text-red-800" title="Delete"><Trash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
             <button
              onClick={addItem}
              className="flex items-center gap-2 text-sm font-medium text-[#2D4485] hover:text-[#1e2f5c] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>

            {/* Totals */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>VAT (7%)</span>
                  <span>{taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#2D4485] pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span>{details.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right text-xs text-slate-500 mt-1">
                  ({THBText(total)})
                </div>
              </div>
            </div>
        </div>

        {/* Terms Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
             <h2 className="text-xl font-bold text-[#2D4485]">Terms & Conditions</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                     <Combobox
                        options={poOptions}
                        value={details.poNo}
                        onChange={(val) => setDetails({ ...details, poNo: val })}
                        placeholder="Select or type PO..."
                        className="w-full"
                    />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                     <select
                        value={details.currency}
                        onChange={(e) => setDetails({ ...details, currency: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                    >
                        <option value="THB">THB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                    <input
                        type="number"
                        value={details.paymentTermsDays}
                        onChange={(e) => setDetails({ ...details, paymentTermsDays: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <DateField value={details.dueDate} onChange={(d) => setDetails({ ...details, dueDate: d })} />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        value={details.notes}
                        onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                        placeholder="Additional notes..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none min-h-[80px]"
                    />
                 </div>
             </div>
        </div>
      </main>
    </div>
  )
}

export default ReceiptPage
