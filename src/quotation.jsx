import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

function useQuotationState() {
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", phone: "" })
  const [details, setDetails] = React.useState({ number: "", date: new Date().toISOString().slice(0, 10), expires: "", currency: "USD", salesperson: "" })
  const [crm, setCrm] = React.useState({ stage: "Draft", probability: 20, nextActivity: "", note: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", qty: 1, price: 0, tax: 0 }])

  React.useEffect(() => {
    if (!details.number) {
      const d = new Date()
      const id = `Q-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`
      setDetails((prev) => ({ ...prev, number: id }))
    }
  }, [])

  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", qty: 1, price: 0, tax: 0 }])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? Number(value) : value } : row)))

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0)
  const taxTotal = items.reduce((sum, it) => sum + it.qty * it.price * (it.tax / 100), 0)
  const total = subtotal + taxTotal

  const save = () => {
    const payload = { customer, details, crm, items, totals: { subtotal, taxTotal, total } }
    localStorage.setItem("quotationDraft", JSON.stringify(payload))
  }
  const print = () => window.print()

  return { customer, setCustomer, details, setDetails, crm, setCrm, items, addItem, removeItem, updateItem, subtotal, taxTotal, total, save, print }
}

function QuotationPage() {
  const q = useQuotationState()
  return (
    <main className="min-h-screen bg-white">
      <div className="print:hidden">
        <Navigation />
      </div>
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quotation</h1>
            <div className="flex gap-2">
              <button onClick={q.save} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200">Save</button>
              <button onClick={q.print} className="px-4 py-2 bg-[#3D56A6] text-white rounded-md hover:bg-[#2D4485]">Print</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={q.customer.name} onChange={(e) => q.setCustomer({ ...q.customer, name: e.target.value })} placeholder="Customer name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.company} onChange={(e) => q.setCustomer({ ...q.customer, company: e.target.value })} placeholder="Company" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.email} onChange={(e) => q.setCustomer({ ...q.customer, email: e.target.value })} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
                  <input value={q.customer.phone} onChange={(e) => q.setCustomer({ ...q.customer, phone: e.target.value })} placeholder="Phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
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
                      {q.items.map((it, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2"><input value={it.product} onChange={(e) => q.updateItem(i, "product", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input value={it.description} onChange={(e) => q.updateItem(i, "description", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="0" value={it.qty} onChange={(e) => q.updateItem(i, "qty", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="0" step="0.01" value={it.price} onChange={(e) => q.updateItem(i, "price", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="0" step="0.1" value={it.tax} onChange={(e) => q.updateItem(i, "tax", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                          <td className="p-2 text-right">{(it.qty * it.price * (1 + it.tax / 100)).toFixed(2)}</td>
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
        </div>
      </section>
      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QuotationPage />
  </React.StrictMode>,
)

