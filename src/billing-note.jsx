import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft, FileText } from "lucide-react"
import html2pdf from "html2pdf.js"
import "./index.css"

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

function useBillingNoteState() {
  const [customer, setCustomer] = React.useState({
    company: "",
    address: "",
    telephone: "",
    fax: "",
    attn: "",
    div: "",
    mobile: "",
    email: ""
  })

  // Helper to get next billing note number
  const getNextBillingNoteNumber = () => {
    const notes = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("history:")) {
          try {
            const item = JSON.parse(localStorage.getItem(key))
            if (item && Array.isArray(item.billingNotes)) {
              notes.push(...item.billingNotes)
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Error reading localStorage", e)
    }

    const currentYear = new Date().getFullYear()
    const nums = notes
      .map(n => String(n.details?.number || ""))
      .map(s => {
        // Match BI YYYY-XXXX format for the current year
        const m = s.match(new RegExp(`^BI ${currentYear}-(\\d{4})$`))
        return m ? parseInt(m[1], 10) : null
      })
      .filter(n => Number.isFinite(n))
    const next = (nums.length ? Math.max(...nums) + 1 : 1)
    return `BI ${currentYear}-${String(next).padStart(4, "0")}`
  }

  const [details, setDetails] = React.useState({
    number: getNextBillingNoteNumber(),
    date: new Date().toISOString().slice(0, 10),
    validUntil: "",
    currency: "THB",
    deliveryTerms: "Ex-Works",
    eit: null,
    salesPerson: "",
    eitAddress: "1/120 ซอยรามคําแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510",
    eitMobile: " 000-000-0000",
    eitTelephone: " 02-052-9544",
    eitFax: " 02-052 9544",
    tradeTerms: "",
    validity: "",
    delivery: "",
    shipmentLocation: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    remark: "",
    recipient: "",
    receivedDate: "",
    chequeDate: "",
    onBehalfOf: "",
    depositor: ""
  })

  const [items, setItems] = React.useState([{ invoiceNo: "", date: "", dueDate: "", amount: 0, paid: 0 }])
  const [sourceKey, setSourceKey] = React.useState(null)
  const [sourceIndex, setSourceIndex] = React.useState(null)
  const [eitOptions, setEitOptions] = React.useState([])

  const total = items.reduce((sum, it) => sum + ((Number(String(it.amount).replace(/,/g, '')) || 0) - (Number(String(it.paid).replace(/,/g, '')) || 0)), 0)

  // Load from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")
    const index = params.get("index")

    if (key && index !== null) {
      try {
        const historyItem = JSON.parse(localStorage.getItem(key))
        if (historyItem && Array.isArray(historyItem.billingNotes)) {
          const bn = historyItem.billingNotes[parseInt(index, 10)]
          if (bn) {
            setCustomer(bn.customer || {})
            setDetails(bn.details || {})
            setItems(Array.isArray(bn.items) ? bn.items : [])
          }
        }
      } catch (e) {
        console.error("Error loading billing note from URL", e)
      }
    }
  }, [])

  const addItem = () => setItems((prev) => [...prev, { invoiceNo: "", date: "", dueDate: "", amount: 0, paid: 0 }])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) =>
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === i ? { ...row, [field]: value } : row,
      ),
    )
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

  return {
    customer,
    setCustomer,
    details,
    setDetails,
    items,
    setItems,
    sourceKey,
    setSourceKey,
    sourceIndex,
    setSourceIndex,
    eitOptions,
    addItem,
    removeItem,
    updateItem,
    total,
  }
}

