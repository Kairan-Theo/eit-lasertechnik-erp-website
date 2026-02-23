import React from "react"
import ReactDOM from "react-dom/client"
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  ShoppingCart, 
  Search, 
  X,
  Plus, 
  Download,
  Trash2,
  ExternalLink,
  Lock,
  ClipboardList,
  Building2, // Added for EIT Organizations sidebar icon
  Box // Added for Product Details sidebar icon
} from "lucide-react"

import Navigation from "./components/navigation.jsx"
import PurchaseOrderPage from "./components/purchase-order-page.jsx"
import EitManagement from "./components/eit-management.jsx" // Added EIT Management component
import ProductDetails from "./components/product-details.jsx" // Added Product Details component
import { LanguageProvider } from "./components/language-context"
import { API_BASE_URL } from "./config"
import "./index.css"

// Helper to get all data from localStorage
const getAllData = () => {
  const data = {
    quotations: [],
    invoices: [],
    billingNotes: [],
    taxInvoices: [],
    customers: [],
    purchaseOrders: []
  }

  try {
    // Get Purchase Orders
    try {
      const poList = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(poList)) {
        data.purchaseOrders = poList
      }
    } catch (e) {
      console.error("Error parsing poList", e)
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("history:")) {
        try {
          const item = JSON.parse(localStorage.getItem(key))
          if (item) {
            if (item.customer) {
              data.customers.push(item.customer)
            }
            if (Array.isArray(item.quotations)) {
              item.quotations.forEach((q, idx) => {
                data.quotations.push({ ...q, customerName: item.customer?.name || item.customer?.company, sourceKey: key, sourceIndex: idx })
              })
            }
            if (Array.isArray(item.billingNotes)) {
              item.billingNotes.forEach((bn, idx) => {
                data.billingNotes.push({ ...bn, customerName: item.customer?.name || item.customer?.company, sourceKey: key, sourceIndex: idx })
              })
            }
            if (Array.isArray(item.invoices)) {
              item.invoices.forEach((inv, idx) => {
                data.invoices.push({ ...inv, customerName: item.customer?.name || item.customer?.company, sourceKey: key, sourceIndex: idx })
              })
            }
            // Check both old "receipts" and new "taxInvoices" keys for backward compatibility
            const taxInvoices = item.taxInvoices || item.receipts
            if (Array.isArray(taxInvoices)) {
              taxInvoices.forEach((rc, idx) => {
                data.taxInvoices.push({ ...rc, customerName: item.customer?.name || item.customer?.company, sourceKey: key, sourceIndex: idx })
              })
            }
          }
        } catch (e) {
          console.error("Error parsing key", key, e)
        }
      }
    }
  } catch (e) {
    console.error("Error accessing localStorage", e)
  }

  // Helper to deduplicate items by number
  const deduplicate = (items) => {
    const unique = {}
    items.forEach(item => {
      const num = item.details?.number?.trim()
      if (num) {
        const existing = unique[num]
        // Keep the one with latest savedAt or date
        const itemDate = new Date(item.savedAt || item.details?.date || 0)
        const existingDate = existing ? new Date(existing.savedAt || existing.details?.date || 0) : new Date(0)
        
        if (!existing || itemDate > existingDate) {
          unique[num] = item
        }
      }
    })
    return Object.values(unique)
  }

  // Deduplicate lists except quotations; allow duplicate quotation numbers to appear as separate rows
  data.invoices = deduplicate(data.invoices)
  data.billingNotes = deduplicate(data.billingNotes)
  data.taxInvoices = deduplicate(data.taxInvoices)

  // Sort by QT Code ascending
  data.quotations.sort((a, b) => {
    const getNum = (str) => {
       const m = (str || "").match(/QT[-/ ]?(\d+)/i)
       return m ? parseInt(m[1], 10) : 0
    }
    return getNum(a.details?.number) - getNum(b.details?.number)
  })
  data.invoices.sort((a, b) => new Date(b.savedAt || b.details?.date) - new Date(a.savedAt || a.details?.date))
  data.billingNotes.sort((a, b) => new Date(b.savedAt || b.details?.date) - new Date(a.savedAt || a.details?.date))
  data.taxInvoices.sort((a, b) => new Date(b.savedAt || b.details?.date) - new Date(a.savedAt || a.details?.date))
  data.purchaseOrders.sort((a, b) => new Date(b.updatedAt || b.extraFields?.orderDate) - new Date(a.updatedAt || a.extraFields?.orderDate))
  
  return data
}

