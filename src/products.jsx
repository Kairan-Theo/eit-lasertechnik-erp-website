import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"
import { API_BASE_URL } from "./config"

function ProductsPage() {
  const [products, setProducts] = React.useState([])
  const [query, setQuery] = React.useState("")
  const [showNew, setShowNew] = React.useState(false)
  const [newItem, setNewItem] = React.useState({ name: "", sku: "", qty: 1 })
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openBulkDelete, setOpenBulkDelete] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState(null)
  const [nameHints, setNameHints] = React.useState([])
  const [nameFocused, setNameFocused] = React.useState(false)
  const [editNameFocused, setEditNameFocused] = React.useState(false)
  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/component_entries/`)
        if (!res.ok) throw new Error("Failed to load components")
        const data = await res.json()
        const mapped = (Array.isArray(data) ? data : []).map((c) => ({
          id: c.id,
          name: c.component_name || "",
          sku: "",
          category: "",
          qty: Number(c.quantity) || 0,
          state: "",
          favorite: false,
        }))
        setProducts(mapped)
      } catch (e) {
        console.error("Failed to load component entries", e)
      }
    })()
  }, [])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("componentHints") || "[]"
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) setNameHints(arr)
    } catch {}
  }, [])
  const updateProducts = (next) => { setProducts(next) }
  const toggleFavorite = (id) => updateProducts(products.map(p => p.id===id ? { ...p, favorite: !p.favorite } : p))
  const parseCnNum = (s) => {
    const m = /CN(?:\/|-)?(\d+)/.exec(String(s || ""))
    return m ? parseInt(m[1], 10) : null
  }
  const nextCnNumber = () => {
    let max = 0
    for (const p of products) {
      const n = parseCnNum(p.sku)
      if (Number.isFinite(n) && n > max) max = n
    }
    return `CN-${String(max + 1).padStart(5, "0")}`
  }
  React.useEffect(() => {
    if (products.length) {
      const isCn = (s) => /^CN-\d{5}$/.test(String(s || ""))
      let max = 0
      for (const p of products) {
        const n = parseCnNum(p.sku)
        if (Number.isFinite(n) && n > max) max = n
      }
      let changed = false
      const next = products.map((p) => {
        if (!isCn(p.sku)) {
          const num = String(++max).padStart(5, "0")
          changed = true
          return { ...p, sku: `CN-${num}` }
        }
        return p
      })
      if (changed) updateProducts(next)
    }
  }, []) 
  const filtered = products.filter((p) => {
    const q = query.toLowerCase()
    return (p.name || "").toLowerCase().includes(q)
  })
  const allSelected = filtered.length > 0 && filtered.every((p) => selectedRows.includes(p.id))
  const toggleSelectAll = () => {
    if (allSelected) setSelectedRows([])
    else setSelectedRows(filtered.map((p) => p.id))
  }
  const toggleRow = (id) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const confirmBulkDelete = async () => {
    try {
      const ids = selectedRows.slice()
      for (const id of ids) {
        try {
          await fetch(`${API_BASE_URL}/api/component_entries/${id}/`, { method: "DELETE" })
        } catch {}
      }
    } finally {
      const next = products.filter((p) => !selectedRows.includes(p.id))
      updateProducts(next)
      setSelectedRows([])
      setOpenBulkDelete(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full bg-gray-50">
        <div className="w-full mx-auto p-6 min-h-full">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Component</h1>
                {/* Comment: Tab header below the page title for MO / BOM / Components */}
                {(() => {
                  // Comment: Tabs config for manufacturing navigation — consistent across pages
                  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
                  const tabsNav = [
                    { id: "manufacturing", label: "Manufacturing Order", href: "/manufacturing.html" },
                    { id: "bom", label: "Bill of Materials", href: "/bom.html" },
                    { id: "components", label: "Components", href: "/products.html" },
                  ]
                  const activeTabId = currentPath.includes("bom") ? "bom" : (currentPath.includes("product") ? "components" : "manufacturing")
                  return (
                    <div className="mt-2 flex border-b border-gray-200 overflow-x-auto">
                      {tabsNav.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { window.location.href = tab.href }}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTabId === tab.id
                              ? "border-[#2D4485] text-[#2D4485]"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                          title={tab.label}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Comment: Place New Component next to Search for better proximity */}
              <button
                className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                title="New component"
                onClick={() => setShowNew(true)}
              >
                New component
              </button>
              {selectedRows.length > 0 && (
                <button
                  onClick={() => setOpenBulkDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete selected components"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Delete ({selectedRows.length})</span>
                </button>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Component"
                  className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear Search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="text-slate-500 font-medium text-sm">
                {query ? (
                  <span>Showing <span className="text-slate-900 font-bold">{filtered.length}</span> of <span className="text-slate-900 font-bold">{products.length}</span> components</span>
                ) : (
                  <span>Total: <span className="text-slate-900 font-bold">{products.length}</span> components</span>
                )}
              </div>
            </div>
          </div>
          

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto max-w-4xl mx-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4 border-b w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 border-b w-14">Index</th>
                  <th className="p-4 border-b w-[65%]">Component</th>
                  <th className="p-4 border-b w-[20%] text-right">Quantity Available</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i)=> {
                  const checked = selectedRows.includes(p.id)
                  return (
                    <tr key={p.id} className={`transition-colors ${checked ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}>
                      <td className="p-4 border-b">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={checked}
                          onChange={() => toggleRow(p.id)}
                        />
                      </td>
                      <td className="p-4 border-b w-14 text-gray-800 font-medium">{i + 1}</td>
                      <td className="p-4 border-b w-[65%] text-gray-600">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-[#2D4485] font-semibold hover:underline truncate"
                            title={p.name}
                            onClick={() => setEditingItem(p)}
                          >
                            {p.name}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 border-b w-[20%] text-right text-gray-600">
                        <span className="text-gray-800">{Number(p.qty).toFixed(2)}</span>
                      </td>
                    </tr>
                  )
                })}
                {!filtered.length && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={4}>No components found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {editingItem && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setEditingItem(null)}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[640px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Component</h3>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setEditingItem(null)}>✕</button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-x-10 gap-y-3">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-1">
                    <div className="text-sm text-gray-700">Component</div>
                    <div className="relative">
                      <input
                        value={editingItem.name || ""}
                        onChange={(e)=>setEditingItem({...editingItem, name:e.target.value})}
                        onFocus={()=>setEditNameFocused(true)}
                        onBlur={()=>setTimeout(()=>setEditNameFocused(false), 120)}
                        placeholder="Component name"
                        className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2"
                      />
                      {editNameFocused && (() => {
                        const q = String(editingItem.name || "").toLowerCase()
                        const base = Array.from(new Set(nameHints))
                        const candidates = base
                          .filter(v => {
                            const s = String(v || "")
                            if (!s) return false
                            if (!q) return true
                            return s.toLowerCase().includes(q)
                          })
                          .slice(0, 8)
                        return candidates.length ? (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                            {candidates.map((val, i) => (
                              <button
                                key={`${val}-${i}`}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                onMouseDown={(e)=>{ e.preventDefault(); setEditingItem({...editingItem, name: val}); setEditNameFocused(false) }}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-1">
                    <div className="text-sm text-gray-700">Quantity</div>
                    <input type="number" min="0" step="1" value={editingItem.qty || 0} onChange={(e)=>setEditingItem({...editingItem, qty:Number(e.target.value)})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setEditingItem(null)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={async () => {
                    const payload = {
                      component_name: editingItem.name || "Untitled",
                      quantity: Number(editingItem.qty) || 0,
                    }
                    try {
                      await fetch(`${API_BASE_URL}/api/component_entries/${editingItem.id}/`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      })
                    } catch {}
                    const next = products.map((p) => p.id === editingItem.id ? { ...p, name: payload.component_name, qty: payload.quantity } : p)
                    updateProducts(next)
                    setEditingItem(null)
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openBulkDelete && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpenBulkDelete(false)}>
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[520px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Delete components</h3>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenBulkDelete(false)}>✕</button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-semibold">{selectedRows.length}</span> selected components?</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenBulkDelete(false)}>Cancel</button>
                <button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={confirmBulkDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setShowNew(false)}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[640px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">New Component</h3>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setShowNew(false)}>✕</button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-x-10 gap-y-3">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-1">
                    <div className="text-sm text-gray-700">Component</div>
                    <div className="relative">
                      <input
                        value={newItem.name}
                        onChange={(e)=>setNewItem({...newItem, name:e.target.value})}
                        onFocus={()=>setNameFocused(true)}
                        onBlur={()=>setTimeout(()=>setNameFocused(false), 120)}
                        placeholder="Component name"
                        className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2"
                      />
                      {nameFocused && (() => {
                        const q = String(newItem.name || "").toLowerCase()
                        const base = Array.from(new Set(nameHints))
                        const candidates = base
                          .filter(v => {
                            const s = String(v || "")
                            if (!s) return false
                            if (!q) return true
                            return s.toLowerCase().includes(q)
                          })
                          .slice(0, 8)
                        return candidates.length ? (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                            {candidates.map((val, i) => (
                              <button
                                key={`${val}-${i}`}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                onMouseDown={(e)=>{ e.preventDefault(); setNewItem({...newItem, name: val}); setNameFocused(false) }}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-1">
                    <div className="text-sm text-gray-700">Quantity</div>
                    <input type="number" min="0" step="1" value={newItem.qty} onChange={(e)=>setNewItem({...newItem, qty:Number(e.target.value)})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowNew(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={async () => {
                    const payload = {
                      component_name: newItem.name || "Untitled",
                      quantity: Number(newItem.qty) || 0,
                    }
                    let created = null
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/component_entries/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      })
                      if (res.ok) {
                        created = await res.json()
                      }
                    } catch {}
                    const id = created && created.id ? created.id : Date.now()
                    const o = { id, name: payload.component_name, sku: newItem.sku || nextCnNumber(), category: "", qty: payload.quantity, state: "", favorite: false }
                    const next = [...products, o]
                    updateProducts(next)
                    setShowNew(false)
                    setNewItem({ name: "", sku: "", qty: 1 })
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ProductsPage />
    </LanguageProvider>
  </React.StrictMode>,
)
