import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import { QuotationTemplate } from "./components/quotation-template.jsx"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft, ClipboardList, FileText } from "lucide-react"
import { CustomerCombobox } from "./components/customer-combobox.jsx"
// Import a typing+select combobox component to enhance description input
import { Combobox } from "./components/combobox.jsx"
import { DateField } from "./components/ui/date-field"

import "./index.css"



const parseNumber = (val) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  return parseFloat(String(val).replace(/,/g, ''))
}

function useQuotationState() {
  const [customer, setCustomer] = React.useState({
    company: "",
    taxId: "",
    address: "",
    telephone: "",
    fax: "",
    attn: "",
    div: "",
    mobile: "",
    email: ""
  })

  // Helper to get next quotation number
  const getNextQuotationNumber = () => {
    const quotations = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("history:")) {
          try {
            const item = JSON.parse(localStorage.getItem(key))
            if (item && Array.isArray(item.quotations)) {
              quotations.push(...item.quotations)
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Error reading localStorage", e)
    }

    const currentYear = new Date().getFullYear()
    const nums = quotations
      .map(q => String(q.number || ""))
      .map(s => {
        // Match EIT QUO YYYY-XXXX format for the current year
        const m = s.match(new RegExp(`^QUO ${currentYear}-(\\d{4})$`))
        return m ? parseInt(m[1], 10) : null
      })
      .filter(n => Number.isFinite(n))
    const next = (nums.length ? Math.max(...nums) + 1 : 1)
    return `QUO ${currentYear}-${String(next).padStart(4, "0")}`
  }

  const [details, setDetails] = React.useState({
    number: getNextQuotationNumber(),
    date: new Date().toISOString().slice(0, 10),
    validUntil: "",
    currency: "THB",
    deliveryTerms: "Ex-Works",
    eit: null,
    salesPerson: "",
    eitMobile: " 000-000-0000",
    eitTelephone: " 02-052-9544",
    eitFax: " 02-052 9544",
    eitAddress: "1/120 ซอยรามคําแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510",
    tradeTerms: "",
    validity: "",
    delivery: "",
    shipmentLocation: "",
    invoiceDate: "SAME AS DELIVERY DATE",
    remark: "IN CASE OF PURCHASING THERE IS NO EXCHANGE GOODS AFTER PURCHASED PLEASE SEE WARRANTY CONDITION\nTHE INFORMATION ARE SUBJECT TO CHANGE WITH OUT NOTICE",
    paymentTerms: ""
  })

  // Each item can include nested specification lines (specLines) shown as 1.1 under the item,
  // plus optional image and edit mode flags for inline editing of specifications.
  const [items, setItems] = React.useState([{ item: "", model: "", description: "", qty: 1, price: 0, specLines: [], specImage: null, specEdit: false }])
  const [sourceKey, setSourceKey] = React.useState(null)
  const [sourceIndex, setSourceIndex] = React.useState(null)
  const [eitOptions, setEitOptions] = React.useState([])
  const [customerOptions, setCustomerOptions] = React.useState([])
  // Hold description suggestion options aggregated from PD_* tables
  const [pdDescriptionOptions, setPdDescriptionOptions] = React.useState([])
  // Lookup map from rendered option label to its underlying PD data (name/description/specification/type)
  const [pdOptionLookup, setPdOptionLookup] = React.useState({})

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

  // Load product description suggestions from PD_* tables
  // This provides selectable options in the Description field while still allowing free typing.
  React.useEffect(() => {
    const token = localStorage.getItem("authToken")
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Token ${token}` } : {})
    }
    const endpoints = [
      "pd_machines",
      "pd_systems",
      "pd_wires",
      "pd_spareparts",
      "pd_services",
      "pd_system_childproducts",
    ]
    ;(async () => {
      try {
        const results = await Promise.all(
          endpoints.map(ep =>
            fetch(`${API_BASE_URL}/api/${ep}/`, { headers })
              .then(r => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        )
        const raw = results.flat().filter(Boolean)
        const labels = []
        const lookup = {}
        raw.forEach((d) => {
          const name = (d && d.name) ? String(d.name).trim() : ""
          const desc = (d && d.description) ? String(d.description).trim() : ""
          const spec = (d && d.specification) ? String(d.specification).trim() : ""
          // Build label using specification if present; otherwise description; else just name.
          const detail = spec || desc
          const label = detail ? `${name} — ${detail}` : name
          if (label && !lookup[label]) {
            labels.push(label)
            lookup[label] = { name, description: desc, specification: spec }
          }
        })
        setPdDescriptionOptions(labels)
        setPdOptionLookup(lookup)
      } catch (e) {
        console.error("Error loading PD description options", e)
        setPdDescriptionOptions([])
        setPdOptionLookup({})
      }
    })()
  }, [])

  const total = items.reduce((sum, it) => sum + (parseNumber(it.qty) || 0) * (parseNumber(it.price) || 0), 0)

  const addItem = () => setItems((prev) => [...prev, { item: "", model: "", description: "", qty: 1, price: 0, specRows: [], specEdit: false }])
  const addSpecificItem = () => setItems((prev) => [...prev, { type: 'specific', item: "", model: "", description: "Specific Description", qty: 0, price: 0 }])

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
        idx === i ? { ...row, [field]: value } : row,
      ),
    )
  
  // When a PD option is selected from the Description combobox:
  // - Put the PD "name" into the current row's description (the title)
  // - Put the PD "specification" (or description fallback) into the NEXT LINE as a 'specific' row
  //   so the specification appears below, not inside the title line.
  const applyPdSelection = (rowIndex, label) => {
    const meta = pdOptionLookup[label]
    const pdName = (meta?.name || "").trim()
    const specText = (meta?.specification || meta?.description || "").trim()
    setItems((prev) => {
      const next = [...prev]
      if (next[rowIndex]) {
        // Set the chosen PD name as the main description/title on this row
        next[rowIndex] = { ...next[rowIndex], description: pdName || label }
      }
      // Initialize first specification row under the item with fetched lines
      const lines = String(specText || "")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean)
      next[rowIndex] = { 
        ...next[rowIndex], 
        specRows: [{ lines, image: null, edit: true }] 
      }
      return next
    })
  }

  // Update a specific specification row's lines. Preserve spaces and blank lines;
  // only normalize Windows CRLF to LF so the textarea behaves naturally.
  const updateSpecLines = (rowIndex, text, specIndex = 0) => {
    const lines = String(text || "")
      .replace(/\r/g, "")
      .split("\n")
    setItems(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row
      const rows = Array.isArray(row.specRows) ? [...row.specRows] : []
      if (!rows[specIndex]) rows[specIndex] = { lines: [], image: null, edit: true }
      rows[specIndex] = { ...rows[specIndex], lines }
      return { ...row, specRows: rows }
    }))
  }

  // Toggle edit mode for a specific specification row
  const setSpecEdit = (rowIndex, flag, specIndex = 0) => {
    setItems(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row
      const rows = Array.isArray(row.specRows) ? [...row.specRows] : []
      if (!rows[specIndex]) rows[specIndex] = { lines: [], image: null, edit: !!flag }
      else rows[specIndex] = { ...rows[specIndex], edit: !!flag }
      return { ...row, specRows: rows }
    }))
  }

  // Set or remove image for a specific specification row
  const setSpecImage = (rowIndex, dataUrl, specIndex = 0) => {
    setItems(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row
      const rows = Array.isArray(row.specRows) ? [...row.specRows] : []
      if (!rows[specIndex]) rows[specIndex] = { lines: [], image: dataUrl || null, edit: true }
      else rows[specIndex] = { ...rows[specIndex], image: dataUrl || null }
      return { ...row, specRows: rows }
    }))
  }

  // Add a new specification row under an item and open it for editing
  const addSpecRow = (rowIndex) => {
    setItems(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row
      const rows = Array.isArray(row.specRows) ? [...row.specRows] : []
      rows.push({ lines: [], image: null, edit: true })
      return { ...row, specRows: rows }
    }))
  }
  // Load from URL params if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")
    const index = params.get("index")

    if (key && index !== null) {
      setSourceKey(key)
      setSourceIndex(parseInt(index, 10))

      if (key === 'api') {
        // Load from API
        fetch(`${API_BASE_URL}/api/quotations/${index}/`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
          })
          .then(data => {
            // Map API data to state
            setCustomer({
              company: data.customer_details?.company_name || "",
              taxId: data.customer_details?.tax_id || "",
              address: data.customer_details?.address || "",
              telephone: data.customer_details?.phone || "",
              fax: data.customer_details?.cus_fax || "",
              attn: data.customer_details?.attn || "",
              div: data.customer_details?.division || "",
              mobile: data.customer_details?.mobile || "",
              email: data.customer_details?.email || ""
            })
            setDetails({
              number: data.qo_code || "",
              date: data.created_date || new Date().toISOString().slice(0, 10),
              validUntil: "",
              currency: "THB",
              deliveryTerms: "Ex-Works",
              salesPerson: data.eit_details?.organization_name || "",
              eit: data.eit_details?.id || null,
              eitMobile: data.eit_details?.eit_mobile || "",
              eitTelephone: data.eit_details?.eit_telephone || "",
              eitFax: data.eit_details?.eit_fax || "",
              eitAddress: data.eit_details?.address || "",
              tradeTerms: data.trade_terms || "",
              validity: data.validity || "",
              delivery: data.delivery || "",
              shipmentLocation: data.shipment_location || "",
              invoiceDate: data.invoice_date || "SAME AS DELIVERY DATE",
              remark: data.remark || "",
              paymentTerms: data.payment_terms || ""
            })
            const apiItems = data.quotation_items || data.items || data.products || []
            if (apiItems.length > 0) {
              setItems(apiItems.map(i => {
                const rawQty = i.quantity !== undefined ? i.quantity : i.qty
                const qty = rawQty !== undefined ? rawQty : 1
                const total = parseFloat(i.quo_total || i.total || 0)
                
                // Identify specific description items: empty item/model and 0 quantity
                const isSpecific = (!i.quo_item && !i.quo_model && qty === 0);

                return {
                  type: isSpecific ? 'specific' : undefined,
                  item: i.quo_item || i.item || "",
                  model: i.quo_model || i.model || "",
                  description: i.quo_description || i.description || "",
                  qty: qty,
                  price: qty > 0 ? total / qty : 0
                }
              }))
            }
          })
          .catch(err => console.error("Error loading from API", err))
      } else {
        try {
          const storedItem = JSON.parse(localStorage.getItem(key))
          if (storedItem) {
            if (storedItem.quotations && storedItem.quotations[index]) {
              const qData = storedItem.quotations[index]
              
              // Sanitize details to prevent null values (controlled input error)
              const safeDetails = { ...qData.details }
              Object.keys(safeDetails).forEach(k => {
                if (safeDetails[k] === null || safeDetails[k] === undefined) {
                   // Preserve null for 'eit' as it's handled by select logic
                   if (k === 'eit') return
                   safeDetails[k] = ""
                }
              })
              setDetails(prev => ({ ...prev, ...safeDetails }))
              
              const safeItems = Array.isArray(qData.items) ? qData.items.map(i => ({
                item: i.item || "",
                model: i.model || "",
                description: i.description || "",
                qty: i.qty || 1,
                price: i.price || 0
              })) : []
              setItems(safeItems)

              if (storedItem.customer) {
                 const safeCustomer = { ...storedItem.customer }
                 Object.keys(safeCustomer).forEach(k => {
                   if (safeCustomer[k] === null || safeCustomer[k] === undefined) {
                     safeCustomer[k] = ""
                   }
                 })
                 setCustomer(prev => ({ ...prev, ...safeCustomer }))
              }
            }
          }
        } catch (e) {
          console.error("Error loading quotation", e)
        }
      }
    }
  }, [])

  // Expose helpers and pd lookup for use in the Description combobox
  return { customer, setCustomer, details, setDetails, items, setItems, addItem, addSpecificItem, insertItem: insertRow, removeItem, updateItem, applyPdSelection, updateSpecLines, setSpecEdit, setSpecImage, addSpecRow, total, sourceKey, sourceIndex, eitOptions, customerOptions, pdDescriptionOptions, pdOptionLookup }
}

function QuotationPage() {
  const q = useQuotationState()
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)
  // Full-size preview for uploaded specification image
  const [previewSrc, setPreviewSrc] = React.useState(null)
  // Keep refs to each spec textarea so we can auto-size them to fit content.
  const specTextareasRef = React.useRef({})

  // Auto-grow each spec textarea to fit content whenever items/spec rows change.
  React.useEffect(() => {
    q.items.forEach((it, i) => {
      const rows = Array.isArray(it.specRows) ? it.specRows : []
      rows.forEach((sr, sIndex) => {
        const el = specTextareasRef.current[`${i}-${sIndex}`]
        if (el && sr?.edit) {
          el.style.height = "auto"
          el.style.height = `${el.scrollHeight}px`
        }
      })
    })
  }, [q.items])

  const handlePrintPdf = async () => {
    try {
      const payload = {
        details: q.details,
        customer: q.customer,
        items: q.items.map(i => ({
          ...i,
          // Send numeric values for calculations in PDF
          qty: parseNumber(i.qty),
          price: parseNumber(i.price),
          // Include specification rows for PDF (supports multiple spec rows)
          spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({ lines: r.lines || [], image_data: r.image || null })) : [],
          // Legacy fields kept for backward compatibility
          spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
          spec_image_data: i.specImage || null
        })),
        totals: { total: q.total }
      }
      const response = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf/`, {
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
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF")
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              New Quotation
            </h1>
          </div>
        </div>

        {/* Codes Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">Codes</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
               <input value={q.details.number} onChange={(e) => q.setDetails({ ...q.details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Quotation number" />
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
               {/* Select EIT organization to populate details. 
                   The options are fetched from /api/eits/ and include "EIT Lasertechnik Co.,Ltd." 
                   and "Einstein Industrietechnik Corporation Co.,LTD" as populated by the backend. */}
               <select 
                 value={q.details.eit || ""} 
                 onChange={(e) => {
                   const val = e.target.value
                   if (!val) {
                      q.setDetails({ 
                        ...q.details, 
                        eit: null,
                        salesPerson: "",
                        eitMobile: "",
                        eitTelephone: "",
                        eitFax: "",
                        eitAddress: "" 
                      })
                      return
                   }
                   const selected = q.eitOptions.find(o => String(o.id) === val)
                   if (selected) {
                     q.setDetails({ 
                       ...q.details, 
                       eit: selected.id,
                       salesPerson: selected.organization_name,
                       eitMobile: selected.eit_mobile || "",
                       eitTelephone: selected.eit_telephone || "",
                       eitFax: selected.eit_fax || "",
                       eitAddress: selected.address || "" 
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

        {/* Customer Information Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
          


          <h3 className="text-base font-bold text-gray-900 pt-2">Customer Company</h3>

          {/* Company Name (50% width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <CustomerCombobox
                  value={q.customer.company}
                  options={q.customerOptions}
                  onChange={(val) => {
                    const match = q.customerOptions.find(c => c.customer_name === val)
                    if (match) {
                      q.setCustomer({ 
                        ...q.customer, 
                        company: val,
                        taxId: match.tax_id || q.customer.taxId,
                        address: match.address || q.customer.address,
                        telephone: match.phone || q.customer.telephone,
                        attn: match.contact || q.customer.attn,
                        email: match.email || q.customer.email
                      })
                    } else {
                      q.setCustomer({ ...q.customer, company: val })
                    }
                  }}
                />
              </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
               <input value={q.customer.taxId} onChange={(e) => q.setCustomer({ ...q.customer, taxId: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Tax ID" />
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



        {/* Quotation Description Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#2D4485]">Quotation Description</h2>
             <button onClick={q.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-medium">Add Item</span>
             </button>
             <button onClick={q.addSpecificItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200">
               <FileText className="w-4 h-4" />
               <span className="text-sm font-medium">Add Specific Description</span>
             </button>
           </div>
           <div className="overflow-x-auto">
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
                 {q.items.map((item, i) => (
                   <>
                   <tr key={`item-${i}`} className="hover:bg-gray-50 transition border-b border-gray-100">
                     <td className="p-3 text-center text-sm text-gray-700">
                       {i + 1}
                     </td>
                     {item.type === 'specific' ? (
                       <td className="p-3" colSpan={5}>
                         <textarea 
                            value={item.description} 
                            onChange={(e) => q.updateItem(i, "description", e.target.value)} 
                            className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none min-h-[40px] resize-y" 
                            placeholder="Specific Description" 
                         />
                       </td>
                     ) : (
                       <>
                     <td className="p-3">
                       <input value={item.model} onChange={(e) => q.updateItem(i, "model", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" placeholder="Model" />
                     </td>
                    <td className="p-3">
                      {/* Description combobox: select PD name; nested specifications render below as 1.x */}
                      <Combobox
                        value={item.description}
                        onChange={(val) => q.updateItem(i, "description", val)}
                        onSelect={(label) => q.applyPdSelection(i, label)}
                        options={q.pdDescriptionOptions}
                        placeholder="Select or type description..."
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={item.price} 
                        onChange={(e) => q.updateItem(i, "price", e.target.value)} 
                        onBlur={(e) => {
                          const val = parseNumber(e.target.value)
                          if (!isNaN(val)) {
                            q.updateItem(i, "price", val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                          }
                        }}
                        className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" 
                      />
                    </td>
                    <td className="p-3">
                      <input type="number" value={item.qty} onChange={(e) => q.updateItem(i, "qty", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                    </td>
                     <td className="p-3 text-right text-sm text-gray-700">
                       {(parseNumber(item.qty || 0) * parseNumber(item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                       </>
                     )}
                     <td className="p-3 text-right">
                       <div className="flex justify-end gap-2">
                        {/* Plus now adds a specification row/editor for this item */}
                        <button onClick={() => q.addSpecRow(i)} className="text-[#2D4485] hover:text-[#1a2c5e]" title="Add Specification"><Plus className="w-4 h-4" /></button>
                         <button onClick={() => q.removeItem(i)} className="text-red-600 hover:text-red-800" title="Delete"><Trash className="w-4 h-4" /></button>
                       </div>
                     </td>
                   </tr>
                   {/* Render all specification lines under one subordinate row (1.1) since they are stored together.
                       Show bullet list inside the description cell to keep them visually grouped. */}
                  {(() => {
                    // Determine spec rows (support legacy specLines/specImage/specEdit)
                    const legacyRows = Array.isArray(item.specLines)
                      ? [{ lines: item.specLines, image: item.specImage || null, edit: !!item.specEdit }]
                      : []
                    const specRows = Array.isArray(item.specRows) ? item.specRows : legacyRows
                    const rowsToRender = specRows.length > 0 ? specRows : (item.specEdit ? [{ lines: [], image: null, edit: true }] : [])
                    return rowsToRender.map((sr, sIndex) => (
                      <tr key={`item-${i}-spec-${sIndex}`} className="hover:bg-gray-50 transition border-b border-gray-100">
                        <td className="p-3 text-center text-sm text-gray-700">{`${i + 1}.${sIndex + 1}`}</td>
                        <td className="p-3" colSpan={5}>
                          {/* Full-width spec box with side actions */}
                          <div className="flex items-start gap-4">
                            {/* Left: specification content/editor */}
                            <div className="flex-1">
                              {!sr.edit ? (
                                // Read-only spec box; allow double-click to enter edit mode
                                <div
                                  className="text-sm text-gray-800 rounded-lg border border-gray-300 p-3"
                                  onDoubleClick={() => q.setSpecEdit(i, true, sIndex)}
                                  title="Double-click to edit specification"
                                >
                                  {sr.lines.length === 1 ? (
                                    sr.lines[0]
                                  ) : (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {sr.lines.map((line, si) => (
                                        <li key={si}>{line}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ) : (
                                // Auto-resizing textarea: remove vertical resize, grow with content
                                <textarea
                                  value={sr.lines.join("\n")}
                                  ref={(el) => { specTextareasRef.current[`${i}-${sIndex}`] = el }}
                                  onChange={(e) => {
                                    e.target.style.height = "auto"
                                    e.target.style.height = `${e.target.scrollHeight}px`
                                    q.updateSpecLines(i, e.target.value, sIndex)
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#2D4485] outline-none min-h-[160px] resize-none overflow-hidden"
                                  placeholder="Edit specifications (one per line)"
                                  style={{ height: "auto" }}
                                />
                              )}
                            </div>
                            {/* Right: actions beside the spec box (Edit + Upload on the same line) */}
                            <div className="w-64 shrink-0">
                              <div className="flex items-center gap-3">
                                {!sr.edit ? (
                                  <button
                                    className="text-[#2D4485] hover:text-[#1a2c5e] text-sm underline"
                                    onClick={() => q.setSpecEdit(i, true, sIndex)}
                                  >
                                    Edit
                                  </button>
                                ) : (
                                  <button
                                    className="text-[#2D4485] hover:text-[#1a2c5e] text-sm underline"
                                    onClick={() => q.setSpecEdit(i, false, sIndex)}
                                  >
                                    Save
                                  </button>
                                )}
                                <label
                                  htmlFor={`spec-upload-${i}-${sIndex}`}
                                  className="cursor-pointer text-sm text-[#2D4485] underline hover:text-[#1a2c5e]"
                                >
                                  Upload Image
                                </label>
                                <input
                                  id={`spec-upload-${i}-${sIndex}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    const reader = new FileReader()
                                    reader.onload = () => q.setSpecImage(i, reader.result, sIndex)
                                    reader.readAsDataURL(file)
                                    e.target.value = ""
                                  }}
                                />
                                {/* Show uploaded image preview right beside the Upload action */}
                                {sr.image && (
                                  <>
                                    <img
                                      src={sr.image}
                                      alt="Specification"
                                      className="h-16 w-16 object-cover rounded border border-gray-300 cursor-pointer"
                                      onClick={() => setPreviewSrc(sr.image)}
                                    />
                                    <button
                                      className="text-red-600 hover:text-red-800 text-sm underline"
                                      onClick={() => q.setSpecImage(i, null, sIndex)}
                                    >
                                      Remove Image
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right"></td>
                      </tr>
                    ))
                  })()}
                   </>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex flex-col md:flex-row justify-between items-start mt-4 gap-4">
             <div className="flex gap-2">
               <button onClick={q.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
                 <Plus className="w-4 h-4" />
                 <span className="text-sm font-medium">Add Item</span>
               </button>
               <button onClick={q.addSpecificItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200">
                 <FileText className="w-4 h-4" />
                 <span className="text-sm font-medium">Add Specific Description</span>
               </button>
             </div>
             <div className="w-64 space-y-2">
               <div className="flex justify-between text-base font-bold text-gray-900"><span>Total:</span> <span>{q.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
               <div className="flex justify-between text-base font-bold text-gray-900"><span>VAT 7%:</span> <span>{(q.total * 0.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
               <div className="flex justify-between text-base font-bold text-[#2D4485] pt-2 border-t"><span>Grand Total:</span> <span>{(q.total * 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
             </div>
           </div>
        </div>
        
        {/* Terms & Conditions Box */}
        <div className="mb-8">
           <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6">
             <h2 className="text-xl font-bold text-[#2D4485] mb-4">Terms & Conditions</h2>
             <div className="space-y-4">
                {/* Row 1: Trade Terms, Validity, Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Trade Terms</label>
                     <input value={q.details.tradeTerms} onChange={(e) => q.setDetails({ ...q.details, tradeTerms: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Trade Terms" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Validity</label>
                     <input value={q.details.validity} onChange={(e) => q.setDetails({ ...q.details, validity: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Validity" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label>
                     <input value={q.details.delivery} onChange={(e) => q.setDetails({ ...q.details, delivery: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Delivery" />
                  </div>
                </div>

                {/* Row 2: Payment Terms */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                   <textarea 
                     name="paymentTerms"
                     value={q.details.paymentTerms} 
                     onChange={(e) => q.setDetails({ ...q.details, paymentTerms: e.target.value })} 
                     className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                     rows="4" 
                     placeholder="Payment terms" 
                   />
                </div>

                {/* Row 3: Shipment Location, Invoice Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Location</label>
                     <input value={q.details.shipmentLocation} onChange={(e) => q.setDetails({ ...q.details, shipmentLocation: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Shipment Location" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                     <input value={q.details.invoiceDate} onChange={(e) => q.setDetails({ ...q.details, invoiceDate: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Invoice Date" />
                  </div>
                </div>

                {/* Row 4: Remark */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                   <textarea value={q.details.remark} onChange={(e) => q.setDetails({ ...q.details, remark: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="4" placeholder="Remark" />
                </div>
             </div>
           </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href="/admin.html"}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create QO Form</button>
        </div>

        {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Create QO Form</h3>
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
                  onClick={() => {
                    const handleSave = async () => {
                      try {
                        // --- 1. LocalStorage Save (Legacy/Backup) ---
                        const company = q.customer.company || "Unknown"
                        const targetKey = `history:${company}`
                        
                        if (q.sourceKey && q.sourceKey !== targetKey && q.sourceIndex !== null) {
                            try {
                                const oldDataStr = localStorage.getItem(q.sourceKey)
                                if (oldDataStr) {
                                    const oldData = JSON.parse(oldDataStr)
                                    if (oldData && Array.isArray(oldData.quotations)) {
                                        oldData.quotations.splice(q.sourceIndex, 1)
                                        localStorage.setItem(q.sourceKey, JSON.stringify(oldData))
                                    }
                                }
                            } catch(e) { console.error("Error removing old record", e) }
                        }

                        let data = { customer: q.customer, quotations: [], invoices: [], billingNotes: [] }
                        try {
                          const existing = localStorage.getItem(targetKey)
                          if (existing) {
                            const parsed = JSON.parse(existing)
                            if (parsed) data = { ...data, ...parsed }
                          }
                        } catch (e) { console.error("Error parsing localStorage", e) }

                        if (!Array.isArray(data.quotations)) data.quotations = []
                        if (!data.customer || !data.customer.company) data.customer = q.customer

                        const newQuotation = {
                          id: Date.now(),
                          savedAt: new Date().toISOString(),
                          number: q.details.number,
                          details: q.details,
                          items: q.items,
                          total: q.total,
                          totals: { total: q.total },
                          customerName: company
                        }

                        let updateIndex = -1
                        if (q.sourceKey === targetKey && q.sourceIndex !== null) {
                             updateIndex = q.sourceIndex
                        } else {
                             updateIndex = data.quotations.findIndex(x => x.number === q.details.number)
                        }

                        if (updateIndex >= 0 && updateIndex < data.quotations.length) {
                          data.quotations[updateIndex] = newQuotation
                        } else {
                          data.quotations.push(newQuotation)
                        }

                        localStorage.setItem(targetKey, JSON.stringify(data))
                        
                        // --- 2. Backend Database Save ---
                        const backendPayload = {
                            qo_code: q.details.number,
                            created_date: q.details.date,
                            customer_name: q.customer.company || "Unknown",
                            customer_tax_id: q.customer.taxId || "",
                            customer_address: q.customer.address || "",
                            customer_email: q.customer.email || "",
                            customer_phone: q.customer.telephone || "",
                            customer_fax: q.customer.fax || "",
                            cus_respon_attn: q.customer.attn || "",
                            cus_respon_div: q.customer.div || "",
                            cus_respon_mobile: q.customer.mobile || "",
                            eit: q.details.eit,
                            eit_name: q.details.salesPerson || "",
                            eit_address: q.details.eitAddress || "",
                            eit_mobile: q.details.eitMobile || "",
                            eit_phone: q.details.eitTelephone || "",
                            eit_fax: q.details.eitFax || "",
                            trade_terms: q.details.tradeTerms || "",
                            validity: q.details.validity || "",
                            delivery: q.details.delivery || "",
                            payment_terms: q.details.paymentTerms || "",
                            shipment_location: q.details.shipmentLocation || "",
                            invoice_date: (q.details.invoiceDate && q.details.invoiceDate !== "SAME AS DELIVERY DATE") ? q.details.invoiceDate : null,
                            remark: q.details.remark || "",
                            items: q.items.map(item => ({
                                item: item.item || "",
                                model: item.model || "",
                                description: item.description || "",
                                qty: item.qty || 1,
                                price: item.price || 0
                            }))
                        }
                        
                        // Validate date format for backend
                        if (backendPayload.invoice_date && !/^\d{4}-\d{2}-\d{2}$/.test(backendPayload.invoice_date)) {
                             backendPayload.invoice_date = null
                        }

                        console.log("Saving to backend...", backendPayload)
                        
                        let url = `${API_BASE_URL}/api/quotations/`
                        let method = 'POST'
                        
                        if (q.sourceKey === 'api' && q.sourceIndex) {
                            url = `${API_BASE_URL}/api/quotations/${q.sourceIndex}/`
                            method = 'PUT'
                        }

                        const response = await fetch(url, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(backendPayload)
                        })

                        if (!response.ok) {
                            const errText = await response.text()
                            console.error("Backend save error:", errText)
                            throw new Error("Failed to save to database: " + errText)
                        }
                        
                        alert("Quotation saved successfully!")
                        setOpenCreateConfirm(false)
                        window.location.href = "/admin.html"
                      } catch (error) {
                        console.error(error)
                        alert("Error saving quotation: " + error.message)
                      }
                    }
                    handleSave()
                  }}
                >
                  Save Changes
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center"
                  onClick={() => {
                    setOpenCreateConfirm(false)
                    handlePrintPdf()
                  }}
                >
                  Download Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal removed */}

      {/* Full-size image preview overlay */}
      {previewSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setPreviewSrc(null)}
        >
          <div
            className="max-w-[90vw] max-h-[90vh] bg-white rounded-lg shadow-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewSrc}
              alt="Preview"
              className="max-w-[85vw] max-h-[80vh] object-contain rounded"
            />
            <div className="mt-3 text-right">
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
                onClick={() => setPreviewSrc(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  )
}

const container = document.getElementById("root")
if (container) {
  if (!container._reactRoot) {
    container._reactRoot = ReactDOM.createRoot(container)
  }
  container._reactRoot.render(
    <React.StrictMode>
      <QuotationPage />
    </React.StrictMode>,
  )
}
