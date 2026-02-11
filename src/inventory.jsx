import React from "react"
import ReactDOM from "react-dom/client"
import { createPortal } from "react-dom"
import { Trash } from "lucide-react"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL } from "./config"
import "./index.css"

/** Build tracking URL from courier + number (or use custom full URL) */
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
    case "Lazada": return `https://tracker.lel.asia/tracker?trackingNumber=${number}`
    case "Shopee": return `https://spx.co.th/` // Shopee often needs tracking in app/site search
    case "Nim": return `https://www.nimexpress.com/web/p/tracking?i=${number}`
    default: return `https://t.17track.net/en#nums=${number}`
  }
}

const buildTrackingUrl = (courier, trackingNumber, trackingUrl) => {
  // If user pasted full URL, keep it
  if (trackingUrl && String(trackingUrl).trim()) return String(trackingUrl).trim()
  // Otherwise compute from courier+number
  return getTrackingLink(courier, trackingNumber) || ""
}

function useInventory() {
  const [query, setQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState("updatedAt")
  const [sortDir, setSortDir] = React.useState("desc")
  const [items, setItems] = React.useState([])
  const [showAdd, setShowAdd] = React.useState(false)
  const [showEdit, setShowEdit] = React.useState(null)
  const [showAdjust, setShowAdjust] = React.useState(null)
  const [showTransfer, setShowTransfer] = React.useState(null)
  const [showReceive, setShowReceive] = React.useState(null)
  const [showDeliver, setShowDeliver] = React.useState(null)
  const [role, setRole] = React.useState("Inventory Admin")
  const [refQuery, setRefQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("All")
  const [showHistory, setShowHistory] = React.useState(null)
  const [view, setView] = React.useState("inventory")
  const [historyFilter, setHistoryFilter] = React.useState(null)
  const [selectedRows, setSelectedRows] = React.useState([])
  
  // Delivery/Movements State
  const [movements, setMovements] = React.useState([])
  const [deliveries, setDeliveries] = React.useState([]) // Backend delivery records
  const [selectedDeliveryIds, setSelectedDeliveryIds] = React.useState([])
  const [error, setError] = React.useState(null)

  const refreshDeliveries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/delivery/`)
      if (response.ok) {
        const data = await response.json()
        setDeliveries(data)
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error)
    }
  }

  React.useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
      const logs = Array.isArray(raw) ? raw : []
      // Normalize IDs if missing
      const normalized = logs.map(l => {
        if (!l.id) return { ...l, id: String(Date.now()) + Math.random().toString(36).slice(2) }
        return l
      })
      if (logs.some(l => !l.id)) {
        localStorage.setItem("inventoryMovements", JSON.stringify(normalized))
      }
      setMovements(normalized)
    } catch {
      setMovements([])
    }
  }, [])

  const saveItems = (next) => {
    setItems(next)
    try { localStorage.setItem("inventoryProducts", JSON.stringify(next)) } catch {}
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

  // Fetch inventory from backend and merge with local data
  // This ensures we get the latest stock/names from server while preserving local fields (warehouse, bin, etc.)
  const refreshInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/`)
      if (response.ok) {
        setError(null)
        const data = await response.json()
        
        let localItems = []
        try { localItems = JSON.parse(localStorage.getItem("inventoryProducts") || "[]") } catch {}

        // Group local items by SKU to handle multi-warehouse distribution
        const localGroups = {}
        localItems.forEach(item => {
            if (!item.sku) return
            if (!localGroups[item.sku]) localGroups[item.sku] = []
            localGroups[item.sku].push(item)
        })

        const finalItems = []

        // Iterate over Backend Items (Source of Truth for Total Stock & Name)
        data.forEach(backendItem => {
           const sku = `INV-${backendItem.id}`
           const totalStock = Number(backendItem.inventory_stock || 0)
           const group = localGroups[sku] || []

           if (group.length === 0) {
             // New item from backend (not in local) - Create default entry
             finalItems.push({
               // Defaults
               warehouse: "Main",
               category: "Finished Goods",
               price: 0,
               bin: "A-01-01",
               lot: "",
               expiry: "",
               reserved: 0,
               incomingQty: 0,
               outgoingQty: 0,
               barcode: "",
               uom: "pcs",
               description: "",
               brand: "",
               model: "",
               minStock: 0,
               reorderQty: 0,
               valuationMethod: "FIFO",
               serials: [],
               manufactureDate: "",
               deliveryStatus: "",
               deliveryCompany: "",
               trackingNumber: "",
               courier: "",
               trackingUrl: "",
               trackingStatus: "",
               
               // Backend Data
               sku: sku,
               name: backendItem.inventory_product_name,
               stockQty: totalStock,
               updatedAt: backendItem.last_updated_day ? backendItem.last_updated_day.slice(0, 10) : new Date().toISOString().slice(0, 10),
               instock: totalStock > 0 ? 1 : 0,
               status: totalStock > 0 ? "Active" : "Inactive",
             })
           } else {
             // Existing local items - Reconcile stock
             const localTotal = group.reduce((sum, i) => sum + Number(i.stockQty || 0), 0)
             const diff = totalStock - localTotal

             // Update common fields from backend (name, date) for all rows
             const updatedGroup = group.map(item => ({
               ...item,
               name: backendItem.inventory_product_name,
               updatedAt: backendItem.last_updated_day ? backendItem.last_updated_day.slice(0, 10) : new Date().toISOString().slice(0, 10),
               instock: totalStock > 0 ? 1 : 0, // Global status based on total stock
               status: totalStock > 0 ? "Active" : "Inactive"
             }))

             if (diff !== 0) {
                 // Adjust stock to match backend total
                 // We add/subtract the difference from the "Main" warehouse or the first available row
                 let targetIdx = updatedGroup.findIndex(i => (i.warehouse === "Main"))
                 if (targetIdx === -1) targetIdx = 0 

                 let remainingDiff = diff
                 
                 if (remainingDiff > 0) {
                     // Backend has MORE stock -> Add to target
                     updatedGroup[targetIdx].stockQty = Number(updatedGroup[targetIdx].stockQty || 0) + remainingDiff
                 } else {
                     // Backend has LESS stock -> Subtract from rows until satisfied
                     // We try to subtract from target first, then others
                     // Since remainingDiff is negative, we want to add it (reduce stock)
                     
                     // First apply to target
                     let targetStock = Number(updatedGroup[targetIdx].stockQty || 0)
                     let canTake = Math.min(targetStock, Math.abs(remainingDiff))
                     updatedGroup[targetIdx].stockQty = targetStock - canTake
                     remainingDiff += canTake // Move towards 0
                     
                     // If still negative, distribute to others
                     if (remainingDiff < 0) {
                         for (let i = 0; i < updatedGroup.length; i++) {
                             if (i === targetIdx) continue // Already handled
                             if (remainingDiff === 0) break
                             
                             let q = Number(updatedGroup[i].stockQty || 0)
                             let take = Math.min(q, Math.abs(remainingDiff))
                             updatedGroup[i].stockQty = q - take
                             remainingDiff += take
                         }
                     }
                 }
             }
             
             finalItems.push(...updatedGroup)
           }
        })

        setItems(finalItems)
        try { localStorage.setItem("inventoryProducts", JSON.stringify(finalItems)) } catch {}
      } else {
        setError("Failed to fetch inventory data from server.")
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
      setError("Unable to connect to inventory server. Please check your connection.")
    }
  }

  React.useEffect(() => {
    refreshInventory()
    refreshDeliveries()
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

  const pageItems = sorted

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const addItem = async (payload, keepOpen = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory_product_name: payload.name,
          inventory_stock: payload.stockQty,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save to backend: ${response.statusText}`)
      }

      // Only update local state if backend save succeeds
      const s = String(payload.sku || "")
      const valid = /^WH\/IV\/\d+$/.test(s)
      const assignedSku = valid ? s : `WH/IV/${nextWhIvNumber()}`

      const trackingUrl = buildTrackingUrl(payload.courier, payload.trackingNumber, payload.trackingUrl)

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
          trackingUrl,
        },
        ...items,
      ]
      saveItems(next)
      if (!keepOpen) setShowAdd(false)
      
      // Refresh list from backend to be sure
      // We use the shared refreshInventory function to ensure consistency across the app
      await refreshInventory()

    } catch (e) {
      console.error("Backend sync failed", e)
      alert("Failed to save inventory item to database. Please check your connection.")
    }
  }

  const logMove = (entry) => {
    try {
      const newLog = { 
        ...entry, 
        id: entry.id || Date.now().toString(36) + Math.random().toString(36).substr(2), 
        ts: new Date().toISOString(), 
        user: role 
      }
      const nextLogs = [...movements, newLog]
      setMovements(nextLogs)
      localStorage.setItem("inventoryMovements", JSON.stringify(nextLogs))
    } catch {}
  }

  // Update stock quantity on backend and refresh
  // This function handles both backend sync and local movement logging
  const setQty = async (sku, warehouse, bin, lot, newQty, reason, ref) => {
    const finalQty = Math.max(0, Number(newQty || 0))

    // 1. Update Backend
    if (sku && sku.startsWith("INV-")) {
      const id = sku.split("-")[1]
      if (id) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/inventory/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inventory_stock: finalQty })
          })
          if (!res.ok) throw new Error("Backend update failed")
        } catch (e) {
          console.error("Stock update failed", e)
          alert("Failed to update stock on server. Please check connection.")
          return // Stop if backend fails to prevent desync
        }
      }
    }

    // 2. Update Local State (Optimistic/Legacy) & Log Movement
    const next = items.map((it) => {
      if (!(it.sku === sku && (it.warehouse || "Main") === (warehouse || "Main") && (it.bin || "A-01-01") === (bin || "A-01-01") && (it.lot || "") === (lot || ""))) return it
      return { ...it, stockQty: finalQty, status: finalQty > 0 ? "Active" : "Inactive", updatedAt: new Date().toISOString().slice(0, 10) }
    })
    saveItems(next)

    const item = items.find((it) => it.sku === sku && (it.warehouse || "Main") === (warehouse || "Main") && (it.bin || "A-01-01") === (bin || "A-01-01") && (it.lot || "") === (lot || ""))
    const prevQty = item ? Number(item.stockQty || 0) : 0
    logMove({ type: "adjustment", sku, warehouse: warehouse || "Main", bin: bin || "A-01-01", lot: lot || "", delta: finalQty - prevQty, newQty: finalQty, reason, ref })
    
    setShowAdjust(null)

    // 3. Refresh data from backend
    await refreshInventory()
  }

  // Receive goods: Update backend stock and log movement
  const receiveQty = async (sku, qty, ref, company) => {
    if (!qty || qty <= 0) { setShowReceive(null); return }
    const qtyNum = Number(qty)

    // 1. Update Backend
    if (sku && sku.startsWith("INV-")) {
      const id = sku.split("-")[1]
      const currentItem = items.find(i => i.sku === sku)
      if (id && currentItem) {
        const newStock = Number(currentItem.stockQty || 0) + qtyNum
        try {
          const res = await fetch(`${API_BASE_URL}/api/inventory/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inventory_stock: newStock })
          })
          if (!res.ok) throw new Error("Backend update failed")
        } catch (e) {
          console.error("Receive sync failed", e)
          alert("Failed to sync receipt to server.")
          return
        }
      }
    }

    // 2. Update Local
    const next = items.map((it) => (
      it.sku === sku
        ? { ...it, stockQty: Number(it.stockQty || 0) + qtyNum, incomingQty: Math.max(0, Number(it.incomingQty || 0) - qtyNum), deliveryStatus: "Delivered", updatedAt: new Date().toISOString().slice(0, 10) }
        : it
    ))
    saveItems(next)
    logMove({ type: "purchase_receipt", sku, qty: qtyNum, ref, company, label: "Tax Invoice" })
    setShowReceive(null)

    // 3. Refresh
    await refreshInventory()
  }

  // Deliver goods: Update backend stock and log movement
  const deliverQty = async (sku, qty, ref, status, company, warehouse, bin, lot, tracking, courier, trackingUrl) => {
    if (!qty || qty <= 0) { setShowDeliver(null); return }

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

    const isShipped = ["Shipped", "Delivered"].includes(status || "Delivered")
    
    // 1. Update Backend if shipped
    if (isShipped && sku && sku.startsWith("INV-")) {
      const id = sku.split("-")[1]
      if (id && item) {
         const newStock = Math.max(0, Number(item.stockQty || 0) - Number(qty))
         try {
           const res = await fetch(`${API_BASE_URL}/api/inventory/${id}/`, {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ inventory_stock: newStock })
           })
           if (!res.ok) throw new Error("Backend update failed")
         } catch (e) {
           console.error("Delivery sync failed", e)
           alert("Failed to sync delivery to server.")
           return
         }
      }
    }

    const isPending = ["Pending", "Ready"].includes(status)
    const finalTrackingUrl = buildTrackingUrl(courier, tracking, trackingUrl)

    const next = items.map((it) => {
      if (it.sku !== sku) return it
      if (warehouse !== undefined && (it.warehouse || "Main") !== (warehouse || "Main")) return it
      if (bin !== undefined && (it.bin || "") !== (bin || "")) return it
      if (lot !== undefined && (it.lot || "") !== (lot || "")) return it

      let newStock = Number(it.stockQty || 0)
      let newReserved = Number(it.reserved || 0)
      let newOutgoing = Number(it.outgoingQty || 0)

      if (isShipped) newStock = Math.max(0, newStock - Number(qty))
      else if (isPending) { newReserved += Number(qty); newOutgoing += Number(qty) }

      return {
        ...it,
        stockQty: newStock,
        reserved: newReserved,
        outgoingQty: newOutgoing,
        deliveryStatus: status || "Delivered",
        deliveryCompany: company || "",
        trackingNumber: tracking || "",
        courier: courier || "",
        trackingUrl: finalTrackingUrl || "",
        updatedAt: new Date().toISOString().slice(0, 10),
      }
    })

    saveItems(next)
    logMove({ type: "sales_delivery", sku, qty: Number(qty), ref, company, status: status || "Delivered", tracking: tracking || "", courier, trackingUrl: finalTrackingUrl })
    setShowDeliver(null)

    // 3. Refresh
    await refreshInventory()
  }

  // Transfer stock between warehouses/bins
  // NOTE: This operation is currently local-only because the Backend only stores "Total Stock" per product.
  // The distribution of stock across warehouses is maintained in Local Storage.
  // Since "Transfer" does not change the Total Stock, we do not need to call the Backend API here.
  // The new refreshInventory logic will preserve this distribution while syncing the Total Stock.
  const transferQty = (sku, qty, fromWarehouse, toWarehouse, ref) => {
    if (!qty || qty <= 0 || fromWarehouse === toWarehouse) { setShowTransfer(null); return }
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
      if (src) next.push({ ...src, warehouse: toWarehouse, stockQty: Number(qty || 0), bin: "A-01-01", updatedAt: new Date().toISOString().slice(0, 10) })
    }
    saveItems(next)
    logMove({ type: "transfer", sku, qty: Number(qty), from: fromWarehouse, to: toWarehouse, ref })
    setShowTransfer(null)
  }

  const exportCsv = () => {
    const headers = ["Index", "Productname", "stockQty", "updatedAt"]
    const rows = items.map((item, idx) => {
      const values = [
        String(idx + 1),
        item.name ?? "",
        item.stockQty ?? "",
        item.updatedAt ?? ""
      ]
      return values
        .map((v) => {
          const s = String(v)
          const needsQuote = s.includes(",") || s.includes("\n") || s.includes('"')
          return needsQuote ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(",")
    })
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory.csv"
    a.click()
  }

  // Update item details on backend and refresh
  const updateItem = async (original, updates) => {
    // 1. Update Backend
    if (original.sku && original.sku.startsWith("INV-")) {
      const id = original.sku.split("-")[1]
      if (id) {
        try {
          // Map frontend fields to backend fields
          const backendPayload = {}
          if (updates.name !== undefined) backendPayload.inventory_product_name = updates.name
          if (updates.stockQty !== undefined) backendPayload.inventory_stock = updates.stockQty
          
          if (Object.keys(backendPayload).length > 0) {
            const res = await fetch(`${API_BASE_URL}/api/inventory/${id}/`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(backendPayload)
            })
            if (!res.ok) throw new Error("Backend update failed")
          }
        } catch (e) {
          console.error("Update failed", e)
          alert("Failed to update item on server.")
          return
        }
      }
    }

    // 2. Update Local State (Legacy)
    const next = items.map((it) => {
      const sameRow =
        it.sku === original.sku &&
        (it.warehouse || "Main") === (original.warehouse || "Main") &&
        (it.bin || "A-01-01") === (original.bin || "A-01-01") &&
        (it.lot || "") === (original.lot || "")

      if (!sameRow) return it

      // if tracking changed, recompute trackingUrl
      const nextCourier = updates.courier ?? it.courier
      const nextTrackingNumber = updates.trackingNumber ?? it.trackingNumber
      const nextTrackingUrl = buildTrackingUrl(nextCourier, nextTrackingNumber, updates.trackingUrl ?? it.trackingUrl)

      return {
        ...it,
        ...updates,
        trackingUrl: nextTrackingUrl,
        updatedAt: new Date().toISOString().slice(0, 10),
      }
    })
    saveItems(next)

    // 3. Refresh from backend
    await refreshInventory()
  }

  const getRowId = (p) => `${p.sku}-${p.warehouse || "Main"}-${p.bin || "A-01-01"}-${p.lot || ""}`

  const deleteItems = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return

    const itemsToDelete = items.filter((p) => ids.includes(getRowId(p)))
    
    // Group deletions by SKU to decide between Full Delete vs Partial Stock Reduction
    const deletionGroups = {}
    itemsToDelete.forEach(item => {
        if (!item.sku) return
        if (!deletionGroups[item.sku]) deletionGroups[item.sku] = []
        deletionGroups[item.sku].push(item)
    })

    const backendDeletes = []
    const backendUpdates = []

    for (const sku in deletionGroups) {
        // Only process backend-synced items
        if (!sku.startsWith("INV-")) continue 
        
        const toDelete = deletionGroups[sku]
        const allRowsForSku = items.filter(i => i.sku === sku)
        
        // Check if we are deleting ALL rows for this SKU
        if (toDelete.length === allRowsForSku.length) {
            // Full Delete: Remove the product entirely from backend
            const id = sku.split("-")[1]
            if (id) backendDeletes.push(id)
        } else {
            // Partial Delete: Removing specific warehouse/bin entries
            // We must reduce backend total stock by the quantity of deleted items
            const id = sku.split("-")[1]
            if (id) {
                const qtyToRemove = toDelete.reduce((sum, i) => sum + Number(i.stockQty || 0), 0)
                const currentTotal = allRowsForSku.reduce((sum, i) => sum + Number(i.stockQty || 0), 0)
                const newStock = Math.max(0, currentTotal - qtyToRemove)
                backendUpdates.push({ id, inventory_stock: newStock })
            }
        }
    }

    try {
        // Execute Backend Operations
        if (backendDeletes.length > 0) {
            await Promise.all(backendDeletes.map(id => 
                fetch(`${API_BASE_URL}/api/inventory/${id}/`, { method: "DELETE" })
            ))
        }
        
        if (backendUpdates.length > 0) {
            await Promise.all(backendUpdates.map(update => 
                fetch(`${API_BASE_URL}/api/inventory/${update.id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ inventory_stock: update.inventory_stock })
                })
            ))
        }
        
        // Update Local State immediately
        // We remove deleted items from local storage so refreshInventory knows they are gone
        const remaining = items.filter(p => !ids.includes(getRowId(p)))
        saveItems(remaining) 

        // Refresh to ensure final sync with backend
        await refreshInventory()
        setSelectedRows([])
        
    } catch (e) {
        console.error("Delete operation failed", e)
        setError("Failed to delete items. Please check connection.")
    }
  }

  const deliveryRows = React.useMemo(() => {
    // Map backend deliveries
    const backendRows = deliveries.map(d => ({
         id: d.id,
         ts: d.created_at,
         type: "sales_delivery",
         productName: d.inventory_product_name_display || "Unknown",
         sku: "INV-" + d.inventory_product_name,
         orderAmount: d.order_amount,
         status: d.delivery_status ? d.delivery_status.charAt(0).toUpperCase() + d.delivery_status.slice(1) : "Pending",
         company: d.company_name_display || "",
         tracking: d.tracking_number || "",
         courier: d.courier || "",
         trackingUrl: buildTrackingUrl(d.courier, d.tracking_number, ""),
         isBackend: true
     }))

    const localRows = movements
      .filter((e) => e.type === "sales_delivery")
      .map(log => {
          const p = items.find(i => i.sku === log.sku)
          return {
            ...log,
            productName: p ? p.name : log.sku,
            orderAmount: log.qty,
            isBackend: false
          }
      })

    return [...backendRows, ...localRows]
      .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
      .filter(r => {
          if (!query) return true
          const q = query.toLowerCase()
          return (
            (r.productName || "").toLowerCase().includes(q) ||
            (r.sku || "").toLowerCase().includes(q) ||
            (r.company || "").toLowerCase().includes(q) ||
            (r.tracking || "").toLowerCase().includes(q)
          )
      })
  }, [movements, items, query, deliveries])

  const addDelivery = async (payload) => {
    try {
      // Find product ID from SKU if possible
      // payload.sku is likely "INV-123" or product name? 
      // In DeliveryView, it sends `sku` which is `it.sku` (e.g. "INV-123")
      
      let productId = null
      if (payload.sku && payload.sku.startsWith("INV-")) {
          productId = payload.sku.split("-")[1]
      } else {
          // Try to find by name? Or if SKU is just the name?
          // DeliveryView uses `it.sku` as value.
          // If manually entered, might be tricky.
          const item = items.find(i => i.sku === payload.sku)
          if (item && item.sku.startsWith("INV-")) {
              productId = item.sku.split("-")[1]
          }
      }

      const body = {
          inventory_product_name: productId,
          order_amount: payload.qty,
          delivery_status: "pending",
          company_name_input: payload.company, // Use input field for name
          tracking_number: payload.tracking,
          courier: payload.courier
      }

      const response = await fetch(`${API_BASE_URL}/api/delivery/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
      })

      if (response.ok) {
          await refreshDeliveries()
          // Optionally also log local movement for stock consistency if needed
          // But usually backend should handle stock deduction? 
          // Current logic in DeliveryView calls addMovement which is local.
          // We might need to keep local movement for stock update if backend doesn't trigger it automatically
          // OR if we rely on `deliverQty` function.
          // But `saveNewRow` is "Manual Delivery Row", it might not affect stock immediately or maybe it should?
          // The original `saveNewRow` calls `inv.addMovement` which DOES NOT update stock automatically (it just logs it).
          // `deliverQty` updates stock.
          // So `saveNewRow` is just a record?
          
          // If we want stock deduction, we should use `deliverQty`.
          // But `saveNewRow` seems to be just creating a record.
      } else {
          const err = await response.json()
          console.error("Failed to add delivery", err)
          alert("Failed to save delivery: " + JSON.stringify(err))
      }
    } catch (e) {
        console.error("Error adding delivery:", e)
        alert("Error connecting to server")
    }
  }

  const addMovement = (entry) => {
    logMove(entry)
  }

  const updateMovement = async (id, updates) => {
    // Check if it's a backend delivery
    const isBackend = deliveries.some(d => d.id === id)
    if (isBackend) {
        const payload = {}
        if (updates.status) payload.delivery_status = updates.status.toLowerCase()
        if (updates.tracking) payload.tracking_number = updates.tracking
        if (updates.courier) payload.courier = updates.courier
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/delivery/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                await refreshDeliveries()
            }
        } catch (e) {
            console.error("Failed to update backend delivery", e)
        }
        return
    }

    const next = movements.map(m => m.id === id ? { ...m, ...updates } : m)
    setMovements(next)
    localStorage.setItem("inventoryMovements", JSON.stringify(next))
  }

  const deleteMovements = async (ids) => {
    if (!ids || !ids.length) return
    
    // Separate backend and local IDs
    const backendIds = ids.filter(id => deliveries.some(d => d.id === id))
    const localIds = ids.filter(id => !backendIds.includes(id))

    // Delete backend items
    if (backendIds.length > 0) {
        try {
            await Promise.all(backendIds.map(id => 
                fetch(`${API_BASE_URL}/api/delivery/${id}/`, { method: "DELETE" })
            ))
            await refreshDeliveries()
        } catch (e) {
            console.error("Failed to delete backend deliveries", e)
        }
    }

    // Delete local items
    if (localIds.length > 0) {
        const next = movements.filter(m => !localIds.includes(m.id))
        setMovements(next)
        localStorage.setItem("inventoryMovements", JSON.stringify(next))
    }
    
    setSelectedDeliveryIds([])
  }

  return {
    query, setQuery,
    pageItems,
    toggleSort,
    sortKey, sortDir,
    showAdd, setShowAdd,
    showEdit, setShowEdit,
    showAdjust, setShowAdjust,
    showTransfer, setShowTransfer,
    addItem, updateItem,
    deleteItems, getRowId,
    setQty, transferQty,
    exportCsv,
    warehouses,
    role, setRole,
    refQuery, setRefQuery,
    categories,
    categoryFilter, setCategoryFilter,
    showReceive, setShowReceive,
    showDeliver, setShowDeliver,
    receiveQty, deliverQty,
    items,
    showHistory, setShowHistory,
    view, setView,
    historyFilter, setHistoryFilter,
    selectedRows, setSelectedRows,
    // Delivery exports
    deliveryRows,
    selectedDeliveryIds, setSelectedDeliveryIds,
    addMovement, updateMovement, deleteMovements,
    addDelivery,
    error,
  }
}

