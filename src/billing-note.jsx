import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { Plus, Trash, ArrowLeft, FileText } from "lucide-react"
import { CustomerCombobox } from "./components/customer-combobox"
import { Combobox } from "./components/combobox"
import { useInvoiceState } from "./invoice"
import { InvoiceForm } from "./components/invoice-form"
import { DateField } from "./components/ui/date-field"
import { THBText } from "./utils/currency"
import "./index.css"





function EmbeddedInvoice({ invoiceNo, allInvoices }) {
  const inv = useInvoiceState({ enableUrlLoading: false })

  React.useEffect(() => {
    if (invoiceNo && allInvoices && allInvoices.length > 0) {
      const match = allInvoices.find(i => i.number === invoiceNo)
      if (match) {
        inv.setCustomer(prev => ({ ...prev, ...(match.customer || {}) }))
        inv.setDetails(prev => ({ ...prev, ...(match.details || {}) }))
        if (inv.setItems) {
           inv.setItems(match.items || [])
        }
      }
    }
  }, [invoiceNo, allInvoices])

  const [show, setShow] = React.useState(false)

  if (!invoiceNo) return <div className="text-gray-400 italic text-xs">Select Invoice</div>

  return (
    <div className="min-w-[200px]">
      <button 
        onClick={() => setShow(!show)}
        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 mb-2"
      >
        {show ? "Hide Invoice" : "Show Invoice"}
      </button>
      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
           <div className="bg-white w-full max-w-6xl h-[90vh] overflow-y-auto rounded-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold">Invoice Details: {invoiceNo}</h3>
                 <button onClick={() => setShow(false)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>
              <InvoiceForm inv={inv} />
           </div>
        </div>
      )}
    </div>
  )
}

