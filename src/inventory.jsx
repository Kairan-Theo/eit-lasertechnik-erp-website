import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function useInventory() {
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [sortKey, setSortKey] = React.useState("updatedAt")
  const [sortDir, setSortDir] = React.useState("desc")
  const pageSize = 10
  const [items, setItems] = React.useState([])
  const [showAdd, setShowAdd] = React.useState(false)
  const [showAdjust, setShowAdjust] = React.useState(null)
  const [showTransfer, setShowTransfer] = React.useState(null)
  const [showImport, setShowImport] = React.useState(false)
  const [warehouseFilter, setWarehouseFilter] = React.useState("All")
  const [showReceive, setShowReceive] = React.useState(null)
  const [showDeliver, setShowDeliver] = React.useState(null)
  const [role, setRole] = React.useState("Inventory Admin")
  const [refQuery, setRefQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("All")
  const [showHistory, setShowHistory] = React.useState(null)
  const [view, setView] = React.useState("inventory")
  const [historyFilter, setHistoryFilter] = React.useState(null)
  const saveItems = (next) => {
    setItems(next)
    try {
      localStorage.setItem("inventoryProducts", JSON.stringify(next))
    } catch {}
  }
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
      if (Array.isArray(data) && data.length) {
        const norm = data.map((p) => ({
          sku: p.sku,
          name: p.name,
          stockQty: Number(p.stockQty || 0),
          price: Number(p.price || 0),
          updatedAt: p.updatedAt || new Date().toISOString().slice(0, 10),
          photo: p.photo || "/eit-icon.png",
          instock: Number(p.instock || 0),
          warehouse: p.warehouse || "Main",
          bin: p.bin || "A-01-01",
          lot: p.lot || "",
          expiry: p.expiry || "",
          reserved: Number(p.reserved || 0),
          incomingQty: Number(p.incomingQty || 0),
          outgoingQty: Number(p.outgoingQty || 0),
          barcode: p.barcode || "",
          category: p.category || "Finished Goods",
          uom: p.uom || "pcs",
          description: p.description || "",
          brand: p.brand || "",
          model: p.model || "",
          status: p.status || "Active",
          minStock: Number(p.minStock || 0),
          reorderQty: Number(p.reorderQty || 0),
          valuationMethod: p.valuationMethod || "FIFO",
          serials: Array.isArray(p.serials) ? p.serials : [],
          manufactureDate: p.manufactureDate || "",
        }))
        setItems(norm)
      } else {
        setItems([
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 120000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1, warehouse: "Main", bin: "A-01-01", lot: "L210201", expiry: "2023-12-31", reserved: 0, incomingQty: 0, outgoingQty: 0, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 940000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1, warehouse: "Main", bin: "A-01-02", lot: "L210202", expiry: "2024-03-31", reserved: 500, incomingQty: 100, outgoingQty: 0, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 290000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: -1, warehouse: "Secondary", bin: "B-02-01", lot: "L210203", expiry: "", reserved: 0, incomingQty: 0, outgoingQty: 50, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
          { sku: "SE9023", name: "Simatic S7-1500", stockQty: 15000, price: 420000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1, warehouse: "Main", bin: "A-02-01", lot: "L210204", expiry: "2025-01-15", reserved: 0, incomingQty: 0, outgoingQty: 0, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
        ])
      }
    } catch {
      setItems([])
    }
  }, [])
  const warehouses = React.useMemo(() => {
    const set = new Set(items.map((i) => i.warehouse || "Main"))
    return ["All", ...Array.from(set)]
  }, [items])
  const categories = React.useMemo(() => {
    const set = new Set(items.map((i) => i.category || "Finished Goods"))
    return ["All", ...Array.from(set)]
  }, [items])
  const filtered = items
    .filter((p) => (p.name || "").toLowerCase().includes(query.toLowerCase()))
    .filter((p) => (refQuery ? (p.sku || "").toLowerCase().includes(refQuery.toLowerCase()) : true))
    .filter((p) => (warehouseFilter === "All" ? true : (p.warehouse || "Main") === warehouseFilter))
    .filter((p) => (categoryFilter === "All" ? true : (p.category || "Finished Goods") === categoryFilter))
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
  const addItem = (payload, keepOpen = false) => {
    const next = [
      {
        ...payload,
        stockQty: Number(payload.stockQty || 0),
        price: Number(payload.price || 0),
        reserved: Number(payload.reserved || 0),
        incomingQty: Number(payload.incomingQty || 0),
        outgoingQty: Number(payload.outgoingQty || 0),
        minStock: Number(payload.minStock || 0),
        reorderQty: Number(payload.reorderQty || 0),
        updatedAt: payload.updatedAt || new Date().toISOString().slice(0, 10),
        instock: payload.instock || 1,
        photo: payload.photo || "/eit-icon.png",
      },
      ...items,
    ]
    saveItems(next)
    if (!keepOpen) setShowAdd(false)
  }
  const logMove = (entry) => {
    try {
      const logs = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
      logs.push({ ...entry, ts: new Date().toISOString(), user: role })
      localStorage.setItem("inventoryMovements", JSON.stringify(logs))
    } catch {}
  }
  const setQty = (sku, warehouse, bin, lot, newQty, reason, ref) => {
    const next = items.map((it) => {
      if (!(it.sku === sku && (it.warehouse || "Main") === (warehouse || "Main") && (it.bin || "A-01-01") === (bin || "A-01-01") && (it.lot || "") === (lot || ""))) {
        return it
      }
      const prev = Number(it.stockQty || 0)
      const nextQty = Math.max(0, Number(newQty || 0))
      return {
        ...it,
        stockQty: nextQty,
        status: nextQty > 0 ? "Active" : "Inactive",
        updatedAt: new Date().toISOString().slice(0, 10),
      }
    })
    saveItems(next)
    const item = items.find((it) => it.sku === sku && (it.warehouse || "Main") === (warehouse || "Main") && (it.bin || "A-01-01") === (bin || "A-01-01") && (it.lot || "") === (lot || ""))
    const prevQty = item ? Number(item.stockQty || 0) : 0
    const finalQty = Math.max(0, Number(newQty || 0))
    logMove({ type: "adjustment", sku, warehouse: warehouse || "Main", bin: bin || "A-01-01", lot: lot || "", delta: finalQty - prevQty, newQty: finalQty, reason, ref })
    setShowAdjust(null)
  }
  const receiveQty = (sku, qty, ref) => {
    if (!qty || qty <= 0) {
      setShowReceive(null)
      return
    }
    const next = items.map((it) => (it.sku === sku ? { ...it, stockQty: Number(it.stockQty || 0) + Number(qty || 0), incomingQty: Math.max(0, Number(it.incomingQty || 0) - Number(qty || 0)), updatedAt: new Date().toISOString().slice(0, 10) } : it))
    saveItems(next)
    logMove({ type: "purchase_receipt", sku, qty: Number(qty), ref })
    setShowReceive(null)
  }
  const deliverQty = (sku, qty, ref) => {
    if (!qty || qty <= 0) {
      setShowDeliver(null)
      return
    }
    const next = items.map((it) => (it.sku === sku ? { ...it, stockQty: Math.max(0, Number(it.stockQty || 0) - Number(qty || 0)), outgoingQty: Math.max(0, Number(it.outgoingQty || 0) - Number(qty || 0)), updatedAt: new Date().toISOString().slice(0, 10) } : it))
    saveItems(next)
    logMove({ type: "sales_delivery", sku, qty: Number(qty), ref })
    setShowDeliver(null)
  }
  const transferQty = (sku, qty, fromWarehouse, toWarehouse, ref) => {
    if (!qty || qty <= 0 || fromWarehouse === toWarehouse) {
      setShowTransfer(null)
      return
    }
    const next = items.map((it) => {
      if (it.sku === sku && (it.warehouse || "Main") === fromWarehouse) {
        return { ...it, stockQty: Math.max(0, Number(it.stockQty || 0) - Number(qty || 0)), updatedAt: new Date().toISOString().slice(0, 10) }
      }
      return it
    })
    const targetIndex = next.findIndex((it) => it.sku === sku && (it.warehouse || "Main") === toWarehouse)
    if (targetIndex >= 0) {
      next[targetIndex] = { ...next[targetIndex], stockQty: Number(next[targetIndex].stockQty || 0) + Number(qty || 0), updatedAt: new Date().toISOString().slice(0, 10) }
    } else {
      const src = items.find((it) => it.sku === sku)
      if (src) {
        next.push({ ...src, warehouse: toWarehouse, stockQty: Number(qty || 0), bin: "A-01-01", updatedAt: new Date().toISOString().slice(0, 10) })
      }
    }
    saveItems(next)
    logMove({ type: "transfer", sku, qty: Number(qty), from: fromWarehouse, to: toWarehouse, ref })
    setShowTransfer(null)
  }
  const exportCsv = () => {
    const headers = ["sku", "name", "stockQty", "reserved", "price", "updatedAt", "warehouse", "bin", "lot", "expiry"]
    const rows = items.map((it) => headers.map((h) => (it[h] != null ? String(it[h]).replaceAll(",", " ") : "")).join(","))
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  const importCsv = async (file) => {
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
    const headers = lines[0].split(",").map((h) => h.trim())
    const out = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const obj = {}
      headers.forEach((h, idx) => (obj[h] = cols[idx] ? cols[idx].trim() : ""))
      out.push({
        sku: obj.sku || "",
        name: obj.name || "",
        stockQty: Number(obj.stockQty || 0),
        reserved: Number(obj.reserved || 0),
        price: Number(obj.price || 0),
        updatedAt: obj.updatedAt || new Date().toISOString().slice(0, 10),
        warehouse: obj.warehouse || "Main",
        bin: obj.bin || "A-01-01",
        lot: obj.lot || "",
        expiry: obj.expiry || "",
        photo: "/eit-icon.png",
        instock: 1,
      })
    }
    saveItems([...out, ...items])
    setShowImport(false)
  }
  return {
    query,
    setQuery,
    page,
    totalPages,
    pageItems,
    toggleSort,
    prevPage,
    nextPage,
    sortKey,
    sortDir,
    showAdd,
    setShowAdd,
    showAdjust,
    setShowAdjust,
    showTransfer,
    setShowTransfer,
    showImport,
    setShowImport,
    addItem,
    setQty,
    transferQty,
    exportCsv,
    importCsv,
    warehouses,
    warehouseFilter,
    setWarehouseFilter,
    role,
    setRole,
    refQuery,
    setRefQuery,
    categories,
    categoryFilter,
    setCategoryFilter,
    showReceive,
    setShowReceive,
    showDeliver,
    setShowDeliver,
    receiveQty,
    deliverQty,
    items,
    showHistory,
    setShowHistory,
    view,
    setView,
    historyFilter,
    setHistoryFilter,
  }
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
        <span className="text-lg sm:text-xl font-semibold text-[#2D4485]">EIT Lasertechnik</span>
        <h1 className="text-lg sm:text-xl font-semibold text-[#2D4485]">Inventory Control Tower</h1>
      </div>
      <div className="flex items-center gap-3">
        <select value={inv.warehouseFilter} onChange={(e) => inv.setWarehouseFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
          {inv.warehouses.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <input
          value={inv.query}
          onChange={(e) => inv.setQuery(e.target.value)}
          className="w-56 rounded-md border border-gray-300 px-3 py-2"
          placeholder="Search"
        />
        <button onClick={inv.exportCsv} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Export</button>
        <button onClick={() => inv.setShowImport(true)} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Import</button>
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

function TopNav({ inv }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#2D4485] to-[#3D56A6] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">EIT Lasertechnik</span>
          <span className="text-white/70">/</span>
          <span className="text-sm text-white">Inventory</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => inv.setView("inventory")}
            className={(inv.view === "inventory" ? "bg-white text-[#2D4485]" : "bg-white/20 text-white hover:bg-white/30") + " rounded-full px-3 py-1.5 text-sm font-medium transition"}
          >
            Inventory
          </button>
          <button
            onClick={() => {
              inv.setHistoryFilter(null)
              inv.setView("history")
            }}
            className={(inv.view === "history" ? "bg-white text-[#2D4485]" : "bg.white/20 text-white hover:bg-white/30").replace("bg.white/20","bg-white/20") + " rounded-full px-3 py-1.5 text-sm font-medium transition"}
          >
            History
          </button>
          <a href="/apps.html" className="rounded-full px-3 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 transition">Apps</a>
        </div>
      </div>
    </header>
  )
}

