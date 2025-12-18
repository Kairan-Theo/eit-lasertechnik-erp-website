import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function ProductsPage() {
  const [products, setProducts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("mfgProducts") || "[]") } catch { return [] }
  })
  const [query, setQuery] = React.useState("")
  const [showNew, setShowNew] = React.useState(false)
  const [newItem, setNewItem] = React.useState({ name: "", sku: "", qty: 1 })
  React.useEffect(() => {
    if (!products.length) {
      const seed = [
        { id: 1, name: "Laser Cladding Machine", sku: "CN-00001", category: "Machine", qty: 12, state: "Active", favorite: false },
        { id: 2, name: "Laser Welding Machine", sku: "CN-00002", category: "Machine", qty: 8, state: "Active", favorite: true },
        { id: 3, name: "Cake", sku: "CN-00003", category: "Food", qty: 50, state: "Inactive", favorite: false },
        { id: 4, name: "mohinga", sku: "CN-00004", category: "Food", qty: 24, state: "Active", favorite: false },
      ]
      setProducts(seed)
      localStorage.setItem("mfgProducts", JSON.stringify(seed))
    }
  }, [])
  const setAndPersist = (next) => { setProducts(next); localStorage.setItem("mfgProducts", JSON.stringify(next)) }
  const toggleFavorite = (id) => setAndPersist(products.map(p => p.id===id ? { ...p, favorite: !p.favorite } : p))
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
      if (changed) setAndPersist(next)
    }
  }, []) 
  const filtered = products.filter((p) => {
    const q = query.toLowerCase()
    return (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
  })

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Component</h1>
              <button
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                title="New component"
                onClick={() => setShowNew(true)}
              >
                New component
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Manufacturing Order"
                onClick={() => window.location.href = "/manufacturing.html"}
              >
                Manufacturing Order
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Bill of Materials"
                onClick={() => window.location.href = "/bom.html"}
              >
                Bill of Materials
              </button>
            </div>
            <div className="w-64">
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Search component"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="p-2 text-left">Component No.</th>
                  <th className="p-2 text-left">Component</th>
                  <th className="p-2 text-right">Quantity Available</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p)=> (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">
                      <span className="text-gray-700">{p.sku || "-"}</span>
                    </td>
                    <td className="p-2">
                      <a className="text-[#3D56A6] hover:underline" href="#">{p.name}</a>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-[#3D56A6]">{Number(p.qty).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr className="border-t">
                    <td className="p-2 text-center text-gray-500" colSpan={2}>No components found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Component</div>
                    <input value={newItem.name} onChange={(e)=>setNewItem({...newItem, name:e.target.value})} placeholder="Component name" className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Component No.</div>
                    <input value={newItem.sku} onChange={(e)=>setNewItem({...newItem, sku:e.target.value})} placeholder="e.g. CN-00001" className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Quantity</div>
                    <input type="number" min="0" step="1" value={newItem.qty} onChange={(e)=>setNewItem({...newItem, qty:Number(e.target.value)})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowNew(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={() => {
                    const o = { id: Date.now(), name: newItem.name || "Untitled", sku: newItem.sku || nextCnNumber(), category: "", qty: Number(newItem.qty)||0, state: "", favorite: false }
                    const next = [o, ...products]
                    setAndPersist(next)
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
