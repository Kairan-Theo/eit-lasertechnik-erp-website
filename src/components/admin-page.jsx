import React from "react"
import { Search } from "lucide-react"

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
              <div className="card p-6 border-l-4 border-l-[#2D4485]">
                <h2 className="text-lg font-semibold text-[#2D4485] mb-2">User Permissions</h2>
                <p className="text-sm text-gray-600">Manage user access to apps.</p>
                <button onClick={() => setView("userPermissions")} className="mt-4 btn-primary">Manage</button>
              </div>
            </div>

          </>
        )}

        {view === "userPermissions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D4485]">User Permissions</h1>
              <button onClick={() => setView("home")} className="btn-outline">Back</button>
            </div>
            <UserPermissions />
          </div>
        )}

        {view === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D4485]">Notifications</h1>
              <button onClick={() => setView("home")} className="btn-outline">Back</button>
            </div>
            <Notifications setActiveTab={setView} />
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

function UserPermissions() {
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const appsList = ["Manufacturing", "Inventory", "CRM", "Project Management", "Admin"]
  const [draft, setDraft] = React.useState({})
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(users)) return []
    return users.filter(u => 
      (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/api/users/", {
        headers: {
          "Authorization": `Token ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (e) {
      setError("Error connecting to server")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggle = async (userId, appName, currentApps) => {
    const base = draft[userId] !== undefined ? draft[userId] : currentApps
    const apps = base === "all" ? appsList : base.split(",").filter(a => a)
    let newApps = []
    
    if (apps.includes(appName)) {
        newApps = apps.filter(a => a !== appName)
    } else {
        newApps = [...apps, appName]
    }
    
    const newAppsStr = newApps.join(",")
    
    setDraft({ ...draft, [userId]: newAppsStr })
    setUsers(users.map(u => (u.id === userId ? { ...u, allowed_apps: newAppsStr } : u)))
  }
  


  const handleSave = async () => {
    if (!Object.keys(draft).length) return
    setSaving(true)
    try {
      const token = localStorage.getItem("authToken")
      for (const [userId, allowed] of Object.entries(draft)) {
        const response = await fetch("http://localhost:8000/api/users/permissions/", {
          method: "POST",
          headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ user_id: Number(userId), allowed_apps: allowed })
        })
        if (!response.ok) {
          throw new Error("Failed to save")
        }
      }
      setDraft({})
    } catch (e) {
      alert("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) return <div>Loading users...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="card overflow-hidden">
      <div className="p-3 border-b border-gray-200 bg-gray-50/50">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all shadow-sm hover:border-gray-300"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              {appsList.map(app => (
                <th key={app} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {app}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => {
                const currentApps = user.allowed_apps || ""
                const isAll = currentApps === "all"
                const appList = isAll ? appsList : currentApps.split(",")
                // Check if this is a new user (no apps assigned and not admin)
                const isNewUser = !user.is_staff && currentApps === ""
                
                return (
                  <tr key={user.id} className={isNewUser ? "bg-blue-50/50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {user.name}
                        {isNewUser && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">NEW</span>}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_staff ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>
                        {user.is_staff ? "Admin" : "User"}
                      </span>
                    </td>
                    {appsList.map(app => {
                        const hasAccess = isAll || appList.includes(app)
                        return (
                            <td key={app} className="px-6 py-4 whitespace-nowrap text-center">
                                <input 
                                    type="checkbox" 
                                    checked={hasAccess}
                                    onChange={() => handleToggle(user.id, app, currentApps)}
                                    className="h-4 w-4 text-[#2D4485] focus:ring-[#2D4485] border-gray-300 rounded"
                                />
                            </td>
                        )
                    })}
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t bg-gray-50 flex items-center justify-end">
        <button onClick={handleSave} disabled={saving || !Object.keys(draft).length} className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  )
}

function Notifications({ setActiveTab }) {
  const [teamAlerts, setTeamAlerts] = React.useState([])

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/api/notifications/", {
        headers: { "Authorization": `Token ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTeamAlerts(data)
      }
    } catch {
      setTeamAlerts([])
    }
  }

  React.useEffect(() => {
    loadNotifications()
  }, [])
  
  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      await fetch("http://localhost:8000/api/notifications/read/", {
        method: "POST",
        headers: { 
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id })
      })
      setTeamAlerts(teamAlerts.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const handleNotificationClick = (notification) => {
      if (notification.type === 'signup' && setActiveTab) {
          setActiveTab('userPermissions')
      }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D4485]">Notifications</h2>
          <button onClick={loadNotifications} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>
        {teamAlerts.length === 0 ? (
          <div className="text-sm text-gray-600">No recent notifications.</div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
            {teamAlerts.map((n) => (
              <div key={n.id} className={`p-3 rounded-md border ${!n.is_read ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'} flex justify-between items-start`}>
                 <div className="cursor-pointer flex-1" onClick={() => handleNotificationClick(n)}>
                    <span className={`text-sm block ${!n.is_read ? 'text-blue-800 font-medium' : 'text-gray-800'}`}>
                      {(() => {
                        const m = String(n.message || "")
                        const dashIdx = m.indexOf(" - ")
                        const header = dashIdx >= 0 ? m.slice(0, dashIdx) : m
                        const rest = dashIdx >= 0 ? m.slice(dashIdx + 3) : ""
                        const parts = header.split("  ")
                        const page = parts[0] || ""
                        const company = parts[1] || ""
                        const hasStructured = !!(page && company && dashIdx >= 0)
                        return (
                          <>
                            {company ? <span className="font-bold">{company}</span> : null}
                            {(company && page) ? " " : null}
                            {page ? <span className="font-bold">{page}</span> : null}
                            {company ? " - " : null}
                            {hasStructured ? rest : (!page && !company ? m : rest)}
                          </>
                        )
                      })()}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
                 </div>
                 {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="text-xs text-blue-600 hover:underline ml-4">
                        Mark Read
                    </button>
                 )}
              </div>
            ))}
          </div>
        )}
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
        {!results.length && <li className="py-2 text-sm text-gray-500">No components found</li>}
      </ul>
    </div>
  )
}

