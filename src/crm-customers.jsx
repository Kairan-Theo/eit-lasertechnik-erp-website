import React, { useState } from "react"

export default function CRMCustomers({ deals = [], onDeleteDeals }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [columnModes, setColumnModes] = useState({}) // { [key]: 'folded' | 'expanded' | undefined }
  const [selectedRows, setSelectedRows] = useState([])

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

  const columns = [
    { id: 'index', label: 'Index', width: 'w-16' },
    { id: 'company', label: 'Company Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'address', label: 'Address', defaultClass: 'max-w-xs truncate' },
    { id: 'contact', label: 'Contact Person' },
    { id: 'taxId', label: 'Tax ID', defaultClass: 'font-mono text-sm' },
    { id: 'poNumber', label: 'PO Number' },
    { id: 'title', label: 'Opportunity Name', defaultClass: 'font-medium' },
    { id: 'salesperson', label: 'Sales Person' },
    { id: 'amount', label: 'Amount', defaultClass: 'font-mono' },
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
      case 'contact': return deal.contact || "-";
      case 'taxId': return deal.taxId || "-";
      case 'poNumber': return deal.poNumber || "-";
      case 'title': return deal.title || "-";
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
              <tr key={deal.id || index} className={`transition border-b border-gray-100 ${selectedRows.includes(deal.id) ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}>
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
    </div>
  )
}
