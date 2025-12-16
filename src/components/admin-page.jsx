import React from "react"

export default function AdminPage() {
  const [view, setView] = React.useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get("view") || "home"
    } catch {
      return "home"
    }
  })
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {view === "home" && (
          <>
            <h1 className="text-3xl font-bold text-[#2D4485] mb-8">Admin</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Product Order</h2>
                <p className="text-sm text-gray-600">Create and manage product orders.</p>
                <button onClick={() => setView("poToQuotation")} className="mt-4 btn-primary">Open</button>
              </div>
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Quotation</h2>
                <p className="text-sm text-gray-600">Create and manage customer quotations.</p>
                <a href="/quotation.html" className="inline-block mt-4 btn-primary">Open</a>
              </div>
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Invoice</h2>
                <p className="text-sm text-gray-600">Create and send invoices.</p>
                <a href="/invoice.html" className="inline-block mt-4 btn-primary">Open</a>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Search Products</h2>
                <p className="text-sm text-gray-600">Find products by name or SKU.</p>
                <button onClick={() => setView("productSearch")} className="mt-4 btn-primary">Open</button>
              </div>
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Customer History</h2>
                <p className="text-sm text-gray-600">View quotations, invoices and emails.</p>
                <button onClick={() => setView("customerHistory")} className="mt-4 btn-primary">Open</button>
              </div>
            </div>

          </>
        )}

        {view === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D4485]">Notifications</h1>
              <button onClick={() => setView("home")} className="btn-outline">Back</button>
            </div>
            <Notifications />
          </div>
        )}

        {view === "productSearch" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D4485]">Search Products</h1>
              <button onClick={() => setView("home")} className="btn-outline">Back</button>
            </div>
            <ProductSearch />
          </div>
        )}

        {view === "customerHistory" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D4485]">Customer History</h1>
              <button onClick={() => setView("home")} className="btn-outline">Back</button>
            </div>
            <CustomerHistory />
          </div>
        )}

        {view === "poToQuotation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D4485]">Product Order</h1>
              <button onClick={() => setView("home")} className="btn-outline">Back</button>
            </div>
            <PoToQuotation />
          </div>
        )}
      </div>
    </div>
  )
}