function CustomerHistory() {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState("")
  const [customers, setCustomers] = React.useState([])
  const [expandedIndex, setExpandedIndex] = React.useState(-1)
  const [bigDoc, setBigDoc] = React.useState(null)
  const [docType, setDocType] = React.useState("all")
  const [docView, setDocView] = React.useState("table")
  const [sortKey, setSortKey] = React.useState("date")
  const [sortDir, setSortDir] = React.useState("desc")
  const [page, setPage] = React.useState(1)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const f = params.get("filter") || ""
      if (f) {
        setQuery(f)
        setFilter(f)
        setExpandedIndex(0)
      }
    } catch {}
  }, [])
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
            phone: v.customer?.phone || "",
            companyEmail: v.customer?.companyEmail || "",
            companyPhone: v.customer?.companyPhone || "",
            products: Array.from(map.values()).sort((a, b) => b.qty - a.qty),
            last,
            raw: v,
          })
        } catch {}
      })
      const merged = list.sort((a, b) => b.last - a.last)
      const cleaned = merged.filter((c) => ((c.name || c.company || c.email || c.phone || "").trim().length > 0))
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
    return base.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.companyEmail || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.companyPhone || "").toLowerCase().includes(q),
    )
  }, [customers, filter])
  const allDocs = React.useMemo(() => {
    const docs = []
    customers.forEach((c) => {
      ;(c.raw?.quotations || []).forEach((q) => {
        docs.push({
          type: "quotation",
          number: q.details?.number || "",
          currency: q.details?.currency || "",
          total: q.totals?.total,
          savedAt: q.savedAt,
          customerName: c.name || c.company || c.email || c.phone || "",
          items: Array.isArray(q.items) ? q.items : [],
        })
      })
      ;(c.raw?.invoices || []).forEach((inv) => {
        docs.push({
          type: "invoice",
          number: inv.details?.number || "",
          currency: inv.details?.currency || "",
          total: inv.totals?.total,
          savedAt: inv.savedAt,
          dueDate: inv.details?.dueDate,
          customerName: c.name || c.company || c.email || c.phone || "",
          items: Array.isArray(inv.items) ? inv.items : [],
        })
      })
    })
    return docs.sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime())
  }, [customers])
  const pageSize = docView === "cards" ? 12 : 20
  const historyResults = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    let base = allDocs
    if (docType !== "all") {
      base = base.filter((d) => d.type === docType)
    }
    if (q) {
      base = base.filter((d) => {
        if ((d.number || "").toLowerCase().includes(q)) return true
        if ((d.customerName || "").toLowerCase().includes(q)) return true
        return (d.items || []).some((it) => ((it.description || it.product || "").toLowerCase().includes(q)))
      })
    }
    base = base.slice().sort((a, b) => {
      if (sortKey === "amount") {
        const va = Number(a.total || 0)
        const vb = Number(b.total || 0)
        return sortDir === "asc" ? va - vb : vb - va
      } else {
        const ta = new Date(a.savedAt || 0).getTime()
        const tb = new Date(b.savedAt || 0).getTime()
        return sortDir === "asc" ? ta - tb : tb - ta
      }
    })
    const start = (page - 1) * pageSize
    return base.slice(start, start + pageSize)
  }, [allDocs, filter, docType, sortKey, sortDir, page, pageSize])
  const totalCount = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    let base = allDocs
    if (docType !== "all") base = base.filter((d) => d.type === docType)
    if (q) {
      base = base.filter((d) => {
        if ((d.number || "").toLowerCase().includes(q)) return true
        if ((d.customerName || "").toLowerCase().includes(q)) return true
        return (d.items || []).some((it) => ((it.description || it.product || "").toLowerCase().includes(q)))
      })
    }
    return base.length
  }, [allDocs, filter, docType])
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const goPrev = () => setPage((p) => Math.max(1, p - 1))
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1))
  const currencySymbol = (cur) => (cur === "THB" ? "฿" : cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : cur || "")
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Customer History</h2>
      <div className="flex items-center gap-2 mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, company, email, phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <button onClick={() => { setFilter(query); setPage(1) }} className="btn-primary">Search</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="text-sm text-gray-700">View:</div>
        <div className="flex rounded-md border border-gray-300 overflow-hidden">
          <button className={`px-3 py-1 text-sm ${docView === "table" ? "bg-gray-200" : "bg-white"}`} onClick={() => { setDocView("table"); setPage(1) }}>Table</button>
          <button className={`px-3 py-1 text-sm ${docView === "cards" ? "bg-gray-200" : "bg-white"}`} onClick={() => { setDocView("cards"); setPage(1) }}>Cards</button>
        </div>
        <div className="text-sm text-gray-700 ml-2">Type:</div>
        <div className="flex rounded-md border border-gray-300 overflow-hidden">
          <button className={`px-3 py-1 text-sm ${docType === "all" ? "bg-gray-200" : "bg-white"}`} onClick={() => { setDocType("all"); setPage(1) }}>All</button>
          <button className={`px-3 py-1 text-sm ${docType === "quotation" ? "bg-gray-200" : "bg-white"}`} onClick={() => { setDocType("quotation"); setPage(1) }}>Quotations</button>
          <button className={`px-3 py-1 text-sm ${docType === "invoice" ? "bg-gray-200" : "bg-white"}`} onClick={() => { setDocType("invoice"); setPage(1) }}>Invoices</button>
        </div>
        <div className="text-sm text-gray-700 ml-2">Sort:</div>
        <select value={sortKey} onChange={(e) => { setSortKey(e.target.value); setPage(1) }} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </select>
        <select value={sortDir} onChange={(e) => { setSortDir(e.target.value); setPage(1) }} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
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
                  <div className="font-semibold text-gray-900">{c.name || c.company || c.email || c.phone}</div>
                  <div className="text-gray-600 text-xs">{c.company}</div>
                  <div className="text-gray-600 text-xs">{[c.email, c.companyEmail].filter(Boolean).join(" • ")}</div>
                  <div className="text-gray-600 text-xs">{[c.phone, c.companyPhone].filter(Boolean).join(" • ")}</div>
                  <div className="text-gray-700 text-xs">
                    Top products: {c.products.slice(0, 3).map((p) => `${p.name} (${p.qty})`).join(", ") || "-"}
                  </div>
                  <div className="text-gray-700 text-xs">
                    Quotations: {(c.raw?.quotations || []).length} • Invoices: {(c.raw?.invoices || []).length}
                  </div>
                </button>
                {open && (
                  <div className="mt-3 ml-2 space-y-3">
                    <div className="bg-white rounded-xl border p-3 text-[12px]">
                      <div className="font-semibold mb-2">Customer Info</div>
                      <div className="grid grid-cols-1 gap-1 text-gray-800">
                        <div><span className="text-gray-600">Name:</span> {c.name || "-"}</div>
                        <div><span className="text-gray-600">Company:</span> {c.company || "-"}</div>
                        <div><span className="text-gray-600">Email:</span> {[c.email, c.companyEmail].filter(Boolean).join(" • ") || "-"}</div>
                        <div><span className="text-gray-600">Phone:</span> {[c.phone, c.companyPhone].filter(Boolean).join(" • ") || "-"}</div>
                        <div className="flex flex-wrap gap-1 items-center"><span className="text-gray-600">Products:</span> {c.products.slice(0, 6).map((p, idx) => (
                          <button key={idx} className="px-2 py-0.5 rounded-full border border-gray-300 text-xs hover:bg-gray-100" onClick={() => { setFilter(p.name); setQuery(p.name); setPage(1) }}>{p.name}</button>
                        ))}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Quotations</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(c.raw?.quotations || []).map((q, qi) => {
                          const sym = currencySymbol(q.details?.currency)
                          const subtotal = Array.isArray(q.items) ? q.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0) : 0
                          const taxTotal = Array.isArray(q.items) ? q.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0) * (Number(it.tax || 0) / 100), 0) : 0
                          const total = Number(q.totals?.total ?? subtotal + taxTotal)
                          return (
                            <div
                              key={qi}
                              className="bg-white rounded-xl shadow-sm border p-2 text-[10px] aspect-square max-w-[220px] mx-auto cursor-pointer hover:shadow-md transition"
                              onClick={() => setBigDoc({ type: "quotation", doc: q, customer: c })}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="text-[#2D4485] font-bold text-[12px]">EIT Lasertechnik</div>
                                  <div className="text-gray-500 text-[10px]">Quotation</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-semibold text-[#2D4485]">{q.details?.number || "-"}</div>
                                  <div className="text-[9px] text-gray-700">{q.details?.date || "-"}</div>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-700 mb-2">
                                <div className="font-semibold text-gray-900">Customer</div>
                                <div>{c.name || "-"}</div>
                                <div className="text-gray-600">{c.company || ""}</div>
                                <div className="text-gray-600">{[c.email, c.companyEmail].filter(Boolean).join(" • ")}</div>
                                <div className="text-gray-600">{[c.phone, c.companyPhone].filter(Boolean).join(" • ")}</div>
                              </div>
                              <div className="overflow-x-auto mb-2 h-[90px]">
                                <table className="min-w-full text-[10px]">
                                  <thead>
                                    <tr className="bg-gray-100 text-gray-700">
                                      <th className="p-1 text-left">QTY</th>
                                      <th className="p-1 text-left">DESCRIPTION</th>
                                      <th className="p-1 text-left">PRICE</th>
                                      <th className="p-1 text-left">AMOUNT</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(q.items || []).map((it, i) => {
                                      const amount = Number(it.qty || 0) * Number(it.price || 0)
                                      return (
                                        <tr key={i} className="border-t">
                                          <td className="p-1">{it.qty}</td>
                                          <td className="p-1">
                                            <div>{it.description || it.product}</div>
                                            {it.note ? <div className="text-[8px] text-gray-500 mt-1">Note: {it.note}</div> : null}
                                          </td>
                                          <td className="p-1">{sym} {Number(it.price || 0).toFixed(2)}</td>
                                          <td className="p-1">{sym} {amount.toFixed(2)}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-end">
                                <div className="w-28 text-[10px] space-y-1">
                                  <div className="flex justify-between"><span className="text-gray-700">SUBTOTAL</span><span className="font-semibold">{sym} {subtotal.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-700">TAX</span><span className="font-semibold">{sym} {taxTotal.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-900 font-semibold">TOTAL</span><span className="font-semibold">{sym} {total.toFixed(2)}</span></div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Invoices</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(c.raw?.invoices || []).map((inv, ii) => {
                          const sym = currencySymbol(inv.details?.currency)
                          const subtotal = Array.isArray(inv.items) ? inv.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0) : 0
                          const taxTotal = Array.isArray(inv.items) ? inv.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0) * (Number(it.tax || 0) / 100), 0) : 0
                          const total = Number(inv.totals?.total ?? subtotal + taxTotal)
                          return (
                            <div
                              key={ii}
                              className="bg-white rounded-xl shadow-sm border p-2 text-[10px] aspect-square max-w-[220px] mx-auto cursor-pointer hover:shadow-md transition"
                              onClick={() => setBigDoc({ type: "invoice", doc: inv, customer: c })}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="text-[#2D4485] font-bold text-[12px]">EIT Lasertechnik</div>
                                  <div className="text-gray-500 text-[10px]">Invoice</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-semibold text-[#2D4485]">{inv.details?.number || "-"}</div>
                                  <div className="text-[9px] text-gray-700">{inv.details?.date || "-"}</div>
                                  <div className="text-[9px] text-gray-700">{inv.details?.dueDate ? `Due ${new Date(inv.details.dueDate).toLocaleDateString()}` : ""}</div>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-700 mb-2">
                                <div className="font-semibold text-gray-900">Customer</div>
                                <div>{c.name || "-"}</div>
                                <div className="text-gray-600">{c.company || ""}</div>
                                <div className="text-gray-600">{[c.email, c.companyEmail].filter(Boolean).join(" • ")}</div>
                                <div className="text-gray-600">{[c.phone, c.companyPhone].filter(Boolean).join(" • ")}</div>
                              </div>
                              <div className="overflow-x-auto mb-2 h-[90px]">
                                <table className="min-w-full text-[10px]">
                                  <thead>
                                    <tr className="bg-gray-100 text-gray-700">
                                      <th className="p-1 text-left">QTY</th>
                                      <th className="p-1 text-left">DESCRIPTION</th>
                                      <th className="p-1 text-left">PRICE</th>
                                      <th className="p-1 text-left">AMOUNT</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(inv.items || []).map((it, i) => {
                                      const amount = Number(it.qty || 0) * Number(it.price || 0)
                                      return (
                                        <tr key={i} className="border-t">
                                          <td className="p-1">{it.qty}</td>
                                          <td className="p-1">{it.description || it.product}</td>
                                          <td className="p-1">{sym} {Number(it.price || 0).toFixed(2)}</td>
                                          <td className="p-1">{sym} {amount.toFixed(2)}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-end">
                                <div className="w-28 text-[10px] space-y-1">
                                  <div className="flex justify-between"><span className="text-gray-700">SUBTOTAL</span><span className="font-semibold">{sym} {subtotal.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-700">TAX</span><span className="font-semibold">{sym} {taxTotal.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-900 font-semibold">TOTAL</span><span className="font-semibold">{sym} {total.toFixed(2)}</span></div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
          {filtered.length === 0 && <li className="py-2 text-sm text-gray-600">No matching customers</li>}
        </ul>
      </div>
      {filter && (
      <div className="card p-4 mt-4">
        <div className="font-semibold text-gray-900 mb-2">Matching History</div>
        {docView === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Type</th>
                  <th className="p-2">Number</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Customer</th>
                </tr>
              </thead>
              <tbody>
                {historyResults.map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{h.type === "quotation" ? "Quotation" : "Invoice"}</td>
                    <td className="p-2">{h.number}</td>
                    <td className="p-2">{new Date(h.savedAt).toLocaleString()}</td>
                    <td className="p-2">{h.total?.toFixed?.(2)} {h.currency}</td>
                    <td className="p-2">{h.customerName}</td>
                  </tr>
                ))}
                {historyResults.length === 0 && (
                  <tr>
                    <td className="p-2 text-gray-600" colSpan={5}>No history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {historyResults.map((h, i) => {
              const sym = currencySymbol(h.currency)
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border p-2 text-[10px] aspect-square max-w-[220px] mx-auto cursor-pointer hover:shadow-md transition"
                  onClick={() => setBigDoc({ type: h.type, doc: { details: { number: h.number, date: new Date(h.savedAt).toISOString().slice(0, 10), currency: h.currency }, items: h.items, totals: { total: h.total } }, customer: { name: h.customerName } })}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[#2D4485] font-bold text-[12px]">EIT Lasertechnik</div>
                      <div className="text-gray-500 text-[10px]">{h.type === "quotation" ? "Quotation" : "Invoice"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#2D4485]">{h.number || "-"}</div>
                      <div className="text-[9px] text-gray-700">{new Date(h.savedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-700 mb-2">
                    <div className="font-semibold text-gray-900">Customer</div>
                    <div>{h.customerName || "-"}</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="w-28 text-[10px] space-y-1">
                      <div className="flex justify-between"><span className="text-gray-700">TOTAL</span><span className="font-semibold">{sym} {Number(h.total || 0).toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              )
            })}
            {historyResults.length === 0 && <div className="text-sm text-gray-600">No history found</div>}
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-700">Page {page} / {totalPages}</div>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={goPrev} disabled={page <= 1}>Prev</button>
            <button className="btn-outline" onClick={goNext} disabled={page >= totalPages}>Next</button>
          </div>
        </div>
      </div>
      )}
      {bigDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBigDoc(null)}></div>
          <div className="relative bg-white rounded-xl shadow-xl border w-full max-w-4xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold text-[#2D4485]">{bigDoc.type === "quotation" ? "Quotation" : "Invoice"} Preview</div>
              <button className="btn-outline" onClick={() => setBigDoc(null)}>Close</button>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              {(() => {
                const d = bigDoc.doc
                const c = bigDoc.customer
                const sym = currencySymbol(d.details?.currency)
                const subtotal = Array.isArray(d.items) ? d.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0) : 0
                const taxTotal = Array.isArray(d.items) ? d.items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0) * (Number(it.tax || 0) / 100), 0) : 0
                const total = Number(d.totals?.total ?? subtotal + taxTotal)
                return (
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#3D56A6] rounded flex items-center justify-center">
                          <img src="/eit-icon.png" alt="EIT" className="w-8 h-8" />
                        </div>
                        <div className="leading-tight">
                          <div className="text-[#3D56A6] font-bold text-lg">EIT Lasertechnik</div>
                          <div className="text-gray-500 text-sm">{bigDoc.type === "quotation" ? "Quotation" : "Invoice"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#3D56A6] tracking-wide">{bigDoc.type === "quotation" ? "QUOTATION" : "INVOICE"}</div>
                        <div className="mt-2 text-sm text-gray-700">{bigDoc.type === "quotation" ? "Quotation Number" : "Invoice Number"} : <span className="font-semibold">{d.details?.number}</span></div>
                        <div className="text-sm text-gray-700">{bigDoc.type === "quotation" ? "Quote Date" : "Invoice Date"} : <span className="font-semibold">{d.details?.date}</span></div>
                        {bigDoc.type === "invoice" && d.details?.dueDate && <div className="text-sm text-gray-700">Due Date : <span className="font-semibold">{d.details?.dueDate}</span></div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="text-sm text-gray-600">{bigDoc.type === "quotation" ? "Quote to:" : "Bill to:"}</div>
                        <div className="text-[#3D56A6] font-semibold text-lg">{c.name || c.company || "-"}</div>
                        <div className="text-gray-600 text-sm">{c.company || ""}</div>
                        <div className="text-gray-600 text-sm">{[c.email, c.companyEmail].filter(Boolean).join(" • ")}</div>
                        <div className="text-gray-600 text-sm">{[c.phone, c.companyPhone].filter(Boolean).join(" • ")}</div>
                      </div>
                      <div className="md:text-right">
                        <div className="text-sm text-gray-600">Currency:</div>
                        <div className="text-gray-900 font-semibold">{d.details?.currency}</div>
                      </div>
                    </div>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700">
                            <th className="p-2 text-left">QTY</th>
                            <th className="p-2 text-left">DESCRIPTION</th>
                            <th className="p-2 text-left">PRICE</th>
                            <th className="p-2 text-left">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(d.items || []).map((it, i) => {
                            const amount = Number(it.qty || 0) * Number(it.price || 0)
                            return (
                              <tr key={i} className="border-t">
                                <td className="p-2">{it.qty}</td>
                                <td className="p-2">
                                  <div>{it.description || it.product}</div>
                                  {it.note ? <div className="text-xs text-gray-500 mt-1">Note: {it.note}</div> : null}
                                </td>
                                <td className="p-2">{sym} {Number(it.price || 0).toFixed(2)}</td>
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
                            <div className="flex justify-between text-sm"><span className="text-gray-700">SUBTOTAL :</span><span className="font-semibold">{sym} {subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-700">TAX :</span><span className="font-semibold">{sym} {taxTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-base mt-1"><span className="text-gray-900 font-semibold">TOTAL :</span><span className="font-bold text-[#3D56A6]">{sym} {total.toFixed(2)}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PoToQuotation() {
  const [poNumber, setPoNumber] = React.useState("")
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const [showForm, setShowForm] = React.useState(false)
  const [poList, setPoList] = React.useState([])
  const [errors, setErrors] = React.useState({ email: "", companyEmail: "", phone: "", companyPhone: "" })
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
  const startNew = () => {
    setPoNumber("")
    setCustomer({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
    setItems([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
    prefilledRef.current = false
    setShowForm(true)
  }
  const editPo = (idx) => {
    const p = poList[idx]
    if (!p) return
    setPoNumber(p.poNumber || "")
    setCustomer(p.customer || { name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
    setItems(Array.isArray(p.items) && p.items.length ? p.items : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
    setShowForm(true)
  }
  const deletePo = (idx) => {
    const next = poList.filter((_, i) => i !== idx)
    persistPoList(next)
  }
  const generateFromList = (idx) => {
    const p = poList[idx]
    if (!p) return
    localStorage.setItem("poInbound", JSON.stringify(p))
    window.location.href = "/quotation.html"
  }
  const generate = () => {
    const errs = validateCustomer(customer)
    setErrors(errs)
    if (Object.values(errs).some((e) => !!e)) return
    const payload = { poNumber, customer, items }
    localStorage.setItem("poInbound", JSON.stringify(payload))
    window.location.href = "/quotation.html"
  }
  const saveDraft = () => {
    const errs = validateCustomer(customer)
    setErrors(errs)
    if (Object.values(errs).some((e) => !!e)) return
    const payload = { poNumber, customer, items, updatedAt: new Date().toISOString() }
    const idx = poList.findIndex((p) => p.poNumber === poNumber)
    if (idx >= 0) {
      const next = poList.slice()
      next[idx] = payload
      persistPoList(next)
    } else {
      persistPoList([payload, ...poList])
    }
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
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Product Order</h2>
      {!showForm && (
        <>
          <div className="mb-4">
            <button onClick={startNew} className="btn-primary">Add Product Order</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">PO Number</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Items</th>
                  <th className="p-2">Updated</th>
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
                      <div className="flex gap-2">
                        <button onClick={() => editPo(i)} className="btn-outline">Edit</button>
                        <button onClick={() => generateFromList(i)} className="btn-primary">Generate Quotation</button>
                        <button onClick={() => deletePo(i)} className="btn-outline text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {poList.length === 0 && (
                  <tr>
                    <td className="p-2 text-gray-600" colSpan={5}>No product orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {showForm && (
        <>
          <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Customer PO number" className="w-full rounded-md border border-gray-300 px-3 py-2 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              onBlur={(e) => setCustomer({ ...customer, name: e.target.value.trim() })}
              placeholder="Customer name"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <input
              value={customer.company}
              onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
              onBlur={(e) => setCustomer({ ...customer, company: e.target.value.trim() })}
              placeholder="Company"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <div>
              <input
                type="email"
                value={customer.email}
                onChange={(e) => {
                  const next = { ...customer, email: e.target.value }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                onBlur={(e) => {
                  const next = { ...customer, email: e.target.value.trim().toLowerCase() }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                placeholder="Email"
                className={`w-full rounded-md border px-3 py-2 ${errors.email ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
            </div>
            <div>
              <input
                type="email"
                value={customer.companyEmail}
                onChange={(e) => {
                  const next = { ...customer, companyEmail: e.target.value }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                onBlur={(e) => {
                  const next = { ...customer, companyEmail: e.target.value.trim().toLowerCase() }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                placeholder="Company email"
                className={`w-full rounded-md border px-3 py-2 ${errors.companyEmail ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.companyEmail && <div className="text-xs text-red-600 mt-1">{errors.companyEmail}</div>}
            </div>
            <div>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => {
                  const next = { ...customer, phone: e.target.value }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                onBlur={(e) => {
                  const next = { ...customer, phone: normalizePhone(e.target.value) }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                placeholder="Phone"
                className={`w-full rounded-md border px-3 py-2 ${errors.phone ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.phone && <div className="text-xs text-red-600 mt-1">{errors.phone}</div>}
            </div>
            <div>
              <input
                type="tel"
                value={customer.companyPhone}
                onChange={(e) => {
                  const next = { ...customer, companyPhone: e.target.value }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                onBlur={(e) => {
                  const next = { ...customer, companyPhone: normalizePhone(e.target.value) }
                  setCustomer(next)
                  setErrors(validateCustomer(next))
                }}
                placeholder="Company phone"
                className={`w-full rounded-md border px-3 py-2 ${errors.companyPhone ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.companyPhone && <div className="text-xs text-red-600 mt-1">{errors.companyPhone}</div>}
            </div>
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
                    <td className="p-2 text-right"><button onClick={() => removeItem(i)} className="btn-outline">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={saveDraft} disabled={!isValid} className="btn-outline disabled:opacity-50">Save</button>
            <button onClick={generate} disabled={!isValid} className="btn-primary disabled:opacity-50">Generate Quotation</button>
            <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}

