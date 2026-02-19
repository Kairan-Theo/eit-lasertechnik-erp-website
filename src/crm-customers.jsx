import React, { useState } from "react"
import { API_BASE_URL } from "./config"
import { Trash } from "lucide-react"

export default function CRMCustomers({ deals = [], onDeleteDeals }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [columnModes, setColumnModes] = useState({}) // { [key]: 'folded' | 'expanded' | undefined }
  const [selectedRows, setSelectedRows] = useState([])
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newDeal, setNewDeal] = useState({
    company: "",
    branch: "",
    contact: "",
    opportunity: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    poNumber: "",
    amount: 0,
    currency: "฿",
    priority: "none",
    stageIndex: 0,
    salesperson: "",
  })
  const [extraContacts, setExtraContacts] = useState([])
  const [stages, setStages] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingDealInfo, setEditingDealInfo] = useState(null)

  const filteredDeals = deals.filter(deal => {
    const term = searchTerm.toLowerCase()
    const company = (deal.customer || deal.company || "").toLowerCase()
    const salesperson = (deal.salesperson || deal.salespersonName || "").toLowerCase()
    return company.includes(term) || salesperson.includes(term)
  })

  // Clear selection when search changes (optional, but safer to avoid deleting hidden items)
  // React.useEffect(() => setSelectedRows([]), [searchTerm]) 
  // User might want to search and select, search and select... so keeping selection is better.

  // Clean up selection when deals are removed
  React.useEffect(() => {
      const currentIds = new Set(deals.map(d => d.id))
      setSelectedRows(prev => prev.filter(id => currentIds.has(id)))
  }, [deals])

  React.useEffect(() => {
    if (!showNewCustomerForm || stages.length > 0) return
    const loadStages = async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { Authorization: `Token ${token}` } : {}
        const res = await fetch(`${API_BASE_URL}/api/stages/`, { headers })
        if (!res.ok) return
        const data = await res.json()
        setStages(Array.isArray(data) ? data : [])
      } catch {}
    }
    loadStages()
  }, [showNewCustomerForm, stages.length])

  const handleCreateCustomer = async () => {
    const isEditing = !!editingDealInfo
    if (!newDeal.company || !newDeal.company.trim()) {
      alert("Please enter a company name")
      return
    }
    let stageName = "New"
    if (!isEditing) {
      try {
        stageName = stages[newDeal.stageIndex]?.name || stages[0]?.name || "New"
      } catch {}
    }

    const baseData = {
      title: newDeal.opportunity || newDeal.company || "Untitled",
      amount: Number(newDeal.amount) || 0,
      currency: newDeal.currency || "฿",
      po_number: newDeal.poNumber || "",
      priority: newDeal.priority || "none",
      contact: newDeal.contact || "",
      email: newDeal.email || "",
      phone: newDeal.phone || "",
      address: newDeal.address || "",
      tax_id: newDeal.taxId || "",
      extra_contacts: extraContacts,
      salesperson: newDeal.salesperson || "",
    }

    let url = `${API_BASE_URL}/api/deals/`
    let method = "POST"
    let payload = {
      ...baseData,
      customer: null,
      notes: "",
      stage: stageName,
      write_customer_name: newDeal.company || "",
    }

    if (isEditing && editingDealInfo) {
      url = `${API_BASE_URL}/api/deals/${editingDealInfo.id}/`
      method = "PATCH"
      payload = {
        ...baseData,
        customer_name: newDeal.company || "",
      }
      if (editingDealInfo.stageName) {
        payload.stage = editingDealInfo.stageName
      }
    }
    setIsSaving(true)
    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      }
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowNewCustomerForm(false)
        setNewDeal({
          company: "",
          branch: "",
          contact: "",
          opportunity: "",
          email: "",
          phone: "",
          address: "",
          taxId: "",
          poNumber: "",
          amount: 0,
          currency: "฿",
          priority: "none",
          stageIndex: 0,
          salesperson: "",
        })
        setExtraContacts([])
        setEditingDealInfo(null)
        alert(isEditing ? "Customer updated. Refresh CRM to see changes." : "Customer added. Refresh CRM to see it in the list.")
      } else {
        const errorText = await res.text()
        console.error("Failed to create customer:", errorText)
        alert("Failed to create customer: " + errorText)
      }
    } catch (err) {
      console.error("Error creating customer", err)
      alert("Error creating customer: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSelectAll = (e) => {
      if (e.target.checked) {
          setSelectedRows(filteredDeals.map(d => d.id))
      } else {
          setSelectedRows([])
      }
  }

  const handleSelectRow = (id) => {
      setSelectedRows(prev => {
          if (prev.includes(id)) {
              return prev.filter(rowId => rowId !== id)
          } else {
              return [...prev, id]
          }
      })
  }

  const handleDelete = () => {
      if (onDeleteDeals && selectedRows.length > 0) {
          onDeleteDeals(selectedRows)
          // Don't clear selection here; wait for deletion to complete (deals prop update)
          // or user to cancel (selection remains)
      }
  }

  const handleEditRow = (deal) => {
    setNewDeal({
      company: deal.customer || deal.company || "",
      branch: deal.branch || "",
      contact: deal.contact || "",
      opportunity: deal.title || "",
      email: deal.email || "",
      phone: deal.phone || "",
      address: deal.address || "",
      taxId: deal.taxId || deal.tax_id || "",
      poNumber: deal.poNumber || deal.po_number || "",
      amount: deal.amount || 0,
      currency: deal.currency || "฿",
      priority: deal.priority || "none",
      stageIndex: 0,
      salesperson: deal.salesperson || deal.salespersonName || "",
    })
    setExtraContacts(deal.extraContacts || deal.extra_contacts || [])
    setEditingDealInfo({ id: deal.id, stageName: deal.stageName })
    setShowNewCustomerForm(true)
  }

  const columns = [
    { id: 'index', label: 'Index', width: 'w-16' },
    { id: 'company', label: 'Company Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'address', label: 'Address', defaultClass: 'max-w-xs truncate' },
    { id: 'contact', label: 'Contact Person' },
    { id: 'contactEmail', label: 'Contact Email' },
    { id: 'contactMobile', label: 'Contact Mobile' },
    { id: 'contactPosition', label: 'Position' },
    { id: 'contactDivision', label: 'Division' },
    { id: 'taxId', label: 'Tax ID', defaultClass: 'font-mono text-sm' },
    { id: 'poNumber', label: 'PO Number' },
    { id: 'title', label: 'Opportunity Name', defaultClass: 'font-medium' },
    { id: 'salesperson', label: 'Sales Person' },
    { id: 'amount', label: 'Amount', defaultClass: 'font-mono' },
    { id: 'stagesTotal', label: 'Stages Total' },
  ]

  const toggleMode = (id, mode) => {
    setColumnModes(prev => ({
      ...prev,
      [id]: prev[id] === mode ? undefined : mode
    }))
  }

  const renderCellContent = (col, deal, index) => {
    if (columnModes[col.id] === 'folded') return <span className="text-gray-300">•</span>;

    switch (col.id) {
      case 'index': return <span className="font-medium text-gray-800">{index + 1}</span>;
      case 'company': return <span className="font-medium text-gray-800">{deal.customer || deal.company || "-"}</span>;
      case 'contactEmail': {
        const extras = deal.extraContacts || deal.extra_contacts || []
        const primary = extras[0] || {}
        return primary.email || "-"
      }
      case 'contactMobile': {
        const extras = deal.extraContacts || deal.extra_contacts || []
        const primary = extras[0] || {}
        return primary.mobile || "-"
      }
      case 'contactPosition': {
        const extras = deal.extraContacts || deal.extra_contacts || []
        const primary = extras[0] || {}
        return primary.position || "-"
      }
      case 'contactDivision': {
        const extras = deal.extraContacts || deal.extra_contacts || []
        const primary = extras[0] || {}
        return primary.division || "-"
      }
      case 'salesperson': 
        const name = deal.salesperson || deal.salespersonName;
        return name ? (
          <div className="flex items-center gap-1.5" title={name}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {name}
          </div>
        ) : "-";
      case 'amount':
        return deal.amount ? `${deal.amount.toLocaleString()} ${deal.currency || '฿'}` : "-";
      case 'address': return deal.address || "-";
      case 'email': return deal.email || "-";
      case 'phone': return deal.phone || "-";
      case 'contact': {
        const extras = deal.extraContacts || deal.extra_contacts || []
        const names = []
        if (deal.contact) names.push(deal.contact)
        extras.forEach(c => {
          if (c && c.name) names.push(c.name)
        })
        if (names.length === 0) return "-"
        if (names.length <= 3) return names.join(", ")
        const firstLine = names.slice(0, 3).join(", ")
        const restLine = names.slice(3).join(", ")
        return (
          <span>
            {firstLine}
            <br />
            {restLine}
          </span>
        )
      }
      case 'taxId': return deal.taxId || "-";
      case 'poNumber': return deal.poNumber || "-";
      case 'title': return deal.title || "-";
      case 'stagesTotal': 
        return deal.stageName ? (
          <div className="flex flex-col">
            <span className="font-medium text-slate-700">{deal.stageName}</span>
            <span className="text-xs text-slate-500">Total: {deal.stageCount}</span>
          </div>
        ) : "-";
      default: return "-";
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers (Pipeline Data)</h2>
        <div className="flex items-center gap-6">
          {selectedRows.length > 0 && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Delete ({selectedRows.length})</span>
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-sm text-sm font-medium"
            onClick={() => setShowNewCustomerForm(true)}
          >
            + Add Customer
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Company or Salesperson..."
              className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
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
            {searchTerm ? (
              <span>Showing <span className="text-slate-900 font-bold">{filteredDeals.length}</span> of <span className="text-slate-900 font-bold">{deals.length}</span> customers</span>
            ) : (
              <span>Total: <span className="text-slate-900 font-bold">{deals.length}</span> customers</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  onChange={handleSelectAll}
                  checked={filteredDeals.length > 0 && selectedRows.length === filteredDeals.length}
                  ref={input => {
                    if (input) {
                      input.indeterminate = selectedRows.length > 0 && selectedRows.length < filteredDeals.length
                    }
                  }}
                />
              </th>
              {columns.map(col => {
                const mode = columnModes[col.id]
                return (
                  <th 
                    key={col.id} 
                    className={`p-4 border-b transition-all duration-300 group relative align-top ${
                      mode === 'folded' ? 'w-12 max-w-[3rem]' : mode === 'expanded' ? 'min-w-[300px]' : 'whitespace-nowrap'
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-2 ${mode === 'folded' ? 'justify-center' : ''}`}>
                      {mode !== 'folded' && <span>{col.label}</span>}
                      
                      <div className={`flex items-center gap-1 bg-white rounded-md shadow-md border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                        mode === 'folded' ? 'opacity-100 absolute left-1/2 -translate-x-1/2 top-2' : ''
                      }`}>
                        {mode !== 'folded' && (
                          <button 
                            onClick={() => toggleMode(col.id, 'folded')}
                            className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                            title="Fold Column"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        
                        {mode !== 'expanded' ? (
                          <button 
                            onClick={() => toggleMode(col.id, 'expanded')}
                            className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                            title="Fully Expand"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12a1 1 0 01-1-1z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M16 16a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L13.586 13.586V12a1 1 0 012 0v4zM4 12a1 1 0 011 1v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 13.586H8a1 1 0 010 2H4a1 1 0 01-1-1v-4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleMode(col.id, undefined)}
                            className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                            title="Reset to Default"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
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
            {filteredDeals.map((deal, index) => (
              <tr 
                key={deal.id || index} 
                className={`transition border-b border-gray-100 ${selectedRows.includes(deal.id) ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}
                onClick={(e) => {
                  const tag = e.target.tagName
                  if (tag === "INPUT" || tag === "BUTTON" || tag === "SVG" || tag === "PATH") return
                  handleEditRow(deal)
                }}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                    onChange={() => handleSelectRow(deal.id)}
                    checked={selectedRows.includes(deal.id)}
                  />
                </td>
                {columns.map(col => {
                  const mode = columnModes[col.id]
                  return (
                    <td 
                      key={col.id} 
                      className={`p-4 transition-all duration-300 align-top ${
                        mode === 'folded' 
                          ? 'w-12 max-w-[3rem] text-center overflow-hidden p-2' 
                          : mode === 'expanded'
                            ? 'min-w-[300px] whitespace-normal break-words text-gray-600'
                            : `whitespace-nowrap text-gray-600 ${col.defaultClass || ''}`
                      }`}
                    >
                      {renderCellContent(col, deal, index)}
                    </td>
                  )
                })}
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">
                  {searchTerm ? "No matching customers found." : "No data found in Sales Pipeline."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col mt-16">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-lg font-bold text-slate-800">{editingDealInfo ? "Edit Customer" : "Add Customer"}</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setShowNewCustomerForm(false)
                  setEditingDealInfo(null)
                }}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Company Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                    <input
                      value={newDeal.company}
                      onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
                    <input
                      value={newDeal.branch}
                      onChange={(e) => setNewDeal({ ...newDeal, branch: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Branch name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Opportunity</label>
                    <input
                      value={newDeal.opportunity}
                      onChange={(e) => setNewDeal({ ...newDeal, opportunity: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Deal opportunity name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Salesperson</label>
                    <input
                      value={newDeal.salesperson}
                      onChange={(e) => setNewDeal({ ...newDeal, salesperson: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Salesperson name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                    <input
                      value={newDeal.address}
                      onChange={(e) => setNewDeal({ ...newDeal, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Company address"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact Person</div>
                <div className="rounded-2xl border border-[#2D4485]/40 bg-white shadow-md px-5 py-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                      <input
                        value={newDeal.contact}
                        onChange={(e) => setNewDeal({ ...newDeal, contact: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <input
                        value={newDeal.email}
                        onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                      <input
                        value={newDeal.phone}
                        onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Position"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Division"
                      />
                    </div>
                    {extraContacts.map((c, index) => {
                      const update = (field, value) => {
                        const next = [...extraContacts]
                        next[index] = { ...next[index], [field]: value }
                        setExtraContacts(next)
                      }
                      const remove = () => {
                        const next = extraContacts.filter((_, i) => i !== index)
                        setExtraContacts(next)
                      }
                      return (
                        <div
                          key={index}
                          className="sm:col-span-2 mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 space-y-3"
                        >
                          <div className="flex items-center justify-between text-sm font-semibold text-[#2D4485]">
                            <span>Additional contact {index + 1}</span>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-800"
                              onClick={remove}
                              title="Delete contact"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                              <input
                                value={c.name || ""}
                                onChange={(e) => update("name", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                placeholder="Contact person name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                              <input
                                value={c.email || ""}
                                onChange={(e) => update("email", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                placeholder="Email address"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                              <input
                                value={c.mobile || ""}
                                onChange={(e) => update("mobile", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                placeholder="Mobile number"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                              <input
                                value={c.position || ""}
                                onChange={(e) => update("position", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                placeholder="Position"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                              <input
                                value={c.division || ""}
                                onChange={(e) => update("division", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                placeholder="Division"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#2D4485]/50 text-xs font-semibold text-[#2D4485] bg-white hover:bg-[#2D4485]/5 transition-colors"
                      onClick={() => setExtraContacts([...extraContacts, {}])}
                    >
                      + Add more contact person
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Codes</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tax ID</label>
                    <input
                      value={newDeal.taxId}
                      onChange={(e) => setNewDeal({ ...newDeal, taxId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Tax ID"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">PO Number</label>
                    <input
                      value={newDeal.poNumber}
                      onChange={(e) => setNewDeal({ ...newDeal, poNumber: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Purchase Order Number"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Amount</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        {newDeal.currency}
                      </span>
                      <input
                        type="number"
                        value={newDeal.amount}
                        onChange={(e) => setNewDeal({ ...newDeal, amount: Number(e.target.value) })}
                        className="w-full pl-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                    <input
                      value={newDeal.currency}
                      onChange={(e) => setNewDeal({ ...newDeal, currency: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all text-center uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Priority</div>
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((n) => {
                    const p = n === 1 ? "low" : n === 2 ? "medium" : "high"
                    const title = n === 1 ? "Low" : n === 2 ? "Medium" : "High"
                    const active = newDeal.priority === p
                    const colorClass = n === 1 ? "bg-[#2D4485]" : n === 2 ? "bg-orange-400" : "bg-red-500"
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          active
                            ? `${colorClass} text-white border-transparent shadow-md transform scale-105`
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        onClick={() =>
                          setNewDeal({
                            ...newDeal,
                            priority: active ? "none" : p,
                          })
                        }
                      >
                        {title} Priority
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Stage</div>
                <select
                  value={newDeal.stageIndex}
                  onChange={(e) =>
                    setNewDeal({
                      ...newDeal,
                      stageIndex: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                >
                  {stages.length === 0 ? (
                    <option value={0}>New</option>
                  ) : (
                    stages.map((s, i) => (
                      <option key={s.id || s.name || i} value={i}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm"
                onClick={() => {
                  setShowNewCustomerForm(false)
                  setEditingDealInfo(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleCreateCustomer}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editingDealInfo ? "Save Changes" : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
