import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import "./index.css"

function useInventory() {
  const [query, setQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState("updatedAt")
  const [sortDir, setSortDir] = React.useState("desc")
  const [items, setItems] = React.useState([])
  const [showAdd, setShowAdd] = React.useState(false)
  const [showEdit, setShowEdit] = React.useState(null)
  const [showAdjust, setShowAdjust] = React.useState(null)
  const [showTransfer, setShowTransfer] = React.useState(null)
  const [showImport, setShowImport] = React.useState(false)
  const [showReceive, setShowReceive] = React.useState(null)
  const [showDeliver, setShowDeliver] = React.useState(null)
  const [role, setRole] = React.useState("Inventory Admin")
  const [refQuery, setRefQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("All")
  const [showHistory, setShowHistory] = React.useState(null)
  const [view, setView] = React.useState("inventory")
  const [historyFilter, setHistoryFilter] = React.useState(null)
  const [page, setPage] = React.useState(1)
  const pageSize = 20
  const saveItems = (next) => {
    setItems(next)
    try {
      localStorage.setItem("inventoryProducts", JSON.stringify(next))
    } catch {}
  }
  const parseWhIvNum = (s) => {
    const m = /^WH\/IV\/(\d+)$/.exec(String(s || ""))
    return m ? parseInt(m[1], 10) : null
  }
  const nextWhIvNumber = (arr = items) => {
    let max = 0
    for (const it of arr) {
      const n = parseWhIvNum(it.sku)
      if (Number.isFinite(n) && n > max) max = n
    }
    return max + 1
  }
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
      if (Array.isArray(data) && data.length) {
        const norm = data.map((p) => ({
          sku: String(p.sku || ""),
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
          deliveryStatus: p.deliveryStatus || "",
          deliveryCompany: p.deliveryCompany || "",
          trackingNumber: p.trackingNumber || "",
          courier: p.courier || "",
          trackingStatus: p.trackingStatus || "",
        }))
        let max = nextWhIvNumber(norm)
        const fixed = norm.map((it) => {
          const valid = /^WH\/IV\/\d+$/.test(String(it.sku || ""))
          const next = valid ? it : { ...it, sku: `WH/IV/${max++}` }
          return next
        })
        setItems(fixed)
        try { localStorage.setItem("inventoryProducts", JSON.stringify(fixed)) } catch {}
      } else {
        setItems([
          { sku: "WH/IV/1", name: "Simatic S7-1500", stockQty: 15000, price: 120000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1, warehouse: "Main", bin: "A-01-01", lot: "L210201", expiry: "2023-12-31", reserved: 0, incomingQty: 0, outgoingQty: 0, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
          { sku: "WH/IV/2", name: "Simatic S7-1500", stockQty: 15000, price: 940000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1, warehouse: "Main", bin: "A-01-02", lot: "L210202", expiry: "2024-03-31", reserved: 500, incomingQty: 100, outgoingQty: 0, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
          { sku: "WH/IV/3", name: "Simatic S7-1500", stockQty: 15000, price: 290000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: -1, warehouse: "Secondary", bin: "B-02-01", lot: "L210203", expiry: "", reserved: 0, incomingQty: 0, outgoingQty: 50, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
          { sku: "WH/IV/4", name: "Simatic S7-1500", stockQty: 15000, price: 420000, updatedAt: "2021-02-20", photo: "/eit-icon.png", instock: 1, warehouse: "Main", bin: "A-02-01", lot: "L210204", expiry: "2025-01-15", reserved: 0, incomingQty: 0, outgoingQty: 0, barcode: "1234567890123", category: "Finished Goods", uom: "pcs", description: "", brand: "Siemens", model: "S7-1500", status: "Active", minStock: 1000, reorderQty: 500, valuationMethod: "FIFO", serials: [], manufactureDate: "" },
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
    const s = String(payload.sku || "")
    const valid = /^WH\/IV\/\d+$/.test(s)
    const assignedSku = valid ? s : `WH/IV/${nextWhIvNumber()}`
    const next = [
      {
        ...payload,
        sku: assignedSku,
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
      const raw = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
      const logs = Array.isArray(raw) ? raw : []
      logs.push({ ...entry, id: entry.id || Date.now().toString(36) + Math.random().toString(36).substr(2), ts: new Date().toISOString(), user: role })
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
  const receiveQty = (sku, qty, ref, company) => {
    if (!qty || qty <= 0) {
      setShowReceive(null)
      return
    }
    const next = items.map((it) => (it.sku === sku ? { ...it, stockQty: Number(it.stockQty || 0) + Number(qty || 0), incomingQty: Math.max(0, Number(it.incomingQty || 0) - Number(qty || 0)), deliveryStatus: "Delivered", updatedAt: new Date().toISOString().slice(0, 10) } : it))
    saveItems(next)
    logMove({ type: "purchase_receipt", sku, qty: Number(qty), ref, company })
    setShowReceive(null)
  }
  const deliverQty = (sku, qty, ref, status, company, warehouse, bin, lot, tracking, courier, trackingUrl) => {
    if (!qty || qty <= 0) {
      setShowDeliver(null)
      return
    }

    // Check stock availability before proceeding
    const item = items.find((it) => 
      it.sku === sku && 
      (it.warehouse || "Main") === (warehouse || "Main") && 
      (it.bin || "") === (bin || "") && 
      (it.lot || "") === (lot || "")
    )

    if (item) {
      const currentStock = Number(item.stockQty || 0)
      if (qty > currentStock) {
        alert(`Insufficient stock! You only have ${currentStock} units available.`)
        return
      }
    }
    
    // Status Logic:
    // 1. "Shipped" or "Delivered" means the goods have physically left the warehouse.
    //    We deduct stockQty immediately.
    // 2. "Pending" or "Ready" means goods are reserved but still in the warehouse.
    //    We increase reserved/outgoingQty but do NOT deduct stockQty yet.
    
    const isShipped = ["Shipped", "Delivered"].includes(status || "Delivered")
    const isPending = ["Pending", "Ready"].includes(status)
    
    const next = items.map((it) => {
      // Must match SKU
      if (it.sku !== sku) return it

      // If specific location provided, strict match required to avoid reducing stock from multiple locations
      if (warehouse !== undefined && (it.warehouse || "Main") !== (warehouse || "Main")) return it
      if (bin !== undefined && (it.bin || "") !== (bin || "")) return it
      if (lot !== undefined && (it.lot || "") !== (lot || "")) return it
      
      let newStock = Number(it.stockQty || 0)
      let newReserved = Number(it.reserved || 0)
      let newOutgoing = Number(it.outgoingQty || 0)
      
      if (isShipped) {
        // Reduce actual stock
        newStock = Math.max(0, newStock - Number(qty))
        
        // If it was previously reserved, we might want to reduce reserved count too?
        // But here we are creating a NEW delivery record. 
        // Usually, if we deliver from "Reserved" stock, we should decrease reserved.
        // However, this function `deliverQty` seems to handle new ad-hoc deliveries.
        // Let's assume this delivery consumes available stock directly.
        // If the user workflow is "Reserve -> Deliver", that's a status update, not a new delivery call.
        
        // For a NEW delivery that is immediately Shipped/Delivered:
        // We just reduce stock. We don't touch reserved unless specified.
      } else if (isPending) {
        // Reserve stock for future delivery
        newReserved = newReserved + Number(qty)
        newOutgoing = newOutgoing + Number(qty)
      }
      
      return { 
        ...it, 
        stockQty: newStock, 
        reserved: newReserved, 
        outgoingQty: newOutgoing, 
        deliveryStatus: status || "Delivered", 
        deliveryCompany: company || "",
        trackingNumber: tracking || "",
        courier: courier || "",
        trackingUrl: trackingUrl || "",
        updatedAt: new Date().toISOString().slice(0, 10) 
      }
    })
    
    saveItems(next)
    logMove({ type: "sales_delivery", sku, qty: Number(qty), ref, company, status: status || "Delivered", tracking: tracking || "", courier, trackingUrl })
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
    const csv = [
      headers.join(","),
      ...items.map((i) => headers.map((k) => i[k]).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory.csv"
    a.click()
  }
  const importCsv = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())
      const newItems = []
      let max = nextWhIvNumber(items)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(",")
        if (line.length !== headers.length) continue
        const item = {}
        headers.forEach((h, j) => {
          item[h] = line[j].trim()
        })
        const s = String(item.sku || "")
        const valid = /^WH\/IV\/\d+$/.test(s)
        const finalSku = valid ? s : `WH/IV/${max++}`
        newItems.push({
          ...item,
          sku: finalSku,
          stockQty: Number(item.stockQty || 0),
          price: Number(item.price || 0),
          reserved: Number(item.reserved || 0),
          incomingQty: 0,
          outgoingQty: 0,
          minStock: Number(item.minStock || 0),
          reorderQty: Number(item.reorderQty || 0),
          updatedAt: item.updatedAt || new Date().toISOString().slice(0, 10),
          instock: 1,
          photo: "/eit-icon.png",
        })
      }
      const next = [...newItems, ...items]
      saveItems(next)
      setShowImport(false)
    }
    reader.readAsText(file)
  }

  const updateItem = (original, updates) => {
    const next = items.map((it) => {
      if (it.sku === original.sku && (it.warehouse || "Main") === (original.warehouse || "Main") && (it.bin || "A-01-01") === (original.bin || "A-01-01") && (it.lot || "") === (original.lot || "")) {
        return { ...it, ...updates, updatedAt: new Date().toISOString().slice(0, 10) }
      }
      return it
    })
    saveItems(next)
  }

  return {
    query,
    setQuery,
    pageItems,
    toggleSort,
    sortKey,
    sortDir,
    showAdd,
    setShowAdd,
    showEdit,
    setShowEdit,
    showAdjust,
    setShowAdjust,
    showTransfer,
    setShowTransfer,
    showImport,
    setShowImport,
    addItem,
    updateItem,
    setQty,
    transferQty,
    exportCsv,
    importCsv,
    warehouses,
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

const getTrackingLink = (courier, number) => {
  if (!number) return null
  if (String(number).startsWith("http")) return number
  switch (courier) {
    case "Kerry": return `https://th.kerryexpress.com/th/track/?track=${number}`
    case "Flash": return `https://www.flashexpress.co.th/tracking/?se=${number}`
    case "ThaiPost": return `https://track.thailandpost.co.th/?trackNumber=${number}`
    case "J&T": return `https://www.jtexpress.co.th/tracking?billcode=${number}`
    case "DHL": return `https://www.dhl.com/th-en/home/tracking.html?tracking-id=${number}`
    case "SCG": return `https://www.scgexpress.co.th/tracking/detail/${number}`
    case "NinjaVan": return `https://www.ninjavan.co/th-th/tracking?id=${number}`
    case "Best": return `https://www.best-inc.co.th/track?billcode=${number}`
    case "Shopee": return `https://spx.co.th/`
    case "Lazada": return `https://tracker.lel.asia/tracker?trackingNumber=${number}`
    case "Nim": return `https://www.nimexpress.com/web/p/tracking?i=${number}`
    default: return `https://t.17track.net/en#nums=${number}`
  }
}

function InventoryTable({ inv }) {
  const fmtTHB = (n) => `฿ ${Number(n).toLocaleString("th-TH")}`
  const [editingId, setEditingId] = React.useState(null)
  const [editingField, setEditingField] = React.useState(null)
  const [editingValue, setEditingValue] = React.useState("")

  const getRowId = (p) => `${p.sku}-${p.warehouse || "Main"}-${p.bin || "A-01-01"}-${p.lot || ""}`

  const handleKeyDown = (e, p) => {
    if (e.key === "Enter") {
      inv.updateItem(p, { [editingField]: editingField === "price" ? Number(editingValue) : editingValue })
      setEditingId(null)
      setEditingField(null)
    } else if (e.key === "Escape") {
      setEditingId(null)
      setEditingField(null)
    }
  }

  const handleBlur = (p) => {
    inv.updateItem(p, { [editingField]: editingField === "price" ? Number(editingValue) : editingValue })
    setEditingId(null)
    setEditingField(null)
  }

  const [openStatusId, setOpenStatusId] = React.useState(null)


  const deliveryStatusClass = (s) => {
    switch (s) {
      case "Pending": return "bg-amber-100 text-amber-800 border border-amber-200"
      case "Shipped": 
      case "In Transit": return "bg-blue-100 text-blue-800 border border-blue-200"
      case "Out for Delivery": return "bg-purple-100 text-purple-800 border border-purple-200"
      case "Delivered": return "bg-emerald-100 text-emerald-800 border border-emerald-200"
      case "Returned": 
      case "Exception": return "bg-rose-100 text-rose-800 border border-rose-200"
      case "Manual Check Needed": return "bg-orange-100 text-orange-800 border border-orange-200"
      default: return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  return (
    <div className="">
      {inv.pageItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-lg font-semibold text-gray-900">No items found</div>
          <div className="text-sm text-gray-600 mt-1">Try adjusting your search or add a new item</div>
          <button onClick={() => inv.setShowAdd(true)} className="mt-4 inline-flex items-center justify-center px-6 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-sm">Add Item</button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[#2D4485] bg-gray-50">
                <th className="p-3 text-left">Item Photo</th>
                <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("sku")}>Product Number</th>
                <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("name")}>Name</th>
                <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("stockQty")}>Stock</th>
                <th className="p-3 text-left">Delivery Status</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Tracking #</th>
                <th className="p-3 text-left cursor-pointer" onClick={() => inv.toggleSort("updatedAt")}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {inv.pageItems.map((p, i) => {
                const rowId = getRowId(p)
                const isEditing = (field) => editingId === rowId && editingField === field
                return (
                  <tr key={i} className="border-t odd:bg-gray-50 hover:bg-gray-100 transition">
                    <td className="p-3">
                      {isEditing("photo") ? (
                        <input
                          autoFocus
                          className="w-full rounded-md border border-gray-300 px-2 py-1"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleBlur(p)}
                          onKeyDown={(e) => handleKeyDown(e, p)}
                        />
                      ) : (
                        <img
                          src={p.photo || "/eit-icon.png"}
                          alt=""
                          className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80"
                          title="Click to edit photo URL"
                          onClick={() => {
                            setEditingId(rowId)
                            setEditingField("photo")
                            setEditingValue(p.photo || "")
                          }}
                        />
                      )}
                    </td>
                    <td className="p-3">
                      <a href={`/inventory-detail.html?sku=${encodeURIComponent(p.sku)}`} className="text-[#3D56A6] hover:underline font-medium">
                        {p.sku}
                      </a>
                    </td>
                    <td className="p-3 text-gray-700">
                      {isEditing("name") ? (
                        <input
                          autoFocus
                          className="w-full rounded-md border border-gray-300 px-2 py-1"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleBlur(p)}
                          onKeyDown={(e) => handleKeyDown(e, p)}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-[#2D4485] hover:underline"
                          onClick={() => {
                            setEditingId(rowId)
                            setEditingField("name")
                            setEditingValue(p.name)
                          }}
                        >
                          {p.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className="cursor-pointer hover:text-[#2D4485] hover:underline font-medium"
                        title="Click to update stock"
                        onClick={() => inv.setShowAdjust({ sku: p.sku, warehouse: p.warehouse || "Main", bin: p.bin || "A-01-01", lot: p.lot || "", current: Number(p.stockQty || 0) })}
                      >
                        {Number(p.stockQty).toLocaleString("en-US")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="relative inline-block">
                        <button
                          className={`${deliveryStatusClass(p.deliveryStatus)} px-2 py-1 rounded-full text-xs font-medium min-w-[80px]`}
                          onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === rowId ? null : rowId) }}
                        >
                          {p.deliveryStatus || "Set Status"}
                        </button>
                        {openStatusId === rowId && (
                          <div className="absolute z-20 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg left-0">
                            {["Pending", "Delivered", ""].map((status) => (
                              <button
                                key={status}
                                className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${status === "Pending" ? "text-amber-700" : status === "Delivered" ? "text-emerald-700" : "text-gray-500"}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenStatusId(null)
                                  if (status === "Delivered") {
                                    inv.setShowDeliver(p)
                                  } else {
                                    inv.updateItem(p, { deliveryStatus: status })
                                  }
                                }}
                              >
                                {status || "Clear"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      {isEditing("deliveryCompany") ? (
                        <input
                          autoFocus
                          className="w-full rounded-md border border-gray-300 px-2 py-1"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleBlur(p)}
                          onKeyDown={(e) => handleKeyDown(e, p)}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-[#2D4485] hover:underline truncate max-w-[120px] inline-block align-middle"
                          title={p.deliveryCompany || "Click to edit"}
                          onClick={() => {
                            setEditingId(rowId)
                            setEditingField("deliveryCompany")
                            setEditingValue(p.deliveryCompany || "")
                          }}
                        >
                          {p.deliveryCompany || "-"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 font-mono text-xs">
                      {p.trackingNumber ? (
                         (p.trackingUrl || getTrackingLink(p.courier, p.trackingNumber)) ? (
                           <button 
                             onClick={(e) => { 
                                e.stopPropagation(); 
                                navigator.clipboard.writeText(p.trackingNumber);
                                const url = p.trackingUrl || getTrackingLink(p.courier, p.trackingNumber);
                                if(url) window.open(url, '_blank');
                              }}
                             className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium bg-transparent border-0 p-0 cursor-pointer max-w-[140px]"
                             title={`Track ${p.trackingNumber} on ${p.courier} website`}
                           >
                             <span className="truncate">{p.trackingNumber}</span>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                           </button>
                         ) : (
                           <span className="truncate max-w-[140px] inline-block" title={p.trackingNumber}>{p.trackingNumber}</span>
                         )
                      ) : "-"}
                    </td>

                    <td className="p-3">{p.updatedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      
      {inv.showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Add Inventory Item</div>
            <AddItemForm onCancel={() => inv.setShowAdd(false)} onSave={inv.addItem} />
          </div>
        </div>
      )}
      {inv.showEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => inv.setShowEdit(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">Edit Item</div>
            <AddItemForm
              initialData={inv.showEdit}
              onCancel={() => inv.setShowEdit(null)}
              onSave={(data) => inv.updateItem(inv.showEdit, data)}
            />
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
            <DeliverForm sku={inv.showDeliver.sku} items={inv.items} onCancel={() => inv.setShowDeliver(null)} onConfirm={(qty, ref, status, company, tracking, courier, trackingUrl) => inv.deliverQty(inv.showDeliver.sku, qty, ref, status, company, inv.showDeliver.warehouse, inv.showDeliver.bin, inv.showDeliver.lot, tracking, courier, trackingUrl)} />
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

function AddItemForm({ onCancel, onSave, initialData }) {
  const initial = {
    sku: "WH/IV",
    name: "",
    photo: "",
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
  const [f, setF] = React.useState(initialData || initial)
  const canSave = Boolean(f.name)
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))

  const handleSave = () => {
    const payload = {
      ...f,
      sku: f.sku || `SKU-${Date.now()}`,
      serials: Array.isArray(f.serials) ? f.serials : []
    }
    onSave(payload)
  }

  return (
    <div className="space-y-3">
      {initialData && (
        <div className="text-sm text-gray-700">Product Number: <span className="font-semibold">{f.sku}</span></div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button disabled={!canSave} onClick={() => onSave({ ...f, serials: [] })} className="btn-pill disabled:opacity-50">Save</button>
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
      <div className="text-sm text-gray-700">Product Number: <span className="font-semibold">{sku}</span></div>
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
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button disabled={!canConfirm} onClick={() => onConfirm(Number(newQty), note || "Stock update")} className="btn-pill disabled:opacity-50">Confirm</button>
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
      <div className="text-sm text-gray-700">Product Number: <span className="font-semibold">{sku}</span></div>
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
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button onClick={() => onConfirm(qty, to, ref)} className="btn-pill">Transfer</button>
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
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button onClick={() => onFile && onFile(file)} className="btn-pill">Import</button>
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
      <div className="text-sm text-gray-700">Product Number: <span className="font-semibold">{sku}</span></div>
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
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Tracking</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">User</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="p-3 text-gray-600" colSpan={10}>No movements found</td></tr>
            ) : (
              rows.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{String(e.ts).slice(0, 19).replace("T", " ")}</td>
                  <td className="p-2">{e.type}</td>
                  <td className="p-2">{fmtChange(e)}</td>
                  <td className="p-2">{e.newQty != null ? e.newQty : ""}</td>
                  <td className="p-2">{e.reason || ""}</td>
                  <td className="p-2">{e.ref || e.from || e.to || ""}</td>
                  <td className="p-2">{e.company || "-"}</td>
                  <td className="p-2">
                     {e.tracking ? (
                       <a 
                         href={e.trackingUrl || getTrackingLink(e.courier, e.tracking)} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                         title={`Track via ${e.courier || "17TRACK"}`}
                         onClick={(evt) => evt.stopPropagation()}
                       >
                         <span className="truncate max-w-[100px] inline-block align-bottom">{e.tracking}</span>
                         <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                       </a>
                     ) : "-"}
                  </td>
                  <td className="p-2">
                    {e.type === 'sales_delivery' ? (
                       <span className={`px-2 py-0.5 rounded text-xs ${
                         e.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                         e.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {e.status || "Shipped"}
                       </span>
                    ) : "-"}
                  </td>
                  <td className="p-2">{e.user || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-pill">Close</button>
      </div>
    </div>
  )
}

function ReceiveForm({ sku, onCancel, onConfirm }) {
  const [qty, setQty] = React.useState(0)
  const [ref, setRef] = React.useState("")
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Product Number: <span className="font-semibold">{sku}</span></div>
      <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="Qty received" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="PO/GRN Reference" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button onClick={() => onConfirm(qty, ref)} className="btn-pill">Receive</button>
      </div>
    </div>
  )
}

function DeliverForm({ sku, onCancel, onConfirm, items = [] }) {
  // Simple delivery form to record outgoing items
  // Fields: Quantity, Reference (SO/DO), Courier info, and Customer
  const [qty, setQty] = React.useState(0)
  const [ref, setRef] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [status, setStatus] = React.useState("Delivered")
  const [tracking, setTracking] = React.useState("")
  const [courier, setCourier] = React.useState("Other")
  
  // Custom courier fields
  const [customCourier, setCustomCourier] = React.useState("")
  const [customUrl, setCustomUrl] = React.useState("")
  
  const isOther = courier === "Other"

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Product: <span className="font-semibold">{sku}</span></div>
      
      {/* Quantity & Reference */}
      <input type="number" min={0} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} placeholder="Quantity" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference No." className="w-full rounded-md border border-gray-300 px-3 py-2" />
      
      {/* Courier & Tracking */}
      <div className="grid grid-cols-2 gap-3">
        <select value={courier} onChange={(e) => setCourier(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
          <option value="Other">Other Courier</option>
          <option value="Kerry">Kerry Express</option>
          <option value="Flash">Flash Express</option>
          <option value="ThaiPost">Thai Post</option>
          <option value="J&T">J&T Express</option>
          <option value="DHL">DHL</option>
          <option value="SCG">SCG Express</option>
          <option value="NinjaVan">Ninja Van</option>
          <option value="Best">Best Express</option>
          <option value="Shopee">Shopee Xpress (SPX)</option>
          <option value="Lazada">Lazada Express (LEX)</option>
          <option value="Nim">Nim Express</option>
        </select>
        <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking No." className="w-full rounded-md border border-gray-300 px-3 py-2" />
      </div>

      {isOther && (
        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
          <input 
            value={customCourier} 
            onChange={(e) => setCustomCourier(e.target.value)} 
            placeholder="Specify Courier Name" 
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input 
            value={customUrl} 
            onChange={(e) => setCustomUrl(e.target.value)} 
            placeholder="Tracking Link (Optional)" 
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            title="Paste the full tracking URL if available"
          />
        </div>
      )}
      
      {/* Customer Info */}
      <input 
        value={company} 
        onChange={(e) => setCompany(e.target.value)} 
        placeholder="Customer Name" 
        className="w-full rounded-md border border-gray-300 px-3 py-2" 
      />

      {/* Delivery Status */}
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
        <option value="Pending">Pending</option>
        <option value="Delivered">Delivered</option>
      </select>
      
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button 
          onClick={() => {
            const finalCourier = isOther ? (customCourier || "Other") : courier
            onConfirm(qty, ref, status, company, tracking, finalCourier, customUrl)
          }} 
          className="btn-pill"
        >
          Deliver
        </button>
      </div>
    </div>
  )
}

function InventoryPage() {
  const inv = useInventory()
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Control Tower</h1>
              <button
                className="inline-flex items-center justify-center min-w-[150px] px-6 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-sm"
                title="Add Item"
                onClick={() => inv.setShowAdd(true)}
              >
                Add Item
              </button>
              <button
                onClick={() => inv.setShowImport(true)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 shadow-sm"
              >
                Import
              </button>
              <button
                onClick={inv.exportCsv}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 shadow-sm"
              >
                Export
              </button>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={inv.query}
                    onChange={(e) => inv.setQuery(e.target.value)}
                    placeholder="Search by name or product number"
                    className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {inv.query && (
                    <button
                      onClick={() => inv.setQuery("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Clear Search"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                 <button
                    onClick={() => {
                      inv.setHistoryFilter(null)
                      inv.setView(inv.view === "history" ? "inventory" : "history")
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 shadow-sm"
                  >
                    {inv.view === "history" ? "Inventory" : "History"}
                  </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
             {inv.view === "history" ? <HistoryView inv={inv} /> : <InventoryTable inv={inv} />}
          </div>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InventoryPage />
  </React.StrictMode>,
)
