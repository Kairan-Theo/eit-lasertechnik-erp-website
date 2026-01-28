import React from "react"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft, Receipt } from "lucide-react"
import html2pdf from "html2pdf.js"
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

  // Helper to get next invoice number
  const getNextInvoiceNumber = () => {
    const invoices = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("history:")) {
          try {
            const item = JSON.parse(localStorage.getItem(key))
            if (item && Array.isArray(item.invoices)) {
              invoices.push(...item.invoices)
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Error reading localStorage", e)
    }

    const currentYear = new Date().getFullYear()
    const nums = invoices
      .map(n => String(n.number || n.details?.number || ""))
      .map(s => {
        const m = s.match(new RegExp(`^VOI ${currentYear}-(\\d{4})$`, 'i'))
        return m ? parseInt(m[1], 10) : null
      })
      .filter(n => Number.isFinite(n))
    const next = (nums.length ? Math.max(...nums) + 1 : 1)
    return `VOI ${currentYear}-${String(next).padStart(4, "0")}`
  }

  const [details, setDetails] = React.useState({
    number: getNextInvoiceNumber(),
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    poNo: "",
    paymentType: "",
    currency: "THB",
    notes: "",
    paymentTermsDays: 7,
    sourceQuotationNumber: "",
    salesPerson: "EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD",
    eitAddress: "",
    eitTelephone: "",
    eitFax: "",
    onBehalfOf: ""
  })

  const [items, setItems] = React.useState([{ product: "", description: "", qty: 1, price: 0, tax: 0, unit: "pcs" }])

  // Initialization: load confirmedQuotation if present
  React.useEffect(() => {
    // 1. Check URL params
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")
    const index = params.get("index")
    
    if (key && index !== null) {
      try {
        const historyItem = JSON.parse(localStorage.getItem(key))
        if (historyItem && Array.isArray(historyItem.invoices)) {
          const inv = historyItem.invoices[parseInt(index, 10)]
          if (inv) {
            setCustomer(inv.customer || {})
            setDetails(inv.details || {})
            setItems(Array.isArray(inv.items) ? inv.items : [])
            return
          }
        }
      } catch (e) {
        console.error("Error loading invoice from URL", e)
      }
    }

    try {
      const fromQuotation = localStorage.getItem("confirmedQuotation")
      if (fromQuotation) {
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

          const number = prev.number || getNextInvoiceNumber()

          return {
            ...prev,
            ...q.details,
            currency: q.details?.currency || prev.currency,
            date,
            paymentTermsDays,
            number,
            dueDate: due.toISOString().slice(0, 10),
            sourceQuotationNumber: q.details?.number || prev.sourceQuotationNumber || "", // Use quotation number as source
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
      const number = prev.number || getNextInvoiceNumber()
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
    const opt = { margin: 0, filename: `Invoice_${details.number}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }
    const clone = el.cloneNode(true)
    clone.style.position = "fixed"
    clone.style.left = "-10000px"
    clone.style.top = "0"
    clone.style.display = "block"
    clone.style.background = "#ffffff"
    clone.classList.remove("hidden")
    clone.removeAttribute("aria-hidden")
    document.body.appendChild(clone)
    
    // Wait for images to load
    const images = clone.querySelectorAll('img')
    await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve
        })
    }))

    try {
      const all = clone.querySelectorAll("*")
      all.forEach((node) => {
        const cs = window.getComputedStyle(node)
        const props = [
          "color",
          "backgroundColor",
          "background",
          "borderColor",
          "borderTopColor",
          "borderRightColor",
          "borderBottomColor",
          "borderLeftColor",
          "boxShadow",
        ]
        props.forEach((prop) => {
          const val = cs[prop]
          if (typeof val === "string" && val.includes("oklch")) {
            if (prop.toLowerCase().includes("background")) {
              node.style[prop] = "#ffffff"
            } else if (prop.toLowerCase().includes("border")) {
              node.style[prop] = "#000000"
            } else {
              node.style[prop] = "#000000"
            }
          }
        })
      })
    } catch (e) {
      console.error("Failed to sanitize colors for PDF", e)
    }
    try {
      await html2pdf().set(opt).from(clone).save()
    } catch (err) {
      console.error("PDF generation failed", err)
      window.print()
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
  const orgName = inv.details.onBehalfOf || "EIT LASERTECHNIK CO.,LTD"
  const isEinstein = orgName.toUpperCase().includes("EINSTEIN")
  
  const orgThaiName = isEinstein 
    ? "บริษัท ไอน์สไตน์ อินดัสเตรียล เทคนิค คอร์ปอเรชั่น จำกัด" 
    : "บริษัท อีไอที เลเซอร์เทคนิค จำกัด"
  
  const orgAddressLine1 = isEinstein
    ? "1/120 Soi Ramkhamhaeng 184, Minburi, Minburi, Bangkok 10510 Thailand"
    : "118/20 Soi Ramkhamhaeng 184, Minburi, Minburi, Bangkok 10510 Thailand"
  
  const orgThaiAddress = isEinstein
    ? "1/120 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510"
    : "118/20 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510"

  const orgTel = isEinstein ? "02-052-9544" : "02-xxx-xxxx"
  const orgFax = isEinstein ? "02-052-9544" : "02-xxx-xxxx"
  const orgTaxId = isEinstein ? "0105547001928" : "010555xxxxxxx"
  
  const customerName = inv.customer.company || inv.customer.name || ""
  const customerTaxId = inv.customer.taxId || ""
  const customerAddress = inv.customer.address || inv.customer.billingAddress1 || ""
  const paymentType = inv.details.paymentType || ""
  const poNo = inv.details.poNo || ""
  const issueDate = inv.details.date ? format(parseISO(inv.details.date), "dd/MM/yyyy") : ""
  const dueDate = inv.details.dueDate ? format(parseISO(inv.details.dueDate), "dd/MM/yyyy") : ""

  const headerImgSrc = window.location.origin + (isEinstein ? "/Einstein%20header.png" : "/EIT%20header.png")

  return (
    <div className="mx-auto bg-white text-black font-sans p-[15px] w-[794px] h-auto relative text-[11px] leading-tight">
      {/* Header Image */}
      <div className="mb-1 flex items-center justify-center">
        <img src={headerImgSrc} alt="Header" className="w-full h-auto object-contain" />
      </div>

      {/* Row 1: Company Info & Doc Info */}
      <div className="flex justify-between items-start mb-1">
         {/* Left: Company Info Box */}
         <div className="border border-black p-2 w-[60%] min-h-[90px]">
            <div className="font-bold text-xs">{orgThaiName}</div>
            <div className="font-bold text-xs">{orgName}</div>
            <div className="mt-1">{orgAddressLine1}</div>
            <div className="mt-1">TEL : {orgTel}    Fax : {orgFax}</div>
            <div className="mt-1 flex justify-between">
               <div className="flex gap-1">
                  <span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร :</span>
                  <span>{orgTaxId}</span>
               </div>
               <span className="font-bold">สำนักงานใหญ่</span>
            </div>
         </div>

         {/* Right: Doc Info */}
         <div className="w-[38%] pl-4">
            <div className="flex justify-between mb-4">
               <div>
                  <div className="font-bold text-sm">ใบแจ้งหนี้</div>
                  <div className="font-bold text-sm">INVOICE</div>
                  <div className="text-[10px]">ไม่ใช่ใบกำกับภาษี</div>
               </div>
               <div className="text-right">
                  <div className="font-bold text-sm">ต้นฉบับ</div>
                  <div className="font-bold text-sm">Original</div>
               </div>
            </div>
            <div className="text-right text-xs">
               <div className="flex justify-end gap-2 mb-1">
                  <span className="w-24 font-bold">เลขที่ (No.)</span>
                  <span>EIT {inv.details.number}</span>
               </div>
               <div className="flex justify-end gap-2">
                  <span className="w-24 font-bold">วันที่ (Issue Date)</span>
                  <span>{issueDate}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Row 2: Customer & Payment Info */}
      <div className="border border-black border-b-0 flex">
         {/* Left: Customer */}
         <div className="w-[70%] border-r border-black p-2 min-h-[90px]">
            <div className="flex mb-1">
               <div className="font-bold w-32">สำนักงานใหญ่</div>
               <div className="flex-1 flex gap-2">
                  <span className="font-bold">เลขประจำตัวผู้เสียภาษี</span>
                  <span>{customerTaxId}</span>
               </div>
            </div>
            <div className="flex mb-1">
               <div className="w-32 font-bold">ลูกค้า (customer)</div>
               <div className="flex-1">{customerName}</div>
            </div>
            <div className="flex mb-1">
               <div className="w-32 font-bold">ชื่อ</div>
               <div>{inv.customer.attn || ""}</div>
            </div>
            <div className="flex">
               <div className="w-32 font-bold">ที่อยู่</div>
               <div className="w-2/3 break-words">{customerAddress}</div>
            </div>
         </div>

         {/* Right: Payment */}
         <div className="w-[30%] flex flex-col">
            <div className="flex-1 border-b border-black p-1 text-center flex flex-col justify-center">
               <div className="font-bold">ประเภทการจ่ายเงิน (Payment Type)</div>
               <div className="mt-1">{paymentType || "-"}</div>
            </div>
            <div className="flex-1 border-b border-black p-1 text-center flex flex-col justify-center">
               <div className="font-bold">วันครบกำหนดชำระเงิน( Due date)</div>
               <div className="mt-1">{dueDate}</div>
            </div>
            <div className="flex-1 p-1 text-center flex flex-col justify-center">
               <div className="font-bold">เลขที่ใบสั่งซื้อ (PO.NO)</div>
               <div className="mt-1">{poNo || "-"}</div>
            </div>
         </div>
      </div>

      {/* Row 3: Table Header */}
      <div className="border border-black border-b-0 flex text-center font-bold text-xs bg-gray-100">
         <div className="w-[55%] border-r border-black p-1">
            <div>รายการ</div>
            <div>Description</div>
         </div>
         <div className="w-[15%] border-r border-black p-1">
            <div>ราคาขายไม่รวมภาษี</div>
            <div>Sales (ex.Vat)</div>
         </div>
         <div className="w-[8%] border-r border-black p-1">
            <div>จำนวน</div>
            <div>Qty</div>
         </div>
         <div className="w-[7%] border-r border-black p-1">
            <div>หน่วยนับ</div>
            <div>Unit</div>
         </div>
         <div className="w-[15%] p-1">
            <div>จำนวนเงิน (บาท)</div>
            <div>Amount</div>
         </div>
      </div>

      {/* Row 4: Table Content */}
      <div className="border border-black flex flex-col min-h-[150px] relative"> 
         {/* Loop Items */}
         {inv.items.map((item, i) => (
            <div key={i} className="flex text-xs z-10">
               <div className="w-[55%] p-1 pl-2 text-left">{i+1}. {item.description || item.product}</div>
               <div className="w-[15%] p-1 text-right">{Number(item.price).toFixed(2)}</div>
               <div className="w-[8%] p-1 text-center">{item.qty}</div>
               <div className="w-[7%] p-1 text-center">{item.unit}</div>
               <div className="w-[15%] p-1 text-right">{ (Number(item.qty) * Number(item.price)).toFixed(2) }</div>
            </div>
         ))}
         
         {/* Vertical Lines (Background) */}
         <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-[55%] border-r border-black"></div>
            <div className="w-[15%] border-r border-black"></div>
            <div className="w-[8%] border-r border-black"></div>
            <div className="w-[7%] border-r border-black"></div>
            <div className="w-[15%]"></div>
         </div>
      </div>

      {/* Row 5: Totals */}
      <div className="flex border border-black border-t-0">
         <div className="flex-1 border-r border-black"></div> 
         <div className="w-[30%]">
            <div className="flex border-b border-black">
               <div className="w-[60%] border-r border-black p-1 text-right font-bold text-[10px]">
                  <div>จำนวนเงินสุทธิ</div>
                  <div>Net Amount</div>
               </div>
               <div className="w-[40%] p-1 text-right">{inv.subtotal.toFixed(2)}</div>
            </div>
            <div className="flex border-b border-black">
               <div className="w-[60%] border-r border-black p-1 text-right font-bold text-[10px]">
                  <div>ภาษีมูลค่าเพิ่ม</div>
                  <div>VAT 7%</div>
               </div>
               <div className="w-[40%] p-1 text-right">{inv.taxTotal.toFixed(2)}</div>
            </div>
            <div className="flex">
               <div className="w-[60%] border-r border-black p-1 text-right font-bold text-[10px]">
                  <div>รวมเป็นมูลค่า</div>
                  <div>Total of sales</div>
               </div>
               <div className="w-[40%] p-1 text-right">{inv.total.toFixed(2)}</div>
            </div>
         </div>
      </div>

      {/* Row 6: Text Amount */}
      <div className="border border-black border-t-0 flex">
         <div className="w-[25%] border-r border-black p-1 text-center font-bold flex flex-col justify-center">
            <div>จำนวนเงินรวมทั้งสิ้น</div>
            <div>(The sum of bath)</div>
         </div>
         <div className="flex-1 p-1 text-center flex items-center justify-center bg-gray-100">
            {THBText(inv.total)}
         </div>
      </div>

      {/* Row 7: Signatures */}
      <div className="border border-black border-t-0 p-2 pt-2 pb-2 flex justify-between text-center text-xs">
         <div className="w-[30%] flex flex-col">
            <div className="border border-black mb-1 font-bold p-1 w-full">ชำระเงินโดย</div>
            <div className="mt-2 font-bold">ผู้รับสินค้า Reciever</div>
            <div className="mt-4 border-b border-dotted border-black w-3/4 mx-auto"></div>
            <div className="mt-1 flex justify-center gap-1">
               <span>วันที่</span>
               <span className="border-b border-dotted border-black w-20"></span>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">(........................................................)</div>
         </div>
         <div className="w-[30%] pt-2">
            <div className="mt-2 font-bold">ผู้ส่งสินค้า Deliverer</div>
            <div className="mt-4 border-b border-dotted border-black w-3/4 mx-auto"></div>
            <div className="mt-1 flex justify-center gap-1">
               <span>วันที่</span>
               <span className="border-b border-dotted border-black w-20"></span>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">(........................................................)</div>
         </div>
         <div className="w-[30%] pt-2">
            <div className="mt-2 font-bold">ผู้มีอำนาจลงนาม Authorized Signature</div>
            <div className="mt-4 border-b border-dotted border-black w-3/4 mx-auto"></div>
            <div className="mt-1 flex justify-center gap-1">
               <span>วันที่</span>
               <span className="border-b border-dotted border-black w-20"></span>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">(........................................................)</div>
         </div>
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
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {inv.items.map((it, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                      <td className="p-3 text-center text-sm text-gray-700">
                        {i + 1}
                      </td>
                      <td className="p-3">
                        <textarea 
                          value={it.description} 
                          onChange={(e) => inv.updateItem(i, "description", e.target.value)} 
                          className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none resize-y min-h-[32px]"
                          rows={1}
                          placeholder="Description"
                        />
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
        <div id="invoiceArea">
          <div className="mt-8 print:mt-0 hidden print:block" id="invoice-document" aria-hidden="true">
            <InvoiceDocument inv={inv} />
          </div>
        </div>

      </div>
    </main>
  )
}

export default InvoicePage