function InventoryTable({ inv }) {
  const [editingId, setEditingId] = React.useState(null)
  const [editingField, setEditingField] = React.useState(null)
  const [editingValue, setEditingValue] = React.useState("")
  const [editingCourier, setEditingCourier] = React.useState("")
  const [openStatusId, setOpenStatusId] = React.useState(null)
  const [columnModes, setColumnModes] = React.useState({})
  const { selectedRows, setSelectedRows, getRowId } = inv

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(inv.pageItems.map((p) => getRowId(p)))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows((prev) => prev.filter((r) => r !== id))
    else setSelectedRows((prev) => [...prev, id])
  }

  const handleKeyDown = (e, p) => {
    if (e.key === "Enter") {
      if (editingField === "trackingNumber") {
        inv.updateItem(p, { trackingNumber: editingValue, courier: editingCourier })
      } else if (editingField === "stockQty") {
        const newQty = Number(editingValue)
        if (!isNaN(newQty)) {
          inv.setQty(p.sku, p.warehouse, p.bin, p.lot, newQty, "Manual Inline Update", "")
        }
      } else {
        inv.updateItem(p, { [editingField]: editingField === "price" ? Number(editingValue) : editingValue })
      }
      setEditingId(null)
      setEditingField(null)
    } else if (e.key === "Escape") {
      setEditingId(null)
      setEditingField(null)
    }
  }

  const handleBlur = (e, p) => {
    if (editingField === "trackingNumber") {
      if (e.relatedTarget && e.relatedTarget.closest(".tracking-edit-container")) return
      inv.updateItem(p, { trackingNumber: editingValue, courier: editingCourier })
    } else if (editingField === "stockQty") {
      const newQty = Number(editingValue)
      if (!isNaN(newQty)) {
        inv.setQty(p.sku, p.warehouse, p.bin, p.lot, newQty, "Manual Inline Update", "")
      }
    } else {
      inv.updateItem(p, { [editingField]: editingField === "price" ? Number(editingValue) : editingValue })
    }
    setEditingId(null)
    setEditingField(null)
  }

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

  const applyStockForStatusChange = (sku, qty, prev, next) => {
    try {
      const item = inv.items.find((it) => it.sku === sku)
      if (!item) return
      let delta = 0
      if (prev === "Delivered" && next !== "Delivered") delta = Number(qty || 0) // add back
      if (prev !== "Delivered" && next === "Delivered") delta = -Number(qty || 0) // deduct
      if (delta === 0) return
      const newStock = Math.max(0, Number(item.stockQty || 0) + delta)
      inv.updateItem(item, { stockQty: newStock })
    } catch {}
  }

  const columns = [
    { id: "name", label: "Product Name", sortable: true, defaultClass: "max-w-xs truncate" },
    { id: "stockQty", label: "Stock", sortable: true, defaultClass: "font-mono" },
    { id: "updatedAt", label: "Last Updated", sortable: true },
  ]

  const toggleMode = (id, mode) => {
    setColumnModes((prev) => ({ ...prev, [id]: prev[id] === mode ? undefined : mode }))
  }

  const renderCellContent = (col, p) => {
    if (columnModes[col.id] === "folded") return <span className="text-gray-300">•</span>

    const rowId = getRowId(p)
    const isEditing = (field) => editingId === rowId && editingField === field

    switch (col.id) {
      case "sku":
        return (
          <a href={`/inventory-detail.html?sku=${encodeURIComponent(p.sku)}`} className="text-[#3D56A6] hover:underline font-medium">
            {p.sku}
          </a>
        )

      case "name":
        return isEditing("name") ? (
          <input
            autoFocus
            className="w-full rounded-md border border-gray-300 px-2 py-1"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={(e) => handleBlur(e, p)}
            onKeyDown={(e) => handleKeyDown(e, p)}
          />
        ) : (
          <span
            className="cursor-pointer hover:text-[#2D4485] hover:underline"
            onClick={() => { setEditingId(rowId); setEditingField("name"); setEditingValue(p.name) }}
          >
            {p.name}
          </span>
        )

      case "stockQty":
        return isEditing("stockQty") ? (
          <input
            autoFocus
            type="number"
            className="w-full rounded-md border border-gray-300 px-2 py-1 font-mono"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={(e) => handleBlur(e, p)}
            onKeyDown={(e) => handleKeyDown(e, p)}
          />
        ) : (
          <span
            className="cursor-pointer hover:text-[#2D4485] hover:underline font-medium"
            title="Click to update stock"
            onClick={() => { setEditingId(rowId); setEditingField("stockQty"); setEditingValue(p.stockQty) }}
          >
            {Number(p.stockQty).toLocaleString("en-US")}
          </span>
        )

      case "deliveryStatus":
        return (
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
                      if (status === "Delivered") inv.setShowDeliver(p)
                      else inv.updateItem(p, { deliveryStatus: status })
                    }}
                  >
                    {status || "Clear"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case "deliveryCompany":
        return isEditing("deliveryCompany") ? (
          <input
            autoFocus
            className="w-full rounded-md border border-gray-300 px-2 py-1"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={(e) => handleBlur(e, p)}
            onKeyDown={(e) => handleKeyDown(e, p)}
          />
        ) : (
          <span
            className="cursor-pointer hover:text-[#2D4485] hover:underline truncate max-w-[120px] inline-block align-middle"
            title={p.deliveryCompany || "Click to edit"}
            onClick={() => { setEditingId(rowId); setEditingField("deliveryCompany"); setEditingValue(p.deliveryCompany || "") }}
          >
            {p.deliveryCompany || "-"}
          </span>
        )

      case "tracking": {
        const url = p.trackingUrl || getTrackingLink(p.courier, p.trackingNumber)

        return isEditing("trackingNumber") ? (
          <div className="tracking-edit-container flex flex-col gap-1 min-w-[160px]">
            <input
              autoFocus
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={(e) => handleBlur(e, p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
              placeholder="Tracking #"
            />
            <select
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
              value={editingCourier}
              onChange={(e) => setEditingCourier(e.target.value)}
              onBlur={(e) => handleBlur(e, p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
            >
              <option value="">Courier...</option>
              {["Kerry", "Flash", "ThaiPost", "J&T", "DHL", "SCG", "NinjaVan", "Best", "Shopee", "Lazada", "Nim", "Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        ) : (
          <div
            className="text-xs font-mono cursor-pointer"
            onClick={() => { setEditingId(rowId); setEditingField("trackingNumber"); setEditingValue(p.trackingNumber || ""); setEditingCourier(p.courier || "") }}
            title="Click to edit tracking"
          >
            {p.trackingNumber ? (
              url ? (
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-mono font-medium text-gray-900">{p.trackingNumber}</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                    title={`Open tracking website`}
                  >
                    <span>{p.courier ? `Track on ${p.courier}` : "Track Package"}</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              ) : (
                <span className="truncate max-w-[140px] inline-block">{p.trackingNumber}</span>
              )
            ) : (
              <span className="text-gray-400 opacity-50 hover:opacity-100 transition-opacity">+ Add</span>
            )}
          </div>
        )
      }

      case "updatedAt":
        return <span className="text-gray-600 text-sm">{p.updatedAt}</span>

      default:
        return <span>-</span>
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="text-lg font-semibold text-gray-900">Inventory</div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center justify-center min-w-[120px] px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-sm"
              onClick={() => inv.setShowAdd(true)}
              title="Add Item"
            >
              Add Item
            </button>
            <button
              onClick={inv.exportCsv}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 shadow-sm"
              title="Export"
            >
              Export
            </button>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  checked={inv.pageItems.length > 0 && selectedRows.length === inv.pageItems.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-4 border-b text-center">INDEX</th>
              {columns.map((col) => {
                const mode = columnModes[col.id]
                return (
                  <th
                    key={col.id}
                    className={`p-4 border-b transition-all duration-300 group relative align-top ${
                      mode === "folded" ? "w-12 max-w-[3rem]" : mode === "expanded" ? "min-w-[300px]" : "whitespace-nowrap"
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-2 ${mode === "folded" ? "justify-center" : ""}`}>
                      {mode !== "folded" && (
                        <div
                          className={`flex items-center gap-1 ${col.sortable ? "cursor-pointer hover:text-gray-900" : ""}`}
                          onClick={() => col.sortable && inv.toggleSort(col.id)}
                        >
                          {col.label}
                        </div>
                      )}

                      <div className={`flex items-center gap-1 bg-white rounded-md shadow-md border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                        mode === "folded" ? "opacity-100 absolute left-1/2 -translate-x-1/2 top-2" : ""
                      }`}>
                        {mode !== "folded" && (
                          <button onClick={() => toggleMode(col.id, "folded")} className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors" title="Fold Column">
                            ◀▶
                          </button>
                        )}
                        {mode !== "expanded" ? (
                          <button onClick={() => toggleMode(col.id, "expanded")} className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors" title="Fully Expand">
                            ⤢
                          </button>
                        ) : (
                          <button onClick={() => toggleMode(col.id, undefined)} className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors" title="Reset Width">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {inv.pageItems.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="p-8 text-center text-gray-400">
                  {inv.query ? "No matching items found." : "No inventory items."}
                </td>
              </tr>
            )}

            {inv.pageItems.map((p, i) => {
              const rowId = getRowId(p)
              return (
                <tr key={i} className={`transition border-b border-gray-100 ${selectedRows.includes(rowId) ? "bg-blue-200 hover:bg-blue-300" : "hover:bg-gray-50"}`}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      onChange={() => handleSelectRow(rowId)}
                      checked={selectedRows.includes(rowId)}
                    />
                  </td>
                  <td className="p-4 text-center text-gray-600">{i + 1}</td>

                  {columns.map((col) => {
                    const mode = columnModes[col.id]
                    return (
                      <td
                        key={col.id}
                        className={`p-4 transition-all duration-300 align-top ${
                          mode === "folded"
                            ? "w-12 max-w-[3rem] text-center overflow-hidden p-2"
                            : mode === "expanded"
                              ? "min-w-[300px] whitespace-normal break-words text-gray-600"
                              : `whitespace-nowrap text-gray-600 ${col.defaultClass || ""}`
                        }`}
                      >
                        {renderCellContent(col, p)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals (same as your original) */}
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
            <DeliverForm
              sku={inv.showDeliver.sku}
              items={inv.items}
              onCancel={() => inv.setShowDeliver(null)}
              onConfirm={(qty, ref, status, company, tracking, courier, trackingUrl) =>
                inv.deliverQty(inv.showDeliver.sku, qty, ref, status, company, inv.showDeliver.warehouse, inv.showDeliver.bin, inv.showDeliver.lot, tracking, courier, trackingUrl)
              }
            />
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
    trackingNumber: "",
    courier: "",
    trackingUrl: "",
  }

  const [f, setF] = React.useState(initialData || initial)
  const canSave = Boolean(f.name)
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-3">
      {initialData && (
        <div className="text-sm text-gray-700">
          Product Number: <span className="font-semibold">{f.sku}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Product name</label>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Laser Welding Machine" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Stock qty</label>
          <input type="number" min={0} value={f.stockQty} onChange={(e) => set("stockQty", Math.max(0, Number(e.target.value)))} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button
          disabled={!canSave}
          onClick={() => onSave({ ...f, serials: [], trackingUrl: buildTrackingUrl(f.courier, f.trackingNumber, f.trackingUrl) })}
          className="btn-pill disabled:opacity-50"
        >
          Save
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

  const fmtChange = (e) => (e.delta != null ? e.delta : e.qty != null ? e.qty : "")
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
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {e.tracking}
                      </a>
                    ) : "-"}
                  </td>
                  <td className="p-2">{e.status || "-"}</td>
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

function DeliverForm({ sku, onCancel, onConfirm }) {
  const [qty, setQty] = React.useState(0)
  const [ref, setRef] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [status, setStatus] = React.useState("Delivered")
  const [tracking, setTracking] = React.useState("")
  const [courier, setCourier] = React.useState("Other")
  const [customCourier, setCustomCourier] = React.useState("")
  const [customUrl, setCustomUrl] = React.useState("")
  const isOther = courier === "Other"

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">Product: <span className="font-semibold">{sku}</span></div>

      <input type="number" min={0} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} placeholder="Quantity" className="w-full rounded-md border border-gray-300 px-3 py-2" />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference No." className="w-full rounded-md border border-gray-300 px-3 py-2" />

      <div className="grid grid-cols-2 gap-3">
        <select value={courier} onChange={(e) => setCourier(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
          {["Other", "Kerry", "Flash", "ThaiPost", "J&T", "DHL", "SCG", "NinjaVan", "Best", "Shopee", "Lazada", "Nim"].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking No." className="w-full rounded-md border border-gray-300 px-3 py-2" />
      </div>

      {isOther && (
        <div className="grid grid-cols-2 gap-3">
          <input value={customCourier} onChange={(e) => setCustomCourier(e.target.value)} placeholder="Specify Courier Name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="Tracking Link (Optional)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      )}

      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Customer Name" className="w-full rounded-md border border-gray-300 px-3 py-2" />

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
        <option value="Pending">Pending</option>
        <option value="Delivered">Delivered</option>
        <option value="Shipped">Shipped</option>
      </select>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-pill">Cancel</button>
        <button
          onClick={() => {
            const finalCourier = isOther ? (customCourier || "Other") : courier
            const finalUrl = buildTrackingUrl(finalCourier, tracking, customUrl)
            onConfirm(qty, ref, status, company, tracking, finalCourier, finalUrl)
          }}
          className="btn-pill"
        >
          Deliver
        </button>
      </div>
    </div>
  )
}

function DeliveryView({ inv }) {
  // Use shared state from useInventory
  const rows = inv.deliveryRows
  const selectedIds = inv.selectedDeliveryIds
  const setSelectedIds = inv.setSelectedDeliveryIds

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(rows.map(r => r.id))
    else setSelectedIds([])
  }

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id))
    else setSelectedIds(prev => [...prev, id])
  }

  const [editingId, setEditingId] = React.useState(null)
  const [editingTracking, setEditingTracking] = React.useState("")
  const [editingCourier, setEditingCourier] = React.useState("")
  const [openStatusId, setOpenStatusId] = React.useState(null)
  const [statusPos, setStatusPos] = React.useState({ top: 0, left: 0 })

  const applyStockForStatusChange = (sku, qty, prev, next) => {
    try {
      const item = inv.items.find((it) => it.sku === sku)
      if (!item) return
      let delta = 0
      if (prev === "Delivered" && next !== "Delivered") delta = Number(qty || 0) // add back
      if (prev !== "Delivered" && next === "Delivered") delta = -Number(qty || 0) // deduct
      if (delta === 0) return
      const newStock = Math.max(0, Number(item.stockQty || 0) + delta)
      inv.updateItem(item, { stockQty: newStock })
    } catch {}
  }

  const changeStatus = (row, status) => {
    applyStockForStatusChange(row.sku, row.qty, row.status || "", status || "")
    inv.updateMovement(row.id, { status: status || "" })
    setOpenStatusId(null)
  }

  const [openNew, setOpenNew] = React.useState(false)
  const [newSku, setNewSku] = React.useState("")
  const [newQty, setNewQty] = React.useState(0)
  const [newCompany, setNewCompany] = React.useState("")

  const addManualDeliveryRow = () => {
    setNewSku(inv.items[0]?.sku || "")
    setNewQty(0)
    setNewCompany("")
    setOpenNew(true)
  }

  const saveNewRow = () => {
    const sku = newSku || "MANUAL"
    
    // Save to backend
    inv.addDelivery({
      sku,
      qty: Number(newQty || 0),
      company: newCompany || "",
      tracking: "",
      courier: ""
    })
    
    setOpenNew(false)
  }

  // Effect for filtering/sorting is now handled in useInventory via deliveryRows

  const commitTrackingEdit = (row) => {
    const nextUrl = buildTrackingUrl(editingCourier, editingTracking, row.trackingUrl)
    inv.updateMovement(row.id, { 
      tracking: editingTracking, 
      courier: editingCourier, 
      trackingUrl: nextUrl 
    })
    setEditingId(null)
  }

  const cancelTrackingEdit = () => {
    setEditingId(null)
  }

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-gray-900">Delivery Records</div>
          {/* Delete button moved to main page header */}
        </div>
        <button
          onClick={addManualDeliveryRow}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-sm"
          title="Add a new delivery row"
        >
          New Row
        </button>
      </div>
      {openNew && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setOpenNew(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">New Delivery</div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Product Name</div>
                <select
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select product</option>
                  {inv.items.map((it) => (
                    <option key={it.sku} value={it.sku}>{it.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Order Amount</div>
                <input
                  type="number"
                  min={0}
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Customer</div>
                <input
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Enter customer name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenNew(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={saveNewRow}>Add</button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
          <tr>
            <th className="p-4 border-b w-10">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                checked={rows.length > 0 && selectedIds.length === rows.length}
                onChange={handleSelectAll}
              />
            </th>
            <th className="p-4 border-b text-center">INDEX</th>
            <th className="p-4 border-b">Product Name</th>
            <th className="p-4 border-b">Order Amount</th>
            <th className="p-4 border-b">Delivery Status</th>
            <th className="p-4 border-b">Customer</th>
            <th className="p-4 border-b">Tracking #</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
             <tr><td className="p-8 text-center text-gray-500" colSpan={7}>No deliveries recorded yet</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => handleSelectRow(r.id)}
                  />
                </td>
                <td className="p-4 text-center text-gray-700">{i + 1}</td>
                <td className="p-4 font-medium text-gray-900">{r.productName}</td>
                <td className="p-4 font-mono text-gray-700">{r.orderAmount}</td>
                <td className="p-4">
                  <div className="relative inline-block">
                    <button
                      className={`${r.status ? deliveryStatusClass(r.status) : "bg-white border border-gray-300 text-gray-700"} px-2 py-1 rounded-full text-xs font-medium min-w-[80px]`}
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setStatusPos({ top: rect.bottom + 5, left: rect.left })
                        setOpenStatusId(openStatusId === r.id ? null : r.id)
                      }}
                      title="Set Delivery Status"
                    >
                      {r.status || "Set Status"}
                    </button>
                    {openStatusId === r.id && createPortal(
                      <div className="fixed inset-0 z-[9999] isolate">
                        <div className="absolute inset-0" onClick={() => setOpenStatusId(null)} />
                        <div 
                          className="absolute bg-white border border-gray-200 rounded-md shadow-md min-w-[120px]"
                          style={{ top: statusPos.top, left: statusPos.left }}
                        >
                          <button
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-amber-700"
                            onClick={() => changeStatus(r, "Pending")}
                            title="Set Pending"
                          >
                            Pending
                          </button>
                          <button
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-emerald-700"
                            onClick={() => changeStatus(r, "Delivered")}
                            title="Set Delivered"
                          >
                            Delivered
                          </button>
                          <button
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-500"
                            onClick={() => changeStatus(r, "")}
                            title="Clear"
                          >
                            Clear
                          </button>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                </td>
                <td className="p-4 text-gray-700">{r.company || "-"}</td>
                <td className="p-4">
                  {editingId === r.id ? (
                    <div className="tracking-edit-container flex flex-col gap-1 min-w-[160px]">
                      <input
                        autoFocus
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                        value={editingTracking}
                        onChange={(e) => setEditingTracking(e.target.value)}
                        onBlur={(e) => {
                          if (e.relatedTarget && e.relatedTarget.closest(".tracking-edit-container")) return
                          commitTrackingEdit(r)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitTrackingEdit(r)
                          if (e.key === "Escape") cancelTrackingEdit()
                        }}
                        placeholder="Tracking #"
                      />
                      <select
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        value={editingCourier}
                        onChange={(e) => setEditingCourier(e.target.value)}
                        onBlur={(e) => {
                          if (e.relatedTarget && e.relatedTarget.closest(".tracking-edit-container")) return
                          commitTrackingEdit(r)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitTrackingEdit(r)
                          if (e.key === "Escape") cancelTrackingEdit()
                        }}
                      >
                        <option value="">Courier...</option>
                        {["Kerry", "Flash", "ThaiPost", "J&T", "DHL", "SCG", "NinjaVan", "Best", "Shopee", "Lazada", "Nim", "Other"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    (() => {
                      const url = r.trackingUrl || getTrackingLink(r.courier, r.tracking)
                      return (
                        <div
                          className="text-xs font-mono cursor-pointer"
                          onClick={() => { setEditingId(r.id); setEditingTracking(r.tracking || ""); setEditingCourier(r.courier || "") }}
                          title="Click to edit tracking"
                        >
                          {r.tracking ? (
                            url ? (
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="font-mono font-medium text-gray-900">{r.tracking}</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                  title={`Open tracking website`}
                                >
                                  <span>{r.courier ? `Track on ${r.courier}` : "Track Package"}</span>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                              </div>
                            ) : (
                              <span className="truncate max-w-[140px] inline-block">{r.tracking}</span>
                            )
                          ) : (
                            <span className="text-gray-400 opacity-50 hover:opacity-100 transition-opacity">+ Add</span>
                          )}
                        </div>
                      )
                    })()
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  )
}

function InventoryPage() {
  const inv = useInventory()
  const [openBulkDelete, setOpenBulkDelete] = React.useState(false)

  // Determine if we have selected items based on current view
  const hasSelection = inv.view === 'delivery' 
    ? inv.selectedDeliveryIds.length > 0 
    : inv.selectedRows.length > 0
  
  const selectionCount = inv.view === 'delivery'
    ? inv.selectedDeliveryIds.length
    : inv.selectedRows.length

  const handleBulkDelete = () => {
    if (inv.view === 'delivery') {
      inv.deleteMovements(inv.selectedDeliveryIds)
    } else {
      inv.deleteItems(inv.selectedRows)
    }
    setOpenBulkDelete(false)
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation require="Inventory" />
      <section className="w-full bg-gray-50">
        <div className="w-full mx-auto p-6 min-h-full">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Control Tower</h1>
            </div>

            <div className="flex items-center gap-3">
              {hasSelection && (
                <button
                  onClick={() => setOpenBulkDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  <span className="font-medium">Delete ({selectionCount})</span>
                </button>
              )}

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
                  <button onClick={() => inv.setQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600" title="Clear Search">
                    ✕
                  </button>
                )}
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg">
                {["inventory", "delivery"].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      if (v === "history") inv.setHistoryFilter(null)
                      inv.setView(v)
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      inv.view === v ? "bg-white text-[#2D4485] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              <div className="text-slate-500 font-medium text-sm">
                {inv.query ? (
                  <span>Showing <span className="text-slate-900 font-bold">{inv.pageItems.length}</span> of <span className="text-slate-900 font-bold">{inv.items.length}</span> items</span>
                ) : (
                  <span>Total: <span className="text-slate-900 font-bold">{inv.items.length}</span> items</span>
                )}
              </div>
            </div>
          </div>

          <div>
            {inv.view === "delivery" ? (
              <DeliveryView inv={inv} />
            ) : (
              <InventoryTable inv={inv} />
            )}
          </div>
        </div>
      </section>

      {openBulkDelete && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenBulkDelete(false)}>
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[520px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Delete items</h3>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenBulkDelete(false)}>✕</button>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-col items-center justify-center py-4 gap-3">
                   <div className="p-3 bg-red-100 rounded-full">
                      <Trash className="w-6 h-6 text-red-600" />
                   </div>
                   <p className="text-center text-gray-700 max-w-sm">
                      Are you sure you want to delete <span className="font-semibold">{selectionCount}</span> selected items? 
                      <br/>
                      <span className="text-sm text-gray-500">This action cannot be undone.</span>
                   </p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenBulkDelete(false)}>Cancel</button>
                <button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={handleBulkDelete}>
                  Delete
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
    <InventoryPage />
  </React.StrictMode>,
)