function Dashboard({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Purchase Orders</h3>
            <div className="p-2 bg-orange-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.purchaseOrders.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Quotations</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.quotations.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Invoices</h3>
            <div className="p-2 bg-green-50 rounded-lg">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.invoices.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Billing Notes</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.billingNotes.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Tax Invoices</h3>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.taxInvoices.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Purchase Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">PO Number</th>
                  <th className="pb-2">Vendor</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.purchaseOrders.slice(0, 5).map((po, i) => {
                  const total = (po.items || []).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 1.07
                  return (
                    <tr key={i}>
                      <td className="py-3 font-medium">{po.poNumber}</td>
                    <td className="py-3">{po.customer?.company || po.customer?.name || "-"}</td>
                      <td className="py-3">{po.items?.length || 0}</td>
                      <td className="py-3 text-right">
                        THB {total.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
                {data.purchaseOrders.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No purchase orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Quotations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">QT Code</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...data.quotations].sort((a, b) => new Date(b.savedAt || b.details?.date) - new Date(a.savedAt || a.details?.date)).slice(0, 5).map((q, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium">
                      {q.details?.number}
                    </td>
                    <td className="py-3">{q.customerName || "-"}</td>
                    <td className="py-3">{q.details?.date}</td>
                    <td className="py-3 text-right">
                      {q.details?.currency} {q.totals?.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {data.quotations.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No quotations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Invoice Number</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.invoices.slice(0, 5).map((inv, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium">
                      {inv.details?.number}
                    </td>
                    <td className="py-3">{inv.customerName || "-"}</td>
                    <td className="py-3">{inv.details?.dueDate}</td>
                    <td className="py-3 text-right">
                      {inv.details?.currency} {inv.totals?.total?.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {data.invoices.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No invoices found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Billing Notes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Billing Note Number</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.billingNotes.slice(0, 5).map((bn, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium">
                      {bn.details?.number}
                    </td>
                    <td className="py-3">{bn.customerName || "-"}</td>
                    <td className="py-3">{bn.details?.dueDate}</td>
                    <td className="py-3 text-right">
                      {bn.details?.currency} {bn.totals?.total?.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {data.billingNotes.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No billing notes found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comment: New card to display recent Tax Invoices on the dashboard */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Tax Invoices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Tax Invoice Number</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.taxInvoices.slice(0, 5).map((ti, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium">
                      {ti.details?.number}
                    </td>
                    <td className="py-3">{ti.customerName || "-"}</td>
                    <td className="py-3">{ti.details?.date}</td>
                    <td className="py-3 text-right">
                      {ti.details?.currency}{" "}
                      {ti.totals?.total?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                {data.taxInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No tax invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuotationList({ list, refreshData }) {
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)
  // Comment: Search query for filtering quotations by file name
  const [searchQuery, setSearchQuery] = React.useState("")

  const getUid = (q) => `${q.sourceKey}-${q.sourceIndex}`

  const handleSelectAll = (e) => {
    // Comment: Select only currently visible (filtered) rows
    const visible = visibleList
    if (e.target.checked) {
      setSelectedRows(visible.map(getUid))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (uid) => {
    if (selectedRows.includes(uid)) {
      setSelectedRows(prev => prev.filter(x => x !== uid))
    } else {
      setSelectedRows(prev => [...prev, uid])
    }
  }

  const handleDelete = async () => {
    const itemsToDelete = list.filter(q => selectedRows.includes(getUid(q)))
    
    // API Deletion
    const apiItems = itemsToDelete.filter(q => q.sourceKey === 'api')
    for (const item of apiItems) {
      try {
        await fetch(`${API_BASE_URL}/api/quotations/${item.id}/`, { method: 'DELETE' })
      } catch (e) {
        console.error("Error deleting API item", e)
      }
    }

    // LocalStorage Deletion
    const localItems = itemsToDelete.filter(q => q.sourceKey !== 'api')
    const groupedByKey = {}
    localItems.forEach(q => {
      if (!groupedByKey[q.sourceKey]) groupedByKey[q.sourceKey] = []
      groupedByKey[q.sourceKey].push(q.sourceIndex)
    })

    Object.keys(groupedByKey).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key))
        if (item && Array.isArray(item.quotations)) {
          const indicesToDelete = groupedByKey[key]
          item.quotations = item.quotations.filter((_, idx) => !indicesToDelete.includes(idx))
          localStorage.setItem(key, JSON.stringify(item))
        }
      } catch (e) {
        console.error("Error updating localStorage", e)
      }
    })

    if (refreshData) refreshData()
    setSelectedRows([])
    setOpenDeleteConfirm(false)
  }

  // Comment: Filter list using file name (case-insensitive); fallback to q.file_name
  const visibleList = (list || []).filter(q => {
    const name = (q.details?.fileName || q.file_name || "").toLowerCase()
    const s = (searchQuery || "").toLowerCase().trim()
    return s === "" ? true : name.includes(s)
  })

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#2D4485]">
            <FileText className="w-6 h-6" />
            <h1 className="text-xl font-bold">Quotations</h1>
          </div>
          {selectedRows.length > 0 && (
            <button 
              onClick={() => setOpenDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedRows.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Comment: Rounded pill search bar with leading icon; matches provided UI reference */}
          <div className="relative">
            {/* Comment: Left search icon positioned absolutely inside the input */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by File Name"
              aria-label="Search quotations by file name"
              // Comment: Use a blue border and pill shape; add right padding for clear button space
              className="pl-9 pr-9 py-2 border-2 border-[#2D4485] rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4485]/30 placeholder:text-gray-400"
            />
            {/* Comment: Right-side clear button inside the input for quick reset */}
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <a href="/quotation.html" className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Quotation
          </a>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 border-b">
              <th className="p-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  checked={visibleList.length > 0 && selectedRows.length === visibleList.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left w-16">Index</th>
              {/* Comment: New File Name column placed between Index and Quotation Number */}
              <th className="p-3 text-left">File Name</th>
              <th className="p-3 text-left">Quotation Number</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-right">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visibleList.map((q, i) => {
              const uid = getUid(q)
              return (
                <tr key={uid} className={`hover:bg-gray-50 ${selectedRows.includes(uid) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      checked={selectedRows.includes(uid)}
                      onChange={() => handleSelectRow(uid)}
                    />
                  </td>
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  {/* Comment: Show stored file_name from API or derived UI value */}
                  <td className="p-3">{q.details?.fileName || q.file_name || "-"}</td>
                  <td className="p-3 font-medium">
                    <a href={`/quotation.html?key=${encodeURIComponent(q.sourceKey)}&index=${q.sourceIndex}`} className="text-[#2D4485] hover:underline">
                      {q.details?.number}
                    </a>
                  </td>
                  <td className="p-3">{q.customerName || "-"}</td>
                  <td className="p-3">{q.details?.date}</td>
                  <td className="p-3">{q.items?.length || 0}</td>
                  <td className="p-3 text-right font-medium">
                    {q.details?.currency} {q.totals?.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
            {visibleList.length === 0 && (
              // Comment: Update colspan to match non-checkbox columns (Index + File Name + Quotation Number + Customer + Date + Item + Grand Total = 7)
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No quotations found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {openDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOpenDeleteConfirm(false)}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Quotations</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete {selectedRows.length} selected quotations?</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setOpenDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

function InvoiceList({ list, refreshData }) {
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)
  // Tab state: which organization to show in the list ("eit" or "einstein")
  // We use a top tab bar UI similar to Purchase Order page
  const [activeOrgTab, setActiveOrgTab] = React.useState("eit")

  const getUid = (inv) => `${inv.sourceKey}-${inv.sourceIndex}`

  const handleSelectAll = (e) => {
    // Only select currently visible (filtered) rows in the active tab
    const visible = filterByOrg(list, activeOrgTab)
    if (e.target.checked) {
      setSelectedRows(visible.map(getUid))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (uid) => {
    if (selectedRows.includes(uid)) {
      setSelectedRows(prev => prev.filter(x => x !== uid))
    } else {
      setSelectedRows(prev => [...prev, uid])
    }
  }

  const handleDelete = async () => {
    // Delete only visible rows in the current tab to avoid cross-org deletion
    const visible = filterByOrg(list, activeOrgTab)
    const itemsToDelete = visible.filter(inv => selectedRows.includes(getUid(inv)))
    // Collect all invoice numbers we are deleting so we can remove duplicates from localStorage
    const deletedNumbers = new Set(
      itemsToDelete
        .map(inv => (inv.details && inv.details.number ? String(inv.details.number).trim() : ""))
        .filter(Boolean)
    )
    
    // API Deletion
    const apiItems = itemsToDelete.filter(inv => inv.sourceKey === 'api')
    let successCount = 0
    let failCount = 0

    for (const item of apiItems) {
      try {
        const token = localStorage.getItem('authToken')
        const headers = {
          'Content-Type': 'application/json'
        }
        if (token) {
          headers['Authorization'] = `Token ${token}`
        }
        
        const res = await fetch(`${API_BASE_URL}/api/invoices/${item.id}/`, { 
          method: 'DELETE',
          headers
        })
        if (res.ok) {
          successCount++
        } else {
          console.error(`Failed to delete invoice ${item.id}:`, res.status)
          failCount++
        }
      } catch (e) {
        console.error("Error deleting API item", e)
        failCount++
      }
    }

    if (failCount > 0) {
      alert(`Deleted ${successCount} items. Failed to delete ${failCount} items. Please check permissions or network.`)
    }

    // LocalStorage Deletion
    const localItems = itemsToDelete.filter(inv => inv.sourceKey !== 'api')
    const groupedByKey = {}
    localItems.forEach(inv => {
      if (!groupedByKey[inv.sourceKey]) groupedByKey[inv.sourceKey] = []
      groupedByKey[inv.sourceKey].push(inv.sourceIndex)
    })

    Object.keys(groupedByKey).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key))
        if (item && Array.isArray(item.invoices)) {
          const indicesToDelete = groupedByKey[key]
          // Remove invoices by index AND by invoice number inside this history entry
          item.invoices = item.invoices.filter((inv, idx) => {
            if (indicesToDelete.includes(idx)) return false
            const num = inv?.details?.number ? String(inv.details.number).trim() : ""
            return !deletedNumbers.has(num)
          })
          localStorage.setItem(key, JSON.stringify(item))
        }
      } catch (e) {
        console.error("Error updating localStorage", e)
      }
    })

    // Also scan all history entries to remove any invoices with the same numbers
    if (deletedNumbers.size) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key || !key.startsWith("history:")) continue
          try {
            const raw = localStorage.getItem(key)
            if (!raw) continue
            const item = JSON.parse(raw)
            if (!item || !Array.isArray(item.invoices)) continue
            const before = item.invoices.length
            // Remove any invoice whose number is in deletedNumbers
            item.invoices = item.invoices.filter(inv => {
              const num = inv?.details?.number ? String(inv.details.number).trim() : ""
              return !deletedNumbers.has(num)
            })
            if (item.invoices.length !== before) {
              localStorage.setItem(key, JSON.stringify(item))
            }
          } catch (e) {
            console.error("Error cleaning local history invoices for key", key, e)
          }
        }
      } catch (e) {
        console.error("Error scanning localStorage for invoices", e)
      }
    }

    if (refreshData) {
       await refreshData()
    }
    setSelectedRows([])
    setOpenDeleteConfirm(false)
  }

  // Determine organization from invoice details:
  // Prefer details.onBehalfOf or details.salesPerson; default to EIT if absent
  const getOrgKey = (item) => {
    const hint = (item.details?.onBehalfOf || item.details?.salesPerson || "").toUpperCase()
    return hint.includes("EINSTEIN") ? "einstein" : "eit"
  }
  // Filter list by active organization tab
  const filterByOrg = (fullList, orgKey) => (fullList || []).filter(it => getOrgKey(it) === orgKey)
  const visibleList = filterByOrg(list, activeOrgTab)

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#2D4485]">
            <Receipt className="w-6 h-6" />
            <h1 className="text-xl font-bold">Invoices</h1>
          </div>
        </div>
        <a href="/invoice.html" className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          New Invoice
        </a>
      </div>
      {/* Organization Tab Bar - matches the PO page style; not small buttons */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6" role="tablist" aria-label="Organization Tabs">
          {/* EIT Tab */}
          <div
            role="tab"
            aria-selected={activeOrgTab === "eit"}
            onClick={() => { setActiveOrgTab("eit"); setSelectedRows([]) }}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer ${activeOrgTab==='eit' ? 'text-[#2D4485]' : 'text-gray-500 hover:text-gray-700'}`}
            title="Show EIT invoices"
          >
            EIT
            {activeOrgTab==='eit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D4485]" />}
          </div>
          {/* Einstein Tab */}
          <div
            role="tab"
            aria-selected={activeOrgTab === "einstein"}
            onClick={() => { setActiveOrgTab("einstein"); setSelectedRows([]) }}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer ${activeOrgTab==='einstein' ? 'text-[#2D4485]' : 'text-gray-500 hover:text-gray-700'}`}
            title="Show Einstein invoices"
          >
            Einstein
            {activeOrgTab==='einstein' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D4485]" />}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {selectedRows.length > 0 && (
            <button 
              onClick={() => setOpenDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedRows.length})
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 border-b">
              <th className="p-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  // Compare against filtered list length for "select all"
                  checked={visibleList.length > 0 && selectedRows.length === visibleList.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left w-16">Index</th>
              <th className="p-3 text-left">Invoice Number</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Render only rows from the active tab's organization */}
            {visibleList.map((inv, i) => {
              const uid = getUid(inv)
              return (
                <tr key={uid} className={`hover:bg-gray-50 ${selectedRows.includes(uid) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      checked={selectedRows.includes(uid)}
                      onChange={() => handleSelectRow(uid)}
                    />
                  </td>
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3 font-medium">
                    <a href={`/invoice.html?key=${encodeURIComponent(inv.sourceKey)}&index=${inv.sourceIndex}`} className="text-[#2D4485] hover:underline">
                      {inv.details?.number}
                    </a>
                  </td>
                  <td className="p-3">{inv.customerName || "-"}</td>
                  <td className="p-3">{inv.details?.date}</td>
                  <td className="p-3 text-red-600">{inv.details?.dueDate}</td>
                  <td className="p-3 text-right font-medium">
                    {inv.details?.currency} {inv.totals?.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
            {visibleList.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {openDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOpenDeleteConfirm(false)}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Invoices</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete {selectedRows.length} selected invoices?</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setOpenDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

function BillingNoteList({ list, refreshData }) {
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)
  // Tab state: which organization to show ("eit" or "einstein")
  const [activeOrgTab, setActiveOrgTab] = React.useState("eit")

  const getUid = (bn) => `${bn.sourceKey}-${bn.sourceIndex}`

  const handleSelectAll = (e) => {
    const visible = filterByOrgBN(list, activeOrgTab)
    if (e.target.checked) {
      setSelectedRows(visible.map(getUid))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (uid) => {
    if (selectedRows.includes(uid)) {
      setSelectedRows(prev => prev.filter(x => x !== uid))
    } else {
      setSelectedRows(prev => [...prev, uid])
    }
  }

  const handleDelete = async () => {
    const visible = filterByOrgBN(list, activeOrgTab)
    const itemsToDelete = visible.filter(bn => selectedRows.includes(getUid(bn)))
    
    // API Deletion
    const apiItems = itemsToDelete.filter(bn => bn.sourceKey === 'api')
    for (const item of apiItems) {
      try {
        await fetch(`${API_BASE_URL}/api/billing_notes/${item.id}/`, { method: 'DELETE' })
      } catch (e) {
        console.error("Error deleting API item", e)
      }
    }

    // LocalStorage Deletion
    const localItems = itemsToDelete.filter(bn => bn.sourceKey !== 'api')
    const groupedByKey = {}
    localItems.forEach(bn => {
      if (!groupedByKey[bn.sourceKey]) groupedByKey[bn.sourceKey] = []
      groupedByKey[bn.sourceKey].push(bn.sourceIndex)
    })

    Object.keys(groupedByKey).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key))
        if (item && Array.isArray(item.billingNotes)) {
          const indicesToDelete = groupedByKey[key]
          item.billingNotes = item.billingNotes.filter((_, idx) => !indicesToDelete.includes(idx))
          localStorage.setItem(key, JSON.stringify(item))
        }
      } catch (e) {
        console.error("Error updating localStorage", e)
      }
    })

    if (refreshData) refreshData()
    setSelectedRows([])
    setOpenDeleteConfirm(false)
  }

  // Determine organization for Billing Note using onBehalfOf or salesPerson
  const getOrgKeyBN = (item) => {
    const hint = (item.details?.onBehalfOf || item.details?.salesPerson || "").toUpperCase()
    return hint.includes("EINSTEIN") ? "einstein" : "eit"
  }
  const filterByOrgBN = (fullList, orgKey) => (fullList || []).filter(it => getOrgKeyBN(it) === orgKey)
  const visibleList = filterByOrgBN(list, activeOrgTab)

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#2D4485]">
            <ClipboardList className="w-6 h-6" />
            <h1 className="text-xl font-bold">Billing Notes</h1>
          </div>
        </div>
        <a href="/billing-note.html" className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          New Billing Note
        </a>
      </div>
      {/* Organization Tab Bar for Billing Notes */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6" role="tablist" aria-label="Organization Tabs">
          <div
            role="tab"
            aria-selected={activeOrgTab === "eit"}
            onClick={() => { setActiveOrgTab("eit"); setSelectedRows([]) }}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer ${activeOrgTab==='eit' ? 'text-[#2D4485]' : 'text-gray-500 hover:text-gray-700'}`}
            title="Show EIT billing notes"
          >
            EIT
            {activeOrgTab==='eit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D4485]" />}
          </div>
          <div
            role="tab"
            aria-selected={activeOrgTab === "einstein"}
            onClick={() => { setActiveOrgTab("einstein"); setSelectedRows([]) }}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer ${activeOrgTab==='einstein' ? 'text-[#2D4485]' : 'text-gray-500 hover:text-gray-700'}`}
            title="Show Einstein billing notes"
          >
            Einstein
            {activeOrgTab==='einstein' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D4485]" />}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {selectedRows.length > 0 && (
            <button 
              onClick={() => setOpenDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedRows.length})
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 border-b">
              <th className="p-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  checked={visibleList.length > 0 && selectedRows.length === visibleList.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left w-16">Index</th>
              <th className="p-3 text-left">Billing Note Number</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visibleList.map((bn, i) => {
              const uid = getUid(bn)
              const amount = (bn.items || []).reduce((sum, item) => sum + (Number(String(item.amount).replace(/,/g, '')) || 0), 0)
              const paid = (bn.items || []).reduce((sum, item) => sum + (Number(String(item.paid).replace(/,/g, '')) || 0), 0)
              const outstanding = amount - paid

              return (
                <tr key={uid} className={`hover:bg-gray-50 ${selectedRows.includes(uid) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      checked={selectedRows.includes(uid)}
                      onChange={() => handleSelectRow(uid)}
                    />
                  </td>
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3 font-medium">
                    <a href={`/billing-note.html?key=${encodeURIComponent(bn.sourceKey)}&index=${bn.sourceIndex}`} className="text-[#2D4485] hover:underline">
                      {bn.details?.number}
                    </a>
                  </td>
                  <td className="p-3">{bn.customerName || "-"}</td>
                  <td className="p-3 text-red-600">{bn.details?.dueDate}</td>
                  <td className="p-3 text-right font-medium text-blue-600">
                    {bn.details?.currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right font-medium ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                    {bn.details?.currency} {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
            {visibleList.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No billing notes found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {openDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOpenDeleteConfirm(false)}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Billing Notes</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete {selectedRows.length} selected billing notes?</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setOpenDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}


function TaxInvoiceList({ list, refreshData }) {
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)

  const getUid = (item) => `${item.sourceKey}-${item.sourceIndex}`

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(list.map(getUid))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (uid) => {
    if (selectedRows.includes(uid)) {
      setSelectedRows(prev => prev.filter(x => x !== uid))
    } else {
      setSelectedRows(prev => [...prev, uid])
    }
  }

  const handleDelete = async () => {
    const itemsToDelete = list.filter(item => selectedRows.includes(getUid(item)))
    
    // API Deletion
    const apiItems = itemsToDelete.filter(item => item.sourceKey === 'api')
    for (const item of apiItems) {
      try {
        // Use underscore per Django router; keep legacy fallback for older data
        const res = await fetch(`${API_BASE_URL}/api/tax_invoices/${item.id}/`, { method: 'DELETE' })
        if (!res.ok) {
          await fetch(`${API_BASE_URL}/api/receipts/${item.id}/`, { method: 'DELETE' })
        }
      } catch (e) {
        console.error("Error deleting API item", e)
      }
    }

    // LocalStorage Deletion
    const localItems = itemsToDelete.filter(item => item.sourceKey !== 'api')
    const groupedByKey = {}
    localItems.forEach(item => {
      if (!groupedByKey[item.sourceKey]) groupedByKey[item.sourceKey] = []
      groupedByKey[item.sourceKey].push(item.sourceIndex)
    })

    Object.keys(groupedByKey).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key))
        if (item) {
          const indicesToDelete = groupedByKey[key]
          // Delete from both potential keys
          if (Array.isArray(item.taxInvoices)) {
            item.taxInvoices = item.taxInvoices.filter((_, idx) => !indicesToDelete.includes(idx))
          }
          if (Array.isArray(item.receipts)) {
            item.receipts = item.receipts.filter((_, idx) => !indicesToDelete.includes(idx))
          }
          localStorage.setItem(key, JSON.stringify(item))
        }
      } catch (e) {
        console.error("Error updating localStorage", e)
      }
    })

    if (refreshData) refreshData()
    setSelectedRows([])
    setOpenDeleteConfirm(false)
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#2D4485]">
            <Receipt className="w-6 h-6" />
            <h1 className="text-xl font-bold">Tax Invoices</h1>
          </div>
          {selectedRows.length > 0 && (
            <button 
              onClick={() => setOpenDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedRows.length})
            </button>
          )}
        </div>
        <a href="/tax-invoice.html" className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          New Tax Invoice
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 border-b">
              <th className="p-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  checked={list.length > 0 && selectedRows.length === list.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left w-16">Index</th>
              <th className="p-3 text-left">Tax Invoice Number</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((item, i) => {
              const uid = getUid(item)
              return (
                <tr key={uid} className={`hover:bg-gray-50 ${selectedRows.includes(uid) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                      checked={selectedRows.includes(uid)}
                      onChange={() => handleSelectRow(uid)}
                    />
                  </td>
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3 font-medium">
                    <a href={`/tax-invoice.html?key=${encodeURIComponent(item.sourceKey)}&index=${item.sourceIndex}`} className="text-[#2D4485] hover:underline">
                      {item.details?.number}
                    </a>
                  </td>
                  <td className="p-3">{item.customerName || "-"}</td>
                  <td className="p-3">{item.details?.date}</td>
                  <td className="p-3 text-right font-medium">
                    {item.details?.currency} {item.totals?.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No tax invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {openDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOpenDeleteConfirm(false)}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tax Invoices</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete {selectedRows.length} selected tax invoices?</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setOpenDeleteConfirm(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}


function PermissionsManager() {
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [savingId, setSavingId] = React.useState(null)
  const APPS = ["Manufacturing", "Inventory", "CRM", "Project Management", "Admin", "Support"]
  const parseAllowed = (allowed) => {
    if (!allowed) return []
    if (allowed === "all") return [...APPS]
    return allowed.split(",").map(s => s.trim()).filter(Boolean)
  }
  const [me, setMe] = React.useState(null)
  const loadMe = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const cuRaw = localStorage.getItem("currentUser")
      let cu = null
      try { cu = JSON.parse(cuRaw || "{}") } catch {}
      if (!cu || (!cu.email && !cu.name)) {
        setMe(null)
        return
      }
      let allowed = localStorage.getItem("allowedApps")
      if (token) {
        try {
          const r = await fetch(`${API_BASE_URL}/api/auth/me/allowed-apps/`, { headers: { "Authorization": `Token ${token}` } })
          if (r.ok) {
            const d = await r.json()
            if (typeof d.allowed_apps === "string") {
              allowed = d.allowed_apps
              localStorage.setItem("allowedApps", d.allowed_apps)
            }
          }
        } catch {}
      }
      const role = localStorage.getItem("userRole")
      setMe({ id: null, email: cu.email || "", name: cu.name || "", is_staff: role === "Admin", allowed_apps: allowed || "" })
    } catch {
      setMe(null)
    }
  }, [])
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      if (!token) {
        setUsers([])
        setLoading(false)
        return
      }
      const r = await fetch(`${API_BASE_URL}/api/users/`, {
        headers: { "Authorization": `Token ${token}` }
      })
      if (r.ok) {
        const d = await r.json()
        setUsers(Array.isArray(d) ? d : [])
      } else {
        if (r.status === 401) {
          localStorage.removeItem("authToken")
          localStorage.removeItem("userRole")
          window.location.reload()
          return
        }
        setUsers([])
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])
  React.useEffect(() => {
    loadMe()
    fetchUsers()
  }, [fetchUsers, loadMe])
  React.useEffect(() => {
    if (me && !me.id && users.length) {
      const m = users.find(u => me.email && u.email === me.email)
      if (m) {
        setMe({ ...me, id: m.id, allowed_apps: m.allowed_apps ?? me.allowed_apps, is_staff: m.is_staff })
      }
    }
  }, [users, me])
  const isChecked = (allowed, app) => {
    return parseAllowed(allowed).includes(app)
  }
  const save = async (userId, allowed) => {
    try {
      setSavingId(userId)
      const token = localStorage.getItem("authToken")
      if (!token) return
      console.log(`Saving permissions for user ${userId}: ${allowed}`)
      const r = await fetch(`${API_BASE_URL}/api/users/permissions/`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, allowed_apps: allowed })
      })
      if (!r.ok) {
        console.error("Failed to save permissions", r.status, await r.text())
        alert("Failed to save permissions. Please try again.")
        await fetchUsers()
      } else {
        console.log("Permissions saved successfully")
      }
    } catch (e) {
      console.error("Error saving permissions", e)
      alert("Error saving permissions: " + e.message)
      await fetchUsers()
    } finally {
      setSavingId(null)
    }
  }

  const toggleApp = (userId, app) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const list = parseAllowed(user.allowed_apps || "")
    let nextList = []
    if (list.includes(app)) {
      nextList = list.filter(a => a !== app)
    } else {
      nextList = [...list, app]
    }
    const nextAllowed = nextList.length === APPS.length ? "all" : (nextList.length ? nextList.join(",") : "")
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowed_apps: nextAllowed } : u))
    
    if (me && me.id === userId) {
      setMe(prev => ({ ...prev, allowed_apps: nextAllowed }))
    }
    
    save(userId, nextAllowed)
  }

  const setAll = (userId) => {
    const nextAllowed = "all"
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowed_apps: nextAllowed } : u))
    if (me && me.id === userId) setMe(prev => ({ ...prev, allowed_apps: nextAllowed }))
    save(userId, nextAllowed)
  }

  const setNone = (userId) => {
    const nextAllowed = ""
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowed_apps: nextAllowed } : u))
    if (me && me.id === userId) setMe(prev => ({ ...prev, allowed_apps: nextAllowed }))
    save(userId, nextAllowed)
  }

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return
    
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return
      
      const r = await fetch(`${API_BASE_URL}/api/users/${userId}/delete/`, {
        method: "DELETE",
        headers: { "Authorization": `Token ${token}` }
      })
      
      if (r.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
      } else {
        const txt = await r.text()
        try {
            const json = JSON.parse(txt)
            alert(json.error || "Failed to delete user")
        } catch {
            alert("Failed to delete user: " + txt)
        }
      }
    } catch (e) {
      console.error("Error deleting user", e)
      alert("Error deleting user: " + e.message)
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">User Permissions</h2>
        <button onClick={fetchUsers} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200">Refresh</button>
      </div>
      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b">
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Allowed Apps</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...(me ? [me] : []), ...users.filter(u => !me || u.email !== me.email)].map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{me && u.email === me.email ? "You" : u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="p-3">{u.is_staff ? "Admin" : "User"}</td>
                  <td className="p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {APPS.map(app => (
                        <label key={app} className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked(u.allowed_apps, app)}
                            onChange={() => toggleApp(u.id, app)}
                          />
                          <span>{app}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setAll(u.id)} className="px-2 py-1 text-xs rounded border border-gray-300">All</button>
                      <button onClick={() => setNone(u.id)} className="px-2 py-1 text-xs rounded border border-gray-300">None</button>
                      <button
                        onClick={() => save(u.id, u.allowed_apps)}
                        className={`px-3 py-1.5 text-xs rounded bg-[#2D4485] text-white ${savingId===u.id ? "opacity-50" : ""}`}
                        disabled={!u.id || savingId===u.id}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className={`p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors ${savingId===u.id || (me && me.id === u.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                        title="Delete User"
                        disabled={savingId===u.id || (me && me.id === u.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {savingId===u.id && <span className="text-xs text-gray-500">Saving...</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("dashboard")
  const [data, setData] = React.useState({ quotations: [], invoices: [], billingNotes: [], taxInvoices: [], customers: [], purchaseOrders: [] })

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const view = params.get("view")
      const allowed = ["dashboard","purchase-orders","quotations","invoices","billing-notes","eit-management","permissions", "product-details"]
      if (view && allowed.includes(view)) {
        setActiveTab(view)
      }
    } catch {}
  }, [])

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      const response = await fetch(`${API_BASE_URL}/api/quotations/`, { headers })
      if (response.ok) {
        const apiQuotations = await response.json()
        return apiQuotations.map(q => ({
          id: q.id,
          sourceKey: 'api',
          sourceIndex: q.id,
          details: {
            number: q.qo_code,
            date: q.created_date,
            currency: q.currency || 'THB', 
            // Comment: map Quotation.file_name from API to details.fileName for UI use
            fileName: q.file_name || ""
          },
          customerName: q.customer_details?.company_name || 'Unknown',
          items: q.quotation_items || [],
          totals: {
            total: (q.quotation_items || []).reduce((sum, item) => sum + parseFloat(item.quo_total || 0), 0)
          }
        }))
      }
    } catch (e) {
      console.error("Failed to fetch quotations from API", e)
    }
    return []
  }

  const fetchBillingNotes = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      const response = await fetch(`${API_BASE_URL}/api/billing_notes/`, { headers })
      if (response.ok) {
        const apiBillingNotes = await response.json()
        // Map API fields into our unified shape and preserve org info
        // We copy EIT/Einstein organization fields so tabs can classify rows
        return apiBillingNotes.map(bn => ({
          id: bn.id,
          sourceKey: 'api',
          sourceIndex: bn.id,
          details: {
            number: bn.bn_code,
            date: bn.bn_created_date || bn.bn_date,
            dueDate: bn.bn_due_date || bn.bn_invoice_date,
            currency: bn.bn_currency || 'THB', 
            // Preserve org identification for tab filtering:
            // - bn_behalf_of corresponds to "onBehalfOf"
            // - eit_details.organization_name corresponds to "salesPerson"
            onBehalfOf: bn.bn_behalf_of || "",
            salesPerson: bn.eit_details?.organization_name || "",
          },
          customerName: bn.customer_details?.company_name || bn.customer_name || 'Unknown',
          items: (bn.items || []).map(item => ({
            ...item,
            invoiceNo: item.invoice_no || item.invoiceNo,
            dueDate: item.due_date || item.dueDate,
            amount: item.amount,
            paid: item.paid
          })),
          totals: {
            total: (bn.items || []).reduce((sum, item) => sum + (parseFloat(String(item.amount || 0).replace(/,/g, '')) - parseFloat(String(item.paid || 0).replace(/,/g, ''))), 0)
          }
        }))
      }
    } catch (e) {
      console.error("Failed to fetch billing notes from API", e)
    }
    return []
  }

  const fetchTaxInvoices = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      // Use underscore per Django router: /api/tax_invoices/
      const response = await fetch(`${API_BASE_URL}/api/tax_invoices/`, { headers })
      if (response.ok) {
        const apiReceipts = await response.json()
        return apiReceipts.map(rc => {
          // TaxInvoice fields differ from Invoice; map correctly and compute totals
          const items = Array.isArray(rc.items) ? rc.items : []
          const parseNum = (v) => parseFloat(String(v || 0).replace(/,/g, '')) || 0
          const subtotal = items.reduce((sum, it) => {
            const line = parseNum(it.qty) * parseNum(it.price) - parseNum(it.discount)
            return sum + (line < 0 ? 0 : line)
          }, 0)
          const grandTotal = subtotal * 1.07
          const customerName =
            rc.customer_details?.company_name ||
            rc.customer_details?.company ||
            rc.customer_details?.name ||
            "Unknown"
          return {
            id: rc.tax_invoice_id,
            sourceKey: 'api',
            sourceIndex: rc.tax_invoice_id,
            details: {
              number: rc.tax_invoice_code,
              date: rc.issued_date || rc.created_at,
              currency: 'THB',
            },
            customerName,
            items,
            totals: { total: grandTotal }
          }
        })
      }
    } catch (e) {
      console.error("Failed to fetch tax invoices from API", e)
    }
    return []
  }

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      const response = await fetch(`${API_BASE_URL}/api/invoices/`, { headers })
      if (response.ok) {
        const apiInvoices = await response.json()
        return apiInvoices.map(inv => ({
          id: inv.id,
          sourceKey: 'api',
          sourceIndex: inv.id,
          details: {
            ...inv.details,
            number: inv.number,
            date: inv.details?.date || inv.created_at,
            currency: inv.details?.currency || 'THB',
          },
          customerName: inv.customer?.company || inv.customer?.company_name || inv.customer?.name || 'Unknown',
          items: inv.items || [],
          totals: {
            total: inv.totals?.total || 0
          }
        }))
      }
    } catch (e) {
      console.error("Failed to fetch invoices from API", e)
    }
    return []
  }

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase_orders/`)
      if (response.ok) {
        const data = await response.json()
        return data.map(po => ({
          poNumber: po.number,
          customer: po.customer,
          items: po.items,
          details: {
            poNumber: po.number,
            eit: po.eit_details?.id || po.eit,
            eitName: po.extra_fields?.eitName || po.eit_details?.organization_name || "",
            eitAddress: po.extra_fields?.eitAddress || po.eit_details?.address || "",
            ...po.extra_fields
          },
          extraFields: po.extra_fields,
          updatedAt: po.updated_at,
          sourceKey: 'api',
          sourceIndex: po.id
        }))
      }
    } catch (e) {
      console.error("Failed to fetch POs from API", e)
    }
    return null
  }

  const loadData = async () => {
    const localData = getAllData()
    const apiQuotations = await fetchQuotations()
    const apiBillingNotes = await fetchBillingNotes()
    const apiInvoices = await fetchInvoices()
    const apiTaxInvoices = await fetchTaxInvoices()
    const apiPurchaseOrders = await fetchPurchaseOrders()
    
    if (apiPurchaseOrders !== null) {
      localData.purchaseOrders = apiPurchaseOrders
    }

    if (apiQuotations.length > 0) {
      // Create a Set of API quotation numbers for efficient lookup
      const apiNumbers = new Set(apiQuotations.map(q => q.details.number))
      
      // Filter out LocalStorage items that exist in API
      // We prefer the API version as the source of truth
      localData.quotations = localData.quotations.filter(q => !apiNumbers.has(q.details.number))
      
      // Merge the lists
      localData.quotations = [...localData.quotations, ...apiQuotations]
    }

    if (apiBillingNotes.length > 0) {
      // Create a Set of API billing note numbers for efficient lookup
      const apiNumbers = new Set(apiBillingNotes.map(bn => bn.details.number))
      
      // Filter out LocalStorage items that exist in API
      localData.billingNotes = localData.billingNotes.filter(bn => !apiNumbers.has(bn.details.number))
      
      // Merge the lists
      localData.billingNotes = [...localData.billingNotes, ...apiBillingNotes]
    }
    
    if (apiInvoices.length > 0) {
      // Create a Set of API invoice numbers for efficient lookup
      const apiNumbers = new Set(apiInvoices.map(inv => inv.details.number))
      
      // Filter out LocalStorage items that exist in API
      // We prefer the API version as the source of truth
      localData.invoices = localData.invoices.filter(inv => !apiNumbers.has(inv.details.number))
      
      // Merge the lists
      localData.invoices = [...localData.invoices, ...apiInvoices]
    }

    if (apiTaxInvoices.length > 0) {
      const apiNumbers = new Set(apiTaxInvoices.map(rc => rc.details.number))
      localData.taxInvoices = localData.taxInvoices.filter(rc => !apiNumbers.has(rc.details.number))
      localData.taxInvoices = [...localData.taxInvoices, ...apiTaxInvoices]
    }
    
    setData(localData)
  }

  // Seed initial data for testing if not present
  React.useEffect(() => {
    const key = "history:Mock Customer 002"
    if (!localStorage.getItem(key)) {
      const mockData = {
        customer: {
          company: "Mock Customer 002",
          taxId: "0000000000002",
          address: "456 Another Road, Bangkok",
          telephone: "02-999-9999",
          email: "customer002@example.com",
          contactPerson: "Jane Doe"
        },
        quotations: [
          {
            details: {
              number: "QT-002",
              date: new Date().toISOString().slice(0, 10),
              currency: "THB",
              validUntil: "",
              salesPerson: "Admin",
              paymentTerms: "30 Days",
              remark: "Mock data 002"
            },
            items: [
               { item: "1", model: "MODEL-002", description: "Test Product 002", qty: 2, price: 2500 }
            ],
            totals: { total: 5350 }
          }
        ],
        invoices: [
          {
            details: {
              number: `VOI ${new Date().getFullYear()}-0002`,
              date: new Date().toISOString().slice(0, 10),
              dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
              currency: "THB",
              sourceQuotationNumber: "QT-002"
            },
            items: [
               { product: "MODEL-002", description: "Test Product 002", qty: 2, price: 2500, unit: "pcs" }
            ],
            totals: { total: 5350 }
          }
        ],
        billingNotes: [
          {
            details: {
              number: "BN-002",
              date: new Date().toISOString().slice(0, 10),
              dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
              currency: "THB"
            },
            items: [
               { product: "MODEL-002", description: "Test Product 002", qty: 2, price: 2500, unit: "pcs" }
            ],
            totals: { total: 5350 }
          }
        ],
        receipts: [
          {
            details: {
              number: `RE ${new Date().getFullYear()}-0002`,
              date: new Date().toISOString().slice(0, 10),
              currency: "THB"
            },
            items: [
               { product: "MODEL-002", description: "Test Product 002", qty: 2, price: 2500, unit: "pcs" }
            ],
            totals: { total: 5350 }
          }
        ]
      }
      localStorage.setItem(key, JSON.stringify(mockData))
      loadData()
    }
  }, [])

  // Refresh data when tab changes or periodically
  React.useEffect(() => {
    loadData()
  }, [activeTab])

  // Handle URL params for direct navigation (e.g. from create page)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const view = params.get("view")
    if (view === "customerHistory") setActiveTab("customers")
    if (view === "purchaseOrders") setActiveTab("purchase-orders")
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden lg:block fixed top-16 bottom-0 overflow-y-auto pt-4">
        <div className="px-6 mb-8">
           <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Panel</h2>
        </div>
        <nav className="space-y-1 px-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "dashboard" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("purchase-orders")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "purchase-orders" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab("quotations")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "quotations" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-5 h-5" />
            Quotations
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "invoices" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Receipt className="w-5 h-5" />
            Invoices
          </button>
          <button
            onClick={() => setActiveTab("billing-notes")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "billing-notes" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Billing Notes
          </button>
          <button
            onClick={() => setActiveTab("tax-invoices")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "tax-invoices" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Receipt className="w-5 h-5" />
            Tax Invoices
          </button>
          <button
            onClick={() => setActiveTab("product-details")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "product-details" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Box className="w-5 h-5" />
            Product Details
          </button>
          <button
            onClick={() => setActiveTab("eit-management")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "eit-management" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Building2 className="w-5 h-5" />
            EIT Organizations
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "purchase-orders" && "Purchase Orders"}
            {activeTab === "quotations" && "Quotations"}
            {activeTab === "invoices" && "Invoices"}
            {activeTab === "billing-notes" && "Billing Notes"}
            {activeTab === "tax-invoices" && "Tax Invoices"}
            {activeTab === "product-details" && "Product Details"}
            {activeTab === "eit-management" && "EIT Organizations"}
          </h1>
        </header>

        {activeTab === "dashboard" && <Dashboard data={data} />}
        {activeTab === "purchase-orders" && <PurchaseOrderPage />}
        {activeTab === "quotations" && <QuotationList list={data.quotations} refreshData={loadData} />}
        {activeTab === "invoices" && <InvoiceList list={data.invoices} refreshData={loadData} />}
        {activeTab === "billing-notes" && <BillingNoteList list={data.billingNotes} refreshData={loadData} />}
        {activeTab === "tax-invoices" && <TaxInvoiceList list={data.taxInvoices} refreshData={loadData} />}
        {activeTab === "product-details" && <ProductDetails />}
        {activeTab === "eit-management" && <EitManagement />} {/* Added EIT Management view */}
      </main>
    </div>
  )
}

function AdminRoot() {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("isAuthenticated")
    if (auth !== "true") {
      window.location.href = "/"
      return
    }
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <main className="min-h-screen bg-white">
      <Navigation require="Admin" />
      <AdminPage />
    </main>
  )
}

const container = document.getElementById("root")

if (!window.__reactRoot) {
  window.__reactRoot = ReactDOM.createRoot(container)
}

window.__reactRoot.render(
  <React.StrictMode>
    <LanguageProvider>
      <AdminRoot />
    </LanguageProvider>
  </React.StrictMode>,
)
