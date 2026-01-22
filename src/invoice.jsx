import React from "react"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft, Receipt } from "lucide-react"
import Navigation from "./components/navigation.jsx"
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

function useInvoiceState() {
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

  const [details, setDetails] = React.useState({
    number: "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    poNo: "",
    paymentType: "",
    currency: "THB",
    notes: "",
    paymentTermsDays: 7,
    sourceQuotationNumber: "",
    salesPerson: "",
    eitAddress: "",
    eitTelephone: "",
    eitFax: "",
    onBehalfOf: ""
  })

  const [items, setItems] = React.useState([{ product: "", description: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])

  // Initialization: load confirmedQuotation if present
  React.useEffect(() => {
    try {
      const fromQuotation = localStorage.getItem("confirmedQuotation")
      if (fromQuotation) {
        const raw = JSON.parse(fromQuotation)
        const q = (raw && typeof raw === 'object') ? raw : {}
        setCustomer((prev) => ({ ...prev, ...(q.customer || {}) }))
        setItems(Array.isArray(q.items) && q.items.length ? q.items : [{ product: "", description: "", qty: 1, price: 0, tax: 0 }])
        const q = JSON.parse(fromQuotation)
        // Map quotation customer to new structure if possible
        setCustomer((prev) => ({
          ...prev,
          company: q.customer?.company || q.customer?.name || "",
          address: q.customer?.billingAddress1 || q.customer?.address || "",
          email: q.customer?.email || "",
          telephone: q.customer?.phone || "",
        }))
        
        setItems(Array.isArray(q.items) && q.items.length ? q.items.map(i => ({ ...i, unit: i.unit || "pcs" })) : [{ product: "", description: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
        
        setDetails((prev) => {
          const date = q.details?.date || prev.date
          const paymentTermsDays = Number(q.details?.paymentTermsDays ?? prev.paymentTermsDays)
          const base = new Date(date)
          const due = new Date(base)
          if (!Number.isNaN(paymentTermsDays)) due.setDate(due.getDate() + paymentTermsDays)

          const number =
            prev.number ||
            q.details?.number ||
            (() => {
              const d = new Date()
              return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`
            })()

          return {
            ...prev,
            ...q.details,
            currency: q.details?.currency || prev.currency,
            date,
            paymentTermsDays,
            number,
            dueDate: due.toISOString().slice(0, 10),
            sourceQuotationNumber: q.details?.sourceQuotationNumber || prev.sourceQuotationNumber || "",
          }
        })
        localStorage.removeItem("confirmedQuotation")
        return
      }
    } catch (err) {
      // ignore parse errors
    }

    // default when no quotation loaded: ensure number and dueDate exist
    setDetails((prev) => {
      const d = new Date(prev.date || new Date().toISOString().slice(0, 10))
      const number =
        prev.number ||
        `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`
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

  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) =>
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? (value === "" ? "" : Number(value)) : value } : row,
      ),
    )

  const confirm = () => {
    const payload = { customer, details, items, totals: { subtotal, taxTotal, total } }
    localStorage.setItem("invoiceDraft", JSON.stringify(payload))
    try {
      const key = `history:${customer.email || customer.phone || customer.name || details.number}`
      const raw = JSON.parse(localStorage.getItem(key) || "{}")
      const existing = (raw && typeof raw === 'object') ? raw : {}
      const key = `history:${customer.email || customer.telephone || customer.company || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const invoices = Array.isArray(existing.invoices) ? existing.invoices : []
      invoices.push({ ...payload, savedAt: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, invoices }))
    } catch {}
    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        const body = {
          number: details.number,
          customer,
          items,
          details,
          totals: { subtotal, taxTotal, total }
        }
        fetch(`${API_BASE_URL}/api/invoices/`, {
          method: "POST",
          headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }).catch(() => {})
      }
    } catch {}
  }

  const print = () => window.print()

  const exportPdf = async () => {
    const el = document.getElementById("invoice-document")
    if (!el) return
    const opt = { margin: 10, filename: `Invoice_${details.number}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }
    const clone = el.cloneNode(true)
    clone.style.position = "fixed"
    clone.style.left = "-10000px"
    clone.style.top = "0"
    clone.style.display = "block"
    clone.style.background = "#ffffff"
    clone.classList.remove("hidden")
    clone.removeAttribute("aria-hidden")
    document.body.appendChild(clone)
    try {
      const loadLib = () =>
        new Promise((resolve) => {
          if (window.html2pdf) return resolve(window.html2pdf)
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"
          s.onload = () => resolve(window.html2pdf)
          s.onerror = () => resolve(null)
          document.head.appendChild(s)
        })
      const lib = await loadLib()
      if (typeof lib === "function") {
        await lib().set(opt).from(clone).save()
      } else {
        window.print()
      }
    } finally {
      document.body.removeChild(clone)
    }
  }

  const emailTo = () => {
    if (!customer.email) {
      return { ok: false, message: "No customer email provided" }
    }
    const subject = encodeURIComponent(`Invoice ${details.number}`)
    const addr = customer.address || "-"
    const body = encodeURIComponent(
      `Dear ${customer.attn || customer.company},\n\nPlease find your invoice ${details.number} dated ${details.date}.\n\nTotal: ${total.toFixed(2)} ${details.currency}\nDue Date: ${details.dueDate || "-"}\nInvoice Address:\n${addr}\n\nNotes:\n${details.notes || "-"}\n\nRegards,\nEIT Lasertechnik`,
    )
    const link = `mailto:${customer.email}?subject=${subject}&body=${body}`
    window.location.href = link
    try {
      const key = `history:${customer.email || customer.phone || customer.name || details.number}`
      const raw = JSON.parse(localStorage.getItem(key) || "{}")
      const existing = (raw && typeof raw === 'object') ? raw : {}
      const key = `history:${customer.email || customer.telephone || customer.company || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const emails = Array.isArray(existing.emails) ? existing.emails : []
      emails.push({ type: "invoice", number: details.number, sentAt: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, emails }))
    } catch {}
    return { ok: true }
  }

  return {
    customer,
    setCustomer,
    details,
    setDetails,
    items,
    addItem,
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

function InvoiceDocument({ inv }) {
  const sym = inv.details.currency === "THB" ? "฿" : inv.details.currency === "USD" ? "$" : inv.details.currency === "EUR" ? "€" : inv.details.currency === "GBP" ? "£" : inv.details.currency
  return (
    <div className="relative bg-white rounded-xl border shadow-sm p-8 print:shadow-none print:border-0 overflow-hidden">
      <div className="absolute -left-10 -top-10 w-56 h-56 bg-[#2D4485] opacity-90 rotate-12" />
      <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-[#2D4485] opacity-90 -rotate-12" />
      <div className="relative">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden">
              <img src="/eit-icon.png" alt="EIT" className="w-10 h-10 object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-[#2D4485] font-bold text-lg">EIT Lasertechnik</div>
              <div className="text-gray-500 text-sm">Invoice</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-[#2D4485] tracking-wide">INVOICE</div>
            <div className="mt-2 text-sm text-gray-700">Invoice Number : <span className="font-semibold">{inv.details.number}</span></div>
            <div className="text-sm text-gray-700">Due Date : <span className="font-semibold">{inv.details.dueDate || "-"}</span></div>
            <div className="text-sm text-gray-700">Invoice Date : <span className="font-semibold">{inv.details.date}</span></div>
            <div className="text-sm text-gray-700">From Quotation : <a href="/quotation.html" className="font-semibold text-[#2D4485] hover:underline">{inv.details.sourceQuotationNumber || "-"}</a></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-600">Invoice to:</div>
            <div className="text-[#2D4485] font-semibold text-lg">{inv.customer.company || inv.customer.name || "-"}</div>
            <div className="text-gray-600 text-sm">{inv.customer.attn ? `Attn: ${inv.customer.attn}` : ""}</div>
            <div className="text-gray-600 text-sm whitespace-pre-wrap">{inv.customer.address || inv.customer.billingAddress1 || ""}</div>
            <div className="text-gray-600 text-sm">{inv.customer.email || ""}</div>
            <div className="text-gray-600 text-sm">{inv.customer.telephone || inv.customer.phone || ""}</div>
          </div>
          <div className="md:text-right">
            <div className="text-sm text-gray-600">Currency:</div>
            <div className="text-gray-900 font-semibold">{inv.details.currency}</div>
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 text-left w-12">No.</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Sales (ex. Vat)</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Unit</th>
                <th className="p-2 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => {
                const amount = (Number(it.qty) || 0) * (Number(it.price) || 0)
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{it.description || it.product}</td>
                    <td className="p-2">{sym} {Number(it.price || 0).toFixed(2)}</td>
                    <td className="p-2">{it.qty}</td>
                    <td className="p-2">{it.unit}</td>
                    <td className="p-2">{sym} {amount.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-2">Payment Method :</div>
            <div className="text-sm text-gray-700">Account Name : EIT Lasertechnik</div>
            <div className="text-sm text-gray-700">Bank/Credit Card</div>
            <div className="text-sm text-gray-700">Paypal : hello@eitlasertechnik.com</div>
          </div>
          <div className="md:text-right">
            <div className="flex justify-end">
              <div className="w-auto min-w-[250px] space-y-2">
                <div className="flex justify-between text-sm gap-8"><span className="text-gray-700">Net amount :</span><span className="font-semibold">{sym} {inv.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm gap-8"><span className="text-gray-700">Vat 7% :</span><span className="font-semibold">{sym} {inv.taxTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-base mt-1 pt-2 border-t gap-8"><span className="text-gray-900 font-semibold">Total of sales :</span><span className="font-bold text-[#2D4485]">{sym} {inv.total.toFixed(2)}</span></div>
                <div className="text-right text-base font-bold text-[#2D4485] mt-1">{THBText(inv.total)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions :</div>
            <div className="text-sm text-gray-700">Please send payment within 30 days of receiving this invoice.</div>
            <div className="text-sm text-gray-700">There will be a 1.5% interest charge per month on late invoices.</div>
          </div>
          <div className="md:text-right">
            <div className="inline-block">
              <div className="text-3xl text-gray-700">EIT</div>
              <div className="text-sm text-gray-700">EIT Lasertechnik</div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-[#2D4485] font-bold">Thank for your business with us!</div>
      </div>
    </div>
  )
}

function InvoicePage() {
  const inv = useInvoiceState()
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)
  const [confirmSend, setConfirmSend] = React.useState({ open: false })
  const [notice, setNotice] = React.useState({ show: false, text: "" })

  const openConfirm = () => setConfirmSend({ open: true })
  const cancelConfirm = () => setConfirmSend({ open: false })
  const doConfirmSend = () => {
    setConfirmSend({ open: false })
    const res = inv.emailTo()
    if (!res || !res.ok) {
      setNotice({ show: true, text: res?.message || "No email provided" })
    } else {
      setNotice({ show: true, text: "Sent" })
    }
    setTimeout(() => setNotice({ show: false, text: "" }), 2000)
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
              <Receipt className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
            </div>
          </div>
        </div>

        {confirmSend.open && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5">
              <div className="text-lg font-semibold text-gray-900 mb-2">Confirm Send</div>
              <div className="text-gray-700 text-sm mb-4">Send invoice to customer email?</div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={cancelConfirm} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200">Cancel</button>
                <button type="button" onClick={doConfirmSend} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {notice.show && (
          <div className="fixed bottom-4 right-4 z-50 print:hidden">
            <div className="bg-[#2D4485] text-white rounded-md shadow-md px-4 py-2 text-sm">
              {notice.text}
            </div>
          </div>
        )}

        {/* Code Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">Code</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
               <input value={inv.details.number} onChange={(e) => inv.setDetails({ ...inv.details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Invoice number" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
               <DateField value={inv.details.date} onChange={(val) => inv.setDetails({ ...inv.details, date: val })} />
             </div>
          </div>
        </div>

        {/* EIT Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">EIT/Einstein organization</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
               <select value={inv.details.salesPerson} onChange={(e) => inv.setDetails({ ...inv.details, salesPerson: e.target.value, onBehalfOf: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none">
                 <option value="">Select Organization</option>
                 <option value="EIT LASERTECHNIK CO.,LTD">EIT LASERTECHNIK CO.,LTD</option>
                 <option value="EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD">EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={inv.details.eitAddress} onChange={(e) => inv.setDetails({ ...inv.details, eitAddress: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
               <input value={inv.details.eitTelephone} onChange={(e) => inv.setDetails({ ...inv.details, eitTelephone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
               <input value={inv.details.eitFax} onChange={(e) => inv.setDetails({ ...inv.details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
             </div>
           </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
               <input value={inv.customer.company} onChange={(e) => inv.setCustomer({ ...inv.customer, company: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Company name" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tax Code</label>
               <input value={inv.customer.taxId} onChange={(e) => inv.setCustomer({ ...inv.customer, taxId: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Tax Code" />
             </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={inv.customer.address} onChange={(e) => inv.setCustomer({ ...inv.customer, address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
             </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select value={inv.details.paymentType} onChange={(e) => inv.setDetails({ ...inv.details, paymentType: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none">
                <option value="">Select Type</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <DateField value={inv.details.dueDate} onChange={(val) => inv.setDetails({ ...inv.details, dueDate: val })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO No.</label>
              <input value={inv.details.poNo} onChange={(e) => inv.setDetails({ ...inv.details, poNo: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="PO Number" />
            </div>
          </div>
        </div>

        {/* Description Box (Items) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#2D4485]">Invoice Description</h2>
             <button onClick={inv.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-medium">Add Item</span>
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 text-[#2D4485] uppercase text-xs font-bold">
                 <tr>
                   <th className="p-3 border-b w-16">No.</th>
                   <th className="p-3 border-b">Description</th>
                   <th className="p-3 border-b">Sales (ex. Vat)</th>
                   <th className="p-3 border-b">Quantity</th>
                   <th className="p-3 border-b">Unit</th>
                   <th className="p-3 border-b text-right">Amount</th>
                   <th className="p-3 border-b w-12"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {inv.items.map((it, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                      <td className="p-3 text-center text-sm text-gray-700">
                        {i + 1}
                      </td>
                      <td className="p-3">
                        <input value={it.description} onChange={(e) => inv.updateItem(i, "description", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" placeholder="Description" />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" step="0.01" value={it.price} onChange={(e) => inv.updateItem(i, "price", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" value={it.qty} onChange={(e) => inv.updateItem(i, "qty", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                      </td>
                      <td className="p-3">
                        <input value={it.unit} onChange={(e) => inv.updateItem(i, "unit", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                      </td>
                      <td className="p-3 text-right text-sm text-gray-700">
                        {((Number(it.qty) || 0) * (Number(it.price) || 0)).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <button onClick={() => inv.removeItem(i)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>

           <div className="flex justify-end mt-4">
              <div className="w-auto min-w-[250px] space-y-2">
                <div className="flex justify-between text-sm gap-8">
                  <span className="text-gray-600">Net amount</span>
                  <span className="font-medium text-gray-900">{inv.subtotal.toFixed(2)} {inv.details.currency}</span>
                </div>
                <div className="flex justify-between text-sm gap-8">
                  <span className="text-gray-600">Vat 7%</span>
                  <span className="font-medium text-gray-900">{inv.taxTotal.toFixed(2)} {inv.details.currency}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 gap-8">
                  <span className="font-bold text-gray-900">Total of sales</span>
                  <span className="font-bold text-[#2D4485]">{inv.total.toFixed(2)} {inv.details.currency}</span>
                </div>
                <div className="text-right text-base font-bold text-[#2D4485]">
                  {THBText(inv.total)}
                </div>
              </div>
           </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href = "/admin.html"}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create Invoice Form</button>
        </div>

        {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Create Invoice Form</h3>
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
                  onClick={() => { inv.confirm(); window.location.href = "/admin.html" }}
                >
                  Save Changes
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center"
                  onClick={() => {
                    inv.confirm()
                    inv.exportPdf()
                    setOpenCreateConfirm(false)
                  }}
                >
                  Download Form
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Hidden Document for PDF */}
        <div className="mt-8 print:mt-0 hidden print:block" id="invoice-document" aria-hidden="true">
          <InvoiceDocument inv={inv} />
        </div>

      </div>
    </main>
  )
}

export default InvoicePage
