import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

function useInventory() {
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [sortKey, setSortKey] = React.useState("updatedAt")
  const [sortDir, setSortDir] = React.useState("desc")
  const pageSize = 10
  const [items, setItems] = React.useState([])
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
      if (Array.isArray(data) && data.length) {
        setItems(data)
      } else {
        setItems([
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 120000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1 },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 940000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1 },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 290000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: -1 },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 420000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1 },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 120000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1 },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 390000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1 },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 120000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1 },
        ])
      }
    } catch {
      setItems([])
    }
  }, [])
  const filtered = items.filter((p) => (p.name || "").toLowerCase().includes(query.toLowerCase()) || (p.sku || "").toLowerCase().includes(query.toLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey]
    const vb = b[sortKey]
    if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va
    return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }
  const prevPage = () => setPage((p) => Math.max(1, p - 1))
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1))
  return { query, setQuery, page, totalPages, pageItems, toggleSort, prevPage, nextPage, sortKey, sortDir }
}

function Sidebar() {
  const items = [
    { label: "Dashboard", icon: "📊", href: "/" },
    { label: "Orders", icon: "🧾", href: "/crm.html" },
    { label: "Inventory", icon: "📦", href: "/inventory.html", active: true },
    { label: "Roaster", icon: "🔥" },
    { label: "Blockchain", icon: "🔗" },
    { label: "History", icon: "🕘" },
  ]
  return (
    <aside className="w-56 bg-white border-r">
      <div className="p-4">
        <div className="text-teal-700 font-bold text-lg">SIEMENS</div>
        <div className="text-xs text-gray-500">Ingenuity for life</div>
      </div>
      <nav className="px-2 space-y-1">
        {items.map((it) => (
          <a
            key={it.label}
            href={it.href || "#"}
            onClick={(e) => {
              if (!it.href) e.preventDefault()
            }}
            className={
              "flex items-center gap-3 px-3 py-2 rounded-md " +
              (it.active ? "bg-teal-50 text-teal-700 border-l-4 border-teal-600" : "text-gray-700 hover:bg-gray-50")
            }
          >
            <span className="text-lg">{it.icon}</span>
            <span className="text-sm">{it.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

function Header({ inv }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-teal-600 text-white flex items-center justify-center">⬢</div>
        <h1 className="text-lg sm:text-xl font-semibold text-teal-700">Inventory Control Tower</h1>
      </div>
      <div className="flex items-center gap-3">
        <input
          value={inv.query}
          onChange={(e) => inv.setQuery(e.target.value)}
          className="w-56 rounded-md border border-gray-300 px-3 py-2"
          placeholder="Search"
        />
        <button className="px-3 py-2 rounded-md border border-gray-300 bg-white">≡</button>
        <div className="flex items-center gap-2 pl-3 ml-2 border-l">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">M</div>
          <div className="text-sm">
            <div className="text-gray-900 leading-tight">Manager</div>
            <div className="text-gray-500 leading-tight">Profile</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryTable({ inv }) {
  const fmtTHB = (n) => `฿ ${Number(n).toLocaleString("th-TH")}`
  return (
    <div className="p-6">
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-teal-700">
              <th className="p-3 text-left">Item Photo</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("sku")}>Item-Id</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("name")}>Item Name</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("stockQty")}>Stock-Qty</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("price")}>Price</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("updatedAt")}>Updated Date</th>
              <th className="p-3 text-left">Instock</th>
            </tr>
          </thead>
          <tbody>
            {inv.pageItems.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  <img src={p.photo || "/eit-icon.png"} alt="" className="w-10 h-10 rounded object-cover" />
                </td>
                <td className="p-3 text-gray-900">{p.sku}</td>
                <td className="p-3 text-gray-700">{p.name}</td>
                <td className="p-3">{Number(p.stockQty).toLocaleString("en-US")}</td>
                <td className="p-3 text-teal-700 font-medium">{fmtTHB(p.price)}</td>
                <td className="p-3">{p.updatedAt}</td>
                <td className="p-3">
                  {p.instock > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-50 text-green-600">↑</span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-50 text-red-600">↓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
        <button onClick={inv.prevPage} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Previous</button>
        <div className="flex items-center gap-2">
          <span>{String(inv.page).padStart(2, "0")}</span>
          <span>Of</span>
          <span>{String(inv.totalPages).padStart(2, "0")}</span>
        </div>
        <button onClick={inv.nextPage} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Next</button>
      </div>
      <div className="fixed right-6 bottom-6">
        <button className="w-12 h-12 rounded-full bg-teal-600 text-white text-2xl shadow">+</button>
      </div>
    </div>
  )
}

function InventoryLayout() {
  const inv = useInventory()
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header inv={inv} />
          <InventoryTable inv={inv} />
        </div>
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InventoryLayout />
  </React.StrictMode>,
)