function BillingNotePage() {
  const q = useBillingNoteState()
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")
    const index = params.get("index")

    if (key && index) {
      q.setSourceKey(key)
      q.setSourceIndex(index)

      if (key === "api") {
        fetch(`${API_BASE_URL}/api/billing_notes/${index}/`)
          .then(res => res.json())
          .then(data => {
             q.setCustomer({
               company: data.customer_details?.company_name || data.customer_name || "",
               address: data.customer_details?.address || data.cus_address || "",
               telephone: data.customer_details?.phone || data.cus_phone || "",
               fax: data.customer_details?.cus_fax || data.cus_fax || "",
               attn: data.customer_details?.attn || data.cus_attn || "",
               div: data.customer_details?.division || data.cus_div || "",
               mobile: data.customer_details?.mobile || data.cus_mobile || ""
             })
             q.setDetails(prev => ({
               ...prev,
               number: data.bn_code,
               date: data.bn_created_date,
               remark: data.bn_remark || "",
               recipient: data.bn_recipient || "",
               receivedDate: data.bn_recipient_receive_date || "",
               chequeDate: data.bn_payee_date || "",
               onBehalfOf: data.bn_behalf_of || "",
               depositor: data.bn_name_biller || "",
               salesPerson: data.eit_details?.organization_name || "",
               eit: data.eit_details?.id || null,
               eitAddress: data.eit_details?.address || "",
               eitMobile: data.eit_details?.eit_mobile || "",
               eitTelephone: data.eit_details?.eit_telephone || "",
               eitFax: data.eit_details?.eit_fax || ""
             }))
             if (Array.isArray(data.items)) {
                q.setItems(data.items)
             }
          })
          .catch(err => console.error("Error loading BN:", err))
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem(key))
          if (stored && stored.billingNotes && stored.billingNotes[index]) {
            const bn = stored.billingNotes[index]
            q.setCustomer(bn.customer || {})
            q.setDetails(prev => ({ ...prev, ...bn.details }))
            if (bn.items) {
               q.setItems(bn.items)
            }
          }
        } catch (e) {
          console.error("Error loading from localStorage", e)
        }
      }
    }
  }, [])

  const handleDownloadPdf = async () => {
     try {
       const itemsWithOutstanding = q.items.map(item => {
          const amount = Number(String(item.amount).replace(/,/g, '')) || 0
          const paid = Number(String(item.paid).replace(/,/g, '')) || 0
          const outstanding = amount - paid
          return {
            ...item,
            outstanding: outstanding
          }
       })

       const detailsForPdf = {
         ...q.details,
         eit: null,
         salesPerson: "",
         eitAddress: "",
         eitMobile: "",
         eitTelephone: "",
         eitFax: ""
       }
       const payload = {
         customer: q.customer,
         details: detailsForPdf,
         items: itemsWithOutstanding,
         totals: {
           subtotal: q.total,
           grandTotal: q.total,
           thaiText: THBText(q.total)
         }
       }

      const response = await fetch(`${API_BASE_URL}/api/generate-billing-note-pdf/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
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
        
        setOpenCreateConfirm(false)
      } else {
        const errText = await response.text()
        console.error("Error generating PDF", errText)
        alert("Error generating PDF: " + errText)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Error downloading PDF")
    }
  }

  const handleSave = async () => {
    try {
      const company = q.customer.company || "Unknown"
      
      // Prepare payload for API
      const payload = {
        bn_code: q.details.number,
        bn_created_date: q.details.date || new Date().toISOString().slice(0, 10),
        bn_due_date: q.items[0]?.dueDate || null,
        bn_amount: q.total, 
        bn_paid_amount: 0,
        bn_outstanding_balance: q.total,
        bn_total: q.total,
        bn_remark: q.details.remark,
        bn_recipient: q.details.recipient,
        bn_recipient_receive_date: q.details.receivedDate || null,
        bn_payee_date: q.details.chequeDate || null,
        bn_behalf_of: q.details.onBehalfOf,
        bn_name_biller: q.details.depositor,
        
        customer_name: q.customer.company,
        cus_address: q.customer.address,
        cus_phone: q.customer.telephone,
        cus_fax: q.customer.fax,
        cus_attn: q.customer.attn,
        cus_div: q.customer.div,
        cus_mobile: q.customer.mobile,
        
        eit: q.details.eit,
        eit_name: q.details.salesPerson,
        eit_address: q.details.eitAddress,
        eit_mobile: q.details.eitMobile,
        eit_phone: q.details.eitTelephone,
        eit_fax: q.details.eitFax,
        
        items: q.items
      }
      
      let url = `${API_BASE_URL}/api/billing_notes/`
      let method = 'POST'
      
      if (q.sourceKey === 'api' && q.sourceIndex) {
          url = `${API_BASE_URL}/api/billing_notes/${q.sourceIndex}/`
          method = 'PUT'
      }

      const response = await fetch(url, {
          method: method,
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
      })

      if (response.ok) {
          alert("Billing Note saved successfully!")
          window.location.href = "/admin.html"
      } else {
          const errData = await response.json()
          console.error("Error saving billing note:", errData)
          alert("Error saving billing note: " + JSON.stringify(errData))
      }
    } catch (error) {
      console.error(error)
      alert("Error saving billing note")
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = "/admin.html"}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Back to List"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">New Billing Note</h1>
            </div>
          </div>
        </div>

        {/* Billing Note Details Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">Code</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Billing Note Number</label>
               <input value={q.details.number} onChange={(e) => q.setDetails({ ...q.details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Billing Note number" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
               <DateField value={q.details.date} onChange={(val) => q.setDetails({ ...q.details, date: val })} />
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
                 value={q.details.eit || ""} 
                 onChange={(e) => {
                   const val = e.target.value
                   if (!val) {
                     q.setDetails({
                       ...q.details,
                       eit: null,
                       salesPerson: "",
                       onBehalfOf: "",
                       eitAddress: "",
                       eitMobile: "",
                       eitTelephone: "",
                       eitFax: ""
                     })
                     return
                   }
                   const selected = q.eitOptions.find(o => String(o.id) === val)
                   if (selected) {
                     q.setDetails({
                       ...q.details,
                       eit: selected.id,
                       salesPerson: selected.organization_name,
                       onBehalfOf: selected.organization_name,
                       eitAddress: selected.address || "",
                       eitMobile: selected.eit_mobile || "",
                       eitTelephone: selected.eit_telephone || "",
                       eitFax: selected.eit_fax || ""
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
               <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
               <input value={q.details.eitMobile} onChange={(e) => q.setDetails({ ...q.details, eitMobile: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
             </div>
           </div>
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={q.details.eitAddress} onChange={(e) => q.setDetails({ ...q.details, eitAddress: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
               <input value={q.details.eitTelephone} onChange={(e) => q.setDetails({ ...q.details, eitTelephone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
               <input value={q.details.eitFax} onChange={(e) => q.setDetails({ ...q.details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
             </div>
           </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
          
          <h3 className="text-base font-bold text-gray-900 pt-2">Customer Company</h3>

          {/* Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
               <input value={q.customer.company} onChange={(e) => q.setCustomer({ ...q.customer, company: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Company name" />
             </div>
          </div>

          {/* Telephone / Fax / Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input value={q.customer.telephone} onChange={(e) => q.setCustomer({ ...q.customer, telephone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input value={q.customer.fax} onChange={(e) => q.setCustomer({ ...q.customer, fax: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
            </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={q.customer.address} onChange={(e) => q.setCustomer({ ...q.customer, address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
             </div>
          </div>

          <h3 className="text-base font-bold text-gray-900 pt-2">Customer Responsible</h3>

          {/* Attn / Div / Mobile */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attention(Attn.)</label>
                <input value={q.customer.attn} onChange={(e) => q.setCustomer({ ...q.customer, attn: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Attention" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division(Div.)</label>
                <input value={q.customer.div} onChange={(e) => q.setCustomer({ ...q.customer, div: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Division" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input value={q.customer.mobile} onChange={(e) => q.setCustomer({ ...q.customer, mobile: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
            </div>
          </div>
        </div>



        {/* Description Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#2D4485]">Billing Note Description</h2>
             <button onClick={q.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-medium">Add Item</span>
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 text-[#2D4485] uppercase text-xs font-bold">
                 <tr>
                   <th className="p-3 border-b w-16">No.</th>
                   <th className="p-3 border-b">เลขที่ใบก ำกับ</th>
                   <th className="p-3 border-b">วันท</th>
                   <th className="p-3 border-b">ครบก ำหนด</th>
                   <th className="p-3 border-b w-32">จ ำนวนเงิน</th>
                   <th className="p-3 border-b w-32">ช ำระแล้ว</th>
                   <th className="p-3 border-b w-32">เงินคงค้ำง</th>
                   <th className="p-3 border-b w-12"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {q.items.map((item, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                     <td className="p-3 text-center text-sm text-gray-700">
                       {i + 1}
                     </td>
                     <td className="p-3">
                      <input value={item.invoiceNo} onChange={(e) => q.updateItem(i, "invoiceNo", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" placeholder="Invoice No" />
                    </td>
                    <td className="p-3">
                      <input type="date" value={item.date} onChange={(e) => q.updateItem(i, "date", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                    </td>
                    <td className="p-3">
                      <input type="date" value={item.dueDate} onChange={(e) => q.updateItem(i, "dueDate", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                    </td>
                    <td className="p-3">
                      <input type="text" value={item.amount} onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '')
                        if (val === '' || !isNaN(val)) {
                          const parts = val.split('.')
                          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          q.updateItem(i, "amount", parts.join('.'))
                        }
                      }} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none text-right" />
                    </td>
                    <td className="p-3">
                      <input type="text" value={item.paid} onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '')
                        if (val === '' || !isNaN(val)) {
                          const parts = val.split('.')
                          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          q.updateItem(i, "paid", parts.join('.'))
                        }
                      }} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none text-right" />
                    </td>
                    <td className="p-3 text-right text-sm text-gray-700">
                      {((Number(String(item.amount).replace(/,/g, '') || 0)) - (Number(String(item.paid).replace(/,/g, '') || 0))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                     <td className="p-3 text-right">
                       <button onClick={() => q.removeItem(i)} className="text-red-600 hover:text-red-800" title="Delete"><Trash className="w-4 h-4" /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex justify-end mt-4">
              <div className="w-auto min-w-[250px] space-y-2">
                <div className="flex justify-between text-base font-bold text-gray-900 gap-8"><span>รวมทั้งสิ้น:</span> <span>{q.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                <div className="text-right text-base font-bold text-[#2D4485] pt-2 border-t"><span>{THBText(q.total)}</span></div>
              </div>
            </div>
        </div>
        
        {/* Payee Information Box */}
        <div className="mb-8">
           <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6">
             <h2 className="text-xl font-bold text-[#2D4485] mb-4">Payee Information</h2>
             <div className="space-y-4">
                {/* Row 1: Remark */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                   <textarea value={q.details.remark} onChange={(e) => q.setDetails({ ...q.details, remark: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="3" />
                </div>

                {/* Row 2: Recipient, Received Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้รับวางบิล</label>
                     <input value={q.details.recipient} onChange={(e) => q.setDetails({ ...q.details, recipient: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">วันที่รับ</label>
                     <DateField value={q.details.receivedDate} onChange={(val) => q.setDetails({ ...q.details, receivedDate: val })} />
                  </div>
                </div>

                {/* Row 3: Cheque Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">วันที่นัดรับเช็ค</label>
                     <DateField value={q.details.chequeDate} onChange={(val) => q.setDetails({ ...q.details, chequeDate: val })} />
                  </div>
                </div>

                {/* Row 4: On Behalf Of, Depositor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ในนาม</label>
                     <input value={q.details.onBehalfOf} onChange={(e) => q.setDetails({ ...q.details, onBehalfOf: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้วางบิล</label>
                     <input value={q.details.depositor} onChange={(e) => q.setDetails({ ...q.details, depositor: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
                  </div>
                </div>
             </div>
           </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href="/admin.html"}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create BN Form</button>
        </div>

        {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Create BN Form</h3>
                  <div className="text-sm text-gray-600 mt-1">Choose how you want to proceed</div>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenCreateConfirm(false)}>✕</button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <button
                  className="w-full px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 min-w-[140px]"
                  onClick={() => { setOpenCreateConfirm(false); window.location.href = "/admin.html" }}
                >
                  Discard
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] min-w-[140px]"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center"
                  onClick={handleDownloadPdf}
                >
                  Download Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable document */}
      <div id="billing-note-document" className="hidden" aria-hidden="true">
        <BillingNoteDocument bn={{ customer: q.customer, details: q.details, items: q.items, total: q.total }} />
      </div>

      </div>
    </main>
  )
}

function BillingNoteDocument({ bn }) {
  const orgName = bn.details.salesPerson || "EIT LASERTECHNIK CO.,LTD"
  const orgAddress = bn.details.eitAddress || ""
  const orgTel = bn.details.eitTelephone || ""
  const orgFax = bn.details.eitFax || ""
  const customerName = bn.customer.company || ""
  const customerAddress = bn.customer.address || ""
  const issueDate = bn.details.date || ""
  const recipient = bn.details.recipient || ""
  const receivedDate = bn.details.receivedDate || ""
  const chequeDate = bn.details.chequeDate || ""
  const onBehalfOf = bn.details.onBehalfOf || ""
  const depositor = bn.details.depositor || ""

  return (
    <div className="mx-auto bg-white text-[11px] leading-snug text-black border border-black p-4 w-[794px] h-[1123px] relative">
      <div className="flex">
        <div className="w-2/3 pr-2">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 border border-black flex items-center justify-center overflow-hidden">
              <img src="/eit-icon.png" alt="EIT" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[12px]">{orgName}</div>
              <div className="whitespace-pre-line">{orgAddress}</div>
              <div>{orgTel && `TEL.: ${orgTel}`}</div>
              <div>{orgFax && `FAX.: ${orgFax}`}</div>
            </div>
          </div>
        </div>
        <div className="w-1/3 pl-2">
          <div className="border border-black text-center py-2">
            <div className="font-bold text-[12px]">ใบวางบิล</div>
            <div className="font-bold text-[12px]">BILLING NOTE</div>
          </div>
          <div className="border border-black border-t-0 px-2 py-1 flex justify-between">
            <div className="text-[11px]">ต้นฉบับ</div>
            <div className="text-[11px] font-semibold">Original</div>
          </div>
          <div className="border border-black border-t-0 px-2 py-1 text-[11px]">
            <div className="flex justify-between">
              <span>เลขที่ (No.)</span>
              <span className="font-semibold">{bn.details.number}</span>
            </div>
            <div className="flex justify-between">
              <span>วันที่ (Date)</span>
              <span className="font-semibold">{issueDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 border border-black">
        <div className="flex">
          <div className="w-full px-2 py-1">
            <div className="flex">
              <div className="w-24 text-[11px]">ชื่อลูกค้า (Customer)</div>
              <div className="font-semibold">{customerName}</div>
            </div>
            <div className="flex">
              <div className="w-24 text-[11px]">ที่อยู่ (Address)</div>
              <div className="whitespace-pre-line flex-1">{customerAddress}</div>
            </div>
            <div className="flex mt-1">
              <div className="w-1/2 flex">
                 <div className="w-24 text-[11px]">โทรศัพท์ (Tel)</div>
                 <div>{bn.customer.telephone}</div>
              </div>
              <div className="w-1/2 flex">
                 <div className="w-24 text-[11px]">แฟกซ์ (Fax)</div>
                 <div>{bn.customer.fax}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 min-h-[400px]">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 w-10 text-center">ลำดับ<br/>No.</th>
              <th className="border border-black px-1 py-1 text-center">เลขที่ใบกำกับ<br/>Invoice No.</th>
              <th className="border border-black px-1 py-1 text-center w-24">วันที่<br/>Date</th>
              <th className="border border-black px-1 py-1 text-center w-24">ครบกำหนด<br/>Due Date</th>
              <th className="border border-black px-1 py-1 text-right w-28">จำนวนเงิน<br/>Amount</th>
              <th className="border border-black px-1 py-1 text-right w-28">ยอดคงค้าง<br/>Balance</th>
            </tr>
          </thead>
          <tbody>
            {bn.items.map((item, i) => {
               const amt = Number(String(item.amount).replace(/,/g, '')) || 0
               const paid = Number(String(item.paid).replace(/,/g, '')) || 0
               const balance = amt - paid
               return (
              <tr key={i}>
                <td className="border-l border-r border-black px-1 py-1 text-center">{i + 1}</td>
                <td className="border-l border-r border-black px-1 py-1">{item.invoiceNo}</td>
                <td className="border-l border-r border-black px-1 py-1 text-center">{item.date}</td>
                <td className="border-l border-r border-black px-1 py-1 text-center">{item.dueDate}</td>
                <td className="border-l border-r border-black px-1 py-1 text-right">{amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="border-l border-r border-black px-1 py-1 text-right">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            )})}
            {/* Fill empty rows */}
            {Array.from({ length: Math.max(0, 15 - bn.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border-l border-r border-black px-1 py-1 text-center">&nbsp;</td>
                <td className="border-l border-r border-black px-1 py-1">&nbsp;</td>
                <td className="border-l border-r border-black px-1 py-1">&nbsp;</td>
                <td className="border-l border-r border-black px-1 py-1">&nbsp;</td>
                <td className="border-l border-r border-black px-1 py-1">&nbsp;</td>
                <td className="border-l border-r border-black px-1 py-1">&nbsp;</td>
              </tr>
            ))}
            <tr className="border-t border-black">
              <td colSpan={4} className="border border-black px-1 py-1 text-right font-bold">รวมเงิน (Total)</td>
              <td colSpan={2} className="border border-black px-1 py-1 text-right font-bold">
                 {bn.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={6} className="border border-black px-1 py-1 bg-gray-100 font-bold text-center">
                 ({THBText(bn.total)})
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 border border-black p-2 flex">
         <div className="w-1/2 pr-2 border-r border-black">
            <div className="font-bold mb-2 underline">สำหรับลูกค้า (For Customer)</div>
            <div className="flex mb-1">
               <div className="w-24">ชื่อผู้รับวางบิล:</div>
               <div className="border-b border-black border-dotted flex-1 text-center">{recipient}</div>
            </div>
            <div className="flex mb-1">
               <div className="w-24">วันที่รับ:</div>
               <div className="border-b border-black border-dotted flex-1 text-center">{receivedDate ? format(parseISO(receivedDate), "dd/MM/yyyy") : ""}</div>
            </div>
            <div className="flex mb-1">
               <div className="w-24">วันที่นัดรับเช็ค:</div>
               <div className="border-b border-black border-dotted flex-1 text-center">{chequeDate ? format(parseISO(chequeDate), "dd/MM/yyyy") : ""}</div>
            </div>
            <div className="flex mb-1">
               <div className="w-24">ในนาม:</div>
               <div className="border-b border-black border-dotted flex-1 text-center">{onBehalfOf}</div>
            </div>
            <div className="mt-8 text-center">
               (......................................................)
               <div className="text-[10px]">ผู้รับวางบิล / Receiver</div>
            </div>
         </div>
         <div className="w-1/2 pl-2">
            <div className="font-bold mb-2 underline">สำหรับบริษัท (For Company)</div>
            <div className="flex mb-1">
               <div className="w-24">ชื่อผู้วางบิล:</div>
               <div className="border-b border-black border-dotted flex-1 text-center">{depositor}</div>
            </div>
            <div className="flex mb-1">
               <div className="w-24">วันที่:</div>
               <div className="border-b border-black border-dotted flex-1 text-center">{issueDate ? format(parseISO(issueDate), "dd/MM/yyyy") : ""}</div>
            </div>
            <div className="mt-12 text-center">
               (......................................................)
               <div className="text-[10px]">ผู้วางบิล / Collector</div>
            </div>
         </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BillingNotePage />
  </React.StrictMode>,
)