function useBillingNoteState() {
  // Detect edit mode from URL (key/index present) so we don't auto-generate codes
  const urlParams = new URLSearchParams(window.location.search)
  const initialKey = urlParams.get("key")
  const initialIndex = urlParams.get("index")
  const [customer, setCustomer] = React.useState({
    company: "",
    // Add taxId to support Tax Number input beside Company Name
    taxId: "",
    // Add Branch input box in billing note 
    branch: "",
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

  // Ensure Billing Note number is always new: merge API + local history and pick next
  React.useEffect(() => {
    // Skip auto-number when editing an existing record (has key/index in URL)
    if (initialKey && initialIndex !== null) return
    const currentYear = new Date().getFullYear()
    const parseSeq = (s) => {
      try {
        const m = String(s || "").match(new RegExp(`^BI ${currentYear}-(\\d{4})$`, 'i'))
        return m ? parseInt(m[1], 10) : null
      } catch { return null }
    }
    const toCode = (n) => `BI ${currentYear}-${String(n).padStart(4, "0")}`
    const updateFromApi = async () => {
      try {
        // Check API billing notes
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}` } : {}
        const res = await fetch(`${API_BASE_URL}/api/billing_notes/`, { headers })
        let maxSeq = parseSeq(details.number) || 0
        if (res.ok) {
          const apiNotes = await res.json()
          if (Array.isArray(apiNotes)) {
            for (const bn of apiNotes) {
              const seq = parseSeq(bn.bn_code || bn.details?.number)
              if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq
            }
          }
        }
        // Also consider localStorage histories
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith("history:")) {
              const item = JSON.parse(localStorage.getItem(key))
              if (item && Array.isArray(item.billingNotes)) {
                for (const bn of item.billingNotes) {
                  const seq = parseSeq(bn.details?.number)
                  if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq
                }
              }
            }
          }
        } catch {}
        // If any sequence found, set next = max + 1
        if (maxSeq >= 1) {
          setDetails(prev => ({ ...prev, number: toCode(maxSeq + 1) }))
        }
      } catch {}
    }
    updateFromApi()
  }, [])

  // If editing an API Billing Note, preload it and hydrate the form
  React.useEffect(() => {
    if (initialKey === "api" && initialIndex) {
      const loadFromApi = async () => {
        try {
          const token = localStorage.getItem("authToken")
          const headers = token ? { "Authorization": `Token ${token}` } : {}
          const r = await fetch(`${API_BASE_URL}/api/billing_notes/${initialIndex}/`, { headers })
          if (!r.ok) return
          const bn = await r.json()
          // Map API fields to UI state while preserving existing values if missing
          setDetails(prev => ({
            ...prev,
            number: bn.bn_code || prev.number,
            date: bn.bn_created_date || bn.bn_date || prev.date,
            // Use the first item due date if provided; otherwise bn_due_date
            dueDate: bn.bn_due_date || prev.dueDate,
            currency: bn.bn_currency || prev.currency,
            // Organization/EIT display fields
            onBehalfOf: bn.bn_behalf_of || prev.onBehalfOf,
            salesPerson: bn.eit_details?.organization_name || prev.salesPerson,
            eitAddress: bn.eit_details?.address || prev.eitAddress,
            eitMobile: bn.eit_details?.eit_mobile || prev.eitMobile,
            eitTelephone: bn.eit_details?.eit_telephone || prev.eitTelephone,
            eitFax: bn.eit_details?.eit_fax || prev.eitFax,
          }))
          setCustomer(prev => ({
            ...prev,
            company: bn.customer_details?.company_name || bn.customer_name || prev.company,
            address: bn.customer_details?.address || prev.address,
            telephone: bn.customer_details?.phone || prev.telephone,
            fax: bn.customer_details?.cus_fax || prev.fax,
            attn: bn.customer_details?.attn || prev.attn,
            // taxId optional on BN; keep if present in deals
            taxId: bn.customer_details?.tax_id || prev.taxId,
            email: bn.customer_details?.email || prev.email,
          }))
          const uiItems = Array.isArray(bn.items) ? bn.items.map(item => ({
            invoiceNo: item.invoice_no || item.invoiceNo || "",
            date: item.date || "",
            dueDate: item.due_date || item.dueDate || "",
            amount: item.amount || 0,
            paid: item.paid || 0,
          })) : [{ invoiceNo: "", date: "", dueDate: "", amount: 0, paid: 0 }]
          setItems(uiItems)
        } catch (e) {
          console.error("Failed to load Billing Note from API", e)
        }
      }
      loadFromApi()
    }
  }, [])

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
  const [dealCustomers, setDealCustomers] = React.useState([])
  const [invoices, setInvoices] = React.useState([])

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

  // Comment: Load canonical Customers (not Deals) to drive Company Name selection in Billing Note
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/customers/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Comment: Normalize shape with label/value for CustomerCombobox ID-based selection
          const normalized = data.map(c => ({
            ...c,
            label: c.company_name || c.customer_name || "",
            value: c.id
          }))
          setDealCustomers(normalized)
        } else {
          setDealCustomers([])
        }
      })
      .catch(console.error)
  }, [])

  // Load Invoices (API + Local)
  React.useEffect(() => {
    // 1. Fetch from API
    const apiPromise = fetch(`${API_BASE_URL}/api/invoices/`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? data : [])
      .catch(err => {
        console.error(err)
        return []
      })

    // 2. Load from LocalStorage
    const localInvoices = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("history:")) {
          try {
            const item = JSON.parse(localStorage.getItem(key))
            if (item && Array.isArray(item.invoices)) {
              localInvoices.push(...item.invoices)
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Error reading localStorage invoices", e)
    }

    // 3. Merge
    apiPromise.then(apiInvoices => {
      const map = new Map()
      
      // Add local first (converted to match API structure if needed)
      localInvoices.forEach(inv => {
         const number = inv.details?.number
         if (number) {
           map.set(number, {
             id: `local-${number}`,
             number: number,
             details: inv.details,
             totals: inv.totals
           })
         }
      })
      
      // Overwrite with API (authoritative)
      apiInvoices.forEach(inv => {
        if (inv.number) {
          map.set(inv.number, inv)
        }
      })
      
      setInvoices(Array.from(map.values()))
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
    dealCustomers,
    invoices,
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
                   // Comment: Hydrate branch from API payload
                   branch: data.bn_branch || "",
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
         ...q.details
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

      const paidDates = q.items.map(it => it.paid).filter(Boolean).sort()
      const bnPaidDate = paidDates.length ? paidDates[paidDates.length - 1] : null

      const payload = {
        bn_code: q.details.number,
        bn_created_date: q.details.date || new Date().toISOString().slice(0, 10),
        bn_due_date: q.items[0]?.dueDate || null,
        bn_amount: q.total, 
        bn_paid_amount: bnPaidDate,
        bn_outstanding_balance: q.total,
        bn_total: q.total,
        bn_remark: q.details.remark,
        bn_recipient: q.details.recipient,
        bn_recipient_receive_date: q.details.receivedDate || null,
        bn_payee_date: q.details.chequeDate || null,
        bn_behalf_of: q.details.onBehalfOf,
        bn_name_biller: q.details.depositor,
          // Comment: Persist customer branch text to BillingNote.bn_branch
          bn_branch: q.customer.branch,
        
        customer_name: q.customer.company,
        cus_address: q.customer.address,
        cus_phone: q.customer.telephone,
        cus_fax: q.customer.fax,
        cus_attn: q.customer.attn,
        cus_div: q.customer.div,
        cus_mobile: q.customer.mobile,

        eit_name: q.details.salesPerson,
        eit_address: q.details.eitAddress,
        eit_mobile: q.details.eitMobile,
        eit_phone: q.details.eitTelephone,
        eit_fax: q.details.eitFax,
        items: q.items
      }

      if (q.details.eit != null) {
        payload.eit = q.details.eit
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
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
               <CustomerCombobox
                  value={q.customer.company}
                  options={q.dealCustomers}
                  onChange={(val) => {
                    // Comment: Match by display label (supports legacy customer_name and current company_name)
                    const match = q.dealCustomers.find(c => (c.customer_name || c.company_name) === val)
                    if (match) {
                      q.setCustomer({
                        ...q.customer,
                        company: val,
                        // Comment: Preserve branch here; hydrate branch in onSelect via ID fetch
                        taxId: match.tax_id || q.customer.taxId,
                        address: match.address || q.customer.address,
                        telephone: match.phone || q.customer.telephone,
                        // Comment: deal usually lacks fax; preserve existing
                        fax: q.customer.fax,
                        attn: match.contact || q.customer.attn,
                        mobile: q.customer.mobile,
                        email: match.email || q.customer.email
                      })
                    } else {
                      q.setCustomer({ ...q.customer, company: val })
                    }
                  }}
                  // Comment: On actual selection (ID available), fetch canonical Customer to hydrate Branch and other fields
                  onSelect={(payload) => {
                    const option = typeof payload === 'object' && payload !== null 
                      ? payload 
                      : { label: String(payload || ""), value: payload }
                    if (option?.value == null || option.value === "") return
                    fetch(`${API_BASE_URL}/api/customers/${option.value}/`)
                      .then(res => res.ok ? res.json() : null)
                      .then(c => {
                        if (!c) return
                        // Comment: Populate customer top fields including Branch from DB
                        const nextTop = {
                          company: option.label || c.company_name || "",
                          taxId: c.tax_id || "",
                          branch: c.branch || "",
                          address: c.address || "",
                          telephone: c.phone || "",
                          fax: c.cus_fax || "",
                          attn: c.attn || "",
                          div: c.attn_division || "",
                          mobile: c.attn_mobile || "",
                          email: c.email || ""
                        }
                        // Comment: Fallback Branch from latest Deal when Customer.branch is empty
                        const needsBranchFallback = !String(nextTop.branch || "").trim()
                        if (needsBranchFallback) {
                          fetch(`${API_BASE_URL}/api/deals/`)
                            .then(r => r.ok ? r.json() : [])
                            .then(deals => {
                              const latest = Array.isArray(deals)
                                ? deals.filter(d => String(d.customer) === String(c.id)).sort((a, b) => (b.id || 0) - (a.id || 0))[0]
                                : null
                              const mergedTop = {
                                ...nextTop,
                                branch: nextTop.branch || latest?.branch || ""
                              }
                              q.setCustomer({ ...q.customer, ...mergedTop })
                            })
                            .catch(() => {
                              q.setCustomer({ ...q.customer, ...nextTop })
                            })
                        } else {
                          q.setCustomer({ ...q.customer, ...nextTop })
                        }
                      })
                      .catch(() => {})
                  }}
                />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
               {/* Tax Number input placed beside Company Name */}
               <input
                 value={q.customer.taxId}
                 onChange={(e) => q.setCustomer({ ...q.customer, taxId: e.target.value })}
                 className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                 placeholder="Tax Number"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
               <input
                 value={q.customer.branch}
                 onChange={(e) => q.setCustomer({ ...q.customer, branch: e.target.value })}
                 className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                 placeholder="Branch"
               />
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
                   <th className="p-3 border-b w-32">ช ำระแล้ว ภาษี</th>
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
                       <Combobox 
                       placement="top"
                       value={item.invoiceNo} 
                        onChange={(val) => {
                          q.updateItem(i, "invoiceNo", val)
                          const inv = q.invoices.find(inv => inv.number === val)
                          if (inv) {
                            if (inv.details?.date) q.updateItem(i, "date", inv.details.date)
                            
                            // Calculate due date
                            if (inv.details?.dueDate) {
                              q.updateItem(i, "dueDate", inv.details.dueDate)
                            } else if (inv.details?.date && inv.details?.paymentTermsDays) {
                               try {
                                 const d = new Date(inv.details.date)
                                 d.setDate(d.getDate() + (parseInt(inv.details.paymentTermsDays) || 0))
                                 q.updateItem(i, "dueDate", d.toISOString().split('T')[0])
                               } catch (e) {}
                            }
 
                            if (inv.totals?.total) {
                              q.updateItem(i, "amount", inv.totals.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}))
                              q.updateItem(i, "paid", "0.00")
                            }
                          }
                        }}
                        options={q.invoices.map(inv => inv.number)}
                        placeholder="Invoice No"
                      />
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
                      <input type="date" value={item.paid} onChange={(e) => q.updateItem(i, "paid", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                    </td>
                    <td className="p-3 text-right text-sm text-gray-700">
                      {(() => {
                        const amt = Number(String(item.amount).replace(/,/g, '') || 0)
                        const paidStr = String(item.paid || '').replace(/,/g, '')
                        const paidNum = paidStr && !isNaN(Number(paidStr)) ? Number(paidStr) : 0
                        return (amt - paidNum).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                      })()}
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
              <th className="border border-black px-1 py-1 text-center w-24">ช ำระแล้ว ภาษี</th>
              <th className="border border-black px-1 py-1 text-right w-28">ยอดคงค้าง<br/>Balance</th>
            </tr>
          </thead>
          <tbody>
            {bn.items.map((item, i) => {
               const amt = Number(String(item.amount).replace(/,/g, '')) || 0
               const paidStr = String(item.paid || '').replace(/,/g, '')
               const paid = paidStr && !isNaN(Number(paidStr)) ? Number(paidStr) : 0
               const balance = amt - paid
               return (
              <tr key={i}>
                <td className="border-l border-r border-black px-1 py-1 text-center">{i + 1}</td>
                <td className="border-l border-r border-black px-1 py-1">{item.invoiceNo}</td>
                <td className="border-l border-r border-black px-1 py-1 text-center">{item.date}</td>
                <td className="border-l border-r border-black px-1 py-1 text-center">{item.dueDate}</td>
                <td className="border-l border-r border-black px-1 py-1 text-right">{amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="border-l border-r border-black px-1 py-1 text-center">
                  {item.paid ? format(parseISO(item.paid), "dd/MM/yyyy") : ""}
                </td>
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
                <td className="border-l border-r border-black px-1 py-1">&nbsp;</td>
              </tr>
            ))}
            <tr className="border-t border-black">
              <td colSpan={5} className="border border-black px-1 py-1 text-right font-bold">รวมเงิน (Total)</td>
              <td colSpan={2} className="border border-black px-1 py-1 text-right font-bold">
                 {bn.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={7} className="border border-black px-1 py-1 bg-gray-100 font-bold text-center">
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
