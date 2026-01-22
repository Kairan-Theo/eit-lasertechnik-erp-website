import React from "react"
import { createPortal } from "react-dom"
import { PurchaseOrderTemplate } from "./purchase-order-template.jsx"
import Navigation from "./navigation.jsx"
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Trash, 
  Download, 
  Printer,
  Upload,
  Search,
  Calendar as CalendarIcon
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
    eitName: "EIT LASERTECHNIK CO.,LTD",
    eitAddress: "",
    eitPhone: "",
    eitFax: "",
    salesPerson: "",
    remark: "",
    currency: "THB"
  })

  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])

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

  return { vendor, setVendor, details, setDetails, items, setItems, addItem, removeItem, updateItem, subtotal, taxTotal, total }
}

export default function PurchaseOrderPage() {
  const q = usePurchaseOrderState()
  const [poList, setPoList] = React.useState([])
  const [showForm, setShowForm] = React.useState(false)
  const [printingPo, setPrintingPo] = React.useState(null)
  const fileInputRef = React.useRef(null)
  const prefilledRef = React.useRef(false)
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)
  const [importError, setImportError] = React.useState("")

  // Load PO List
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(data)) setPoList(data)
    } catch {}
  }, [])

  const generatePoNumber = React.useCallback(() => {
    try {
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const dateKey = `${yyyy}${mm}${dd}`
      const k = `poSeq:${dateKey}`
      const seq = Number(localStorage.getItem(k) || "0") + 1
      localStorage.setItem(k, String(seq))
      return `PO-${dateKey}-${String(seq).padStart(3, "0")}`
    } catch {
      const r = Math.floor(Math.random() * 1000)
      return `PO-${Date.now()}-${String(r).padStart(3, "0")}`
    }
  }, [])
<<<<<<< HEAD

