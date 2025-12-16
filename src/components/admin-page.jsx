import React from "react"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-[#3D56A6] mb-8">Admin</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#3D56A6] rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">Quotation</h2>
            <p className="text-sm text-gray-600">Create and manage customer quotations.</p>
            <a href="/quotation.html" className="inline-block mt-4 px-4 py-2 bg-[#3D56A6] text-white rounded-md">Open</a>
          </div>
          <div className="border border-[#3D56A6] rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">User Access</h2>
            <p className="text-sm text-gray-600">Manage roles and permissions.</p>
            <button className="mt-4 px-4 py-2 bg-[#3D56A6] text-white rounded-md">Open</button>
          </div>
          <div className="border border-[#3D56A6] rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">Invoice</h2>
            <p className="text-sm text-gray-600">Create and send invoices.</p>
            <a href="/invoice.html" className="inline-block mt-4 px-4 py-2 bg-[#3D56A6] text-white rounded-md">Open</a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProductSearch />
          <CustomerHistory />
          <PoToQuotation />
        </div>

        <DueReminders />
      </div>
    </div>
  )
}

function ProductSearch() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState([])
  React.useEffect(() => {
    try {
      const inventory = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
      const r = inventory.filter((p) => (p.name || "").toLowerCase().includes(query.toLowerCase()) || (p.sku || "").toLowerCase().includes(query.toLowerCase()))
      setResults(r.slice(0, 10))
    } catch {
      setResults([])
    }
  }, [query])
  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">Search Component</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or SKU" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
      <ul className="divide-y">
        {results.map((p, i) => (
          <li key={i} className="py-2 text-sm">
            <span className="font-semibold">{p.name}</span> <span className="text-gray-500">({p.sku})</span>
          </li>
        ))}
        {!results.length && <li className="py-2 text-sm text-gray-500">No components found</li>}
      </ul>
    </div>
  )
}

function CustomerHistory() {
  const [key, setKey] = React.useState("")
  const [data, setData] = React.useState({})
  const load = () => {
    try {
      const v = JSON.parse(localStorage.getItem(`history:${key}`) || "{}")
      setData(v || {})
    } catch {
      setData({})
    }
  }
  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">Customer History</h2>
      <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Email, phone or name" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
      <button onClick={load} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 mb-4">Load</button>
      <div className="space-y-3 text-sm">
        <div>
          <h3 className="font-semibold">Quotations</h3>
          <ul className="list-disc ml-5">
            {(data.quotations || []).map((q, i) => (
              <li key={i}>
                {q.details?.number} • {q.totals?.total?.toFixed?.(2)} {q.details?.currency} • {new Date(q.savedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Invoices</h3>
          <ul className="list-disc ml-5">
            {(data.invoices || []).map((inv, i) => (
              <li key={i}>
                {inv.details?.number} • {inv.totals?.total?.toFixed?.(2)} {inv.details?.currency} • {new Date(inv.savedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Emails</h3>
          <ul className="list-disc ml-5">
            {(data.emails || []).map((em, i) => (
              <li key={i}>
                {em.type} {em.number} • {new Date(em.sentAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function PoToQuotation() {
  const [poNumber, setPoNumber] = React.useState("")
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", phone: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", qty: 1, price: 0, tax: 0 }])
  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", qty: 1, price: 0, tax: 0 }])
  const updateItem = (i, field, value) => setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? Number(value) : value } : row)))
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const generate = () => {
    const payload = { poNumber, customer, items }
    localStorage.setItem("poInbound", JSON.stringify(payload))
    window.location.href = "/quotation.html"
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
    <div className="border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#3D56A6] mb-2">PO → Quotation / Invoice</h2>
      <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Customer PO number" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.company} onChange={(e) => setCustomer({ ...customer, company: e.target.value })} placeholder="Company" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      </div>
      <div className="overflow-x-auto mb-3">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">Product</th>
              <th className="p-2">Description</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">Tax %</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="p-2"><input value={it.product} onChange={(e) => updateItem(i, "product", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                <td className="p-2"><input value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                <td className="p-2"><input type="number" min="0" value={it.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                <td className="p-2"><input type="number" min="0" step="0.01" value={it.price} onChange={(e) => updateItem(i, "price", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                <td className="p-2"><input type="number" min="0" step="0.1" value={it.tax} onChange={(e) => updateItem(i, "tax", e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                <td className="p-2 text-right"><button onClick={() => removeItem(i)} className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <button onClick={generate} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200">Generate Quotation</button>
        <button onClick={confirmAndInvoice} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm → Create Invoice</button>
      </div>
    </div>
  )
}

function DueReminders() {
  const [alerts, setAlerts] = React.useState([])
  React.useEffect(() => {
    const check = () => {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("history:"))
        const upcoming = []
        keys.forEach((k) => {
          const h = JSON.parse(localStorage.getItem(k) || "{}")
          ;(h.invoices || []).forEach((inv) => {
            const due = inv.details?.dueDate
            if (due) {
              const d = new Date(due).getTime()
              const now = Date.now()
              const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
              if (diffDays <= 3 && diffDays >= 0) {
                upcoming.push({ key: k, number: inv.details?.number, dueDate: due, days: diffDays })
              }
            }
          })
        })
        setAlerts(upcoming)
      } catch {
        setAlerts([])
      }
    }
    check()
    const id = setInterval(check, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  if (!alerts.length) return null
  return (
    <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-yellow-800 mb-2">Upcoming Payment Due</h2>
      <ul className="list-disc ml-5 text-sm text-yellow-900">
        {alerts.map((a, i) => (
          <li key={i}>
            {a.number} due on {new Date(a.dueDate).toLocaleDateString()} ({a.days} day{a.days !== 1 ? "s" : ""} left)
          </li>
        ))}
      </ul>
    </div>
  )
}
