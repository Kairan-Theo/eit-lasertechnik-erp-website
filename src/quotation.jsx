import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import "./index.css"

function useQuotationState() {
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
  const [details, setDetails] = React.useState({ number: "", date: new Date().toISOString().slice(0, 10), expires: "", currency: "THB", salesperson: "" })
  const [crm, setCrm] = React.useState({ stage: "Draft", probability: 20, nextActivity: "", note: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])

  React.useEffect(() => {
    try {
      const po = localStorage.getItem("poInbound")
      if (po) {
        const data = JSON.parse(po)
        if (data.customer) setCustomer((prev) => ({ ...prev, ...data.customer }))
        if (Array.isArray(data.items) && data.items.length) setItems(data.items)
        localStorage.removeItem("poInbound")
      }
    } catch {}
    if (!details.number) {
      const d = new Date()
      const id = `Q-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`
      setDetails((prev) => ({ ...prev, number: id }))
    }
  }, [])

  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? Number(value) : value } : row)))

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0)
  const taxTotal = items.reduce((sum, it) => sum + it.qty * it.price * (it.tax / 100), 0)
  const total = subtotal + taxTotal

  const save = () => {
    const payload = { customer, details, crm, items, totals: { subtotal, taxTotal, total } }
    localStorage.setItem("quotationDraft", JSON.stringify(payload))
    try {
      const key = `history:${customer.email || customer.phone || customer.name || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const quotations = Array.isArray(existing.quotations) ? existing.quotations : []
      quotations.push({ ...payload, savedAt: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, quotations }))
    } catch {}
  }
  const confirm = () => {
    save()
    const key = encodeURIComponent(customer.email || customer.phone || customer.name || details.number)
    window.location.href = `/admin.html?view=customerHistory&filter=${key}`
  }
  const print = () => window.print()
  const exportPdf = async () => {
    const el = document.getElementById("quotation-document")
    if (!el) return
    const tryLoad = (src) =>
      new Promise((resolve, reject) => {
        if (window.html2pdf) return resolve()
        const s = document.createElement("script")
        s.src = src
        s.onload = () => resolve()
        s.onerror = () => reject()
        document.head.appendChild(s)
      })
    try {
      await tryLoad("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js")
    } catch {
      try {
        await tryLoad("https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js")
      } catch {
        try {
          await tryLoad("https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js")
        } catch {
          window.print()
          return
        }
      }
    }
    const opt = { margin: 10, filename: `Quotation_${details.number}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }
    const clone = el.cloneNode(true)
    clone.style.position = "fixed"
    clone.style.left = "-10000px"
    clone.style.top = "0"
    clone.style.display = "block"
    document.body.appendChild(clone)
    try {
      await window.html2pdf().set(opt).from(clone).save()
    } finally {
      document.body.removeChild(clone)
    }
  }

  return { customer, setCustomer, details, setDetails, crm, setCrm, items, addItem, removeItem, updateItem, subtotal, taxTotal, total, save, confirm, print, exportPdf }
}

