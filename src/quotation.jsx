import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import { QuotationTemplate } from "./components/quotation-template.jsx"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft, ClipboardList } from "lucide-react"
import { CustomerCombobox } from "./components/customer-combobox.jsx"
// Import a typing+select combobox component to enhance description input
import { Combobox } from "./components/combobox.jsx"
import { DateField } from "./components/ui/date-field"

// Resolve image URL robustly across sources:
// - DataURL: return as-is for immediate preview (client-side)
// - Absolute URL: return unchanged
// - Relative DB path: prefix with /media and API_BASE_URL
const resolveImageUrl = (src) => {
  if (!src || typeof src !== "string") return null
  if (src.startsWith("data:image")) return src
  if (/^https?:\/\//.test(src)) return src
  let path = src
  if (path.startsWith("/media/")) {
    // already correct
  } else if (path.startsWith("media/")) {
    path = `/${path}`
  } else {
    path = `/media/${path.replace(/^\/+/, "")}`
  }
  return `${API_BASE_URL}${path}`
}

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
    email: "",
    // Multiple responsible contacts (Attn/CC/Mobile/Email)
    responsibles: []
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
    // Default trade terms set to "Thai baht" but kept editable via input
    tradeTerms: "Thai baht",
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
  // Full Customer records from backend (includes CC fields). Used to populate Attn/CC on selection.
  const [customerRecords, setCustomerRecords] = React.useState([])
  // Hold description suggestion options aggregated from PD_* tables
  const [pdDescriptionOptions, setPdDescriptionOptions] = React.useState([])
  // Lookup map from rendered option label to its underlying PD data (name/description/specification/type)
  const [pdOptionLookup, setPdOptionLookup] = React.useState({})
  // Map of PDSystem id -> array of child products { name, specification }
  const [systemChildren, setSystemChildren] = React.useState({})

  React.useEffect(() => {
    // Previously we populated customerOptions from Deals (customer_name only),
    // which caused the Quotation combobox to emit labels without IDs and hydration failed.
    // We keep loading deals if needed elsewhere, but do NOT override customerOptions here.
    fetch(`${API_BASE_URL}/api/deals/`)
      .then(res => res.json())
      .then(data => {
        // No-op for customerOptions; rely on /api/customers/ for canonical options with IDs
      })
      .catch(err => console.error("Error loading deals for customers", err))
  }, [])

  // Load canonical Customer records (with CC fields) so selection can hydrate Attn/CC automatically.
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/customers/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomerRecords(data)
          // Build combobox options using ID-based selection:
          // label = company_name (shown), value = id (used for hydration)
          setCustomerOptions(
            data
              .filter(c => (c.company_name || "").trim().length > 0)
              .map(c => ({ label: c.company_name, value: c.id }))
          )
        } else {
          setCustomerRecords([])
        }
      })
      .catch(err => {
        console.error("Error loading customers", err)
        setCustomerRecords([])
      })
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
        // Fetch each PD_* collection, remembering its type
        const typedResults = await Promise.all(
          endpoints.map(async (ep) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/${ep}/`, { headers })
              const data = res.ok ? await res.json() : []
              return data.map((item) => ({ type: ep, item }))
            } catch {
              return []
            }
          })
        )
        const all = typedResults.flat().filter(Boolean)
        const labels = []
        const lookup = {}
        const sysChildren = {}
        all.forEach(({ type, item }) => {
          const id = item?.id
          const name = item?.name ? String(item.name).trim() : ""
          const desc = item?.description ? String(item.description).trim() : ""
          const spec = item?.specification ? String(item.specification).trim() : ""
          // Build label using specification if present; otherwise description; else just name.
          const detail = spec || desc
          const label = detail ? `${name} — ${detail}` : name
          // Collect system child products grouped by PDSystem id
          if (type === "pd_system_childproducts") {
            const sysId = item?.system
            if (sysId != null) {
              if (!sysChildren[sysId]) sysChildren[sysId] = []
              sysChildren[sysId].push({ name, specification: spec })
            }
          }
          // Populate lookup for all resources with their type and id
          if (label && !lookup[label]) {
            labels.push(label)
            lookup[label] = { id, type, name, description: desc, specification: spec }
          }
        })
        setPdDescriptionOptions(labels)
        setPdOptionLookup(lookup)
        setSystemChildren(sysChildren)
      } catch (e) {
        console.error("Error loading PD description options", e)
        setPdDescriptionOptions([])
        setPdOptionLookup({})
        setSystemChildren({})
      }
    })()
  }, [])

  const total = items.reduce((sum, it) => sum + (parseNumber(it.qty) || 0) * (parseNumber(it.price) || 0), 0)

  const addItem = () => setItems((prev) => [...prev, { item: "", model: "", description: "", qty: 1, price: 0, specRows: [], specEdit: false }])
  // Removed: addSpecificItem — per request to delete the button and function
  // Add another responsible contact (Attn + CC) with separate Division/Mobile/Email for each line
  const addResponsible = () => {
    setCustomer(prev => {
      const next = Array.isArray(prev.responsibles) ? [...prev.responsibles] : []
      next.push({ 
        attn: "", attnDiv: "", attnMobile: "", attnEmail: "",
        cc: "", ccDiv: "", ccMobile: "", ccEmail: ""
      })
      return { ...prev, responsibles: next }
    })
  }
  // Update a responsible contact field; mirror index 0 Attn line to top-level fields for backend compatibility
  const updateResponsible = (idx, field, value) => {
    setCustomer(prev => {
      const base = Array.isArray(prev.responsibles) && prev.responsibles.length > 0
        ? [...prev.responsibles]
        : [{
            attn: prev.attn || "", attnDiv: prev.div || "", attnMobile: prev.mobile || "", attnEmail: prev.email || "",
            cc: "", ccDiv: "", ccMobile: "", ccEmail: ""
          }]
      const target = base[idx] || { 
        attn: "", attnDiv: "", attnMobile: "", attnEmail: "",
        cc: "", ccDiv: "", ccMobile: "", ccEmail: ""
      }
      base[idx] = { ...target, [field]: value }
      const next = { ...prev, responsibles: base }
      // Mirror the first Attn-line fields to legacy top-level values
      if (idx === 0) {
        if (field === 'attn') next.attn = value
        if (field === 'attnDiv') next.div = value
        if (field === 'attnMobile') next.mobile = value
        if (field === 'attnEmail') next.email = value
      }
      return next
    })
  }
  // Remove a responsible pair; if first is removed, mirror new first values to legacy top-level fields
  const removeResponsible = (idx) => {
    setCustomer(prev => {
      const base = Array.isArray(prev.responsibles) ? [...prev.responsibles] : []
      if (base.length === 0) return prev
      base.splice(idx, 1)
      const next = { ...prev, responsibles: base }
      if (idx === 0) {
        const first = base[0] || { attn: "", attnDiv: "", attnMobile: "", attnEmail: "" }
        next.attn = first.attn || ""
        next.div = first.attnDiv || ""
        next.mobile = first.attnMobile || ""
        next.email = first.attnEmail || ""
      }
      return next
    })
  }

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
      // If a PD system is chosen, append its child products as new item rows with their specifications
      if (meta?.type === "pd_systems" && meta?.id != null) {
        const children = systemChildren[meta.id] || []
        let insertAt = rowIndex + 1
        children.forEach((c) => {
          const childLines = String(c?.specification || "")
            .split("\n")
            .map(s => s.trim())
            .filter(Boolean)
          next.splice(insertAt, 0, {
            item: "",
            model: "",
            description: c?.name || "",
            qty: 1,
            price: 0,
            // Place child specifications under the child item
            specRows: [{ lines: childLines, image: null, edit: false }],
            specEdit: false
          })
          insertAt += 1
        })
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
      // Initialize image with a default adjustable size so the user can tweak it
      if (!rows[specIndex]) rows[specIndex] = { lines: [], image: dataUrl || null, imageWidth: 64, imageHeight: 64, edit: true }
      else rows[specIndex] = { ...rows[specIndex], image: dataUrl || null, imageWidth: rows[specIndex].imageWidth || 64, imageHeight: rows[specIndex].imageHeight || 64 }
      return { ...row, specRows: rows }
    }))
  }
  // Adjust specification image size (uniform scale: width=height=size)
  const setSpecImageSize = (rowIndex, size, specIndex = 0) => {
    setItems(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row
      const rows = Array.isArray(row.specRows) ? [...row.specRows] : []
      if (!rows[specIndex]) rows[specIndex] = { lines: [], image: null, imageWidth: size, imageHeight: size, edit: true }
      else rows[specIndex] = { ...rows[specIndex], imageWidth: size, imageHeight: size }
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

  // Delete a specific specification row from an item
  // Keeps remaining rows and their numbering consistent (1.1, 1.2, ...)
  const removeSpecRow = (rowIndex, specIndex = 0) => {
    setItems(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row
      const rows = Array.isArray(row.specRows) ? [...row.specRows] : []
      if (specIndex >= 0 && specIndex < rows.length) {
        rows.splice(specIndex, 1)
      }
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
            const cust = data.customer_details || {}
            const top = {
              company: cust.company_name || "",
              taxId: cust.tax_id || "",
              address: cust.address || "",
              telephone: cust.phone || "",
              fax: cust.cus_fax || "",
              attn: cust.attn || "",
              div: cust.attn_division || "",
              mobile: cust.attn_mobile || "",
              email: cust.email || ""
            }
            const splitCSV = (s) => String(s || "").split(',').map(t => t.trim()).filter(Boolean)
            const attnCSV = splitCSV(cust.attn)
            const attnDivCSV = splitCSV(cust.attn_division)
            const attnMobileCSV = splitCSV(cust.attn_mobile)
            const attnEmailCSV = splitCSV(cust.email)
            const ccCSV = splitCSV(cust.cc)
            const ccDivCSV = splitCSV(cust.cc_division)
            const ccMobileCSV = splitCSV(cust.cc_mobile)
            const ccEmailCSV = splitCSV(cust.cc_email)
            const maxLen = Math.max(attnCSV.length, attnDivCSV.length, attnMobileCSV.length, attnEmailCSV.length, ccCSV.length, ccDivCSV.length, ccMobileCSV.length, ccEmailCSV.length)
            const respList = []
            for (let i = 0; i < Math.max(1, maxLen); i++) {
              respList.push({
                attn: attnCSV[i] || top.attn || "",
                attnDiv: attnDivCSV[i] || top.div || "",
                attnMobile: attnMobileCSV[i] || top.mobile || "",
                attnEmail: attnEmailCSV[i] || top.email || "",
                cc: ccCSV[i] || "",
                ccDiv: ccDivCSV[i] || "",
                ccMobile: ccMobileCSV[i] || "",
                ccEmail: ccEmailCSV[i] || ""
              })
            }
            setCustomer(prev => ({
              ...prev,
              ...top,
              responsibles: respList
            }))
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
              // Build item rows and seed specification from 'specification' field; attach image from item.image
              const out = []
              apiItems.forEach((i) => {
                const rawQty = (i.quantity !== undefined ? i.quantity : i.qty)
                const qtyNum = (() => {
                  const n = parseFloat(String(rawQty ?? "").replace(/,/g, ""))
                  return isNaN(n) ? 1 : n
                })()
                const total = parseFloat(String(i.quo_total || i.total || 0).replace(/,/g, ""))
                const baseSpec = String(i.specification || "").replace(/\r/g, "").split("\n").filter(Boolean)
                // Build a displayable image URL from DB path/url/data
                const imgUrl = resolveImageUrl(i.image)
                out.push({
                  item: i.quo_item || i.item || "",
                  model: i.quo_model || i.model || "",
                  description: i.quo_description || i.description || "",
                  qty: qtyNum > 0 ? qtyNum : 1,
                  price: qtyNum > 0 ? (total / qtyNum) : 0,
                  specRows: baseSpec.length ? [{ lines: baseSpec, image: imgUrl, edit: false, imageWidth: 64, imageHeight: 64 }] : []
                })
              })
              setItems(out)
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
  // Include setSpecImageSize so UI slider can adjust image dimensions
  // Exclude addSpecificItem per request (button and function removed)
  return { customer, setCustomer, details, setDetails, items, setItems, addItem, insertItem: insertRow, removeItem, updateItem, applyPdSelection, updateSpecLines, setSpecEdit, setSpecImage, setSpecImageSize, addSpecRow, removeSpecRow, addResponsible, updateResponsible, removeResponsible, total, sourceKey, sourceIndex, eitOptions, customerOptions, pdDescriptionOptions, pdOptionLookup }
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
          spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({
            lines: r.lines || [],
            image_data: (typeof r.image === 'string' && r.image.startsWith('data:image')) ? r.image : null,
            image: (typeof r.image === 'string') ? r.image : null,
            image_width: r.imageWidth || 64,
            image_height: r.imageHeight || 64
          })) : [],
          // Legacy fields kept for backward compatibility
          spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
          spec_image_data: i.specImage || null
        })),
        totals: { total: q.total }
      }
      // Generate base quotation PDF (without cover). We will open Print Preview first, then download.
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
      // Fallback to legacy endpoint without cover if merge fails
      console.error("Error generating PDF with cover:", error)
      try {
        const payload = {
          details: q.details,
          customer: q.customer,
          items: q.items.map(i => ({
            ...i,
            qty: parseNumber(i.qty),
            price: parseNumber(i.price),
            spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({ lines: r.lines || [], image_data: r.image || null, image_width: r.imageWidth || 64, image_height: r.imageHeight || 64 })) : [],
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
      } catch (e2) {
        console.error("Fallback PDF generation failed:", e2)
        alert("Failed to generate PDF")
      }
    }
  }
  
  // Download/print the form combined with cover photo from backend media
  const handlePrintPdfWithCover = async () => {
    try {
      // Step 1: Generate base quotation PDF first (ensures backend doesn't call itself internally)
      const basePayload = {
        details: q.details,
        customer: q.customer,
        items: q.items.map(i => ({
          ...i,
          qty: parseNumber(i.qty),
          price: parseNumber(i.price),
          spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({
            lines: r.lines || [],
            image_data: (typeof r.image === 'string' && r.image.startsWith('data:image')) ? r.image : null,
            image: (typeof r.image === 'string') ? r.image : null,
            image_width: r.imageWidth || 64,
            image_height: r.imageHeight || 64
          })) : [],
          spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
          spec_image_data: i.specImage || null
        })),
        totals: { total: q.total }
      }
      const baseRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload)
      })
      if (!baseRes.ok) throw new Error('Failed to generate base quotation PDF')
      const baseBlob = await baseRes.blob()
      const baseArrayBuffer = await baseBlob.arrayBuffer()
      // Convert ArrayBuffer to base64 for backend
      const bytes = new Uint8Array(baseArrayBuffer)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64Pdf = window.btoa(binary)
      // Step 2: Request backend to merge cover (media/ใบปะหน้า.pdf) + base quotation PDF
      const mergeRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf-with-cover/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_pdf: `data:application/pdf;base64,${base64Pdf}` })
      })
      if (!mergeRes.ok) throw new Error('Failed to merge cover with quotation')
      const blob = await mergeRes.blob()
      const url = window.URL.createObjectURL(blob)
      // Open Print Preview using hidden iframe so user sees preview first
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
      // Fallback to standard download if anything fails (network, backend merge, etc.)
      console.error("Error generating PDF with cover:", error)
      await handlePrintPdf()
    }
  }

  // Preview the merged PDF (cover + quotation) in Chrome's built-in viewer
  // This opens a new tab with the Blob URL so the user can inspect or print from Chrome UI.
  const handlePreviewPdfWithCover = async () => {
    try {
      // Generate base PDF first
      const basePayload = {
        details: q.details,
        customer: q.customer,
        items: q.items.map(i => ({
          ...i,
          qty: parseNumber(i.qty),
          price: parseNumber(i.price),
          spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({
            lines: r.lines || [],
            image_data: (typeof r.image === 'string' && r.image.startsWith('data:image')) ? r.image : null,
            image: (typeof r.image === 'string') ? r.image : null,
            image_width: r.imageWidth || 64,
            image_height: r.imageHeight || 64
          })) : [],
          spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
          spec_image_data: i.specImage || null
        })),
        totals: { total: q.total }
      }
      const baseRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload)
      })
      if (!baseRes.ok) throw new Error('Failed to generate base quotation PDF')
      const baseBlob = await baseRes.blob()
      const baseArrayBuffer = await baseBlob.arrayBuffer()
      const bytes = new Uint8Array(baseArrayBuffer)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64Pdf = window.btoa(binary)

      // Merge cover + base on backend
      const mergeRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf-with-cover/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_pdf: `data:application/pdf;base64,${base64Pdf}` })
      })
      if (!mergeRes.ok) throw new Error('Failed to merge cover with quotation')
      const blob = await mergeRes.blob()
      const url = window.URL.createObjectURL(blob)
      // Open in new tab to use Chrome's PDF viewer and print UI
      const win = window.open(url, '_blank')
      if (!win) {
        // Popup blocked: show a small inline preview using an iframe
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = url
        document.body.appendChild(iframe)
      }
      // Cleanup the object URL later
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.error("Error previewing merged PDF:", error)
      // Fallback to the print path (no cover) to at least show something
      await handlePrintPdf()
    }
  }
  
  // Open the browser Print Preview for the quotation PDF (without cover)
  // The print dialog shows a live preview and options (destination, pages, etc.).
  const handlePrintPreviewPdf = async () => {
    try {
      // Build the payload identical to the download path so content matches
      const payload = {
        details: q.details,
        customer: q.customer,
        items: q.items.map(i => ({
          ...i,
          qty: parseNumber(i.qty),
          price: parseNumber(i.price),
          spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({
            lines: r.lines || [],
            image_data: (typeof r.image === 'string' && r.image.startsWith('data:image')) ? r.image : null,
            image: (typeof r.image === 'string') ? r.image : null,
            image_width: r.imageWidth || 64,
            image_height: r.imageHeight || 64
          })) : [],
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
      // Use a hidden iframe and call print() to open the Print Preview dialog
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      // Wait a tick to ensure the PDF viewer loads before calling print()
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }, 500)
      // Cleanup (revoke object URL and remove iframe)
      setTimeout(() => {
        document.body.removeChild(iframe)
        window.URL.revokeObjectURL(url)
      }, 60000)
    } catch (error) {
      console.error("Error opening Print Preview:", error)
      alert("Failed to open Print Preview")
    }
  }
  
  // Open the browser Print Preview for the merged PDF (cover + quotation)
  // This mirrors the download-with-cover path but triggers the print dialog.
  const handlePrintPreviewPdfWithCover = async () => {
    try {
      // Step 1: Generate base quotation PDF first
      const basePayload = {
        details: q.details,
        customer: q.customer,
        items: q.items.map(i => ({
          ...i,
          qty: parseNumber(i.qty),
          price: parseNumber(i.price),
          spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({ lines: r.lines || [], image_data: r.image || null, image_width: r.imageWidth || 64, image_height: r.imageHeight || 64 })) : [],
          spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
          spec_image_data: i.specImage || null
        })),
        totals: { total: q.total }
      }
      const baseRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload)
      })
      if (!baseRes.ok) throw new Error('Failed to generate base quotation PDF')
      const baseBlob = await baseRes.blob()
      const baseArrayBuffer = await baseBlob.arrayBuffer()
      // Convert to base64 so backend can merge with cover
      const bytes = new Uint8Array(baseArrayBuffer)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64Pdf = window.btoa(binary)
      // Step 2: Merge cover + base on backend
      const mergeRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf-with-cover/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_pdf: `data:application/pdf;base64,${base64Pdf}` })
      })
      if (!mergeRes.ok) throw new Error('Failed to merge cover with quotation')
      const blob = await mergeRes.blob()
      const url = window.URL.createObjectURL(blob)
      // Hidden iframe + print() opens the browser Print Preview dialog
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
      console.error("Error opening Print Preview with cover:", error)
      // Fallback to preview without cover
      await handlePrintPreviewPdf()
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
                  // Typing handler:
                  // - Updates visible company text
                  // - Do NOT hydrate on type to avoid race conditions. Hydration happens in onSelect via fetch-by-ID.
                  onChange={(val) => {
                    const text = String(val || "")
                    q.setCustomer(prev => ({ ...prev, company: text }))
                  }}
                  // On dropdown selection, fetch by Customer ID and hydrate. This avoids race conditions.
                  onSelect={(payload) => {
                    const option = typeof payload === 'object' && payload !== null 
                      ? payload 
                      : { label: String(payload || ""), value: payload }
                    console.log("Quotation:onSelect option =", option)
                    if (option?.value == null || option.value === "") return
                    fetch(`${API_BASE_URL}/api/customers/${option.value}/`)
                      .then(res => res.ok ? res.json() : null)
                      .then(c => {
                        console.log("Quotation:customer fetched =", c)
                        if (!c) return
                        const nextTop = {
                          company: option.label || c.company_name || "",
                          taxId: c.tax_id || "",
                          address: c.address || "",
                          telephone: c.phone || "",
                          fax: c.cus_fax || "",
                          attn: c.attn || "",
                          div: c.attn_division || "",
                          mobile: c.attn_mobile || "",
                          email: c.email || ""
                        }
                        const splitCSV = (s) => String(s || "").split(",").map(t => t.trim()).filter(Boolean)
                        const attnCSV = splitCSV(c.attn)
                        const attnDivCSV = splitCSV(c.attn_division)
                        const attnMobileCSV = splitCSV(c.attn_mobile)
                        const attnEmailCSV = splitCSV(c.email)
                        const ccCSV = splitCSV(c.cc)
                        const ccDivCSV = splitCSV(c.cc_division)
                        const ccMobileCSV = splitCSV(c.cc_mobile)
                        const ccEmailCSV = splitCSV(c.cc_email)
                        const maxLen = Math.max(attnCSV.length, attnDivCSV.length, attnMobileCSV.length, attnEmailCSV.length, ccCSV.length, ccDivCSV.length, ccMobileCSV.length, ccEmailCSV.length)
                        const responsibles = []
                        for (let i = 0; i < Math.max(1, maxLen); i++) {
                          responsibles.push({
                            attn: attnCSV[i] || nextTop.attn || "",
                            attnDiv: attnDivCSV[i] || nextTop.div || "",
                            attnMobile: attnMobileCSV[i] || nextTop.mobile || "",
                            attnEmail: attnEmailCSV[i] || nextTop.email || "",
                            cc: ccCSV[i] || "",
                            ccDiv: ccDivCSV[i] || "",
                            ccMobile: ccMobileCSV[i] || "",
                            ccEmail: ccEmailCSV[i] || ""
                          })
                        }
                        // If some key fields are empty in Customer, fallback to the latest Deal for this customer
                        const needsFallback =
                          !nextTop.taxId || !nextTop.address || !nextTop.telephone || !nextTop.fax || !nextTop.attn || !nextTop.email
                        if (needsFallback) {
                          fetch(`${API_BASE_URL}/api/deals/`)
                            .then(r => r.ok ? r.json() : [])
                            .then(deals => {
                              const latest = Array.isArray(deals)
                                ? deals.filter(d => String(d.customer) === String(c.id)).sort((a, b) => (b.id || 0) - (a.id || 0))[0]
                                : null
                              const fallback = latest ? {
                                taxId: nextTop.taxId || latest.tax_id || "",
                                address: nextTop.address || latest.address || "",
                                telephone: nextTop.telephone || latest.phone || "",
                                fax: nextTop.fax || "",
                                attn: nextTop.attn || latest.contact || "",
                                email: nextTop.email || latest.email || ""
                              } : {}
                              const mergedTop = { ...nextTop, ...fallback }
                              q.setCustomer(prev => ({ ...prev, ...mergedTop, responsibles }))
                            })
                            .catch(() => {
                              q.setCustomer(prev => ({ ...prev, ...nextTop, responsibles }))
                            })
                        } else {
                          q.setCustomer(prev => ({ ...prev, ...nextTop, responsibles }))
                        }
                      })
                      .catch(err => {
                        console.error("Quotation: failed to fetch customer by ID", err)
                        q.setCustomer(prev => ({ ...prev, company: option.label || prev.company }))
                      })
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

          <div className="flex items-center justify-between pt-2">
             <h3 className="text-base font-bold text-gray-900">Customer Responsible</h3>
             {/* Add Responsible (Attn + CC) */}
             <button onClick={q.addResponsible} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-medium">Add Attn + CC</span>
             </button>
          </div>
          {/* Render Responsibles in two rows per contact:
              Row 1: Attn., Division, Mobile, Email
              Row 2: CC., Division, Mobile, Email */}
          {(() => {
            const contacts = Array.isArray(q.customer.responsibles) && q.customer.responsibles.length > 0
              ? q.customer.responsibles
              : [{ 
                  attn: q.customer.attn || "", attnDiv: q.customer.div || "", attnMobile: q.customer.mobile || "", attnEmail: q.customer.email || "",
                  cc: "", ccDiv: "", ccMobile: "", ccEmail: "" 
                }]
            return contacts.map((c, idx) => (
              <div key={`resp-block-${idx}`} className="mt-3">
                {/* Delete this Attn+CC pair */}
                <div className="flex justify-end">
                  <button
                    onClick={() => q.removeResponsible(idx)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                    title="Delete Attn + CC"
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </button>
                </div>
                {/* Attn row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attention(Attn.)</label>
                    <input value={c.attn} onChange={(e) => q.updateResponsible(idx, 'attn', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Attention" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division(Div.)</label>
                    <input value={c.attnDiv || ""} onChange={(e) => q.updateResponsible(idx, 'attnDiv', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Division" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input value={c.attnMobile || ""} onChange={(e) => q.updateResponsible(idx, 'attnMobile', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={c.attnEmail || ""} onChange={(e) => q.updateResponsible(idx, 'attnEmail', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Email" />
                  </div>
                </div>
                {/* CC row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                    <input value={c.cc || ""} onChange={(e) => q.updateResponsible(idx, 'cc', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="CC (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division(Div.)</label>
                    <input value={c.ccDiv || ""} onChange={(e) => q.updateResponsible(idx, 'ccDiv', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Division" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input value={c.ccMobile || ""} onChange={(e) => q.updateResponsible(idx, 'ccMobile', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={c.ccEmail || ""} onChange={(e) => q.updateResponsible(idx, 'ccEmail', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Email" />
                  </div>
                </div>
              </div>
            ))
          })()}
        </div>



        {/* Quotation Description Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#2D4485]">Quotation Description</h2>
             {/* Action buttons: Add Item */}
             <div className="flex items-center gap-2">
               {/* Add Item: standard product/service line */}
               <button onClick={q.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
                 <Plus className="w-4 h-4" />
                 <span className="text-sm font-medium">Add Item</span>
               </button>
             </div>
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
                  // Wrap rows for each item in a keyed Fragment to satisfy React list key requirements
                  <React.Fragment key={`item-block-${i}`}>
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
                                      style={{ width: `${sr.imageWidth || 64}px`, height: `${sr.imageHeight || 64}px` }}
                                      className="object-cover rounded border border-gray-300 cursor-pointer"
                                      onError={(e) => {
                                        // If the image fails (e.g., missing /media prefix), try to resolve and retry
                                        const fixed = resolveImageUrl(sr.image)
                                        if (fixed && e.currentTarget.src !== fixed) {
                                          e.currentTarget.src = fixed
                                        }
                                      }}
                                      onClick={() => setPreviewSrc(resolveImageUrl(sr.image) || sr.image)}
                                    />
                                    {/* Image size slider: adjust width/height uniformly */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">Size</span>
                                      <input
                                        type="range"
                                        min="40"
                                        max="120"
                                        step="4"
                                        value={sr.imageWidth || 64}
                                        onChange={(e) => q.setSpecImageSize(i, parseInt(e.target.value, 10), sIndex)}
                                      />
                                      <span className="text-xs text-gray-700">{sr.imageWidth || 64}px</span>
                                    </div>
                                    <button
                                      className="text-red-600 hover:text-red-800 text-sm underline"
                                      onClick={() => q.setSpecImage(i, null, sIndex)}
                                    >
                                      Remove Image
                                    </button>
                                  </>
                                )}
                                {/* Delete this specification row */}
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Specification"
                                  onClick={() => q.removeSpecRow(i, sIndex)}
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right"></td>
                      </tr>
                    ))
                  })()}
                  </React.Fragment>
                 ))}
               </tbody>
             </table>
           </div>
          {/* Align totals to the right (original placement). 
              Using md:ml-auto pushes this block to the far right on desktop. */}
          <div className="flex flex-col md:flex-row items-start mt-4 gap-4 justify-end">
            {/* Totals summary block */}
            <div className="w-64 space-y-2 md:ml-auto md:text-right">
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
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    className="w-full px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 min-w-[140px]"
                    onClick={() => { setOpenCreateConfirm(false); window.location.href = "/admin.html" }}
                  >
                    Discard
                  </button>
                  <button
                    className="w-full px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 min-w-[140px]"
                    onClick={() => {
                      const handleSaveAsNew = async () => {
                        try {
                          // Build a unique new quotation code derived from current number
                          // Comment: Always derive a fresh number to avoid overwriting existing records
                          const baseCode = q.details.number || `QUO-${Date.now()}`
                          const qo_code = `${baseCode}-COPY-${Date.now()}`

                          // Flatten responsible persons into CSV strings for serializer
                          const list = Array.isArray(q.customer.responsibles) ? q.customer.responsibles : []
                          const attnList = list.map(r => (r.attn || "").trim()).filter(Boolean)
                          const attnDivList = list.map(r => (r.attnDiv || "").trim()).filter(Boolean)
                          const attnMobileList = list.map(r => (r.attnMobile || "").trim()).filter(Boolean)
                          const attnEmailList = list.map(r => (r.attnEmail || "").trim()).filter(Boolean)
                          const ccList = list.map(r => (r.cc || "").trim()).filter(Boolean)
                          const ccDivList = list.map(r => (r.ccDiv || "").trim()).filter(Boolean)
                          const ccMobileList = list.map(r => (r.ccMobile || "").trim()).filter(Boolean)
                          const ccEmailList = list.map(r => (r.ccEmail || "").trim()).filter(Boolean)

                          // Convert data URL to Blob for file upload
                          // Comment: DRF expects UploadedFile for ImageField, not base64 in JSON
                          const dataUrlToBlob = (dataUrl) => {
                            try {
                              const [meta, content] = String(dataUrl || "").split(",")
                              const mimeMatch = meta.match(/data:(.*?);base64/)
                              const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream"
                              const bin = atob(content || "")
                              const bytes = new Uint8Array(bin.length)
                              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
                              return new Blob([bytes], { type: mime })
                            } catch {
                              return null
                            }
                          }

                          // Prepare multipart form data for nested items + image files
                          const fd = new FormData()
                          // Top-level fields
                          fd.append("qo_code", qo_code)
                          fd.append("created_date", q.details.date || "")
                          fd.append("customer_name", q.customer.company || "Unknown")
                          fd.append("customer_tax_id", q.customer.taxId || "")
                          fd.append("customer_address", q.customer.address || "")
                          fd.append("customer_email", q.customer.email || "")
                          fd.append("customer_phone", q.customer.telephone || "")
                          fd.append("customer_fax", q.customer.fax || "")
                          fd.append("cus_respon_attn", attnList.join(","))
                          fd.append("cus_respon_div", attnDivList.join(","))
                          fd.append("cus_respon_mobile", attnMobileList.join(","))
                          fd.append("cus_respon_cc", ccList.join(","))
                          fd.append("cus_respon_cc_div", ccDivList.join(","))
                          fd.append("cus_respon_cc_mobile", ccMobileList.join(","))
                          fd.append("cus_respon_cc_email", ccEmailList.join(","))
                          if (q.details.eit) fd.append("eit", String(q.details.eit))
                          fd.append("eit_name", q.details.salesPerson || "")
                          fd.append("eit_address", q.details.eitAddress || "")
                          fd.append("eit_mobile", q.details.eitMobile || "")
                          fd.append("eit_phone", q.details.eitTelephone || "")
                          fd.append("eit_fax", q.details.eitFax || "")
                          fd.append("trade_terms", q.details.tradeTerms || "")
                          fd.append("validity", q.details.validity || "")
                          fd.append("delivery", q.details.delivery || "")
                          fd.append("payment_terms", q.details.paymentTerms || "")
                          fd.append("shipment_location", q.details.shipmentLocation || "")
                          const invDate = (q.details.invoiceDate && q.details.invoiceDate !== "SAME AS DELIVERY DATE") ? q.details.invoiceDate : ""
                          if (/^\\d{4}-\\d{2}-\\d{2}$/.test(invDate)) fd.append("invoice_date", invDate)
                          fd.append("remark", q.details.remark || "")

                          // Items: persist main items and each spec row as separate items (qty=0)
                          // Comment: Storing specs as separate rows ensures the UI can reconstruct specRows after reload.
                          let idxNew = 0
                          const jsonItemsForFallback = []
                          q.items.forEach((item) => {
                            // Main item
                            fd.append(`items[${idxNew}][item]`, item.item || "")
                            fd.append(`items[${idxNew}][model]`, item.model || "")
                            fd.append(`items[${idxNew}][description]`, item.description || "")
                            // Persist combined specification text on the main item for reporting
                            const specText = (Array.isArray(item.specRows) ? item.specRows : [])
                              .map(sr => Array.isArray(sr.lines) ? sr.lines.join("\\n") : "")
                              .filter(Boolean)
                              .join("\\n")
                            fd.append(`items[${idxNew}][specification]`, specText)
                            fd.append(`items[${idxNew}][qty]`, String(item.qty || 1))
                            fd.append(`items[${idxNew}][price]`, String(item.price || 0))
                            // Attach first specification image to the base item (if any)
                            const firstImageRow = (Array.isArray(item.specRows) ? item.specRows : []).find(sr => sr.image)
                            if (firstImageRow && firstImageRow.image) {
                              const blob = dataUrlToBlob(firstImageRow.image)
                              if (blob) {
                                const file = new File([blob], `spec_${idxNew}.png`, { type: blob.type || "image/png" })
                                fd.append(`items[${idxNew}][image]`, file)
                              }
                            }
                            jsonItemsForFallback.push({
                              item: item.item || "",
                              model: item.model || "",
                              description: item.description || "",
                              specification: specText,
                              qty: String(item.qty || 1),
                              price: String(item.price || 0)
                            })
                            idxNew++
                          })
                          // Add JSON fallback to ensure backend always receives items list
                          fd.append("items", JSON.stringify(jsonItemsForFallback))

                          // Send multipart request (do not set Content-Type manually)
                          const headers = {}
                          const token = localStorage.getItem("authToken")
                          if (token) headers["Authorization"] = `Token ${token}`
                          const response = await fetch(`${API_BASE_URL}/api/quotations/`, {
                            method: "POST",
                            headers,
                            body: fd
                          })
                          if (!response.ok) {
                            const err = await response.text()
                            throw new Error("Failed to save new quotation: " + err)
                          }
                          alert("Saved as new quotation!")
                          setOpenCreateConfirm(false)
                          window.location.href = "/admin.html"
                        } catch (error) {
                          console.error(error)
                          alert("Error saving as new: " + error.message)
                        }
                      }
                      handleSaveAsNew()
                    }}
                  >
                    Save as new
                  </button>
                  <button
                    className="w-full px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] min-w-[140px]"
                    onClick={() => {
                      const handleSave = async () => {
                        try {
                          // Prepare multipart form-data and persist specification rows as separate items (qty=0)
                          const list = Array.isArray(q.customer.responsibles) ? q.customer.responsibles : []
                          const attnList = list.map(r => (r.attn || "").trim()).filter(Boolean)
                          const attnDivList = list.map(r => (r.attnDiv || "").trim()).filter(Boolean)
                          const attnMobileList = list.map(r => (r.attnMobile || "").trim()).filter(Boolean)
                          const attnEmailList = list.map(r => (r.attnEmail || "").trim()).filter(Boolean)
                          const ccList = list.map(r => (r.cc || "").trim()).filter(Boolean)
                          const ccDivList = list.map(r => (r.ccDiv || "").trim()).filter(Boolean)
                          const ccMobileList = list.map(r => (r.ccMobile || "").trim()).filter(Boolean)
                          const ccEmailList = list.map(r => (r.ccEmail || "").trim()).filter(Boolean)

                          const fd = new FormData()
                          fd.append("qo_code", q.details.number || "")
                          fd.append("created_date", q.details.date || "")
                          fd.append("customer_name", q.customer.company || "Unknown")
                          fd.append("customer_tax_id", q.customer.taxId || "")
                          fd.append("customer_address", q.customer.address || "")
                          fd.append("customer_email", q.customer.email || "")
                          fd.append("customer_phone", q.customer.telephone || "")
                          fd.append("customer_fax", q.customer.fax || "")
                          fd.append("cus_respon_attn", attnList.join(","))
                          fd.append("cus_respon_div", attnDivList.join(","))
                          fd.append("cus_respon_mobile", attnMobileList.join(","))
                          fd.append("cus_respon_cc", ccList.join(","))
                          fd.append("cus_respon_cc_div", ccDivList.join(","))
                          fd.append("cus_respon_cc_mobile", ccMobileList.join(","))
                          fd.append("cus_respon_cc_email", ccEmailList.join(","))
                          if (q.details.eit) fd.append("eit", String(q.details.eit))
                          fd.append("eit_name", q.details.salesPerson || "")
                          fd.append("eit_address", q.details.eitAddress || "")
                          fd.append("eit_mobile", q.details.eitMobile || "")
                          fd.append("eit_phone", q.details.eitTelephone || "")
                          fd.append("eit_fax", q.details.eitFax || "")
                          fd.append("trade_terms", q.details.tradeTerms || "")
                          fd.append("validity", q.details.validity || "")
                          fd.append("delivery", q.details.delivery || "")
                          fd.append("payment_terms", q.details.paymentTerms || "")
                          fd.append("shipment_location", q.details.shipmentLocation || "")
                          const invDate = (q.details.invoiceDate && q.details.invoiceDate !== "SAME AS DELIVERY DATE") ? q.details.invoiceDate : ""
                          if (/^\\d{4}-\\d{2}-\\d{2}$/.test(invDate)) fd.append("invoice_date", invDate)
                          fd.append("remark", q.details.remark || "")

                          // Helper to turn data URL into Blob for upload
                          const dataUrlToBlob = (dataUrl) => {
                            try {
                              const [meta, content] = String(dataUrl || "").split(",")
                              const mimeMatch = meta.match(/data:(.*?);base64/)
                              const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream"
                              const bin = atob(content || "")
                              const bytes = new Uint8Array(bin.length)
                              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
                              return new Blob([bytes], { type: mime })
                            } catch {
                              return null
                            }
                          }

                          // Flatten items and their spec rows into sequential index entries
                          let idx = 0
                          const jsonItemsForFallback2 = []
                          q.items.forEach((item) => {
                            // Main item
                            fd.append(`items[${idx}][item]`, item.item || "")
                            fd.append(`items[${idx}][model]`, item.model || "")
                            fd.append(`items[${idx}][description]`, item.description || "")
                            // Persist combined specification text for the main item (reporting)
                            const specTextMain = (Array.isArray(item.specRows) ? item.specRows : [])
                              .map(sr => Array.isArray(sr.lines) ? sr.lines.join("\\n") : "")
                              .filter(Boolean)
                              .join("\\n")
                            fd.append(`items[${idx}][specification]`, specTextMain)
                            fd.append(`items[${idx}][qty]`, String(item.qty || 1))
                            fd.append(`items[${idx}][price]`, String(item.price || 0))
                            // Attach first specification image to the base item (if any)
                            const firstImageRow2 = (Array.isArray(item.specRows) ? item.specRows : []).find(sr => sr.image)
                            if (firstImageRow2 && firstImageRow2.image) {
                              const blob = dataUrlToBlob(firstImageRow2.image)
                              if (blob) {
                                const file = new File([blob], `spec_${idx}.png`, { type: blob.type || "image/png" })
                                fd.append(`items[${idx}][image]`, file)
                              }
                            }
                            jsonItemsForFallback2.push({
                              item: item.item || "",
                              model: item.model || "",
                              description: item.description || "",
                              specification: specTextMain,
                              qty: String(item.qty || 1),
                              price: String(item.price || 0)
                            })
                            idx++
                          })

                          // Choose URL/method
                          let url = `${API_BASE_URL}/api/quotations/`
                          let method = "POST"
                          if (q.sourceKey === "api" && q.sourceIndex) {
                            url = `${API_BASE_URL}/api/quotations/${q.sourceIndex}/`
                            method = "PUT"
                          }
                          const headers = {}
                          const token = localStorage.getItem("authToken")
                          if (token) headers["Authorization"] = `Token ${token}`
                          // Add JSON fallback 'items' list to ensure backend always has items even if nested parsing fails
                          fd.append("items", JSON.stringify(jsonItemsForFallback2))
                          const response = await fetch(url, { method, headers, body: fd })
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
                </div>
                <div className="flex items-center gap-6">
                  <button
                    className="px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] whitespace-nowrap text-center"
                    onClick={() => {
                      setOpenCreateConfirm(false)
                      handlePrintPdf()
                    }}
                  >
                    Download Form
                  </button>
                  <button
                    className="px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[220px] whitespace-nowrap text-center"
                    onClick={() => {
                      setOpenCreateConfirm(false)
                      handlePrintPdfWithCover()
                    }}
                  >
                    Download Form with cover photo
                  </button>
                </div>
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
