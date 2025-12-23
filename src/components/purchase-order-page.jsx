import React from "react"
import { createPortal } from "react-dom"
import { PurchaseOrderTemplate } from "./purchase-order-template.jsx"
import { API_BASE_URL } from "../config"
// PDF parsing is loaded on demand to avoid initial bundle errors

export default function PurchaseOrderPage() {
  const [poNumber, setPoNumber] = React.useState("")
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
  const [extraFields, setExtraFields] = React.useState({ refQuotation: "", orderDate: "", deliveryDate: "", paymentTerms: "", deliveryTo: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const [showForm, setShowForm] = React.useState(false)
  const [poList, setPoList] = React.useState([])
  const [printingPo, setPrintingPo] = React.useState(null)
  const [errors, setErrors] = React.useState({})
  const fileInputRef = React.useRef(null)
  const [importError, setImportError] = React.useState("")

  const handlePrint = (po) => {
    setPrintingPo(po)
    // Allow time for the portal to render
    setTimeout(() => {
        window.print()
        // Optional: clear after print dialog closes (though in some browsers this runs immediately)
        // We'll keep it open or clear it? 
        // Better to clear it on user action or just leave it hidden (since CSS handles display)
        // But we want to stop rendering it to save memory/DOM.
        // The print dialog blocks the main thread in many browsers, so this runs after close.
        setPrintingPo(null)
    }, 100)
  }

  const prefilledRef = React.useRef(false)
  const saveTimer = React.useRef(null)
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const normalizePhone = (s) => {
    const input = (s || "").trim()
    const digits = input.replace(/\D+/g, "")
    return input.startsWith("+") ? `+${digits}` : digits
  }
  const digitCount = (s) => (s || "").replace(/\D/g, "").length
  const validateCustomer = React.useCallback((c) => {
    return {
      email: c.email && !emailRe.test(c.email) ? "Invalid email" : "",
      companyEmail: c.companyEmail && !emailRe.test(c.companyEmail) ? "Invalid email" : "",
      phone: c.phone && digitCount(c.phone) < 7 ? "Invalid phone" : "",
      companyPhone: c.companyPhone && digitCount(c.companyPhone) < 7 ? "Invalid phone" : "",
    }
  }, [])
  const isValid = React.useMemo(() => Object.values(errors).every((e) => !e), [errors])
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
        const h = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
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
        const h = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
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
  const persistPoList = React.useCallback((next) => {
    setPoList(next)
    try {
      localStorage.setItem("poList", JSON.stringify(next))
    } catch {}
  }, [])
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
      const hasProduct = /product|item|code/i.test(line)
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
      const first = normalized[0]
      setPoNumber((prev) => prev || first.poNumber || "")
      setCustomer((prev) => ({
        name: prev.name || first.customer?.name || "",
        company: prev.company || first.customer?.company || "",
        email: prev.email || first.customer?.email || "",
        companyEmail: prev.companyEmail || first.customer?.companyEmail || "",
        phone: prev.phone || first.customer?.phone || "",
        companyPhone: prev.companyPhone || first.customer?.companyPhone || "",
      }))
      setExtraFields((prev) => ({
        refQuotation: prev.refQuotation || first.extraFields?.refQuotation || "",
        orderDate: prev.orderDate || first.extraFields?.orderDate || new Date().toISOString().slice(0,10),
        deliveryDate: prev.deliveryDate || first.extraFields?.deliveryDate || "",
        paymentTerms: prev.paymentTerms || first.extraFields?.paymentTerms || "",
        deliveryTo: prev.deliveryTo || first.extraFields?.deliveryTo || ""
      }))
      setItems((prev) => {
        const importedItems = Array.isArray(first.items) && first.items.length ? first.items : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }]
        if (!Array.isArray(prev) || prev.length === 0) return importedItems
        const isBlank = (row) => {
          const p = String(row.product || "").trim() === ""
          const d = String(row.description || "").trim() === ""
          const n = String(row.note || "").trim() === ""
          const q = !Number(row.qty) || Number(row.qty) <= 1
          const pr = !Number(row.price) || Number(row.price) <= 0
          const t = !Number(row.tax) || Number(row.tax) <= 0
          return p && d && n && q && pr && t
        }
        if (prev.length === 1 && isBlank(prev[0])) return importedItems
        const max = Math.max(prev.length, importedItems.length)
        const out = []
        for (let i = 0; i < max; i++) {
          const a = prev[i] || {}
          const b = importedItems[i] || {}
          const aq = Number(a.qty)
          const ap = Number(a.price)
          const at = Number(a.tax)
          const bq = Number(b.qty)
          const bp = Number(b.price)
          const bt = Number(b.tax)
          out[i] = {
            product: a.product || b.product || "",
            description: a.description || b.description || "",
            note: a.note || b.note || "",
            qty: Number.isFinite(aq) && aq > 0 ? aq : (Number.isFinite(bq) ? bq : 0),
            price: Number.isFinite(ap) && ap > 0 ? ap : (Number.isFinite(bp) ? bp : 0),
            tax: Number.isFinite(at) && at > 0 ? at : (Number.isFinite(bt) ? bt : 0),
          }
        }
        return out
      })
      setShowForm(true)
    } catch {}
    e.target.value = ""
  }
  const startNew = () => {
    setPoNumber("")
    setCustomer({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
    setExtraFields({ refQuotation: "", orderDate: new Date().toISOString().slice(0,10), deliveryDate: "", paymentTerms: "", deliveryTo: "" })
    setItems([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
    prefilledRef.current = false
    setShowForm(true)
  }
  const editPo = (idx) => {
    const p = poList[idx]
    if (!p) return
    setPoNumber(p.poNumber || "")
    setCustomer(p.customer || { name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
    setExtraFields(p.extraFields || { refQuotation: "", orderDate: "", deliveryDate: "", paymentTerms: "", deliveryTo: "" })
    setItems(Array.isArray(p.items) && p.items.length ? p.items : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
    setShowForm(true)
  }
  const deletePo = (idx) => {
    const next = poList.filter((_, i) => i !== idx)
    persistPoList(next)
  }
  const saveToServer = async (payload) => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return
      const subtotal = (payload.items || []).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0)
      const taxTotal = subtotal * 0.07
      const total = subtotal + taxTotal
      const body = {
        number: payload.poNumber,
        customer: payload.customer,
        extra_fields: payload.extraFields,
        items: payload.items,
        totals: { subtotal, taxTotal, total }
      }
      await fetch(`${API_BASE_URL}/api/purchase_orders/`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
    } catch {}
  }
  const generate = async () => {
    const errs = validateCustomer(customer)
    setErrors(errs)
    if (Object.values(errs).some((e) => !!e)) return

    // Create the payload for saving and printing
    const payload = { poNumber, customer, extraFields, items, updatedAt: new Date().toISOString() }
    
    // Save to list (similar to saveDraft)
    const idx = poList.findIndex((p) => p.poNumber === poNumber)
    let nextList = []
    if (idx >= 0) {
      nextList = poList.slice()
      nextList[idx] = payload
    } else {
      nextList = [payload, ...poList]
    }
    persistPoList(nextList)
    await saveToServer(payload)
    
    // Trigger print/export
    handlePrint(payload)
    
    setShowForm(false)
  }
  const saveDraft = async () => {
    const errs = validateCustomer(customer)
    setErrors(errs)
    if (Object.values(errs).some((e) => !!e)) return
    const payload = { poNumber, customer, extraFields, items, updatedAt: new Date().toISOString() }
    const idx = poList.findIndex((p) => p.poNumber === poNumber)
    if (idx >= 0) {
      const next = poList.slice()
      next[idx] = payload
      persistPoList(next)
    } else {
      persistPoList([payload, ...poList])
    }
    await saveToServer(payload)
    setShowForm(false)
  }
  const confirmAndInvoice = () => {
    const payload = {
      customer,
      items,
      details: { currency: "THB" },
    }
    localStorage.setItem("confirmedQuotation", JSON.stringify(payload))
    window.location.href = "/invoice.html"
  }
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Purchase Order</h2>
      {!showForm && (
        <>
          <div className="mb-4">
            <div className="flex gap-2">
              <button onClick={startNew} className="btn-primary">Add Purchase Order</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">PO Number</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Items</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2">Save File</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {poList.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{p.poNumber}</td>
                    <td className="p-2">{p.customer?.name || p.customer?.company || p.customer?.email || p.customer?.phone || "-"}</td>
                    <td className="p-2">{Array.isArray(p.items) ? p.items.length : 0}</td>
                    <td className="p-2">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "-"}</td>
                    <td className="p-2">
                      <button onClick={() => downloadPoJson(p)} className="btn-outline">Save File</button>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                          <button onClick={() => editPo(i)} className="btn-outline">Edit</button>
                          <button onClick={() => handlePrint(p)} className="btn-outline">Export PDF</button>
                          <button onClick={() => deletePo(i)} className="btn-outline text-red-600">Delete</button>
                        </div>
                    </td>
                  </tr>
                ))}
                {poList.length === 0 && (
                  <tr>
                    <td className="p-2 text-gray-600" colSpan={5}>No purchase orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {showForm && (
        <>
          <div className="mb-4">
            <div className="flex gap-2">
              <button onClick={handleImportClick} className="btn-outline">Import</button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,application/json,application/pdf"
                onChange={handleImportFile}
                className="hidden"
              />
              {importError && <div className="text-xs text-red-600">{importError}</div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">Vendor Details</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vendor Name</label>
                <input
                  value={customer.company}
                  onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                  placeholder="Vendor Company Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contact Person</label>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Contact Person Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input
                        value={customer.email}
                        onChange={(e) => {
                            const next = { ...customer, email: e.target.value }
                            setCustomer(next)
                            setErrors(validateCustomer(next))
                        }}
                        placeholder="Vendor Email"
                        className={`w-full rounded-md border px-3 py-2 text-sm ${errors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input
                        value={customer.phone}
                        onChange={(e) => {
                            const next = { ...customer, phone: e.target.value }
                            setCustomer(next)
                            setErrors(validateCustomer(next))
                        }}
                        placeholder="Vendor Phone"
                        className={`w-full rounded-md border px-3 py-2 text-sm ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.phone && <div className="text-xs text-red-600 mt-1">{errors.phone}</div>}
                 </div>
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Delivery To</label>
                   <textarea
                      value={extraFields.deliveryTo}
                      onChange={(e) => setExtraFields({...extraFields, deliveryTo: e.target.value})}
                      placeholder="Delivery Address"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-20"
                   />
              </div>
            </div>

            <div className="space-y-3">
               <h3 className="font-semibold text-gray-700 border-b pb-1">Order Details</h3>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ref. Quotation No.</label>
                    <input
                      value={extraFields.refQuotation}
                      onChange={(e) => setExtraFields({...extraFields, refQuotation: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Order No.</label>
                    <input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date of Order</label>
                    <input
                      type="date"
                      value={extraFields.orderDate}
                      onChange={(e) => setExtraFields({...extraFields, orderDate: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={extraFields.deliveryDate}
                      onChange={(e) => setExtraFields({...extraFields, deliveryDate: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Terms</label>
                  <input
                    value={extraFields.paymentTerms}
                    onChange={(e) => setExtraFields({...extraFields, paymentTerms: e.target.value})}
                    placeholder="e.g. 30 Days"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto mb-3 border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-700 border-b">
                  <th className="p-3 w-16 text-center">Item</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 w-24 text-right">Q'ty</th>
                  <th className="p-3 w-32 text-right">Unit Price</th>
                  <th className="p-3 w-32 text-right">Total Amount</th>
                  <th className="p-3 w-32">Note</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it, i) => {
                   const amount = (Number(it.qty)||0) * (Number(it.price)||0)
                   return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-2 text-center text-gray-500">{i + 1}</td>
                    <td className="p-2">
                      <input
                        value={it.product}
                        onChange={(e) => updateItem(i, "product", e.target.value)}
                        placeholder="Product Code/Name"
                        className="w-full border-none focus:ring-0 bg-transparent p-0 text-sm"
                      />
                    </td>
                    <td className="p-2">
                        <input
                           value={it.description}
                           onChange={(e) => updateItem(i, "description", e.target.value)}
                           placeholder="Description"
                           className="w-full border-none focus:ring-0 bg-transparent p-0 text-sm"
                        />
                    </td>
                    <td className="p-2">
                        <input
                           type="number" min="0"
                           value={it.qty}
                           onChange={(e) => updateItem(i, "qty", e.target.value)}
                           className="w-full text-right border rounded px-1 py-1"
                        />
                    </td>
                    <td className="p-2">
                        <input
                           type="number" min="0" step="0.01"
                           value={it.price}
                           onChange={(e) => updateItem(i, "price", e.target.value)}
                           className="w-full text-right border rounded px-1 py-1"
                        />
                    </td>
                    <td className="p-2 text-right font-medium text-gray-700">
                        {amount.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <input
                        value={it.note || ""}
                        onChange={(e) => updateItem(i, "note", e.target.value)}
                        placeholder="Note"
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-2 text-center">
                        <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700" title="Remove">×</button>
                    </td>
                  </tr>
                )})}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                  <tr>
                      <td colSpan={8} className="p-2 text-center">
                          <button onClick={addItem} className="text-blue-600 hover:underline text-sm">+ Add Item</button>
                      </td>
                  </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end mb-6">
             <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Sub Total</span>
                    <span className="font-medium">
                        {items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Vat 7%</span>
                    <span className="font-medium">
                        {(items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 0.07).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base">
                    <span className="font-bold text-[#2D4485]">Grand Total Amount</span>
                    <span className="font-bold text-[#2D4485]">
                        {(items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 1.07).toFixed(2)}
                    </span>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={saveDraft} disabled={!isValid} className="btn-outline disabled:opacity-50">Save</button>
            <button onClick={generate} disabled={!isValid} className="btn-primary disabled:opacity-50">Generate PO</button>
            <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </>
      )}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
         {/* Hidden containers removed as we use window.print() now */}
      </div>

      {printingPo && createPortal(
        <div className="print-portal">
            <style>
            {`
                @media print {
                    body > *:not(.print-portal) { display: none !important; }
                    .print-portal { 
                        display: block !important; 
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        width: 100%; 
                        background: white; 
                        z-index: 9999;
                    }
                    @page { margin: 0; size: auto; }
                }
                /* Hide on screen */
                .print-portal { display: none; }
                @media print { .print-portal { display: block; } }
            `}
            </style>
            <PurchaseOrderTemplate q={{
                customer: printingPo.customer || {},
                items: printingPo.items || [],
                extraFields: printingPo.extraFields || {},
                details: { number: printingPo.poNumber, currency: "THB" },
                subtotal: (printingPo.items||[]).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0),
                taxTotal: ((printingPo.items||[]).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 0.07),
                total: ((printingPo.items||[]).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 1.07)
            }} />
        </div>,
        document.body
      )}
    </div>
  )
}