function QuotationDocument({ q, compact = false }) {
  const sym = q.details.currency === "THB" ? "฿" : q.details.currency === "USD" ? "$" : q.details.currency === "EUR" ? "€" : q.details.currency === "GBP" ? "£" : q.details.currency
  return (
    <div className={`bg-white rounded-xl border shadow-sm ${compact ? "p-4 text-[12px]" : "p-8"} print:shadow-none print:border-0`}>
      <div className={`flex items-start justify-between ${compact ? "mb-6" : "mb-8"}`}>
        <div className="flex items-center gap-3">
          <div className={`${compact ? "w-10 h-10" : "w-12 h-12"} bg-[#3D56A6] rounded flex items-center justify-center`}>
            <img src="/eit-icon.png" alt="EIT" className={`${compact ? "w-7 h-7" : "w-8 h-8"}`} />
          </div>
          <div className="leading-tight">
            <div className={`text-[#3D56A6] font-bold ${compact ? "text-base" : "text-lg"}`}>EIT Lasertechnik</div>
            <div className={`text-gray-500 ${compact ? "text-xs" : "text-sm"}`}>Quotation</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`${compact ? "text-xl" : "text-2xl"} font-bold text-[#3D56A6] tracking-wide`}>QUOTATION</div>
          <div className={`mt-2 ${compact ? "text-xs" : "text-sm"} text-gray-700`}>Quotation Number : <span className="font-semibold">{q.details.number}</span></div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>Quote Date : <span className="font-semibold">{q.details.date}</span></div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>Valid Until : <span className="font-semibold">{q.details.expires || "-"}</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>Quote to:</div>
          <div className={`text-[#3D56A6] font-semibold ${compact ? "text-base" : "text-lg"}`}>{q.customer.name || q.customer.company || "-"}</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>{q.customer.company || ""}</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>{q.customer.email || ""}</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>{q.customer.companyEmail || ""}</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>{q.customer.phone || ""}</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>{q.customer.companyPhone || ""}</div>
        </div>
        <div className="md:text-right">
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>Currency:</div>
          <div className={`${compact ? "text-sm" : "text-base"} text-gray-900 font-semibold`}>{q.details.currency}</div>
        </div>
      </div>
      <div className="overflow-x-auto mb-6">
        <table className={`min-w-full ${compact ? "text-[11px]" : "text-sm"}`}>
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className={`${compact ? "p-1.5" : "p-2"} text-left`}>QUANTITY</th>
              <th className={`${compact ? "p-1.5" : "p-2"} text-left`}>ITEM DESCRIPTION</th>
              <th className={`${compact ? "p-1.5" : "p-2"} text-left`}>PRICE</th>
              <th className={`${compact ? "p-1.5" : "p-2"} text-left`}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it, i) => {
              const amount = it.qty * it.price
              return (
                <tr key={i} className="border-t">
                  <td className={`${compact ? "p-1.5" : "p-2"}`}>{it.qty}</td>
                  <td className={`${compact ? "p-1.5" : "p-2"}`}>
                    <div>{it.description || it.product}</div>
                    {it.note ? <div className={`${compact ? "text-[10px]" : "text-xs"} text-gray-500 mt-1`}>Note: {it.note}</div> : null}
                  </td>
                  <td className={`${compact ? "p-1.5" : "p-2"}`}>{sym} {Number(it.price).toFixed(2)}</td>
                  <td className={`${compact ? "p-1.5" : "p-2"}`}>{sym} {amount.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-900 mb-2`}>Payment Method :</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>Account Name : EIT Lasertechnik</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>Bank/Credit Card</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>Paypal : hello@eitlasertechnik.com</div>
        </div>
        <div className="md:text-right">
          <div className="flex justify-end">
            <div className={`${compact ? "w-48" : "w-56"}`}>
              <div className={`flex justify-between ${compact ? "text-xs" : "text-sm"}`}><span className="text-gray-700">SUBTOTAL :</span><span className="font-semibold">{sym} {q.subtotal.toFixed(2)}</span></div>
              <div className={`flex justify-between ${compact ? "text-xs" : "text-sm"}`}><span className="text-gray-700">TAX :</span><span className="font-semibold">{sym} {q.taxTotal.toFixed(2)}</span></div>
              <div className={`flex justify-between ${compact ? "text-sm" : "text-base"} mt-1`}><span className="text-gray-900 font-semibold">TOTAL :</span><span className="font-bold text-[#3D56A6]">{sym} {q.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-900 mb-2`}>Terms & Conditions :</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>Please send payment within 30 days of receiving this quotation.</div>
          <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>There may be a 1.5% interest charge per month on late payments.</div>
        </div>
        <div className="md:text-right">
          <div className="inline-block">
            <div className={`${compact ? "text-2xl" : "text-3xl"} font-signature text-gray-700`}>EIT</div>
            <div className={`${compact ? "text-xs" : "text-sm"} text-gray-700`}>EIT Lasertechnik</div>
          </div>
        </div>
      </div>
      <div className={`${compact ? "mt-6" : "mt-10"} text-[#3D56A6] font-bold`}>Thank you for your business with us!</div>
    </div>
  )
}

