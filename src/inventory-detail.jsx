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
    { label: "Tracking", value: item.trackingNumber ? `${item.courier ? item.courier + ': ' : ''}${item.trackingNumber}` : "-" },
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

        {/* Header Section with Photo and Key Stats */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Info Column */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                   <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">{item.name}</h1>
                   <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600 mb-6">
                     <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                       <span className="text-gray-400">SKU:</span>
                       <span className="font-mono text-gray-900">{item.sku}</span>
                     </div>
                     {item.barcode && (
                       <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                         <span className="font-mono text-gray-900">{item.barcode}</span>
                       </div>
                     )}
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${stockStatus === "Out of Stock" ? "bg-red-50 text-red-700 border-red-100" : stockStatus === "Low Stock" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${stockStatus === "Out of Stock" ? "bg-red-500" : stockStatus === "Low Stock" ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                        {stockStatus}
                      </div>
                      <div className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                        {item.status || "Active"}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6 mt-8 pt-8 border-t border-gray-100">
                     {detailRows.map((row, i) => (
                       <div key={i} className="flex flex-col">
                         <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{row.label}</span>
                         <span className="text-base font-medium text-gray-900 break-words">{row.value}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Activities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Activity History</h2>
          </div>
          <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">Activity</th>
                  <th className="py-3 font-medium">Reference</th>
                  <th className="py-3 font-medium">Company</th>
                  <th className="py-3 font-medium">Tracking</th>
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
                    
                    if (log.type === 'purchase_receipt') typeLabel = 'Tax Invoice'
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
                        <td className="py-4 text-gray-600">
                           {log.tracking ? (
                             <a 
                               href={log.trackingUrl || getTrackingLink(log.courier, log.tracking)} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 max-w-[140px]"
                               title={`Track via ${log.courier || "17TRACK"}`}
                               onClick={(e) => e.stopPropagation()}
                             >
                               <span className="truncate">{log.tracking}</span>
                               <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                             </a>
                           ) : (
                             "-"
                           )}
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
                    <td colSpan="7" className="py-8 text-center text-gray-400 italic">
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

export default InventoryDetailPage

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InventoryDetailPage />
  </React.StrictMode>,
)
