import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import "./index.css"

function InventoryDetailPage() {
  const [item, setItem] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [history, setHistory] = React.useState([])

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sku = params.get("sku")
    
    if (sku) {
      try {
        const saved = localStorage.getItem("inventoryProducts")
        if (saved) {
          const items = JSON.parse(saved)
          if (Array.isArray(items)) {
            const found = items.find(i => i.sku === sku)
            setItem(found || null)
          }
        }
        
        let logs = []
        try {
          const rawLogs = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
          logs = Array.isArray(rawLogs) ? rawLogs : []
        } catch {
          logs = []
        }

        // Migration: Ensure all logs have IDs
        let logsChanged = false
        logs = logs.map(l => {
            if (!l.id) {
                logsChanged = true
                return { ...l, id: Date.now().toString(36) + Math.random().toString(36).substr(2) }
            }
            return l
        })

        if (logsChanged) {
            localStorage.setItem("inventoryMovements", JSON.stringify(logs))
        }

        const filtered = logs
          .filter(e => e.sku === sku)
          .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
          .slice(0, 50)
        setHistory(filtered)
      } catch (e) {
        console.error("Failed to load item", e)
      }
    }
    setLoading(false)
  }, [])

  if (loading) return <div className="p-8 text-gray-400 font-mono text-sm">Loading...</div>
  
  if (!item) {
    return (
      <main className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Item Not Found</h1>
          <a href="/inventory.html" className="text-sm text-blue-600 hover:underline">← Back to Inventory</a>
        </div>
      </main>
    )
  }

  const updateStatus = (logId, newStatus) => {
    let allLogs = []
    try {
        const raw = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
        allLogs = Array.isArray(raw) ? raw : []
    } catch {
        allLogs = []
    }

    const logIdx = allLogs.findIndex(l => l.id === logId)
    
    if (logIdx === -1) return
    
    const oldLog = allLogs[logIdx]
    const oldStatus = oldLog.status || "Shipped"
    
    if (oldStatus === newStatus) return
    
    const qty = Number(oldLog.qty || 0)
    let stockDiff = 0
    let reservedDiff = 0
    
    const isOldShipped = ["Shipped", "Delivered"].includes(oldStatus)
    const isOldPending = ["Pending", "Ready"].includes(oldStatus)
    
    const isNewShipped = ["Shipped", "Delivered"].includes(newStatus)
    const isNewPending = ["Pending", "Ready"].includes(newStatus)
    
    if (isOldPending && isNewShipped) {
        // Transition from Pending/Ready -> Shipped/Delivered
        // Reduce stock, release reservation
        stockDiff = -qty
        reservedDiff = -qty
    } else if (isOldShipped && isNewPending) {
        // Transition from Shipped/Delivered -> Pending/Ready (Undo delivery)
        // Restore stock, add back to reservation
        stockDiff = qty
        reservedDiff = qty
    } else if (isOldPending && newStatus === "Returned") {
        // Cancelled before shipping
        // Just release reservation
        reservedDiff = -qty
    } else if (isOldShipped && newStatus === "Returned") {
        // Customer returned the item
        // Add back to stock
        stockDiff = qty
    } else if (oldStatus === "Returned" && isNewPending) {
        // Re-process return as pending again?
        reservedDiff = qty
    } else if (oldStatus === "Returned" && isNewShipped) {
        // Re-ship returned item
        stockDiff = -qty
    }
    
    let allItems = []
    try {
        const rawProducts = JSON.parse(localStorage.getItem("inventoryProducts") || "[]")
        allItems = Array.isArray(rawProducts) ? rawProducts : []
    } catch {
        allItems = []
    }
    
    const itemIndex = allItems.findIndex(i => i.sku === item.sku)
    
    if (itemIndex >= 0) {
        const it = allItems[itemIndex]
        const nextStock = Math.max(0, Number(it.stockQty || 0) + stockDiff)
        const nextReserved = Math.max(0, Number(it.reserved || 0) + reservedDiff)
        const nextOutgoing = Math.max(0, Number(it.outgoingQty || 0) + reservedDiff)
        
        allItems[itemIndex] = {
            ...it,
            stockQty: nextStock,
            reserved: nextReserved,
            outgoingQty: nextOutgoing,
            updatedAt: new Date().toISOString().slice(0, 10)
        }
        localStorage.setItem("inventoryProducts", JSON.stringify(allItems))
        setItem(allItems[itemIndex])
    }
    
    allLogs[logIdx] = { ...oldLog, status: newStatus }
    localStorage.setItem("inventoryMovements", JSON.stringify(allLogs))
    
    const filtered = allLogs
          .filter(e => e.sku === item.sku)
          .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
          .slice(0, 50)
    setHistory(filtered)
  }

  const stockStatus = item.stockQty <= 0 ? "Out of Stock" : item.stockQty < (item.minStock || 0) ? "Low Stock" : "In Stock"
  const statusColor = stockStatus === "Out of Stock" ? "text-red-600" : stockStatus === "Low Stock" ? "text-amber-600" : "text-emerald-600"

  const detailRows = [
    { label: "Category", value: item.category || "-" },
    { label: "Warehouse", value: item.warehouse || "Main" },
    { label: "Bin Location", value: item.bin || "-" },
    { label: "Unit Price", value: `฿${Number(item.price || 0).toLocaleString()}` },
    { label: "Status", value: item.status || "Active" },
    { label: "Description", value: item.description || "-" },
  ]
  
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Top Navigation */}
        <div className="mb-4">
          <a href="/inventory.html" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            ← Back
          </a>
        </div>

        {/* Minimal Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <span className="text-sm font-mono text-gray-500">{item.sku}</span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1">
             <span className={statusColor}>{stockStatus}</span>
             <span className="text-gray-300">|</span>
             <span>{item.stockQty} {item.uom || "units"}</span>
             <span className="text-gray-300">|</span>
             <span className="text-gray-500">{item.reserved || 0} reserved</span>
          </div>
        </div>

        {/* Item Details Table */}
        <div className="mb-12">
          <table className="w-full text-sm text-left">
            <tbody>
              {detailRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-500 w-1/3 align-top">{row.label}</td>
                  <td className="py-3 text-gray-900 align-top">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inventory Activities */}
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">Activity</th>
                  <th className="py-3 font-medium">Reference</th>
                  <th className="py-3 font-medium">Company</th>
                  <th className="py-3 font-medium text-right">Qty</th>
                  <th className="py-3 font-medium pl-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((log, i) => {
                    const isIn = log.type === 'purchase_receipt' || (log.type === 'adjustment' && log.newQty > log.oldQty) || (log.type === 'transfer' && log.to === item.warehouse)
                    const isOut = log.type === 'sales_delivery' || (log.type === 'adjustment' && log.newQty < log.oldQty) || (log.type === 'transfer' && log.from === item.warehouse)
                    
                    let typeLabel = log.type
                    
                    if (log.type === 'purchase_receipt') typeLabel = 'Receipt'
                    else if (log.type === 'sales_delivery') typeLabel = 'Delivery'
                    else if (log.type === 'adjustment') typeLabel = 'Adjustment'
                    else if (log.type === 'transfer') typeLabel = 'Transfer'

                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-gray-700 whitespace-nowrap">
                          {new Date(log.ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 text-gray-900 font-medium">
                          {typeLabel}
                        </td>
                        <td className="py-4 text-gray-600">
                          {log.type === 'adjustment' ? (log.reason || "-") : (log.ref || "-")}
                        </td>
                        <td className="py-4 text-gray-600">
                          {log.company || "-"}
                        </td>
                        <td className={`py-4 text-right font-medium ${isIn ? 'text-emerald-700' : isOut ? 'text-red-700' : 'text-gray-900'}`}>
                          {isIn ? '+' : isOut ? '-' : ''}{Math.abs(log.qty || log.delta || 0)}
                        </td>
                        <td className="py-4 pl-4">
                           {log.type === 'sales_delivery' && log.id ? (
                             <div className="relative inline-block">
                               <select 
                                 value={log.status || "Shipped"} 
                                 onChange={(e) => updateStatus(log.id, e.target.value)}
                                 className="appearance-none bg-transparent border-none text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer pr-6 focus:ring-0 py-0 pl-0"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <option value="Pending">Pending</option>
                                 <option value="Ready">Ready</option>
                                 <option value="Shipped">Shipped</option>
                                 <option value="Delivered">Delivered</option>
                                 <option value="Returned">Returned</option>
                               </select>
                               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-0 text-gray-500">
                                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                               </div>
                             </div>
                           ) : (
                             <span className="text-gray-500 text-sm">{log.status || "-"}</span>
                           )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400 italic">
                      No inventory activities recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<InventoryDetailPage />)