function InventoryTable({ inv }) {
  const fmtTHB = (n) => `฿ ${Number(n).toLocaleString("th-TH")}`
  const daysToExpiry = (d) => {
    if (!d) return null
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return null
    const diff = Math.round((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <input
          value={inv.query}
          onChange={(e) => inv.setQuery(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-2"
          placeholder="Search by name or reference"
        />
        <button onClick={() => inv.setShowAdd(true)} className="px-3 py-2 rounded-md bg-[#2D4485] text-white">Add Item</button>
      </div>
      {inv.pageItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-lg font-semibold text-gray-900">No items found</div>
          <div className="text-sm text-gray-600 mt-1">Try adjusting your search or add a new item</div>
          <button onClick={() => inv.setShowAdd(true)} className="mt-4 px-3 py-2 rounded-md bg-[#2D4485] text-white">Add Item</button>
        </div>
      ) : (
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[#2D4485]">
              <th className="p-3 text-left">Item Photo</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("sku")}>SKU</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("name")}>Name</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("stockQty")}>Stock</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("warehouse")}>Warehouse</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("price")}>Price</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("updatedAt")}>Last Updated</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inv.pageItems.map((p, i) => (
              <tr key={i} className="border-t odd:bg-gray-50 hover:bg-gray-100 transition">
                <td className="p-3">
                  <img src={p.photo || "/eit-icon.png"} alt="" className="w-10 h-10 rounded object-cover" />
                </td>
                <td className="p-3 text-gray-900">{p.sku}</td>
                <td className="p-3 text-gray-700">{p.name}</td>
                <td className="p-3">{Number(p.stockQty).toLocaleString("en-US")}</td>
                <td className="p-3">{p.warehouse || "Main"}</td>
                <td className="p-3 text-[#2D4485] font-medium">{fmtTHB(p.price)}</td>
                <td className="p-3">{p.updatedAt}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button disabled={!(inv.role === "Inventory Admin" || inv.role === "Warehouse Staff")} onClick={() => inv.setShowAdjust({ sku: p.sku, warehouse: p.warehouse || "Main", bin: p.bin || "A-01-01", lot: p.lot || "", current: Number(p.stockQty || 0) })} className="px-2 py-1 rounded-md border border-gray-300 bg-white disabled:opacity-50">Update Stock</button>
                    <button
                      onClick={() => {
                        localStorage.setItem("mfgPreFill", JSON.stringify({ product: p.name, sku: p.sku, quantity: 1 }))
                        window.location.href = "/manufacturing.html"
                      }}
                      className="px-2 py-1 rounded-md border border-purple-700 bg-purple-50 text-purple-700"
                    >
                      Manufacture
                    </button>
                    {Number(p.stockQty) === 0 && (
                      <button
                        onClick={() => {
                          localStorage.setItem("mfgPreFill", JSON.stringify({ product: p.name, sku: p.sku, quantity: 1 }))
                          window.location.href = "/manufacturing.html"
                        }}
                        className="px-2 py-1 rounded-md border border-purple-700 bg-purple-50 text-purple-700"
                      >
                        Manufacturing Order
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
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
        <button onClick={() => inv.setShowAdd(true)} className="w-12 h-12 rounded-full bg-[#2D4485] text-white text-2xl shadow">+</button>
      </div>
      {inv.showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Add Inventory Item</div>
            <AddItemForm onCancel={() => inv.setShowAdd(false)} onSave={inv.addItem} />
          </div>
        </div>
      )}
      {inv.showAdjust && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowAdjust(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Update Stock</div>
            <AdjustForm sku={inv.showAdjust.sku} current={inv.showAdjust.current} onCancel={() => inv.setShowAdjust(null)} onConfirm={(newQty, reason) => inv.setQty(inv.showAdjust.sku, inv.showAdjust.warehouse, inv.showAdjust.bin, inv.showAdjust.lot, newQty, reason, "")} />
          </div>
        </div>
      )}
      {inv.showTransfer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowTransfer(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Transfer Stock</div>
            <TransferForm sku={inv.showTransfer.sku} from={inv.showTransfer.from} warehouses={inv.warehouses.filter((w) => w !== "All")} onCancel={() => inv.setShowTransfer(null)} onConfirm={(qty, toWarehouse, ref) => inv.transferQty(inv.showTransfer.sku, qty, inv.showTransfer.from, toWarehouse, ref)} />
          </div>
        </div>
      )}
      {inv.showReceive && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowReceive(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Receive Products</div>
            <ReceiveForm sku={inv.showReceive.sku} onCancel={() => inv.setShowReceive(null)} onConfirm={(qty, ref) => inv.receiveQty(inv.showReceive.sku, qty, ref)} />
          </div>
        </div>
      )}
      {inv.showDeliver && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowDeliver(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Deliver Products</div>
            <DeliverForm sku={inv.showDeliver.sku} onCancel={() => inv.setShowDeliver(null)} onConfirm={(qty, ref) => inv.deliverQty(inv.showDeliver.sku, qty, ref)} />
          </div>
        </div>
      )}
      {inv.showImport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowImport(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Import CSV</div>
            <ImportForm onCancel={() => inv.setShowImport(false)} onFile={(f) => inv.importCsv(f)} />
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryView({ inv }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-lg font-semibold mb-4 text-gray-900">Movement History</div>
        <MovementLog
          sku={inv.historyFilter?.sku}
          warehouse={inv.historyFilter?.warehouse}
          bin={inv.historyFilter?.bin}
          lot={inv.historyFilter?.lot}
          onCancel={() => inv.setView("inventory")}
        />
      </div>
    </div>
  )
}

function AddItemForm({ onCancel, onSave }) {
  const initial = {
    sku: "",
    name: "",
    stockQty: 0,
    reserved: 0,
    price: 0,
    warehouse: "Main",
    bin: "A-01-01",
    lot: "",
    expiry: "",
    incomingQty: 0,
    outgoingQty: 0,
    barcode: "",
    category: "Finished Goods",
    uom: "pcs",
    description: "",
    brand: "",
    model: "",
    status: "Active",
    minStock: 0,
    reorderQty: 0,
    valuationMethod: "FIFO",
    serials: "",
    manufactureDate: "",
  }
  const [f, setF] = React.useState(initial)
  const [adv, setAdv] = React.useState(false)
  const canSave = Boolean(f.sku && f.name)
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Reference (SKU)</label>
          <input value={f.sku} onChange={(e) => set("sku", e.target.value)} required placeholder="e.g. ABC-001" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Product name</label>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Laser Welding Machine" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Stock qty</label>
          <input type="number" min={0} value={f.stockQty} onChange={(e) => set("stockQty", Math.max(0, Number(e.target.value))) } placeholder="e.g. 10" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Price</label>
          <input type="number" step="0.01" value={f.price} onChange={(e) => set("price", Number(e.target.value))} placeholder="e.g. 50000" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Warehouse</label>
          <select value={f.warehouse} onChange={(e) => set("warehouse", e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
            <option>Main</option>
            <option>Secondary</option>
          </select>
        </div>
      </div>
      <div>
        <button onClick={() => setAdv((v) => !v)} className="text-[#2D4485] text-sm">
          {adv ? "Hide advanced" : "Show advanced"}
        </button>
      </div>
      {adv && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={f.bin} onChange={(e) => set("bin", e.target.value)} placeholder="Bin" className="rounded-md border border-gray-300 px-3 py-2" />
          <input value={f.lot} onChange={(e) => set("lot", e.target.value)} placeholder="Lot" className="rounded-md border border-gray-300 px-3 py-2" />
          <input type="date" value={f.expiry} onChange={(e) => set("expiry", e.target.value)} className="rounded-md border border-gray-300 px-3 py-2" />
          <input value={f.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="Barcode" className="rounded-md border border-gray-300 px-3 py-2" />
          <select value={f.category} onChange={(e) => set("category", e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
            <option>Raw Material</option>
            <option>Finished Goods</option>
            <option>Service</option>
          </select>
          <input value={f.uom} onChange={(e) => set("uom", e.target.value)} placeholder="UOM (pcs, kg, m)" className="rounded-md border border-gray-300 px-3 py-2" />
          <input value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Brand" className="rounded-md border border-gray-300 px-3 py-2" />
          <input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" className="rounded-md border border-gray-300 px-3 py-2" />
          <select value={f.status} onChange={(e) => set("status", e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <input type="number" value={f.minStock} onChange={(e) => set("minStock", Number(e.target.value))} placeholder="Minimum stock" className="rounded-md border border-gray-300 px-3 py-2" />
          <input type="number" value={f.reorderQty} onChange={(e) => set("reorderQty", Number(e.target.value))} placeholder="Reorder qty" className="rounded-md border border-gray-300 px-3 py-2" />
          <select value={f.valuationMethod} onChange={(e) => set("valuationMethod", e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
            <option>FIFO</option>
            <option>LIFO</option>
            <option>Weighted Average</option>
            <option>Standard Cost</option>
          </select>
          <input type="date" value={f.manufactureDate} onChange={(e) => set("manufactureDate", e.target.value)} className="rounded-md border border-gray-300 px-3 py-2" />
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"></textarea>
          <input value={f.serials} onChange={(e) => set("serials", e.target.value)} placeholder="Serials (comma-separated)" className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2" />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Cancel</button>
        <button disabled={!canSave} onClick={() => onSave({ ...f, serials: f.serials ? f.serials.split(",").map((s) => s.trim()).filter(Boolean) : [] })} className="px-3 py-2 rounded-md bg-[#2D4485] text-white disabled:opacity-50">Save</button>
        <button
          onClick={() => {
            onSave({ ...f, serials: f.serials ? f.serials.split(",").map((s) => s.trim()).filter(Boolean) : [] }, true)
            setF(initial)
          }}
          disabled={!canSave}
          className="px-3 py-2 rounded-md border border-[#2D4485] text-[#2D4485] bg-white disabled:opacity-50"
        >
          Save & Add Another
        </button>
      </div>
    </div>
  )
}

function AdjustForm({ sku, current = 0, onCancel, onConfirm }) {
  const [newQty, setNewQty] = React.useState(current)
  const [note, setNote] = React.useState("")
  const canConfirm = Number.isFinite(newQty)
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Reference: <span className="font-semibold">{sku}</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Current stock</label>
          <input value={current} readOnly className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">New stock</label>
          <input type="number" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Note (optional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for change" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Cancel</button>
        <button disabled={!canConfirm} onClick={() => onConfirm(Number(newQty), note || "Stock update")} className="px-3 py-2 rounded-md bg-[#2D4485] text-white disabled:opacity-50">Confirm</button>
      </div>
    </div>
  )
}

function TransferForm({ sku, from, warehouses, onCancel, onConfirm }) {
  const [qty, setQty] = React.useState(0)
  const [to, setTo] = React.useState(warehouses.find((w) => w !== from) || "Secondary")
  const [ref, setRef] = React.useState("")
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Reference: <span className="font-semibold">{sku}</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="Qty" className="rounded-md border border-gray-300 px-3 py-2" />
        <div className="rounded-md border border-gray-300 px-3 py-2">
          <div className="text-xs text-gray-500">From</div>
          <div className="text-sm font-semibold">{from}</div>
        </div>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
          {warehouses.map((w) => w !== "All" && <option key={w}>{w}</option>)}
        </select>
      </div>
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference (e.g. Source Document)" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Cancel</button>
        <button onClick={() => onConfirm(qty, to, ref)} className="px-3 py-2 rounded-md bg-[#2D4485] text-white">Transfer</button>
      </div>
    </div>
  )
}

function ImportForm({ onCancel, onFile }) {
  const [file, setFile] = React.useState(null)
  return (
    <div className="space-y-3">
      <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <div className="text-xs text-gray-600">Headers: sku,name,stockQty,reserved,price,updatedAt,warehouse,bin,lot,expiry</div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Cancel</button>
        <button onClick={() => onFile && onFile(file)} className="px-3 py-2 rounded-md bg-[#2D4485] text-white">Import</button>
      </div>
    </div>
  )
}

function MovementLog({ sku, warehouse, bin, lot, onCancel }) {
  const [rows, setRows] = React.useState([])
  React.useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
      const filtered = logs
        .filter((e) => (sku ? (e.sku || "") === sku : true))
        .filter((e) => (warehouse ? (e.warehouse || "Main") === warehouse : true))
        .filter((e) => (bin ? (e.bin || "A-01-01") === bin : true))
        .filter((e) => (lot ? (e.lot || "") === lot : true))
        .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
        .slice(0, 50)
      setRows(filtered)
    } catch {
      setRows([])
    }
  }, [sku, warehouse, bin, lot])
  const fmtChange = (e) => {
    if (e.delta != null) return e.delta
    if (e.qty != null) return e.qty
    return ""
  }
  const loc = `${warehouse || "Main"} / ${bin || "A-01-01"}${lot ? " / " + lot : ""}`
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Reference: <span className="font-semibold">{sku}</span></div>
      <div className="text-xs text-gray-600">Location: {loc}</div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[#2D4485]">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Change</th>
              <th className="p-2 text-left">New Qty</th>
              <th className="p-2 text-left">Reason</th>
              <th className="p-2 text-left">Ref</th>
              <th className="p-2 text-left">User</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="p-3 text-gray-600" colSpan={7}>No movements found</td></tr>
            ) : (
              rows.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{String(e.ts).slice(0, 19).replace("T", " ")}</td>
                  <td className="p-2">{e.type}</td>
                  <td className="p-2">{fmtChange(e)}</td>
                  <td className="p-2">{e.newQty != null ? e.newQty : ""}</td>
                  <td className="p-2">{e.reason || ""}</td>
                  <td className="p-2">{e.ref || e.from || e.to || ""}</td>
                  <td className="p-2">{e.user || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Close</button>
      </div>
    </div>
  )
}

function ReceiveForm({ sku, onCancel, onConfirm }) {
  const [qty, setQty] = React.useState(0)
  const [ref, setRef] = React.useState("")
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Reference: <span className="font-semibold">{sku}</span></div>
      <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="Qty received" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="PO/GRN Reference" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Cancel</button>
        <button onClick={() => onConfirm(qty, ref)} className="px-3 py-2 rounded-md bg-[#2D4485] text-white">Receive</button>
      </div>
    </div>
  )
}

function DeliverForm({ sku, onCancel, onConfirm }) {
  const [qty, setQty] = React.useState(0)
  const [ref, setRef] = React.useState("")
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Reference: <span className="font-semibold">{sku}</span></div>
      <input type="number" min={0} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} placeholder="Qty delivered" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="SO/DO Reference" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border border-gray-300 bg-white">Cancel</button>
        <button onClick={() => onConfirm(qty, ref)} className="px-3 py-2 rounded-md bg-[#2D4485] text-white">Deliver</button>
      </div>
    </div>
  )
}


function InventoryLayout() {
  const inv = useInventory()
  return (
    <main className="min-h-screen bg-gray-50">
      <TopNav inv={inv} />
      <div className="px-0">
        {inv.view === "history" ? <HistoryView inv={inv} /> : <InventoryTable inv={inv} />}
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <InventoryLayout />
    </LanguageProvider>
  </React.StrictMode>,
)
