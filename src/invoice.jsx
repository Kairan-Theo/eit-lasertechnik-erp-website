import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

function useInvoiceState() {
  const [customer, setCustomer] = React.useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    billingAddress1: "",
    billingAddress2: "",
  })
  const [details, setDetails] = React.useState({
    number: "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    currency: "THB",
    notes: "",
    addressChoice: "1",
  })
  const [items, setItems] = React.useState([{ product: "", description: "", qty: 1, price: 0, tax: 0 }])

  React.useEffect(() => {
    try {
      const fromQuotation = localStorage.getItem("confirmedQuotation")
      if (fromQuotation) {
        const q = JSON.parse(fromQuotation)
        setCustomer((prev) => ({ ...prev, ...q.customer }))
        setItems(Array.isArray(q.items) && q.items.length ? q.items : items)
        setDetails((prev) => ({ ...prev, currency: q.details?.currency || prev.currency }))
        localStorage.removeItem("confirmedQuotation")
      }
    } catch {}
    if (!details.number) {
      const d = new Date()
      const id = `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`
      setDetails((prev) => ({ ...prev, number: id }))
    }
  }, [])

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0)
  const taxTotal = items.reduce((sum, it) => sum + it.qty * it.price * (it.tax / 100), 0)
  const total = subtotal + taxTotal

  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", qty: 1, price: 0, tax: 0 }])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) =>
    setItems((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? Number(value) : value } : row)),
    )

  const save = () => {
    const payload = { customer, details, items, totals: { subtotal, taxTotal, total } }
    localStorage.setItem("invoiceDraft", JSON.stringify(payload))
    try {
      const key = `history:${customer.email || customer.phone || customer.name || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const invoices = Array.isArray(existing.invoices) ? existing.invoices : []
      invoices.push({ ...payload, savedAt: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, invoices }))
    } catch {}
  }
  const print = () => window.print()
  const exportPdf = async () => {
    const el = document.getElementById("invoice-document")
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
    const opt = { margin: 10, filename: `Invoice_${details.number}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }
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
  const emailTo = (choice = details.addressChoice) => {
    const subject = encodeURIComponent(`Invoice ${details.number}`)
    const addr = choice === "2" ? customer.billingAddress2 || customer.billingAddress1 || "-" : customer.billingAddress1 || customer.billingAddress2 || "-"
    const body = encodeURIComponent(
      `Dear ${customer.name || customer.company},\n\nPlease find your invoice ${details.number} dated ${details.date}.\n\nTotal: ${total.toFixed(2)} ${
        details.currency
      }\nDue Date: ${details.dueDate || "-"}\nInvoice Address:\n${addr}\n\nNotes:\n${details.notes || "-"}\n\nRegards,\nEIT Lasertechnik`,
    )
    const link = `mailto:${customer.email}?subject=${subject}&body=${body}`
    window.location.href = link
    try {
      const key = `history:${customer.email || customer.phone || customer.name || details.number}`
      const existing = JSON.parse(localStorage.getItem(key) || "{}")
      const emails = Array.isArray(existing.emails) ? existing.emails : []
      emails.push({ type: "invoice", number: details.number, sentAt: new Date().toISOString(), addressChoice: choice })
      localStorage.setItem(key, JSON.stringify({ ...existing, customer, emails }))
    } catch {}
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
    save,
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
            <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
              <img src="/eit-icon.png" alt="EIT" className="w-10 h-10" />
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
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-600">Invoice to:</div>
            <div className="text-[#2D4485] font-semibold text-lg">{inv.customer.name || inv.customer.company || "-"}</div>
            <div className="text-gray-600 text-sm">{inv.customer.company || ""}</div>
            <div className="text-gray-600 text-sm">{inv.customer.email || ""}</div>
            <div className="text-gray-600 text-sm">{inv.customer.phone || ""}</div>
          </div>
          <div className="md:text-right">
            <div className="text-sm text-gray-600">Currency:</div>
            <div className="text-gray-900 font-semibold">{inv.details.currency}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 border rounded-md p-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">Billing Address 1</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{inv.customer.billingAddress1 || "-"}</div>
          </div>
          <div className="bg-gray-50 border rounded-md p-4 md:text-right">
            <div className="text-sm font-semibold text-gray-900 mb-2">Billing Address 2</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{inv.customer.billingAddress2 || "-"}</div>
          </div>
        </div>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 text-left">QUANTITY</th>
                <th className="p-2 text-left">ITEM DESCRIPTION</th>
                <th className="p-2 text-left">PRICE</th>
                <th className="p-2 text-left">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => {
                const amount = it.qty * it.price
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{it.qty}</td>
                    <td className="p-2">{it.description || it.product}</td>
                    <td className="p-2">{sym} {Number(it.price).toFixed(2)}</td>
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
              <div className="w-56">
                <div className="flex justify-between text-sm"><span className="text-gray-700">SUBTOTAL :</span><span className="font-semibold">{sym} {inv.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-700">TAX :</span><span className="font-semibold">{sym} {inv.taxTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-base mt-1"><span className="text-gray-900 font-semibold">TOTAL :</span><span className="font-bold text-[#2D4485]">{sym} {inv.total.toFixed(2)}</span></div>
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

function AddressBlock({ title, value, onChange, onSave }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Street, City, Zip, Country" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
      <div className="flex justify-end">
        <button type="button" onClick={onSave} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">
          Save
        </button>
      </div>
    </div>
  )
}

function InvoicePage() {
  const inv = useInvoiceState()
  return (
    <main className="min-h-screen bg-white">
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="print:hidden relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoice</h1>
              <div className="flex gap-2">
                <button type="button" onClick={inv.save} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Save</button>
                <button type="button" onClick={inv.exportPdf} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Download</button>
                <button type="button" onClick={inv.print} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Export PDF</button>
                <button type="button" onClick={() => inv.emailTo("1")} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Send Addr 1</button>
                <button type="button" onClick={() => inv.emailTo("2")} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white">Send Addr 2</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={inv.customer.name} onChange={(e) => inv.setCustomer({ ...inv.customer, name: e.target.value })} placeholder="Customer name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={inv.customer.company} onChange={(e) => inv.setCustomer({ ...inv.customer, company: e.target.value })} placeholder="Company" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={inv.customer.email} onChange={(e) => inv.setCustomer({ ...inv.customer, email: e.target.value })} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={inv.customer.phone} onChange={(e) => inv.setCustomer({ ...inv.customer, phone: e.target.value })} placeholder="Phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
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
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((it, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">
                            <input value={it.product} onChange={(e) => inv.updateItem(i, "product", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={it.description} onChange={(e) => inv.updateItem(i, "description", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input type="number" min="0" value={it.qty} onChange={(e) => inv.updateItem(i, "qty", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input type="number" min="0" step="0.01" value={it.price} onChange={(e) => inv.updateItem(i, "price", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input type="number" min="0" step="0.1" value={it.tax} onChange={(e) => inv.updateItem(i, "tax", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                          </td>
                          <td className="p-2 text-right">{(it.qty * it.price * (1 + it.tax / 100)).toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <button onClick={() => inv.removeItem(i)} className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between mt-4">
                  <button onClick={inv.addItem} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200">Add Item</button>
                  <div className="w-64">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        {inv.subtotal.toFixed(2)} {inv.details.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-semibold">
                        {inv.taxTotal.toFixed(2)} {inv.details.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="font-bold text-[#3D56A6]">
                        {inv.total.toFixed(2)} {inv.details.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input value={inv.details.number} onChange={(e) => inv.setDetails({ ...inv.details, number: e.target.value })} placeholder="Invoice number" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input type="date" value={inv.details.date} onChange={(e) => inv.setDetails({ ...inv.details, date: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input type="date" value={inv.details.dueDate} onChange={(e) => inv.setDetails({ ...inv.details, dueDate: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <select value={inv.details.currency} onChange={(e) => inv.setDetails({ ...inv.details, currency: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="THB">THB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <select value={inv.details.addressChoice} onChange={(e) => inv.setDetails({ ...inv.details, addressChoice: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="1">Use Billing Address 1</option>
                    <option value="2">Use Billing Address 2</option>
                  </select>
                  <textarea value={inv.details.notes} onChange={(e) => inv.setDetails({ ...inv.details, notes: e.target.value })} placeholder="Billing notes" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>

              <AddressBlock
                title="Billing Address 1"
                value={inv.customer.billingAddress1}
                onChange={(v) => inv.setCustomer({ ...inv.customer, billingAddress1: v })}
                onSave={() => inv.save()}
              />
              <AddressBlock
                title="Billing Address 2"
                value={inv.customer.billingAddress2}
                onChange={(v) => inv.setCustomer({ ...inv.customer, billingAddress2: v })}
                onSave={() => inv.save()}
              />
            </div>
          </div>
          <div className="mt-8 print:mt-0 hidden print:block" id="invoice-document" aria-hidden="true">
            <InvoiceDocument inv={inv} />
          </div>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InvoicePage />
  </React.StrictMode>,
)
