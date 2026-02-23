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
// Comment: Bring in a consistent modal UI for errors based on reference design
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./components/ui/alert-dialog"

// Resolve image URL robustly across sources:
// - DataURL: return as-is for immediate preview (client-side)
// - Absolute URL: return unchanged
// - Relative DB path: prefix with /media and API_BASE_URL
const resolveImageUrl = (src) => {
  if (!src || typeof src !== "string") return null
  src = src.trim().replace(/\\/g, "/")
  if (src.startsWith("data:image")) return src
  if (/^https?:\/\//.test(src)) return src
  let path = src
  if (!path.startsWith("/") && /\/media\//.test(path)) {
    path = path.split("/media/").slice(-1)[0]
  }
  path = path.replace(/(^|\/)quotation_items\/quotation_items\//, "$1quotation_items/")
  if (path.startsWith("/media/")) {
    // ok
  } else if (path.startsWith("media/")) {
    path = `/${path}`
  } else {
    path = `/media/${path.replace(/^\/+/, "")}`
  }
  // Default: use API_BASE_URL + /media to ensure cross-origin loads in dev/prod
  return `${API_BASE_URL}${path}`
}

const resolveImageCandidates = (src) => {
  const out = []
  const primary = resolveImageUrl(src)
  if (primary) out.push(primary)
  const s = String(src || "").trim().replace(/\\/g, "/")
  const isAbs = /^https?:\/\//.test(s)
  const p = s.replace(/(^|\/)quotation_items\/quotation_items\//, "$1quotation_items/")
  const mediaTail = /\/media\//.test(p) ? p.split("/media/").slice(-1)[0] : p.replace(/^\/+/, "")
  if (!isAbs) {
    const alt = `${API_BASE_URL}/media/${mediaTail.replace(/^\/+/, "")}`
    if (!out.includes(alt)) out.push(alt)
    const rel = `/media/${mediaTail.replace(/^\/+|^media\/+/g, "")}`
    if (!out.includes(rel)) out.push(rel)
    const dblRel = `/media/quotation_items/quotation_items/${mediaTail.split("/").pop()}`
    const dblApi = `${API_BASE_URL}/media/quotation_items/quotation_items/${mediaTail.split("/").pop()}`
    if (!out.includes(dblApi)) out.push(dblApi)
    if (!out.includes(dblRel)) out.push(dblRel)
  } else {
    // Absolute input: add normalized single-folder and double-folder forms based on mediaTail only
    const alt = `${API_BASE_URL}/media/${mediaTail.replace(/^\/+/, "")}`
    if (!out.includes(alt)) out.push(alt)
    const rel = `/media/${mediaTail.replace(/^\/+|^media\/+/g, "")}`
    if (!out.includes(rel)) out.push(rel)
    const dblRel = `/media/quotation_items/quotation_items/${mediaTail.split("/").pop()}`
    const dblApi = `${API_BASE_URL}/media/quotation_items/quotation_items/${mediaTail.split("/").pop()}`
    if (!out.includes(dblApi)) out.push(dblApi)
    if (!out.includes(dblRel)) out.push(dblRel)
  }
  // Additional common dev ports fallback
  try {
    const proto = window.location.protocol === "https:" ? "https" : "http"
    const host = window.location.hostname || "127.0.0.1"
    const ports = [8000, 8001, 8002]
    ports.forEach(port => {
      const cand = `${proto}://${host}:${port}/media/${p.replace(/^\/+/, "")}`
      if (!out.includes(cand)) out.push(cand)
    })
    // localhost variants
    ports.forEach(port => {
      const cand = `${proto}://localhost:${port}/media/${p.replace(/^\/+/, "")}`
      if (!out.includes(cand)) out.push(cand)
    })
  } catch {}
  return out
}

import "./index.css"



const parseNumber = (val) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  return parseFloat(String(val).replace(/,/g, ''))
}

function useQuotationState() {
  // Comment: Determine edit mode synchronously from URL so initial number/fileName don’t auto-increment for existing quotations
  const initialParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialIsEditing = initialParams.has('key') && initialParams.has('index')
  const [customer, setCustomer] = React.useState({
    company: "",
    taxId: "",
    // Comment: Customer branch text for per-quotation snapshot and UI input
    branch: "",
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
    // Comment: On edit, start with blank — will be hydrated from API; on create, prefill with next sequence
    number: initialIsEditing ? "" : getNextQuotationNumber(),
    date: new Date().toISOString().slice(0, 10),
    // File name used for PDF download; default derives from quotation number
    fileName: (() => {
      // Comment: For new quotations, derive filename from next number; for edits, use a generic until API sets real file_name
      if (initialIsEditing) return "quotation.pdf"
      const base = getNextQuotationNumber()
      return `${String(base).replace(/\s+/g, "_")}.pdf`
    })(),
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

  // Comment: Ensure new quotation number increments by exactly 1 relative to the highest existing API/local number.
  // Comment: Skip when editing an existing quotation so the loaded number remains unchanged.
  React.useEffect(() => {
    if (initialIsEditing) return
    const currentYear = new Date().getFullYear()
    const parseSeq = (s) => {
      try {
        const m = String(s || "").match(new RegExp(`^QUO ${currentYear}-(\\d{4})$`, 'i'))
        return m ? parseInt(m[1], 10) : null
      } catch { return null }
    }
    const toCode = (n) => `QUO ${currentYear}-${String(n).padStart(4, "0")}`
    const updateFromApi = async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}` } : {}
        const rNext = await fetch(`${API_BASE_URL}/api/quotations/next-code/`, { headers })
        if (rNext.ok) {
          const data = await rNext.json()
          const code = String(data?.qo_code || "")
          if (code) {
            setDetails(prev => ({ ...prev, number: code }))
            return
          }
        }
        const seqCurrent = parseSeq(details.number) || 0
        let maxSeqOther = 0
        const res = await fetch(`${API_BASE_URL}/api/quotations/`, { headers })
        if (res.ok) {
          const apiQuos = await res.json()
          if (Array.isArray(apiQuos)) {
            for (const q of apiQuos) {
              const seq = parseSeq(q.qo_code || q.details?.number)
              if (Number.isFinite(seq) && seq !== seqCurrent && seq > maxSeqOther) maxSeqOther = seq
            }
          }
        }
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith("history:")) {
              const item = JSON.parse(localStorage.getItem(key))
              if (item && Array.isArray(item.quotations)) {
                for (const quo of item.quotations) {
                  const seq = parseSeq(quo.number)
                  if (Number.isFinite(seq) && seq !== seqCurrent && seq > maxSeqOther) maxSeqOther = seq
                }
              }
            }
          }
        } catch {}
        if (seqCurrent >= 1 && seqCurrent > maxSeqOther) {
        } else if (maxSeqOther >= 1) {
          setDetails(prev => ({ ...prev, number: toCode(maxSeqOther + 1) }))
        }
      } catch {}
    }
    updateFromApi()
  }, [initialIsEditing])

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
      if (!rows[specIndex]) rows[specIndex] = { lines: [], image: dataUrl || null, originalImage: rows[specIndex]?.originalImage || null, imageChanged: !!dataUrl, imageWidth: 64, imageHeight: 64, edit: true }
      else rows[specIndex] = { ...rows[specIndex], image: dataUrl || null, imageChanged: !!dataUrl, imageWidth: rows[specIndex].imageWidth || 64, imageHeight: rows[specIndex].imageHeight || 64 }
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
            // Comment: Prefer Quotation snapshot fields if present (they capture per-quotation edits made via "Save as New"),
            // and fall back to Customer table details when snapshot fields are missing.
            const cust = data.customer_details || {}
            const topFromCustomer = {
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
            const topFromSnapshot = {
              company: data.customer_name || "",
              taxId: data.customer_tax_id || "",
              // Comment: Map Quotation.customer_branch snapshot to UI state
              branch: data.customer_branch || "",
              address: data.customer_address || "",
              telephone: data.customer_phone || "",
              fax: data.customer_fax || "",
              email: data.customer_email || ""
            }
            const top = { ...topFromCustomer, ...Object.fromEntries(Object.entries(topFromSnapshot).filter(([_, v]) => String(v || "").trim() !== "")) }
            // Build responsibles list: prefer snapshot CSVs from quotation row; otherwise derive from Customer
            const splitCSV = (s) => String(s || "").split(',').map(t => t.trim()).filter(Boolean)
            const attnCSV_snap = splitCSV(data.cus_respon_attn)
            const attnDivCSV_snap = splitCSV(data.cus_respon_div)
            const attnMobileCSV_snap = splitCSV(data.cus_respon_mobile)
            const attnEmailCSV_snap = splitCSV(data.customer_email) // snapshot email applied to Attn when not separate
            const ccCSV_snap = splitCSV(data.cus_respon_cc)
            const ccDivCSV_snap = splitCSV(data.cus_respon_cc_div)
            const ccMobileCSV_snap = splitCSV(data.cus_respon_cc_mobile)
            const ccEmailCSV_snap = splitCSV(data.cus_respon_cc_email)
            const snapshotCount = Math.max(attnCSV_snap.length, attnDivCSV_snap.length, attnMobileCSV_snap.length, attnEmailCSV_snap.length, ccCSV_snap.length, ccDivCSV_snap.length, ccMobileCSV_snap.length, ccEmailCSV_snap.length)
            const useSnapshot = snapshotCount > 0
            const attnCSV = useSnapshot ? attnCSV_snap : splitCSV(cust.attn)
            const attnDivCSV = useSnapshot ? attnDivCSV_snap : splitCSV(cust.attn_division)
            const attnMobileCSV = useSnapshot ? attnMobileCSV_snap : splitCSV(cust.attn_mobile)
            const attnEmailCSV = useSnapshot ? attnEmailCSV_snap : splitCSV(cust.email)
            const ccCSV = useSnapshot ? ccCSV_snap : splitCSV(cust.cc)
            const ccDivCSV = useSnapshot ? ccDivCSV_snap : splitCSV(cust.cc_division)
            const ccMobileCSV = useSnapshot ? ccMobileCSV_snap : splitCSV(cust.cc_mobile)
            const ccEmailCSV = useSnapshot ? ccEmailCSV_snap : splitCSV(cust.cc_email)
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
              // Comment: hydrate custom file name from API Quotation.file_name
              fileName: (data.file_name && String(data.file_name).trim()) ? data.file_name : `${String(data.qo_code || 'quotation').replace(/\s+/g, '_')}.pdf`,
              validUntil: "",
              currency: "THB",
              deliveryTerms: "Ex-Works",
              // Comment: Prefer EIT snapshot fields from quotation row; fallback to EIT relation details
              salesPerson: data.eit_name || data.eit_details?.organization_name || "",
              eit: data.eit || data.eit_details?.id || null,
              eitMobile: data.eit_mobile || data.eit_details?.eit_mobile || "",
              eitTelephone: data.eit_phone || data.eit_details?.eit_telephone || "",
              eitFax: data.eit_fax || data.eit_details?.eit_fax || "",
              eitAddress: data.eit_address || data.eit_details?.address || "",
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
              // Comment: Build UI rows by grouping API items using quo_item codes to keep numbering aligned:
              // - Parents: codes like "1","2",...
              // - Children: codes like "1.1","1.2", attached under their parent "1"
              const parentsByBase = {}
              const orderBases = []
              const childrenByBase = {}
              // First pass: collect parents and their base specification/image
              for (let idx = 0; idx < apiItems.length; idx++) {
                const i = apiItems[idx]
                const code = String(i.quo_item || i.item || "").trim()
                const rawQty = (i.quantity !== undefined ? i.quantity : i.qty)
                const qtyNum = (() => {
                  const n = parseFloat(String(rawQty ?? "").replace(/,/g, ""))
                  return isNaN(n) ? 0 : n
                })()
                const total = parseFloat(String(i.quo_total || i.total || 0).replace(/,/g, ""))
                const baseSpecLines = String(i.specification || "")
                  .replace(/\r/g, "")
                  .split("\n")
                  .map(s => s.trim())
                  .filter(Boolean)
                const rawImg = i.image_url || ""
                const dotted = code.match(/^(\d+)\.(\d+)$/)
                const baseOnly = code.match(/^\d+$/)
                if (baseOnly) {
                  const base = baseOnly[0]
                  if (!parentsByBase[base]) {
                    parentsByBase[base] = {
                      item: base,
                      model: i.quo_model || i.model || "",
                      description: i.quo_description || i.description || "",
                      qty: qtyNum > 0 ? qtyNum : 1,
                      price: qtyNum > 0 ? (total / Math.max(qtyNum, 1)) : parseFloat(String(i.price || 0).replace(/,/g, "")) || 0,
                      specRows: [],
                      row_id: i.id,
                      image: rawImg || null
                    }
                    orderBases.push(base)
                  } else {
                    // Merge fields if duplicate parent rows are returned
                    const p = parentsByBase[base]
                    if (!p.model && (i.quo_model || i.model)) p.model = i.quo_model || i.model
                    if (!p.description && (i.quo_description || i.description)) p.description = i.quo_description || i.description
                    if (!p.image && rawImg) p.image = rawImg
                  }
                  if (baseSpecLines.length || rawImg) {
                    parentsByBase[base].specRows.push({ lines: baseSpecLines, image: rawImg, originalImage: rawImg, imageChanged: false, edit: false, imageWidth: 64, imageHeight: 64, row_id: i.id })
                  }
                } else if (dotted) {
                  const base = dotted[1]
                  if (!childrenByBase[base]) childrenByBase[base] = []
                  childrenByBase[base].push({ lines: baseSpecLines, image: rawImg, originalImage: rawImg, imageChanged: false, edit: false, imageWidth: 64, imageHeight: 64, row_id: i.id })
                } else {
                  // Fallback: treat as base row when quo_item missing; rely on qty/model/description
                  const hasBaseFields = Boolean((i.quo_model || i.model || i.quo_description || i.description))
                  if (hasBaseFields || qtyNum > 0) {
                    const base = String(orderBases.length + 1)
                    parentsByBase[base] = {
                      item: base,
                      model: i.quo_model || i.model || "",
                      description: i.quo_description || i.description || "",
                      qty: qtyNum > 0 ? qtyNum : 1,
                      price: qtyNum > 0 ? (total / Math.max(qtyNum, 1)) : parseFloat(String(i.price || 0).replace(/,/g, "")) || 0,
                      specRows: [],
                      row_id: i.id,
                      image: rawImg || null
                    }
                    orderBases.push(base)
                    if (baseSpecLines.length || rawImg) {
                      parentsByBase[base].specRows.push({ lines: baseSpecLines, image: rawImg, originalImage: rawImg, imageChanged: false, edit: false, imageWidth: 64, imageHeight: 64, row_id: i.id })
                    }
                  } else {
                    // Orphan spec rows without a recognizable code
                    const base = orderBases.length ? orderBases[orderBases.length - 1] : "1"
                    if (!childrenByBase[base]) childrenByBase[base] = []
                    childrenByBase[base].push({ lines: baseSpecLines, image: rawImg, originalImage: rawImg, imageChanged: false, edit: false, imageWidth: 64, imageHeight: 64, row_id: i.id })
                  }
                }
              }
              // Second pass: attach children under their correct parents by base code
              const out = []
              orderBases.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).forEach(base => {
                const parent = parentsByBase[base]
                const children = childrenByBase[base] || []
                // Comment: Ensure parent's own spec (1.1) renders before DB children (which become 1.2, 1.3, ...)
                parent.specRows.push(...children)
                out.push(parent)
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
  // Comment: Centralized error dialog state used for duplicate file_name and other save errors
  const [errorOpen, setErrorOpen] = React.useState(false)
  const [errorTitle, setErrorTitle] = React.useState("Error saving quotation")
  const [errorMessage, setErrorMessage] = React.useState("")
  // Comment: Helper to parse backend error payloads and display them in the dialog
  const showErrorDialog = (payload, fallback) => {
    try {
      if (typeof payload === "string" && payload.trim().startsWith("{")) {
        const obj = JSON.parse(payload)
        if (obj && obj.file_name && Array.isArray(obj.file_name) && obj.file_name.length > 0) {
          setErrorTitle("Duplicate File Name")
          // Comment: Augment message with guidance for resolving duplicates
          setErrorMessage(String(obj.file_name[0] || "quotation with this file name already exists."))
          setErrorOpen(true)
          return
        }
        // Comment: Display first error message if available
        const firstKey = Object.keys(obj)[0]
        if (firstKey) {
          const val = obj[firstKey]
          const msg = Array.isArray(val) ? val.join("\n") : JSON.stringify(val)
          setErrorTitle("Validation Error")
          setErrorMessage(`${firstKey}: ${msg}`)
          setErrorOpen(true)
          return
        }
      }
      // Comment: If payload is already an object
      if (payload && typeof payload === "object") {
        if (payload.file_name && Array.isArray(payload.file_name) && payload.file_name.length > 0) {
          setErrorTitle("Duplicate File Name")
          // Comment: Augment message with guidance for resolving duplicates
          setErrorMessage(String(payload.file_name[0] || "quotation with this file name already exists."))
          setErrorOpen(true)
          return
        }
      }
    } catch {}
    setErrorTitle("Error saving quotation")
    setErrorMessage(String(fallback || "Unknown error"))
    setErrorOpen(true)
  }
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
      // Generate base quotation PDF (without cover). We will open Print Preview first, then download.
      // Comment: Normalize image paths for backend (always send media-relative, e.g., quotation_items/uuid.png)
      const toBackendMediaPath = (src) => {
        const s = String(src || "")
        const api = String(API_BASE_URL || "").replace(/\/+$/, "")
        if (s.startsWith(api) && s.includes("/media/")) {
          return s.split("/media/")[1]
        }
        if (s.includes("/media/")) return s.split("/media/")[1]
        if (s.startsWith("media/")) return s.slice("media/".length)
        return s
      }
      // Comment: Build payload with normalized image paths
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
            image: (typeof r.image === 'string') ? toBackendMediaPath(r.image) : null,
            image_width: r.imageWidth || 64,
            image_height: r.imageHeight || 64
          })) : [],
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
      // Comment: Read blob even when status is not OK; backend may still respond with a valid PDF fallback
      const blob = await response.blob()
      const ct = response.headers.get('Content-Type') || ''
      if (!response.ok && !ct.includes('pdf')) {
        // Comment: Non-PDF error response; trigger fallback path below
        throw new Error('Failed to generate PDF')
      }
      // Comment: Validate blob data to avoid opening broken viewer tabs
      const buf = await blob.arrayBuffer()
      const bytes = new Uint8Array(buf)
      const header = String.fromCharCode(...bytes.slice(0, 4))
      if (!header.includes('%PDF') || blob.size < 100) {
        // Comment: Re-generate PDF without any images to bypass broken image references
        const payloadNoImages = {
          details: q.details,
          customer: q.customer,
          items: q.items.map(i => ({
            ...i,
            qty: parseNumber(i.qty),
            price: parseNumber(i.price),
            spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({
              lines: r.lines || [],
              image_data: null,
              image: null,
              image_width: r.imageWidth || 64,
              image_height: r.imageHeight || 64
            })) : [],
            spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
            spec_image_data: null
          })),
          totals: { total: q.total }
        }
        const resp2 = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadNoImages)
        })
        const blob2 = await resp2.blob()
        const buf2 = await blob2.arrayBuffer()
        const bytes2 = new Uint8Array(buf2)
        const header2 = String.fromCharCode(...bytes2.slice(0, 4))
        if (!resp2.ok || !header2.includes('%PDF') || blob2.size < 100) {
          throw new Error('Base PDF invalid after image removal')
        }
        // Comment: Use the second PDF blob if valid
        const url2 = window.URL.createObjectURL(blob2)
        const win2 = window.open(url2, '_blank')
        if (!win2) {
          const iframe2 = document.createElement('iframe')
          iframe2.style.display = 'none'
          iframe2.src = url2
          document.body.appendChild(iframe2)
          setTimeout(() => {
            iframe2.contentWindow.focus()
            iframe2.contentWindow.print()
          }, 500)
          setTimeout(() => {
            document.body.removeChild(iframe2)
            window.URL.revokeObjectURL(url2)
          }, 60000)
        } else {
          setTimeout(() => window.URL.revokeObjectURL(url2), 60000)
        }
        return
      }
      // Comment: Prefer opening a new tab for reliability; fall back to hidden iframe print if blocked
      const url = window.URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (!win) {
        // Comment: Popup blocked; create a hidden iframe and call print()
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
      } else {
        // Comment: New tab opened successfully; schedule object URL cleanup
        setTimeout(() => window.URL.revokeObjectURL(url), 60000)
      }
    } catch (error) {
      // Fallback to legacy endpoint without cover if merge fails
      console.error("Error generating PDF with cover:", error)
      try {
        const toBackendMediaPath = (src) => {
          const s = String(src || "")
          const api = String(API_BASE_URL || "").replace(/\/+$/, "")
          if (s.startsWith(api) && s.includes("/media/")) {
            return s.split("/media/")[1]
          }
          if (s.includes("/media/")) return s.split("/media/")[1]
          if (s.startsWith("media/")) return s.slice("media/".length)
          return s
        }
        const payload = {
          details: q.details,
          customer: q.customer,
          items: q.items.map(i => ({
            ...i,
            qty: parseNumber(i.qty),
            price: parseNumber(i.price),
              spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({ lines: r.lines || [], image_data: (typeof r.image === 'string' && r.image.startsWith('data:image')) ? r.image : null, image: (typeof r.image === 'string') ? toBackendMediaPath(r.image) : null, image_width: r.imageWidth || 64, image_height: r.imageHeight || 64 })) : [],
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
      // Comment: Read blob even on non-OK; backend may return a minimal PDF fallback
      const blob = await response.blob()
      if (!response.ok) {
        const ct = response.headers.get('Content-Type') || ''
        if (!ct.includes('pdf')) throw new Error('Failed to generate PDF')
      }
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
      const toBackendMediaPath = (src) => {
        const s = String(src || "")
        const api = String(API_BASE_URL || "").replace(/\/+$/, "")
        // Extract path after /media/ if present
        if (s.startsWith(api) && s.includes("/media/")) {
          return s.split("/media/")[1]
        }
        if (s.includes("/media/")) return s.split("/media/")[1]
        if (s.startsWith("media/")) return s.slice("media/".length)
        return s
      }
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
            image: (typeof r.image === 'string') ? toBackendMediaPath(r.image) : null,
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
        // Comment: Include details so backend can set output filename from details.fileName
        // Provide cover_pdf_url for robust cover resolution even if local path search fails
        body: JSON.stringify({ base_pdf: `data:application/pdf;base64,${base64Pdf}`, details: q.details, cover_pdf_url: `${API_BASE_URL}/media/cover.pdf` })
      })
      // Comment: Even if status is not OK, try to read the blob; backend may return a minimal PDF fallback.
      const blob = await mergeRes.blob()
      if (!mergeRes.ok) {
        // Comment: If content-type is not PDF, fallback to plain quotation download.
        const ct = mergeRes.headers.get('Content-Type') || ''
        if (!ct.includes('pdf')) throw new Error('Failed to merge cover with quotation')
      }
      // Comment: Validate blob content quickly: check size and leading '%PDF' magic
      const arr = await blob.arrayBuffer()
      const bytes2 = new Uint8Array(arr)
      const header = String.fromCharCode(...bytes2.slice(0, 4))
      if (!header.includes('%PDF') || blob.size < 100) {
        // Comment: Invalid or tiny PDF; fall back to base download (no cover)
        throw new Error('Merged PDF invalid')
      }
      // Comment: Prefer opening a new tab for reliability; fall back to hidden iframe if blocked
      const url = window.URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (!win) {
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
      } else {
        setTimeout(() => window.URL.revokeObjectURL(url), 60000)
      }
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
      const toBackendMediaPath = (src) => {
        const s = String(src || "")
        const api = String(API_BASE_URL || "").replace(/\/+$/, "")
        if (s.startsWith(api) && s.includes("/media/")) {
          return s.split("/media/")[1]
        }
        if (s.includes("/media/")) return s.split("/media/")[1]
        if (s.startsWith("media/")) return s.slice("media/".length)
        return s
      }
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
            image: (typeof r.image === 'string') ? toBackendMediaPath(r.image) : null,
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
        // Comment: Include details for filename selection on backend and cover URL fallback
        body: JSON.stringify({ base_pdf: `data:application/pdf;base64,${base64Pdf}`, details: q.details, cover_pdf_url: `${API_BASE_URL}/media/cover.pdf` })
      })
      // Comment: Attempt to preview even if status not OK (backend may respond with fallback PDF).
      const blob = await mergeRes.blob()
      if (!mergeRes.ok) {
        const ct = mergeRes.headers.get('Content-Type') || ''
        if (!ct.includes('pdf')) throw new Error('Failed to merge cover with quotation')
      }
      // Comment: Validate blob header and size to avoid "Failed to load PDF" viewer error
      const arr = await blob.arrayBuffer()
      const bytes2 = new Uint8Array(arr)
      const header = String.fromCharCode(...bytes2.slice(0, 4))
      if (!header.includes('%PDF') || blob.size < 100) {
        throw new Error('Merged PDF invalid')
      }
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
      // Comment: Normalize image paths for backend (always media-relative)
      const toBackendMediaPath = (src) => {
        const s = String(src || "")
        const api = String(API_BASE_URL || "").replace(/\/+$/, "")
        if (s.startsWith(api) && s.includes("/media/")) {
          return s.split("/media/")[1]
        }
        if (s.includes("/media/")) return s.split("/media/")[1]
        if (s.startsWith("media/")) return s.slice("media/".length)
        return s
      }
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
            image: (typeof r.image === 'string') ? toBackendMediaPath(r.image) : null,
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
      // Comment: Accept non-OK if backend returns a PDF fallback
      const blob = await response.blob()
      const ct = response.headers.get('Content-Type') || ''
      if (!response.ok && !ct.includes('pdf')) {
        throw new Error('Failed to generate PDF')
      }
      // Comment: Validate blob; if invalid, retry without any images
      const buf = await blob.arrayBuffer()
      const bytes = new Uint8Array(buf)
      const header = String.fromCharCode(...bytes.slice(0, 4))
      let finalBlob = blob
      if (!header.includes('%PDF') || blob.size < 100) {
        const payloadNoImages = {
          details: q.details,
          customer: q.customer,
          items: q.items.map(i => ({
            ...i,
            qty: parseNumber(i.qty),
            price: parseNumber(i.price),
            spec_rows: Array.isArray(i.specRows) ? i.specRows.map(r => ({
              lines: r.lines || [],
              image_data: null,
              image: null,
              image_width: r.imageWidth || 64,
              image_height: r.imageHeight || 64
            })) : [],
            spec_lines: Array.isArray(i.specLines) ? i.specLines : [],
            spec_image_data: null
          })),
          totals: { total: q.total }
        }
        const resp2 = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadNoImages)
        })
        const blob2 = await resp2.blob()
        const buf2 = await blob2.arrayBuffer()
        const bytes2 = new Uint8Array(buf2)
        const header2 = String.fromCharCode(...bytes2.slice(0, 4))
        if (!resp2.ok || !header2.includes('%PDF') || blob2.size < 100) {
          throw new Error('Failed to generate valid PDF for preview')
        }
        finalBlob = blob2
      }
      const url = window.URL.createObjectURL(finalBlob)
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
      const toBackendMediaPath = (src) => {
        const s = String(src || "")
        const api = String(API_BASE_URL || "").replace(/\/+$/, "")
        if (s.startsWith(api) && s.includes("/media/")) {
          return s.split("/media/")[1]
        }
        if (s.includes("/media/")) return s.split("/media/")[1]
        if (s.startsWith("media/")) return s.slice("media/".length)
        return s
      }
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
            image: (typeof r.image === 'string') ? toBackendMediaPath(r.image) : null,
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
      // Convert to base64 so backend can merge with cover
      const bytes = new Uint8Array(baseArrayBuffer)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64Pdf = window.btoa(binary)
      // Step 2: Merge cover + base on backend
      const mergeRes = await fetch(`${API_BASE_URL}/api/generate-quotation-pdf-with-cover/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_pdf: `data:application/pdf;base64,${base64Pdf}`, details: q.details, cover_pdf_url: `${API_BASE_URL}/media/cover.pdf` })
      })
      // Comment: Accept non-OK if backend returns a PDF fallback; validate blob
      const blob = await mergeRes.blob()
      const ct = mergeRes.headers.get('Content-Type') || ''
      if (!mergeRes.ok && !ct.includes('pdf')) throw new Error('Failed to merge cover with quotation')
      const arr = await blob.arrayBuffer()
      const bytes2 = new Uint8Array(arr)
      const header = String.fromCharCode(...bytes2.slice(0, 4))
      if (!header.includes('%PDF') || blob.size < 100) {
        // Fallback: show base print preview (without cover)
        await handlePrintPreviewPdf()
        return
      }
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
           {/* Comment: Add "File name" input beside Date; switch to 3 columns on md screens */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
               <input 
                 value={q.details.number} 
                 onChange={(e) => {
                   const num = e.target.value
                   // Comment: keep file name aligned with number when user edits (only if current fileName matches previous pattern)
                   const current = String(q.details.fileName || "")
                   const isDerived = current.toLowerCase().startsWith(String(q.details.number || "").replace(/\s+/g, "_").toLowerCase())
                   const nextFile = `${String(num || "quotation").replace(/\s+/g, "_")}.pdf`
                   q.setDetails({ 
                     ...q.details, 
                     number: num, 
                     fileName: isDerived ? nextFile : q.details.fileName 
                   })
                 }} 
                 className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                 placeholder="Quotation number" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
               <DateField value={q.details.date} onChange={(val) => q.setDetails({ ...q.details, date: val })} />
             </div>
             <div>
               {/* Comment: New input to customize the downloaded PDF file name */}
               <label className="block text-sm font-medium text-gray-700 mb-1">File name</label>
               <input 
                 value={q.details.fileName || ""} 
                 onChange={(e) => q.setDetails({ ...q.details, fileName: e.target.value })} 
                 className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                 placeholder="quotation.pdf" 
               />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          // Comment: Hydrate Branch from Customer DB table
                          branch: c.branch || "",
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
                                // Comment: Fallback Branch from latest Deal snapshot when Customer.branch is empty
                                branch: nextTop.branch || latest.branch || "",
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input value={q.customer.branch} onChange={(e) => q.setCustomer({ ...q.customer, branch: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Branch" />
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
             {/* Comment: Change to Add CC — additional entries are CC-only; Attn exists once */}
             <button onClick={q.addResponsible} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-medium">Add CC</span>
             </button>
          </div>
          {/* Comment: Render first block with Attn + CC; subsequent blocks CC-only (CC1, CC2, ...) */}
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
                {/* Comment: Show Attn row only for the first block */}
                {idx === 0 && (
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
                )}
                {/* CC row (for all blocks). Subsequent blocks labeled CC1, CC2, ... */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {idx === 0 ? "CC" : `CC ${idx}`}
                    </label>
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
                   {/* Parent item row: make text bold to visually declare hierarchy */}
                   <tr key={`item-${i}`} className="hover:bg-gray-50 transition border-b border-gray-100 font-semibold">
                     <td className="p-3 text-center text-sm text-gray-900">
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
                      // Child UI row: visually nested under its parent item
                      // Comment: Use a badge in ITEM column and a shaded, indented container to indicate parent-child relation
                      <tr key={`item-${i}-spec-${sIndex}`} className="transition border-b border-gray-100 bg-white">
                        <td className="p-3 text-center text-xs">
                          {/* Child badge: smaller number to show 1.1, 1.2, ... */}
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-[#E9EDFF] text-[#2D4485] font-semibold">
                            {`${i + 1}.${sIndex + 1}`}
                          </span>
                        </td>
                        <td className="p-3" colSpan={5}>
                          {/* Child container: indented box with left connector to the parent */}
                          {/* Comment: border-left acts as a connector; background differentiates child from parent row */}
                          <div className="flex items-start gap-4 pl-4 border-l-4 border-[#CBD3FF] rounded-lg bg-[#F7F9FF]">
                            {/* Left: specification content/editor */}
                            <div className="flex-1">
                              {!sr.edit ? (
                                // Read-only child spec box; allow double-click to enter edit mode
                                <div
                                  className="text-sm text-gray-800 rounded-md border border-gray-300 p-3 bg-white"
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
                                // Auto-resizing textarea inside child container
                                <textarea
                                  value={sr.lines.join("\n")}
                                  ref={(el) => { specTextareasRef.current[`${i}-${sIndex}`] = el }}
                                  onChange={(e) => {
                                    e.target.style.height = "auto"
                                    e.target.style.height = `${e.target.scrollHeight}px`
                                    q.updateSpecLines(i, e.target.value, sIndex)
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-[#2D4485] outline-none min-h-[160px] resize-none overflow-hidden"
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
                                      src={resolveImageUrl(sr.image) || sr.image}
                                      alt="Specification"
                                      title={resolveImageUrl(sr.image) || sr.image}
                                      style={{ width: `${sr.imageWidth || 64}px`, height: `${sr.imageHeight || 64}px` }}
                                      className="object-cover rounded border border-gray-300 cursor-pointer"
                                      data-cand-index="0"
                                      onError={(e) => {
                                        const cands = resolveImageCandidates(sr.image)
                                        const cur = e.currentTarget.src
                                        let next = null
                                        const pos = cands.findIndex(u => u === cur)
                                        if (pos >= 0 && pos + 1 < cands.length) {
                                          next = cands[pos + 1]
                                        } else if (pos < 0 && cands.length > 0) {
                                          next = cands[0]
                                        }
                                        if (next && next !== cur) {
                                          e.currentTarget.src = next
                                        } else {
                                          e.currentTarget.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9dQXxWcAAAAASUVORK5YII="
                                        }
                                      }}
                                      onClick={() => {
                                        const cands = resolveImageCandidates(sr.image)
                                        setPreviewSrc(cands[0] || resolveImageUrl(sr.image) || sr.image)
                                      }}
                                    />
                                    <div className="mt-1">
                                      <a
                                        href={resolveImageUrl(sr.image) || sr.image}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-gray-600 underline"
                                        title="Open image in new tab"
                                      >
                                        Open image
                                      </a>
                                    </div>
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
                          // Comment: Recover previous behavior — always create new quotation from current UI state via multipart FormData
                          const headers = {}
                          const token = localStorage.getItem("authToken")
                          if (token) headers["Authorization"] = `Token ${token}`
                          // Comment: Do NOT modify qo_code for "Save as new"; backend generates the next number.
                          // Sending a client-side COPY suffix is confusing and unnecessary.

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
                          // Comment: Fetch remote /media or HTTP image URLs and wrap as a File for upload (Save Changes)
                          const fetchUrlToFile2 = async (src, nameHint) => {
                            try {
                              const url = resolveImageUrl(src) || src
                              if (!/^https?:\/\//.test(url)) return null
                              const resp = await fetch(url, { mode: "cors" })
                              if (!resp.ok) return null
                              const blob = await resp.blob()
                              const ct = blob.type || "image/png"
                              const ext = ct.includes("jpeg") ? "jpg" : (ct.split("/")[1] || "png")
                              const fname = (nameHint || "spec_image") + "." + ext
                              return new File([blob], fname, { type: ct })
                            } catch {
                              return null
                            }
                          }
                          // Comment: Fetch blob: or HTTP image URLs and wrap as a File for upload
                          const fetchUrlToFile = async (src, nameHint) => {
                            try {
                              const raw = String(src || "")
                              const url = resolveImageUrl(raw) || raw
                              // Comment: Do NOT re-upload server media images. If the URL points to our API_BASE_URL /media/,
                              // return null so the caller sends image_path, preserving the original stored filename.
                              const api = String(API_BASE_URL || "").replace(/\/+$/, "")
                              const isSameOriginMedia = (url.startsWith(api) && url.includes("/media/")) || url.includes("/media/")
                              if (isSameOriginMedia) return null
                              // Comment: Only fetch external http(s) or blob: URLs (e.g., user-selected files)
                              if (!/^https?:\/\//.test(url) && !/^blob:/.test(url)) return null
                              const resp = await fetch(url, { mode: "cors" })
                              if (!resp.ok) return null
                              const blob = await resp.blob()
                              const ct = blob.type || "image/png"
                              const ext = ct.includes("jpeg") ? "jpg" : (ct.split("/")[1] || "png")
                              const fname = (nameHint || "spec_image") + "." + ext
                              return new File([blob], fname, { type: ct })
                            } catch {
                              return null
                            }
                          }

                          // Prepare multipart form data for nested items + image files
                          const fd = new FormData()
                          // Top-level fields
                          // Comment: Omit qo_code; server will assign the next valid quotation number
                          // Comment: Do NOT send source_quotation_id on Save As New.
                          // We want to persist the current UI edits (specification changes) as new rows,
                          // not copy the original DB rows from the parent.
                          // Comment: Preserve the user's file name without adding COPY/timestamp.
                          // If it collides, backend returns a duplicate error and the UI shows the modal guidance.
                          {
                            const baseFile = String(q.details.fileName || "quotation.pdf")
                            fd.append("file_name", baseFile)
                          }
                          fd.append("created_date", q.details.date || "")
                          fd.append("customer_name", q.customer.company || "Unknown")
                          fd.append("customer_tax_id", q.customer.taxId || "")
                          fd.append("customer_address", q.customer.address || "")
                          fd.append("customer_email", q.customer.email || "")
                          fd.append("customer_phone", q.customer.telephone || "")
                          fd.append("customer_fax", q.customer.fax || "")
                          // Comment: Persist branch text to Quotation.customer_branch
                          fd.append("customer_branch", q.customer.branch || "")
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
                          // Comment: Provide image_path as a reliable backend copy hint when no file can be uploaded
                          const toBackendMediaPath = (src) => {
                            const s = String(src || "")
                            const api = String(API_BASE_URL || "").replace(/\/+$/, "")
                            if (s.startsWith(api) && s.includes("/media/")) {
                              return s.split("/media/")[1]
                            }
                            if (s.includes("/media/")) return s.split("/media/")[1]
                            if (s.startsWith("media/")) return s.slice("media/".length)
                            return s
                          }
                          let idxNew = 0
                          const jsonItemsForFallback = []
                          for (const item of q.items) {
                            // Main item
                            fd.append(`items[${idxNew}][item]`, item.item || "")
                            fd.append(`items[${idxNew}][model]`, item.model || "")
                            fd.append(`items[${idxNew}][description]`, item.description || "")
                            // Comment: Store the entire specification block exactly as written (preserve formatting)
                            const specRowsArr = Array.isArray(item.specRows) ? item.specRows : []
                            const firstBlock = (specRowsArr[0] && Array.isArray(specRowsArr[0].lines)) ? specRowsArr[0].lines.join("\n") : ""
                            fd.append(`items[${idxNew}][specification]`, firstBlock)
                            fd.append(`items[${idxNew}][qty]`, String(item.qty || 1))
                            fd.append(`items[${idxNew}][price]`, String(item.price || 0))
                            // Attach first specification image to the base item (if any)
                            // Comment: Attach image for the item: prefer the item's own image, fallback to the first spec image
                            const firstImageRow = specRowsArr[0] && specRowsArr[0].image ? specRowsArr[0] : null
                            if (firstImageRow && firstImageRow.image) {
                              const blob = dataUrlToBlob(firstImageRow.image)
                              if (blob) {
                                const file = new File([blob], `spec_${idxNew}.png`, { type: blob.type || "image/png" })
                                fd.append(`items[${idxNew}][image]`, file)
                              } else if (typeof firstImageRow.image === "string") {
                                // Comment: If UI holds a blob: URL, fetch and upload as file; otherwise send path hint and original URL string
                                const s = String(firstImageRow.image)
                                const f = await fetchUrlToFile(s, `spec_${idxNew}`)
                                if (f) {
                                  fd.append(`items[${idxNew}][image]`, f)
                                } else {
                                  // Comment: Avoid re-uploading server /media or http(s) images; send path hint and original URL string
                                  fd.append(`items[${idxNew}][image_path]`, toBackendMediaPath(s))
                                  // Comment: Do NOT append image as a plain string; backend only accepts files or valid media paths
                                }
                              }
                            }
                            // Comment: Fallback — if no spec image, but the parent item has image, persist that
                            if ((!firstImageRow || !firstImageRow.image) && item.image) {
                              const blobParent = dataUrlToBlob(item.image)
                              if (blobParent) {
                                const fileP = new File([blobParent], `item_${idxNew}.png`, { type: blobParent.type || "image/png" })
                                fd.append(`items[${idxNew}][image]`, fileP)
                              } else if (typeof item.image === "string") {
                                // Comment: Avoid re-uploading server media path; send image_path so backend keeps original filename
                                fd.append(`items[${idxNew}][image_path]`, toBackendMediaPath(item.image))
                              }
                            }
                            jsonItemsForFallback.push({
                              item: item.item || "",
                              model: item.model || "",
                              description: item.description || "",
                              specification: firstBlock,
                              qty: String(item.qty || 1),
                              price: String(item.price || 0),
                              image_path: (firstImageRow && typeof firstImageRow.image === "string")
                                ? toBackendMediaPath(firstImageRow.image)
                                : (typeof item.image === "string" ? toBackendMediaPath(item.image) : "")
                            })
                            idxNew++
                            // Append additional spec rows as separate items (qty=0)
                            for (let sIdx = 1; sIdx < specRowsArr.length; sIdx++) {
                              const sr = specRowsArr[sIdx] || {}
                              const t = Array.isArray(sr.lines) ? sr.lines.join("\n") : ""
                              fd.append(`items[${idxNew}][item]`, "")
                              fd.append(`items[${idxNew}][model]`, "")
                              fd.append(`items[${idxNew}][description]`, "")
                              fd.append(`items[${idxNew}][specification]`, t)
                              fd.append(`items[${idxNew}][qty]`, "0")
                              fd.append(`items[${idxNew}][price]`, "0")
                              if (sr.image) {
                                const blobSR = dataUrlToBlob(sr.image)
                                if (blobSR) {
                                  const fSR = new File([blobSR], `spec_${idxNew}.png`, { type: blobSR.type || "image/png" })
                                  fd.append(`items[${idxNew}][image]`, fSR)
                                }
                              }
                              jsonItemsForFallback.push({
                                item: "",
                                model: "",
                                description: "",
                                specification: t,
                                qty: "0",
                                price: "0",
                                image_path: (typeof sr.image === "string") ? toBackendMediaPath(sr.image) : ""
                              })
                              idxNew++
                            }
                          }
                          // Comment: Append JSON fallback 'items' alongside nested FormData keys.
                          // The serializer merges nested uploads (files/image_path) into this list,
                          // ensuring specifications and images from the original quotation are preserved robustly.
                          try {
                            fd.append("items", JSON.stringify(jsonItemsForFallback))
                          } catch {}

                          // Send multipart request (do not set Content-Type manually)
                          const response = await fetch(`${API_BASE_URL}/api/quotations/`, {
                            method: "POST",
                            headers,
                            body: fd
                          })
                          if (!response.ok) {
                            // Comment: Prefer JSON for structured Django error messages (e.g., duplicate file_name)
                            const ct = response.headers.get("Content-Type") || ""
                            if (ct.includes("application/json")) {
                              const errJson = await response.json()
                              showErrorDialog(errJson, "Failed to save new quotation")
                            } else {
                              const errText = await response.text()
                              showErrorDialog(errText, "Failed to save new quotation")
                            }
                            return
                          }
                          // Comment: Success — proceed to admin listing
                          setOpenCreateConfirm(false)
                          window.location.href = "/admin.html"
                        } catch (error) {
                          console.error(error)
                          showErrorDialog(error?.message || String(error), "Error saving as new")
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
                          // Comment: Provide source_quotation_id so backend can copy QuotationItem rows from parent
                          if (q.sourceKey === "api" && q.sourceIndex) {
                            fd.append("source_quotation_id", String(q.sourceIndex))
                          }
                          // Comment: persist file_name to Quotation.file_name column
                          fd.append("file_name", q.details.fileName || "quotation.pdf")
                          fd.append("created_date", q.details.date || "")
                          fd.append("customer_name", q.customer.company || "Unknown")
                          fd.append("customer_tax_id", q.customer.taxId || "")
                          fd.append("customer_address", q.customer.address || "")
                          fd.append("customer_email", q.customer.email || "")
                          fd.append("customer_phone", q.customer.telephone || "")
                          fd.append("customer_fax", q.customer.fax || "")
                          // Comment: Persist branch text to Quotation.customer_branch
                          fd.append("customer_branch", q.customer.branch || "")
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
                          const toBackendMediaPath2 = (src) => {
                            const s = String(src || "")
                            const api = String(API_BASE_URL || "").replace(/\/+$/, "")
                            if (s.startsWith(api) && s.includes("/media/")) {
                              return s.split("/media/")[1]
                            }
                            if (s.includes("/media/")) return s.split("/media/")[1]
                            if (s.startsWith("media/")) return s.slice("media/".length)
                            return s
                          }
                          for (const item of q.items) {
                            // Main item
                            // Comment: Include stable DB row id so backend updates in-place without recreating rows
                            if (item && (item.row_id != null || item.id != null)) {
                              const rid = (item.row_id != null) ? item.row_id : item.id
                              fd.append(`items[${idx}][row_id]`, String(rid))
                            }
                            fd.append(`items[${idx}][item]`, item.item || "")
                            fd.append(`items[${idx}][model]`, item.model || "")
                            fd.append(`items[${idx}][description]`, item.description || "")
                            // Persist first spec row on main item; others as separate rows
                            const specRowsMain = Array.isArray(item.specRows) ? item.specRows : []
                            const blockMainLines = []
                            for (const sr of specRowsMain) {
                              const t = Array.isArray(sr?.lines) ? sr.lines.join("\n") : ""
                              if (t) blockMainLines.push(t)
                            }
                            const firstBlockText = (specRowsMain[0] && Array.isArray(specRowsMain[0].lines)) ? specRowsMain[0].lines.join("\n") : ""
                            fd.append(`items[${idx}][specification]`, firstBlockText)
                            fd.append(`items[${idx}][qty]`, String(item.qty || 1))
                            fd.append(`items[${idx}][price]`, String(item.price || 0))
                            // Attach first specification image to the base item (if any)
                            const firstImageRow2 = specRowsMain[0] || null
                            const origStr = firstImageRow2 && typeof firstImageRow2.originalImage === "string" ? firstImageRow2.originalImage : ""
                            const curStr = firstImageRow2 && typeof firstImageRow2.image === "string" ? firstImageRow2.image : ""
                            const normalizeMedia = (s) => {
                              const api = String(API_BASE_URL || "").replace(/\/+$/, "")
                              const v = String(s || "")
                              if (v.startsWith(api) && v.includes("/media/")) return v.split("/media/")[1]
                              if (v.includes("/media/")) return v.split("/media/")[1]
                              if (v.startsWith("media/")) return v.slice("media/".length)
                              return v
                            }
                            const changed = !!(firstImageRow2 && firstImageRow2.imageChanged) || (normalizeMedia(curStr) && normalizeMedia(curStr) !== normalizeMedia(origStr))
                            if (firstImageRow2 && firstImageRow2.image && changed) {
                              const blob = dataUrlToBlob(firstImageRow2.image)
                              if (blob) {
                                const file = new File([blob], `spec_${idx}.png`, { type: blob.type || "image/png" })
                                fd.append(`items[${idx}][image]`, file)
                              } else if (typeof firstImageRow2.image === "string") {
                                // Comment: Avoid re-uploading server images; send image_path and original URL string
                                fd.append(`items[${idx}][image_path]`, toBackendMediaPath2(firstImageRow2.image))
                                // Comment: Mark image_changed to instruct backend to actually replace the current file
                                fd.append(`items[${idx}][image_changed]`, "1")
                                // Comment: Do NOT append plain string to image; backend uses image_path for server-side copy
                              }
                            }
                            // Comment: Fallback — if no spec image, but the parent item has image, try uploading only when it's a data URL
                            if ((!firstImageRow2 || !firstImageRow2.image) && item.image) {
                              const blobParent2 = dataUrlToBlob(item.image)
                              if (blobParent2) {
                                const fileP2 = new File([blobParent2], `item_${idx}.png`, { type: blobParent2.type || "image/png" })
                                fd.append(`items[${idx}][image]`, fileP2)
                              }
                            }
                            // Comment: JSON fallback: include image_path ONLY when the image actually changed to avoid re-copying on re-save
                            jsonItemsForFallback2.push({
                              item: item.item || "",
                              model: item.model || "",
                              description: item.description || "",
                              specification: firstBlockText,
                              qty: String(item.qty || 1),
                              price: String(item.price || 0),
                              image_path: (firstImageRow2 && typeof firstImageRow2.image === "string" && changed)
                                ? toBackendMediaPath2(firstImageRow2.image)
                                : "",
                              // Comment: Preserve base row id for accurate update mapping
                              row_id: (item && item.row_id != null) ? String(item.row_id) : undefined
                            })
                            idx++
                            // Append additional spec rows as separate items (qty=0)
                            for (let sIdx = 1; sIdx < specRowsMain.length; sIdx++) {
                              const sr = specRowsMain[sIdx] || {}
                              const text = Array.isArray(sr.lines) ? sr.lines.join("\n") : ""
                              // Preserve existing spec row id if known
                              if (sr && (sr.row_id != null)) {
                                fd.append(`items[${idx}][row_id]`, String(sr.row_id))
                              }
                              fd.append(`items[${idx}][item]`, "")
                              fd.append(`items[${idx}][model]`, "")
                              fd.append(`items[${idx}][description]`, "")
                              fd.append(`items[${idx}][specification]`, text)
                              fd.append(`items[${idx}][qty]`, "0")
                              fd.append(`items[${idx}][price]`, "0")
                              if (sr.image) {
                                const blobSR2 = dataUrlToBlob(sr.image)
                                if (blobSR2 && sr.imageChanged) {
                                  const fSR2 = new File([blobSR2], `spec_${idx}.png`, { type: blobSR2.type || "image/png" })
                                  fd.append(`items[${idx}][image]`, fSR2)
                                } else if (typeof sr.image === "string") {
                                  // Comment: Only send image_path if the spec image changed relative to original
                                  const norm = (s) => {
                                    const api = String(API_BASE_URL || "").replace(/\/+$/, "")
                                    const v = String(s || "")
                                    if (v.startsWith(api) && v.includes("/media/")) return v.split("/media/")[1]
                                    if (v.includes("/media/")) return v.split("/media/")[1]
                                    if (v.startsWith("media/")) return v.slice("media/".length)
                                    return v
                                  }
                                  const changedSr = !!sr.imageChanged || (norm(sr.image) && norm(sr.image) !== norm(sr.originalImage || ""))
                                  if (changedSr) {
                                    fd.append(`items[${idx}][image_path]`, toBackendMediaPath2(sr.image))
                                    // Comment: Mark image_changed so backend knows to replace the file
                                    fd.append(`items[${idx}][image_changed]`, "1")
                                  }
                                }
                              }
                              // Comment: JSON fallback for spec row: include image_path ONLY when changed
                              jsonItemsForFallback2.push({
                                item: "",
                                model: "",
                                description: "",
                                specification: text,
                                qty: "0",
                                price: "0",
                                image_path: (typeof sr.image === "string" && (sr.imageChanged || ((() => {
                                  const norm = (s) => {
                                    const api = String(API_BASE_URL || "").replace(/\/+$/, "")
                                    const v = String(s || "")
                                    if (v.startsWith(api) && v.includes("/media/")) return v.split("/media/")[1]
                                    if (v.includes("/media/")) return v.split("/media/")[1]
                                    if (v.startsWith("media/")) return v.slice("media/".length)
                                    return v
                                  }
                                  return norm(sr.image) && norm(sr.image) !== norm(sr.originalImage || "")
                                })()))) ? toBackendMediaPath2(sr.image) : ""
                                ,
                                // Comment: Preserve spec row id when updating existing rows; new rows omit row_id
                                row_id: (sr && sr.row_id != null) ? String(sr.row_id) : undefined
                              })
                              idx++
                            }
                          }

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
                          // Comment: Append JSON fallback 'items' on update as well.
                          // Backend merges nested uploads into this list to guarantee item/spec/image persistence.
                          try {
                            fd.append("items", JSON.stringify(jsonItemsForFallback2))
                          } catch {}
                          const response = await fetch(url, { method, headers, body: fd })
                          if (!response.ok) {
                            // Comment: On failure, parse JSON to detect duplicate file_name and show modal
                            const ct = response.headers.get("Content-Type") || ""
                            if (ct.includes("application/json")) {
                              const errJson = await response.json()
                              showErrorDialog(errJson, "Failed to save to database")
                            } else {
                              const errText = await response.text()
                              console.error("Backend save error:", errText)
                              showErrorDialog(errText, "Failed to save to database")
                            }
                            return
                          }
                          // Comment: Success — close dialog and return to admin listing
                          setOpenCreateConfirm(false)
                          window.location.href = "/admin.html"
                        } catch (error) {
                          console.error(error)
                          showErrorDialog(error?.message || String(error), "Error saving quotation")
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
                  handlePrintPreviewPdf()
                    }}
                  >
                    Download Form
                  </button>
                  <button
                    className="px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[220px] whitespace-nowrap text-center"
                    onClick={() => {
                      setOpenCreateConfirm(false)
                  handlePrintPreviewPdfWithCover()
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
      {/* Comment: Error dialog modeled after reference confirm modal; shows duplicate file_name and other errors */}
      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        {/* Comment: Make dialog bigger with inline maxWidth and extra padding */}
        <AlertDialogContent style={{ maxWidth: "720px" }} className="p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>{errorTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {/* Comment: Primary backend error message (e.g., duplicate file_name) */}
              <div className="text-base">{errorMessage}</div>
              {/* Comment: Friendly guidance to resolve duplicate file name */}
              <div className="mt-4 text-sm text-muted-foreground">
                Tip: Try creating another file name (e.g., add a suffix like “_v2” or use the generated quotation number).
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setErrorOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setErrorOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