function Notifications() {
  const [dueAlerts, setDueAlerts] = React.useState([])
  const [inventoryAlerts, setInventoryAlerts] = React.useState({ low: [], expiring: [] })
  React.useEffect(() => {
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
            if (diffDays <= 7 && diffDays >= 0) {
              upcoming.push({ key: k, number: inv.details?.number, dueDate: due, days: diffDays })
            }
          }
        })
      })
      setDueAlerts(upcoming.sort((a, b) => a.days - b.days))
    } catch {
      setDueAlerts([])
    }
    try {
      const inventory = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
      const low = inventory.filter((it) => Number(it.minStock || 0) > 0 && Number(it.stockQty || 0) < Number(it.minStock || 0))
      const expiring = inventory.filter((it) => {
        if (!it.expiry) return false
        const d = new Date(it.expiry).getTime()
        if (isNaN(d)) return false
        const diffDays = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24))
        return diffDays <= 14 && diffDays >= 0
      })
      setInventoryAlerts({ low, expiring })
    } catch {
      setInventoryAlerts({ low: [], expiring: [] })
    }
  }, [])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Upcoming Payment Due</h2>
        {dueAlerts.length === 0 ? (
          <div className="text-sm text-gray-600">No upcoming payments in 7 days.</div>
        ) : (
          <ul className="list-disc ml-5 text-sm text-gray-900">
            {dueAlerts.map((a, i) => (
              <li key={i}>
                {a.number} due on {new Date(a.dueDate).toLocaleDateString()} ({a.days} day{a.days !== 1 ? "s" : ""} left)
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Inventory — Low Stock</h2>
          {inventoryAlerts.low.length === 0 ? (
            <div className="text-sm text-gray-600">No low stock alerts.</div>
          ) : (
            <ul className="list-disc ml-5 text-sm text-gray-900">
              {inventoryAlerts.low.map((it, i) => (
                <li key={i}>{it.sku} • {it.name} • {Number(it.stockQty || 0)} / min {Number(it.minStock || 0)} • {it.warehouse || "Main"}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Inventory — Expiring Soon</h2>
          {inventoryAlerts.expiring.length === 0 ? (
            <div className="text-sm text-gray-600">No items expiring within 14 days.</div>
          ) : (
            <ul className="list-disc ml-5 text-sm text-gray-900">
              {inventoryAlerts.expiring.map((it, i) => (
                <li key={i}>{it.sku} • {it.name} • expires {new Date(it.expiry).toLocaleDateString()} • {it.warehouse || "Main"} • lot {it.lot || "-"}</li>
              ))}
            </ul>
          )}
        </div>
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
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Search Products</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or SKU" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
      <ul className="divide-y">
        {results.map((p, i) => (
          <li key={i} className="py-2 text-sm">
            <span className="font-semibold">{p.name}</span> <span className="text-gray-500">({p.sku})</span>
          </li>
        ))}
        {!results.length && <li className="py-2 text-sm text-gray-500">No products found</li>}
      </ul>
    </div>
  )
}

function CustomerHistory() {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState("")
  const [customers, setCustomers] = React.useState([])
  const [expandedIndex, setExpandedIndex] = React.useState(-1)
  const buildCustomers = React.useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("history:"))
      const list = []
      keys.forEach((k) => {
        try {
          const v = JSON.parse(localStorage.getItem(k) || "{}")
          const invoices = Array.isArray(v.invoices) ? v.invoices : []
          const map = new Map()
          invoices.forEach((inv) => {
            ;(inv.items || []).forEach((it) => {
              const n = (it.description || it.product || "").trim()
              if (!n) return
              const prev = map.get(n) || { name: n, qty: 0 }
              prev.qty += Number(it.qty || 0)
              map.set(n, prev)
            })
          })
          let last = 0
          ;[...(v.quotations || []), ...invoices].forEach((d) => {
            const t = new Date(d.savedAt || 0).getTime()
            if (t > last) last = t
          })
          list.push({
            key: k.slice("history:".length),
            name: v.customer?.name || "",
            company: v.customer?.company || "",
            email: v.customer?.email || "",
            products: Array.from(map.values()).sort((a, b) => b.qty - a.qty),
            last,
            raw: v,
          })
        } catch {}
      })
      const names = ["Taylor Swift", "Jennie Kim", "Lana Del Rey", "Jeon Jongkook", "Kairan"]
      const now = new Date()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)
      const nextActivity = new Date()
      nextActivity.setDate(nextActivity.getDate() + 3)
      const makeEntry = (name, idx) => {
        const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`
        const quotation = {
          details: { number: `Q-D${String(idx + 1).padStart(3, "0")}`, currency: "THB" },
          totals: { total: 1000 },
          items: [{ product: "Laser Service", description: "Basic Laser Service", qty: 1, price: 1000, tax: 7 }],
          crm: { nextActivity: nextActivity.toISOString() },
          savedAt: now.toISOString(),
        }
        const invoice = {
          details: { number: `INV-D${String(idx + 1).padStart(3, "0")}`, currency: "THB", dueDate: dueDate.toISOString().slice(0, 10) },
          totals: { subtotal: 1000, taxTotal: 70, total: 1070 },
          items: [{ product: "Laser Service", description: "Basic Laser Service", qty: 1, price: 1000, tax: 7 }],
          savedAt: now.toISOString(),
        }
        const raw = { customer: { name, company: "", email, phone: "" }, quotations: [quotation], invoices: [invoice] }
        const map = new Map()
        raw.invoices.forEach((inv) => {
          ;(inv.items || []).forEach((it) => {
            const n = (it.description || it.product || "").trim()
            if (!n) return
            const prev = map.get(n) || { name: n, qty: 0 }
            prev.qty += Number(it.qty || 0)
            map.set(n, prev)
          })
        })
        return {
          key: email,
          name,
          company: "",
          email,
          products: Array.from(map.values()).sort((a, b) => b.qty - a.qty),
          last: Date.now(),
          raw,
        }
      }
      const seeded = names.map((n, i) => makeEntry(n, i))
      const merged = [...seeded, ...list].sort((a, b) => b.last - a.last)
      const cleaned = merged.filter((c) => ((c.name || "").trim().length > 0))
      setCustomers(cleaned)
    } catch {
      setCustomers([])
    }
  }, [])
  React.useEffect(() => {
    buildCustomers()
  }, [buildCustomers])
  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    const base = customers
    if (!q) return base
    return base.filter((c) => (c.name || "").toLowerCase().includes(q))
  }, [customers, filter])
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Customer History</h2>
      <div className="flex items-center gap-2 mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <button onClick={() => setFilter(query)} className="btn-primary">Search</button>
      </div>
      <div className="card p-4">
        <div className="font-semibold text-gray-900 mb-2">Customers</div>
        <ul className="divide-y">
          {filtered.map((c, i) => {
            const open = expandedIndex === i
            return (
              <li key={i} className="py-2 text-sm">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedIndex(open ? -1 : i)}
                >
                  <div className="font-semibold text-gray-900">{c.name}</div>
                </button>
                {open && (
                  <div className="mt-3 ml-2 space-y-3">
                    <div>
                      <div className="font-semibold">Quotations</div>
                      <ul className="list-disc ml-5">
                        {(c.raw?.quotations || []).map((q, qi) => {
                          const meetLabel = q.crm?.nextActivity ? ` • Meeting ${new Date(q.crm.nextActivity).toLocaleString()}` : ""
                          const total = q.totals?.total?.toFixed?.(2)
                          return (
                            <li key={qi}>
                              {q.details?.number} • {total} {q.details?.currency}{meetLabel}
                              <div className="mt-1 ml-5">
                                <div className="text-gray-700">Items</div>
                                <ul className="list-disc ml-5">
                                  {(q.items || []).map((it, jj) => (
                                    <li key={jj}>{it.qty} × {it.description || it.product} @ {Number(it.price || 0).toFixed(2)}</li>
                                  ))}
                                </ul>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold">Invoices</div>
                      <ul className="list-disc ml-5">
                        {(c.raw?.invoices || []).map((inv, ii) => {
                          const total = inv.totals?.total?.toFixed?.(2)
                          const dueLabel = inv.details?.dueDate ? ` • Due ${new Date(inv.details.dueDate).toLocaleDateString()}` : ""
                          return (
                            <li key={ii}>
                              {inv.details?.number} • {total} {inv.details?.currency}{dueLabel}
                              <div className="mt-1 ml-5">
                                <div className="text-gray-700">Items</div>
                                <ul className="list-disc ml-5">
                                  {(inv.items || []).map((it, kk) => (
                                    <li key={kk}>{it.qty} × {it.description || it.product} @ {Number(it.price || 0).toFixed(2)}</li>
                                  ))}
                                </ul>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
          {filtered.length === 0 && <li className="py-2 text-sm text-gray-600">No matching customers</li>}
        </ul>
      </div>
    </div>
  )
}

function PoToQuotation() {
  const [poNumber, setPoNumber] = React.useState("")
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const prefilledRef = React.useRef(false)
  const saveTimer = React.useRef(null)
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
    if (!poNumber) {
      setPoNumber(generatePoNumber())
    }
  }, [poNumber, generatePoNumber])
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
  }, [customer.name, customer.company, customer.email, customer.phone, keyForCustomer])
  const generate = () => {
    const payload = { poNumber, customer, items }
    localStorage.setItem("poInbound", JSON.stringify(payload))
    window.location.href = "/quotation.html"
  }
  const saveDraft = () => {
    const payload = { poNumber, customer, items }
    localStorage.setItem("poInbound", JSON.stringify(payload))
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
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Product Order</h2>
      <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Customer PO number" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.company} onChange={(e) => setCustomer({ ...customer, company: e.target.value })} placeholder="Company" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.companyEmail} onChange={(e) => setCustomer({ ...customer, companyEmail: e.target.value })} placeholder="Company email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <input value={customer.companyPhone} onChange={(e) => setCustomer({ ...customer, companyPhone: e.target.value })} placeholder="Company phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
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
              <th className="p-2">Note</th>
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
                <td className="p-2"><input value={it.note} onChange={(e) => updateItem(i, "note", e.target.value)} placeholder="Add note" className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                <td className="p-2 text-right"><button onClick={() => removeItem(i)} className="btn-outline text-red-600 hover:bg-red-100">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <button onClick={saveDraft} className="btn-outline">Save</button>
        <button onClick={generate} className="btn-primary">Generate Quotation</button>
      </div>
    </div>
  )
}