function QuotationPage() {
  const q = useQuotationState()
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const sendAndSave = () => {
    q.setCrm({ ...q.crm, stage: "Sent" })
    q.save()
    const key = encodeURIComponent(q.customer.email || q.customer.phone || q.customer.name || q.details.number)
    window.location.href = `/admin.html?view=customerHistory&filter=${key}`
  }
  return (
    <main className="min-h-screen bg-white">
      <div className="print:hidden">
        <Navigation />
      </div>
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8">
       <div className="max-w-7xl mx-auto">
          <div className="print:hidden relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quotation</h1>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPreviewOpen(true)} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Confirm</button>
                <button type="button" onClick={q.exportPdf} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Download</button>
                <button type="button" onClick={q.print} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Export PDF</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={q.customer.name} onChange={(e) => q.setCustomer({ ...q.customer, name: e.target.value })} placeholder="Customer name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.company} onChange={(e) => q.setCustomer({ ...q.customer, company: e.target.value })} placeholder="Company" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.email} onChange={(e) => q.setCustomer({ ...q.customer, email: e.target.value })} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.companyEmail} onChange={(e) => q.setCustomer({ ...q.customer, companyEmail: e.target.value })} placeholder="Company email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.phone} onChange={(e) => q.setCustomer({ ...q.customer, phone: e.target.value })} placeholder="Phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.companyPhone} onChange={(e) => q.setCustomer({ ...q.customer, companyPhone: e.target.value })} placeholder="Company phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">Product</th>
                        <th className="p-2">Description</th>
                        <th className="p-2">Qty</th>
              <th className="p-2">Unit Price</th>
              <th className="p-2">Tax %</th>
              <th className="p-2">Line Total</th>
              <th className="p-2">Note</th>
              <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((it, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2"><input value={it.product} onChange={(e) => q.updateItem(i, "product", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input value={it.description} onChange={(e) => q.updateItem(i, "description", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="0" value={it.qty} onChange={(e) => q.updateItem(i, "qty", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="0" step="0.01" value={it.price} onChange={(e) => q.updateItem(i, "price", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="0" step="0.1" value={it.tax} onChange={(e) => q.updateItem(i, "tax", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2 text-right">{(it.qty * it.price * (1 + it.tax / 100)).toFixed(2)}</td>
                          <td className="p-2"><input value={it.note || ""} onChange={(e) => q.updateItem(i, "note", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2 text-right"><button onClick={() => q.removeItem(i)} className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100">Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between mt-4">
                  <button onClick={q.addItem} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200">Add Item</button>
                  <div className="w-64">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{q.subtotal.toFixed(2)} {q.details.currency}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-semibold">{q.taxTotal.toFixed(2)} {q.details.currency}</span></div>
                    <div className="flex justify-between text-lg"><span className="text-gray-900">Total</span><span className="font-bold text-[#3D56A6]">{q.total.toFixed(2)} {q.details.currency}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input value={q.details.number} onChange={(e) => q.setDetails({ ...q.details, number: e.target.value })} placeholder="Quotation number" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input type="date" value={q.details.date} onChange={(e) => q.setDetails({ ...q.details, date: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input type="date" value={q.details.expires} onChange={(e) => q.setDetails({ ...q.details, expires: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <select value={q.details.currency} onChange={(e) => q.setDetails({ ...q.details, currency: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="THB">THB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <input value={q.details.salesperson} onChange={(e) => q.setDetails({ ...q.details, salesperson: e.target.value })} placeholder="Salesperson" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">CRM</h2>
                <div className="grid grid-cols-1 gap-4">
                  <select value={q.crm.stage} onChange={(e) => q.setCrm({ ...q.crm, stage: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Won</option>
                    <option>Lost</option>
                    <option>Cancelled</option>
                  </select>
                  <input type="number" min="0" max="100" value={q.crm.probability} onChange={(e) => q.setCrm({ ...q.crm, probability: Number(e.target.value) })} placeholder="Probability %" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input type="datetime-local" value={q.crm.nextActivity} onChange={(e) => q.setCrm({ ...q.crm, nextActivity: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <textarea value={q.crm.note} onChange={(e) => q.setCrm({ ...q.crm, note: e.target.value })} placeholder="Notes" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 print:mt-0 hidden print:block" id="quotation-document" aria-hidden="true">
            <QuotationDocument q={q} />
          </div>
          {previewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="relative bg-white rounded-xl shadow-xl border w-full max-w-3xl mx-4 p-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl font-bold text-[#2D4485]">Preview Quotation</div>
                </div>
                <div className="bg-white rounded-xl border shadow-sm p-2">
                  <QuotationDocument q={q} compact />
                </div>
                <div className="flex items-center justify-between gap-2 mt-4">
                  <button aria-label="Close preview" onClick={() => setPreviewOpen(false)} className="px-2 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={q.exportPdf} className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200">Download</button>
                    <button onClick={q.print} className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200">Print</button>
                    <button onClick={sendAndSave} className="px-3 py-1.5 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]">Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QuotationPage />
  </React.StrictMode>,
)