=======
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(data)) setPoList(data)
    } catch {}
  }, [])
  React.useEffect(() => {
    if (!showForm) return
    if (!poNumber) {
      setPoNumber(generatePoNumber())
    }
  }, [showForm, poNumber, generatePoNumber])
  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const updateItem = (i, field, value) => setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? Number(value) : value } : row)))
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const keyForCustomer = React.useCallback(() => {
    const e = (customer.email || "").trim().toLowerCase()
    if (e) return e
    const ce = (customer.companyEmail || "").trim().toLowerCase()
    if (ce) return ce
    const p = (customer.phone || "").trim()
    if (p) return p
    const n = (customer.name || "").trim().toLowerCase()
    if (n) return n
    return ""
  }, [customer])
  React.useEffect(() => {
    if (!showForm) return
    const k = keyForCustomer()
    if (!k) return
    if (!prefilledRef.current) {
      try {
        const raw = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
        const h = (raw && typeof raw === 'object') ? raw : {}
        if (h.customer) {
          setCustomer((prev) => ({
            name: prev.name || h.customer.name || "",
            company: prev.company || h.customer.company || "",
            email: prev.email || h.customer.email || "",
            companyEmail: prev.companyEmail || h.customer.companyEmail || "",
            phone: prev.phone || h.customer.phone || "",
            companyPhone: prev.companyPhone || h.customer.companyPhone || "",
            deliveryTo: prev.deliveryTo || h.customer.deliveryTo || "",
          }))
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
          customer: { ...customer },
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
  }, [showForm, customer.name, customer.company, customer.email, customer.phone, keyForCustomer])
>>>>>>> 83155bd6fab2e514f64f6b6b54acdef6d48884fe
  const persistPoList = React.useCallback((next) => {
    setPoList(next)
    try {
      localStorage.setItem("poList", JSON.stringify(next))
    } catch {}
  }, [])

  // --- Import Helpers ---
  const handleImportClick = () => {
    setImportError("")
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const downloadPoJson = (po) => {
    try {
      const data = {
        poNumber: po.poNumber,
        customer: po.customer,
        extraFields: po.extraFields,
        items: po.items,
        updatedAt: po.updatedAt
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `PO_${po.poNumber || "unknown"}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
  }

  const normalizeImportedItem = (it) => {
    const qty = Number(it?.qty || 0)
    const price = Number(it?.price || 0)
    const tax = Number(it?.tax || 0)
    return {
      product: String(it?.product || ""),
      description: String(it?.description || ""),
      note: String(it?.note || ""),
      qty: Number.isFinite(qty) ? qty : 0,
      price: Number.isFinite(price) ? price : 0,
      tax: Number.isFinite(tax) ? tax : 0,
      unit: String(it?.unit || "pcs")
    }
  }

  const normalizeImportedPo = (p) => {
    const num = String(p?.poNumber || "").trim()
    const now = new Date().toISOString()
    return {
      poNumber: num || generatePoNumber(),
      customer: {
        name: String(p?.customer?.name || ""),
        company: String(p?.customer?.company || ""),
        email: String(p?.customer?.email || ""),
        companyEmail: String(p?.customer?.companyEmail || ""),
        phone: String(p?.customer?.phone || ""),
        companyPhone: String(p?.customer?.companyPhone || ""),
      },
      extraFields: {
        refQuotation: String(p?.extraFields?.refQuotation || ""),
        orderDate: String(p?.extraFields?.orderDate || ""),
        deliveryDate: String(p?.extraFields?.deliveryDate || ""),
        paymentTerms: String(p?.extraFields?.paymentTerms || ""),
        deliveryTo: String(p?.extraFields?.deliveryTo || ""),
      },
      items: Array.isArray(p?.items) ? p.items.map(normalizeImportedItem) : [],
      updatedAt: p?.updatedAt || now,
    }
  }

  const csvNormalizeKey = (k) => String(k || "").trim().toLowerCase().replace(/[\s_]+/g, "")
  const parseCsv = (text) => {
    const rows = []
    let i = 0
    const len = text.length
    const arr = []
    let cell = ""
    let inQuote = false
    while (i < len) {
      const ch = text[i]
      if (inQuote) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            cell += '"'
            i += 2
            continue
          } else {
            inQuote = false
            i++
            continue
          }
        } else {
          cell += ch
          i++
          continue
        }
      } else {
        if (ch === '"') {
          inQuote = true
          i++
          continue
        }
        if (ch === ",") {
          arr.push(cell)
          cell = ""
          i++
          continue
        }
        if (ch === "\n" || ch === "\r") {
          if (cell.length || arr.length) {
            arr.push(cell)
            rows.push(arr.slice())
            arr.length = 0
            cell = ""
          }
          while (text[i + 1] === "\n" || text[i + 1] === "\r") i++
          i++
          continue
        }
        cell += ch
        i++
      }
    }
    if (cell.length || arr.length) {
      arr.push(cell)
      rows.push(arr.slice())
    }
    if (!rows.length) return []
    const header = rows[0].map(csvNormalizeKey)
    return rows.slice(1).map((r) => {
      const o = {}
      for (let j = 0; j < header.length; j++) {
        o[header[j]] = r[j] != null ? r[j] : ""
      }
      return o
    })
  }

  const parseCsvPurchaseOrders = (text) => {
    const rows = parseCsv(text)
    if (!rows.length) return []
    const group = new Map()
    const val = (o, keys) => {
      for (const k of keys) {
        const v = o[csvNormalizeKey(k)]
        if (v != null && String(v).trim() !== "") return String(v).trim()
      }
      return ""
    }
    rows.forEach((r) => {
      const num = val(r, ["poNumber", "po_number", "ponumber", "po no", "purchaseorderno"])
      const key = num || "PO"
      if (!group.has(key)) {
        group.set(key, {
          poNumber: num,
          customer: {
            name: val(r, ["contact", "contactperson", "contact_name"]),
            company: val(r, ["vendor", "vendorname", "company"]),
            email: val(r, ["email", "vendoremail"]),
            companyEmail: val(r, ["companyemail"]),
            phone: val(r, ["phone", "vendorphone"]),
            companyPhone: val(r, ["companyphone"]),
          },
          extraFields: {
            refQuotation: val(r, ["refQuotation", "quotation", "quotationno"]),
            orderDate: val(r, ["orderDate", "dateOfOrder", "orderdate"]),
            deliveryDate: val(r, ["deliveryDate"]),
            paymentTerms: val(r, ["paymentTerms", "payment"]),
            deliveryTo: val(r, ["deliveryTo", "deliveryaddress"]),
          },
          items: [],
          updatedAt: new Date().toISOString()
        })
      }
      const it = {
        product: val(r, ["itemProduct", "product", "item_code"]),
        description: val(r, ["itemDescription", "description"]),
        note: val(r, ["itemNote", "note"]),
        qty: Number(val(r, ["itemQty", "qty", "quantity"])) || 0,
        price: Number(val(r, ["itemPrice", "price", "unitprice"])) || 0,
        tax: Number(val(r, ["itemTax", "tax"])) || 0,
      }
      if (Object.values(it).some((x) => (typeof x === "number" ? x : String(x).trim()) !== "")) {
        group.get(key).items.push(it)
      }
<<<<<<< HEAD
    })
    const arr = Array.from(group.values()).map((p) => normalizeImportedPo(p))
    return arr
  }

  const extractTextFromPdf = async (file) => {
    const ab = await file.arrayBuffer()
    const pdfModuleName = "pdfjs-dist"
    const mod = await import(/* @vite-ignore */ pdfModuleName)
    const doc = await mod.getDocument({ data: ab, disableWorker: true }).promise
    let out = ""
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const text = content.items.map((i) => i.str).join(" ")
      out += "\n" + text
    }
    return out
  }

  const parsePdfPurchaseOrders = (text) => {
    const lines = String(text || "").split(/\r?\n+/).map((l) => l.trim()).filter(Boolean)
    const full = lines.join("\n")
    const get = (patterns) => {
      for (const re of patterns) {
        const m = full.match(re)
        if (m && m[1]) return m[1].trim()
      }
      return ""
    }
    const poNumber = get([/purchase\s*order\s*no\.?\s*[:\-]\s*(.+)/i, /po\s*number\s*[:\-]\s*(.+)/i, /po\s*no\.?\s*[:\-]\s*(.+)/i])
    const vendor = get([/vendor\s*[:\-]\s*(.+)/i, /company\s*[:\-]\s*(.+)/i])
    const contact = get([/contact\s*(?:person)?\s*[:\-]\s*(.+)/i])
    const email = get([/email\s*[:\-]\s*([^\s]+)\b/i])
    const phone = get([/phone\s*[:\-]\s*(.+)/i, /tel\s*[:\-]\s*(.+)/i])
    const deliveryTo = get([/(?:delivery\s*to|ship\s*to)\s*[:\-]\s*(.+)/i])
    const refQuotation = get([/(?:ref\.?\s*quotation|quotation\s*no\.?)\s*[:\-]\s*(.+)/i])
    const orderDate = get([/(?:order\s*date|date\s*of\s*order)\s*[:\-]\s*(.+)/i])
    const deliveryDate = get([/delivery\s*date\s*[:\-]\s*(.+)/i])
    const paymentTerms = get([/payment\s*terms?\s*[:\-]\s*(.+)/i])
    const items = []
    const numberRe = /(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/
    lines.forEach((line) => {
      const hasQty = /qty|quantity/i.test(line) || /\b\d+\b/.test(line)
      const hasPrice = /price|unit\s*price/i.test(line) || /\b\d+\.\d{1,2}\b/.test(line)
      if (hasQty && hasPrice) {
        const qtyM = line.match(/\bqty\b[:\-]?\s*(\d+)/i) || line.match(numberRe)
        const priceM = line.match(/\bunit\s*price\b[:\-]?\s*(\d+(?:\.\d+)?)/i) || line.match(/\b(\d+\.\d{1,2})\b(?!.*\b\d+\.\d{1,2}\b)/)
        const taxM = line.match(/\btax\b[:\-]?\s*(\d+(?:\.\d+)?)/i)
        const qty = qtyM ? Number(qtyM[1]) : 0
        const price = priceM ? Number(priceM[1]) : 0
        const tax = taxM ? Number(taxM[1]) : 0
        const parts = line.split(/\s{2,}|,|\t/)
        const product = parts[0] || ""
        const description = parts.slice(1).join(" ").replace(/qty.*$/i, "").replace(/unit\s*price.*$/i, "").trim()
        items.push(normalizeImportedItem({ product, description, qty, price, tax }))
      }
    })
    const payload = {
      poNumber,
      customer: { name: contact, company: vendor, email, phone },
      extraFields: { refQuotation, orderDate, deliveryDate, paymentTerms, deliveryTo },
      items,
      updatedAt: new Date().toISOString()
    }
    return [normalizeImportedPo(payload)]
  }

  const handleImportFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    try {
      const name = String(f.name || "").toLowerCase()
      let imported = []
      if (name.endsWith(".csv")) {
        const text = await f.text()
        imported = parseCsvPurchaseOrders(text)
      } else if (name.endsWith(".pdf")) {
        const text = await extractTextFromPdf(f)
        if (!text || text.trim().length < 20) {
          setImportError("PDF appears scanned or unrecognized; please use CSV or a text-based PDF")
          e.target.value = ""
          return
        }
        imported = parsePdfPurchaseOrders(text)
      } else {
        const text = await f.text()
        const data = JSON.parse(text)
        if (Array.isArray(data)) {
          imported = data.map(normalizeImportedPo)
        } else if (data && typeof data === "object") {
          imported = [normalizeImportedPo(data)]
        }
      }
      const normalized = imported
      if (!Array.isArray(normalized) || !normalized.length) {
        e.target.value = ""
        return
      }
      // Save all imported POs to list
      const next = [...poList]
      normalized.forEach((p) => {
        const idx = next.findIndex((x) => String(x.poNumber || "") === String(p.poNumber || ""))
        if (idx >= 0) {
          next[idx] = p
        } else {
          next.unshift(p)
        }
      })
      persistPoList(next)
      
      // Open the first one in the form
      const first = normalized[0]
      q.setDetails({
        poNumber: first.poNumber || "",
        orderDate: first.extraFields?.orderDate || new Date().toISOString().slice(0, 10),
        deliveryDate: first.extraFields?.deliveryDate || "",
        refQuotation: first.extraFields?.refQuotation || "",
        paymentTerms: first.extraFields?.paymentTerms || "",
        deliveryTo: first.extraFields?.deliveryTo || "",
        eitName: "EIT LASERTECHNIK CO.,LTD",
        eitAddress: "",
        eitPhone: "",
        eitFax: "",
        salesPerson: "",
        remark: "",
        currency: "THB"
      })
      q.setVendor({
        company: first.customer?.company || "",
        name: first.customer?.name || "",
        email: first.customer?.email || "",
        companyEmail: first.customer?.companyEmail || "",
        phone: first.customer?.phone || "",
        companyPhone: first.customer?.companyPhone || "",
        address: ""
      })
      q.setItems(Array.isArray(first.items) && first.items.length ? first.items.map(i => ({...i, unit: i.unit || "pcs"})) : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
      
      setShowForm(true)
    } catch {}
    e.target.value = ""
  }
=======
>>>>>>> 83155bd6fab2e514f64f6b6b54acdef6d48884fe

  const startNew = () => {
    q.setDetails({
      poNumber: generatePoNumber(),
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: "",
      refQuotation: "",
      paymentTerms: "",
      deliveryTo: "",
      eitName: "EIT LASERTECHNIK CO.,LTD",
      eitAddress: "",
      eitPhone: "",
      eitFax: "",
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
       eitName: "EIT LASERTECHNIK CO.,LTD", // Defaults
       eitAddress: "",
       eitPhone: "",
       eitFax: "",
       salesPerson: "",
       remark: "",
       currency: "THB",
       ...p.details // Overwrite if exists
    })
    q.setVendor(p.customer || { company: "", name: "", email: "", companyEmail: "", phone: "", companyPhone: "", address: "" })
    q.setItems(Array.isArray(p.items) && p.items.length ? p.items : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
    setShowForm(true)
  }

  const handleSave = () => {
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

  const handleDelete = (idx) => {
    if (!window.confirm("Are you sure you want to delete this Purchase Order?")) return
    const next = poList.filter((_, i) => i !== idx)
    setPoList(next)
    localStorage.setItem("poList", JSON.stringify(next))
  }

  const handlePrint = (po) => {
    setPrintingPo(po)
    setTimeout(() => {
      window.print()
      setPrintingPo(null)
    }, 100)
  }

  // Render Form
  if (showForm) {
    return (
      <div className="h-full">
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
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Purchase Order</h1>
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
                 <select value={q.details.eitName} onChange={(e) => q.setDetails({ ...q.details, eitName: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none">
                   <option value="EIT LASERTECHNIK CO.,LTD">EIT LASERTECHNIK CO.,LTD</option>
                   <option value="EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD">EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                 <textarea value={q.details.eitAddress} onChange={(e) => q.setDetails({ ...q.details, eitAddress: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>
    )
  }

  // Render List
  return (
    <div className="h-full">
      {printingPo && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <PurchaseOrderTemplate po={printingPo} />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <FileText className="w-8 h-8 text-gray-900" />
             <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
               <Upload className="w-4 h-4" />
               <span>Import</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".csv,.pdf,.json" />
            
            <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              <span>New Purchase Order</span>
            </button>
          </div>
        </div>

        {importError && (
          <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center justify-between">
            <span>{importError}</span>
            <button onClick={() => setImportError("")} className="text-red-400 hover:text-red-600">
              &times;
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {poList.map((po, i) => (
             <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-[#2D4485]">
                   <FileText className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-gray-900">{po.poNumber}</h3>
                   <div className="text-sm text-gray-500">
                     {po.customer?.company || po.customer?.name || "No Vendor"} &bull; {po.extraFields?.orderDate}
                   </div>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={() => downloadPoJson(po)} className="p-2 text-gray-400 hover:text-[#2D4485] transition-colors" title="Download JSON">
                   <Download className="w-4 h-4" />
                 </button>
                 <button onClick={() => handlePrint(po)} className="p-2 text-gray-400 hover:text-[#2D4485] transition-colors" title="Print">
                   <Printer className="w-4 h-4" />
                 </button>
                 <button onClick={() => editPo(i)} className="p-2 text-gray-400 hover:text-[#2D4485] transition-colors" title="Edit">
                   <FileText className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDelete(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                   <Trash className="w-4 h-4" />
                 </button>
               </div>
             </div>
          ))}
          
          {poList.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No purchase orders yet</p>
              <button onClick={startNew} className="text-[#2D4485] font-medium hover:underline mt-2">Create your first one</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
