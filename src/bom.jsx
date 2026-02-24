import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import "./index.css"
import { API_BASE_URL } from "./config"

const NodeMenu = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-24 bg-white rounded-md shadow-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit() }}
            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete() }}
            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

const PhotoUpload = ({ photo, onUpload }) => (
  <label className="cursor-pointer flex items-center gap-3 group">
    <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
    <div className={`h-10 w-10 rounded-lg border-2 ${photo ? 'border-solid border-gray-200' : 'border-dashed border-gray-300 group-hover:border-[#3D56A6]'} flex items-center justify-center overflow-hidden transition-colors bg-gray-50 shrink-0`}>
      {photo ? (
        <img src={photo} className="h-full w-full object-cover" />
      ) : (
        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#3D56A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
      )}
    </div>
    <span className="text-xs font-medium text-gray-500 group-hover:text-[#3D56A6] transition-colors whitespace-nowrap">
      {photo ? 'Change' : 'Upload'}
    </span>
  </label>
)

function BOMPage() {
  const [boms, setBoms] = React.useState(() => {
    try { 
      const raw = JSON.parse(localStorage.getItem("mfgBOMs") || "[]") 
      return Array.isArray(raw) ? raw : []
    } catch { return [] }
  })
  const setAndPersist = React.useCallback((next) => {
    setBoms(next)
    try {
      localStorage.setItem("mfgBOMs", JSON.stringify(next))
    } catch {}
  }, [])
  const reloadBoms = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bom/`)
      if (res && res.ok) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : []
        
        // Always update state from API if successful, even if empty
        const mapped = arr.map((item) => ({
          id: item.id,
          name: item.product || "",
          product: item.product || "",
          version: item.version || "",
          type: item.type || "",
          active: true,
          productTree: item.productTree || []
        }))
        setAndPersist(mapped)
        return
      }
    } catch (e) {
      console.error(e)
    }
    // Only fall back to local storage if API fails
    try {
      const raw = JSON.parse(localStorage.getItem("mfgBOMs") || "[]")
      const stored = Array.isArray(raw) ? raw : []
      if (stored.length) {
        setBoms(stored)
        return
      }
    } catch {}
    const seed = [
      { id: 1, name: "LCM Standard", product: "Laser Cladding Machine", version: "v1", type: "Manufacture", active: true },
      { id: 2, name: "LWM Standard", product: "Laser Welding Machine", version: "v2", type: "Manufacture", active: true },
      { id: 3, name: "Cake BOM", product: "Cake", version: "v1", type: "Manufacture", active: false },
    ]
    setAndPersist(seed)
  }, [setAndPersist])
  const [openTreeId, setOpenTreeId] = React.useState(null)
  const [editingTree, setEditingTree] = React.useState({ product: "", version: "", type: "Manufacture", systems: [] })
  const [expandedIds, setExpandedIds] = React.useState(new Set())
  const [viewingPhoto, setViewingPhoto] = React.useState(null)
  const toggleExpand = (id) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedIds(next)
  }
  const [showNew, setShowNew] = React.useState(false)
  const [newBom, setNewBom] = React.useState({ product: "", version: "", type: "Manufacture", systems: [] })
  const [selectedRows, setSelectedRows] = React.useState([])
  const [openBulkDelete, setOpenBulkDelete] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const confirmBulkDelete = async () => {
    try {
      if (selectedRows.length > 0) {
        await Promise.all(selectedRows.map(async (id) => {
          try {
             await fetch(`${API_BASE_URL}/api/bom/${id}/`, { method: "DELETE" })
          } catch {}
        }))
      }
      const next = boms.filter(x => !selectedRows.includes(x.id))
      setAndPersist(next)
    } finally {
      setSelectedRows([])
      setOpenBulkDelete(false)
    }
  }
  const columns = [
    { id: 'index', label: 'Index' },
    { id: 'product', label: 'Product' },
    { id: 'systems', label: 'Systems' },
    { id: 'version', label: 'Version' },
    { id: 'type', label: 'Type' },
  ]
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = viewBoms.map(d => d.id)
      setSelectedRows(prev => Array.from(new Set([...prev, ...ids])))
    } else {
      setSelectedRows(prev => prev.filter(id => !viewBoms.some(b => b.id === id)))
    }
  }
  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const systemsCount = (b) => {
    const pt = b.productTree
    if (pt && !Array.isArray(pt)) return (pt.systems || []).length
    if (Array.isArray(pt)) return (pt || []).length
    return 0
  }
 
  const viewBoms = React.useMemo(() => {
    const q = String(query || "").toLowerCase().trim()
    if (!q) return boms
    return boms.filter(b => {
      const p = String(b.product || "").toLowerCase()
      return p.includes(q)
    })
  }, [boms, query])
  React.useEffect(() => {
    reloadBoms()
  }, [reloadBoms])
  // Comment: Tabs config for manufacturing navigation — consistent across MO/BOM/Components
  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
  const tabsNav = React.useMemo(() => ([
    { id: "manufacturing", label: "Manufacturing Order", href: "/manufacturing.html" },
    { id: "bom", label: "Bill of Materials", href: "/bom.html" },
    { id: "components", label: "Components", href: "/products.html" },
  ]), [])
  const activeTabId = React.useMemo(() => {
    if (currentPath.includes("bom")) return "bom"
    if (currentPath.includes("product")) return "components"
    return "manufacturing"
  }, [currentPath])

  const updateBomTree = (bomId, newTree) => {
    const next = boms.map(b => b.id === bomId ? { ...b, productTree: newTree } : b)
    setAndPersist(next)
  }

  const deleteSystem = (bomId, sysIndex) => {
    if (!window.confirm("Delete this system?")) return
    const b = boms.find(x => x.id === bomId)
    if (!b) return
    const pt = b.productTree || {}
    const systems = Array.isArray(pt) ? pt : (pt.systems || [])
    
    const newSystems = systems.filter((_, i) => i !== sysIndex)
    
    let newTree
    if (Array.isArray(pt)) {
        newTree = newSystems
    } else {
        newTree = { ...pt, systems: newSystems }
    }
    updateBomTree(bomId, newTree)
  }

  const deleteComponent = (bomId, sysIndex, compIndex) => {
    if (!window.confirm("Delete this component?")) return
     const b = boms.find(x => x.id === bomId)
    if (!b) return
    const pt = b.productTree || {}
    const systems = Array.isArray(pt) ? pt : (pt.systems || [])
    
    const newSystems = systems.map((s, i) => {
        if (i !== sysIndex) return s
        return { ...s, components: (s.components || []).filter((_, j) => j !== compIndex) }
    })

    let newTree
    if (Array.isArray(pt)) {
        newTree = newSystems
    } else {
        newTree = { ...pt, systems: newSystems }
    }
    updateBomTree(bomId, newTree)
  }

  const handleFileChange = (e, callback) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => callback(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const productPreview = (b) => {
    const t = b.productTree
    if (t && !Array.isArray(t)) {
      const names = [
        b.product || "",
        ...((t.systems||[]).map((s)=>s.name || "")),
        ...((t.systems||[]).flatMap((s)=> (s.components||[]).map((c)=>c.name || ""))),
      ].filter((v)=>String(v).trim()!=="")
      if (names.length) return names.join(", ")
    }
    if (Array.isArray(t) && t.length) {
      const names = [b.product || ""]
      names.push(...t.map((s)=>s.system || ""))
      names.push(...t.flatMap((s)=> (s.components||[]).map((c)=>c.name||"")))
      return names.filter((v)=>String(v).trim()!=="").join(", ")
    }
    return b.product
  }
  const renderCellContent = (col, b, index) => {
    switch (col.id) {
      case 'index': return <span className="font-medium text-gray-800">{index + 1}</span>
      case 'product': return (
        <div className="flex items-center gap-2">
          <button
            className="text-[#2D4485] hover:underline font-semibold"
            onClick={() => {
              setOpenTreeId(b.id)
              const pt = b.productTree
              if (pt && !Array.isArray(pt)) {
                const systems = (pt.systems || []).map((s) => ({
                  name: s.name || "",
                  photo: s.photo,
                  components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1, photo: c.photo }))
                }))
                if (!systems.length && (pt.components || []).length) {
                  const first = { name: b.product || "", components: (pt.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 })) }
                  setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", photo: pt.photo, systems: [first] })
                } else {
                  setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", photo: pt.photo, systems })
                }
              } else if (Array.isArray(pt)) {
                const systems = (pt || []).map((s) => ({
                  name: s.system || "",
                  components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 }))
                }))
                setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", systems })
              } else {
                setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", systems: [] })
              }
            }}
            title="Edit Settings"
          >
            {b.product || "Untitled"}
          </button>
          <button
            className="text-gray-500 hover:text-[#2D4485] p-1 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => toggleExpand(b.id)}
            title="Toggle details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      )
      case 'version': return <span className="text-gray-800">{b.version || "-"}</span>
      case 'type': return <span className="text-gray-800">{b.type || "-"}</span>
      case 'systems': return <span className="text-gray-800">{systemsCount(b)}</span>
      default: return null
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full bg-gray-50">
        <div className="w-full mx-auto p-6 min-h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Bill of Materials</h2>
                {/* Comment: Tab header below the page title for MO / BOM / Components */}
                <div className="mt-2 flex border-b border-gray-200 overflow-x-auto">
                  {tabsNav.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { window.location.href = tab.href }}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTabId === tab.id
                          ? "border-[#2D4485] text-[#2D4485]"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      title={tab.label}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="hidden"
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-6">
              {/* Comment: Place New BOM next to Search for better proximity */}
              <button
                className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                title="New BOM"
                onClick={() => setShowNew(true)}
              >
                New BOM
              </button>
              {selectedRows.length > 0 && (
                <button
                  onClick={() => setOpenBulkDelete(true)}
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
                  placeholder="Search by Product"
                  className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {query && (
                  <button
                    onClick={() => setQuery("")}
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
                {query ? (
                  <span>Showing <span className="text-slate-900 font-bold">{viewBoms.length}</span> of <span className="text-slate-900 font-bold">{boms.length}</span> BOMs</span>
                ) : (
                  <span>Total: <span className="text-slate-900 font-bold">{boms.length}</span> BOMs</span>
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
                      checked={viewBoms.length > 0 && viewBoms.every(b => selectedRows.includes(b.id))}
                      ref={input => {
                        if (input) {
                          const count = selectedRows.filter(id => viewBoms.some(b => b.id === id)).length
                          input.indeterminate = count > 0 && count < viewBoms.length
                        }
                      }}
                    />
                  </th>
                  {columns.map(col => (
                    <th key={col.id} className="p-4 border-b whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewBoms.map((b, index) => (
                  <React.Fragment key={b.id}>
                    <tr className={`border-b border-gray-100 transition-colors ${selectedRows.includes(b.id) ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}>
                      <td className="p-4 border-b w-10">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                          onChange={() => handleSelectRow(b.id)}
                          checked={selectedRows.includes(b.id)}
                        />
                      </td>
                      {columns.map(col => (
                        <td key={col.id} className="p-4 whitespace-nowrap text-gray-600">
                          {renderCellContent(col, b, index)}
                        </td>
                      ))}
                    </tr>
                    {expandedIds.has(b.id) && (
                      <tr className="border-t">
                        <td colSpan={columns.length + 1} className="p-0">
                          {(() => {
                            const pt = b.productTree
                            const systems = pt && !Array.isArray(pt)
                              ? (pt.systems || [])
                              : Array.isArray(pt)
                                ? (pt || []).map((s) => ({ name: s.system || "", components: s.components || [] }))
                                : []
                            return (
                              <div className="mt-4 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-top-2 duration-200 overflow-x-auto">
                                <style>{`
                                  .mm-branch { position: relative; padding-left: 2rem; }
                                  .mm-branch::before { content: ''; position: absolute; left: 0; top: 50%; width: 2rem; height: 1px; background: #e5e7eb; }
                                  .mm-branch::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px; background: #e5e7eb; }
                                  .mm-branch:first-child::after { top: 50%; }
                                  .mm-branch:last-child::after { bottom: 50%; }
                                  .mm-branch:only-child::after { display: none; }
                                  .mm-branch:only-child::before { width: 2rem; }
                                `}</style>
                                <div className="flex items-center p-4 min-w-max">
                                  <div className="flex-shrink-0 z-10 border border-gray-200 bg-white rounded-lg p-2 shadow-sm flex items-center gap-3 min-w-[200px] hover:shadow-md transition-shadow relative pr-8">
                                    {pt?.photo ? (
                                      <img
                                        src={pt.photo}
                                        className="w-10 h-10 object-cover rounded-md border border-gray-100 cursor-zoom-in"
                                        onClick={(e) => { e.stopPropagation(); setViewingPhoto(pt.photo) }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center text-[8px] text-gray-400">No Photo</div>
                                    )}
                                    <div>
                                      <div className="text-[10px] font-bold text-[#3D56A6] uppercase tracking-wider">Product</div>
                                      <div className="font-semibold text-sm text-gray-900">{b.product || "Untitled"}</div>
                                    </div>
                                    <div className="absolute top-1 right-1">
                                      <NodeMenu
                                        onEdit={() => {
                                          setOpenTreeId(b.id)
                                          const systemsEdit = (pt && !Array.isArray(pt)) ? (pt.systems || []).map((s) => ({
                                            name: s.name || "",
                                            photo: s.photo,
                                            components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1, photo: c.photo }))
                                          })) : (pt || []).map((s) => ({
                                            name: s.system || "",
                                            components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 }))
                                          }))
                                          if (pt && !Array.isArray(pt)) {
                                            setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", photo: pt.photo, systems: systemsEdit })
                                          } else {
                                            setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", systems: systemsEdit })
                                          }
                                        }}
                                        onDelete={() => {
                                          if (window.confirm("Are you sure you want to delete this product?")) {
                                            const next = boms.filter((x) => x.id !== b.id)
                                            setAndPersist(next)
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                  {systems.length > 0 && <div className="w-8 h-px bg-gray-200 flex-shrink-0"></div>}
                                  {systems.length > 0 && (
                                    <div className="flex flex-col justify-center">
                                      {systems.map((sys, i) => (
                                        <div key={`s${i}`} className="mm-branch flex items-center py-2">
                                          <div className="flex-shrink-0 z-10 border border-gray-200 bg-white rounded-lg p-2 shadow-sm flex items-center gap-3 min-w-[180px] hover:shadow-md transition-shadow relative pr-8">
                                            {sys.photo ? (
                                              <img
                                                src={sys.photo}
                                                className="w-8 h-8 object-cover rounded-md border border-gray-100 cursor-zoom-in"
                                                onClick={(e) => { e.stopPropagation(); setViewingPhoto(sys.photo) }}
                                              />
                                            ) : (
                                              <div className="w-8 h-8 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center text-[8px] text-gray-400">No Photo</div>
                                            )}
                                            <div>
                                              <div className="text-[9px] font-bold text-[#3D56A6] uppercase tracking-wider">System</div>
                                              <div className="font-medium text-xs text-gray-800">{sys.name || "Untitled"}</div>
                                            </div>
                                            <div className="absolute top-1 right-1">
                                              <NodeMenu
                                                onEdit={() => {
                                                  setOpenTreeId(b.id)
                                                  const systemsData = (pt && !Array.isArray(pt)) ? (pt.systems || []).map((s) => ({
                                                    name: s.name || "",
                                                    photo: s.photo,
                                                    components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1, photo: c.photo }))
                                                  })) : (pt || []).map((s) => ({
                                                    name: s.system || "",
                                                    components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 }))
                                                  }))
                                                  if (pt && !Array.isArray(pt)) {
                                                    setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", photo: pt.photo, systems: systemsData })
                                                  } else {
                                                    setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", systems: systemsData })
                                                  }
                                                }}
                                                onDelete={() => deleteSystem(b.id, i)}
                                              />
                                            </div>
                                          </div>
                                          {(sys.components || []).length > 0 && <div className="w-8 h-px bg-gray-200 flex-shrink-0"></div>}
                                          {(sys.components || []).length > 0 && (
                                            <div className="flex flex-col justify-center">
                                              {(sys.components || []).map((c, j) => (
                                                <div key={`c${i}-${j}`} className="mm-branch flex items-center py-1">
                                                  <div className="flex-shrink-0 z-10 border border-gray-100 bg-gray-50/50 rounded-lg p-1.5 shadow-sm flex items-center gap-2 min-w-[150px] hover:bg-white hover:shadow transition-all relative pr-8">
                                                    {c.photo ? (
                                                      <img
                                                        src={c.photo}
                                                        className="w-6 h-6 object-cover rounded border border-gray-200 cursor-zoom-in"
                                                        onClick={(e) => { e.stopPropagation(); setViewingPhoto(c.photo) }}
                                                      />
                                                    ) : (
                                                      <div className="w-6 h-6 bg-white rounded border border-gray-200 flex items-center justify-center text-[6px] text-gray-400">No Photo</div>
                                                    )}
                                                    <div>
                                                      <div className="font-medium text-xs text-gray-700">{c.name || "Untitled"}</div>
                                                      <div className="text-[10px] text-gray-500">Qty: {Number(c.qty) || 0}</div>
                                                    </div>
                                                    <div className="absolute top-0.5 right-0.5">
                                                      <NodeMenu
                                                        onEdit={() => {
                                                          setOpenTreeId(b.id)
                                                          const systemsData = (pt && !Array.isArray(pt)) ? (pt.systems || []).map((s) => ({
                                                            name: s.name || "",
                                                            photo: s.photo,
                                                            components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1, photo: c.photo }))
                                                          })) : (pt || []).map((s) => ({
                                                            name: s.system || "",
                                                            components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 }))
                                                          }))
                                                          if (pt && !Array.isArray(pt)) {
                                                            setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", photo: pt.photo, systems: systemsData })
                                                          } else {
                                                            setEditingTree({ product: b.product || "", version: b.version || "", type: b.type || "Manufacture", systems: systemsData })
                                                          }
                                                        }}
                                                        onDelete={() => deleteComponent(b.id, i, j)}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {systems.length === 0 && !pt?.photo && (
                                    <div className="text-gray-500 italic ml-4 text-xs">No details available.</div>
                                  )}
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {boms.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">
                      No bills of materials.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {showNew && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setShowNew(false)}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[720px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">New BOM</h3>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setShowNew(false)}>✕</button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                {/* Product Info Section */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Product Name</label>
                        <input value={newBom.product} onChange={(e)=>setNewBom({...newBom, product:e.target.value})} placeholder="e.g. Laser Welding Machine" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2 border" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Version</label>
                        <input value={newBom.version} onChange={(e)=>setNewBom({...newBom, version:e.target.value})} placeholder="e.g. v1.0" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2 border" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Type</label>
                        <select value={newBom.type} onChange={(e)=>setNewBom({...newBom, type:e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2 border bg-white">
                          <option value="Manufacture">Manufacture</option>
                          <option value="Purchase Order">Purchase Order</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Cover Photo</label>
                        <PhotoUpload photo={newBom.photo} onUpload={(e)=>handleFileChange(e, (v)=>setNewBom({...newBom, photo: v}))} />
                     </div>
                  </div>
                </div>

                {/* Systems Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3D56A6]"></span>
                      Systems Configuration
                    </h4>
                    <button
                      className="text-xs flex items-center gap-1.5 bg-[#3D56A6]/10 text-[#3D56A6] px-4 py-2 rounded-full font-medium hover:bg-[#3D56A6]/20 transition-colors border border-[#3D56A6]/20"
                      onClick={()=> setNewBom((prev)=> ({ ...prev, systems: [...(prev.systems||[]), { name: "", components: [] }] })) }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Add System
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {(newBom.systems||[]).map((sys, si)=>(
                      <div key={si} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                        {/* System Header */}
                        <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex items-center gap-4 group">
                           <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                             <svg className="w-4 h-4 text-[#3D56A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                           </div>
                           <div className="flex-1">
                              <input 
                                value={sys.name}
                                onChange={(e)=>{
                                  const v = e.target.value
                                  setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, name: v } : s) }))
                                }}
                                className="bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 placeholder-gray-400 w-full"
                                placeholder="System Name (e.g. Power Supply)"
                              />
                           </div>
                           <PhotoUpload photo={sys.photo} onUpload={(e)=>handleFileChange(e, (v)=>setNewBom((prev)=>({...prev, systems: prev.systems.map((s,i)=>i===si ? {...s, photo: v} : s)})))} />
                           <button
                             className="text-gray-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                             onClick={()=> setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).filter((_, i)=> i!==si) })) }
                             title="Remove system"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                           </button>
                        </div>
                        
                        {/* Components List */}
                        <div className="p-4 bg-white space-y-3">
                           {(sys.components||[]).map((c, ci)=>(
                             <div key={ci} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition-all">
                                <div className="w-6 text-gray-300 flex justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#3D56A6]"></div>
                                </div>
                                <div className="flex-1">
                                  <input
                                    value={c.name}
                                    onChange={(e)=>{
                                      const v = e.target.value
                                      setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> { if (i!==si) return s; return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, name: v } : cc) } }) }))
                                    }}
                                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#3D56A6] focus:border-[#3D56A6] px-3 py-1.5 placeholder-gray-400 border"
                                    placeholder="Component Name"
                                  />
                                </div>
                                <div className="w-24">
                                  <div className="relative">
                                      <input
                                        type="number" min="0" step="1"
                                        value={c.qty}
                                        onChange={(e)=>{
                                          const v = Math.max(0, Math.floor(Number(e.target.value||0)))
                                          setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> { if (i!==si) return s; return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, qty: v } : cc) } }) }))
                                        }}
                                        className="w-full text-sm border-gray-200 rounded-md focus:ring-[#3D56A6] focus:border-[#3D56A6] pl-3 pr-8 py-1.5 text-center border"
                                        placeholder="Qty"
                                      />
                                      <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">Qty</span>
                                  </div>
                                </div>
                                <PhotoUpload photo={c.photo} onUpload={(e)=>handleFileChange(e, (v)=>setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> { if (i!==si) return s; return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, photo: v } : cc) } }) })))} />
                                <button
                                  className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={()=> setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> { if (i!==si) return s; return { ...s, components: (s.components||[]).filter((_, j)=> j!==ci) } }) })) }
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                             </div>
                           ))}
                           <button
                             className="w-full py-2.5 border-2 border-dashed border-gray-100 rounded-lg text-xs font-medium text-gray-400 hover:border-[#3D56A6]/30 hover:text-[#3D56A6] hover:bg-[#3D56A6]/10 transition-all flex items-center justify-center gap-2 mt-2"
                             onClick={()=> setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, components: [...(s.components||[]), { name: "", qty: 1 }] } : s) })) }
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                             Add Component
                           </button>
                        </div>
                      </div>
                    ))}
                    {(newBom.systems||[]).length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                            <p>No systems added yet.</p>
                            <button className="text-[#3D56A6] font-medium hover:underline mt-1" onClick={()=> setNewBom((prev)=> ({ ...prev, systems: [...(prev.systems||[]), { name: "", components: [] }] })) }>Add your first system</button>
                        </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowNew(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={()=>{
                    const o = { id: Date.now(), product: newBom.product || "Untitled", version: newBom.version || "", type: newBom.type || "Manufacture", productTree: { product: newBom.product || "Untitled", photo: newBom.photo, systems: (newBom.systems||[]).map((s)=>({ name: s.name || "", photo: s.photo, components: (s.components||[]).map((c)=>({ name: c.name || "", qty: Number(c.qty)||0, photo: c.photo })) })) } }
                    const next = [...boms, o]
                    setAndPersist(next)
                    const payload = {
                      product: o.productTree.product || "Untitled",
                      version: o.version || "",
                      type: o.type || "",
                      systems: (Array.isArray(o.productTree.systems) ? o.productTree.systems : []).map(s => ({
                        name: s.name || "",
                        components: (Array.isArray(s.components) ? s.components : []).map(c => ({
                          name: c.name || "",
                          qty: Number(c.qty) || 0
                        }))
                      }))
                    }
                    fetch(`${API_BASE_URL}/api/bom/import/`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    }).then(async (res)=>{
                      if (!res || !res.ok) {
                        const msg = res ? await res.text().catch(()=>"") : ""
                        alert(`Failed to save BOM: ${res ? res.status : 'network'} ${msg}`)
                      } else {
                        await reloadBoms()
                      }
                    }).catch(()=>{
                      alert("Failed to reach backend while saving BOM")
                    })
                    setShowNew(false)
                    setNewBom({ product: "", version: "", type: "Manufacture", systems: [] })
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openBulkDelete && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpenBulkDelete(false)}>
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[520px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Delete BOMs</h3>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenBulkDelete(false)}>✕</button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-semibold">{selectedRows.length}</span> selected BOMs?</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenBulkDelete(false)}>Cancel</button>
                <button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={confirmBulkDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openTreeId && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setOpenTreeId(null)}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[720px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Product Tree</h3>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenTreeId(null)}>✕</button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                {/* Product Info Section */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Product Name</label>
                        <input 
                          value={editingTree.product} 
                          onChange={(e)=> setEditingTree((prev)=>({ ...prev, product: e.target.value })) }
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2 border"
                          placeholder="Product Name"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Cover Photo</label>
                        <PhotoUpload photo={editingTree.photo} onUpload={(e)=>handleFileChange(e, (v)=>setEditingTree({...editingTree, photo: v}))} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Version</label>
                        <input 
                          value={editingTree.version || ""} 
                          onChange={(e)=> setEditingTree((prev)=>({ ...prev, version: e.target.value })) }
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2 border"
                          placeholder="e.g. v1.0"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Type</label>
                        <select 
                          value={editingTree.type || "Manufacture"} 
                          onChange={(e)=> setEditingTree((prev)=>({ ...prev, type: e.target.value })) }
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3D56A6] focus:ring-[#3D56A6] text-sm px-3 py-2 border bg-white"
                        >
                          <option value="Manufacture">Manufacture</option>
                          <option value="Purchase Order">Purchase Order</option>
                        </select>
                     </div>
                  </div>
                </div>

                {/* Systems Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3D56A6]"></span>
                      Systems Configuration
                    </h4>
                    <button
                      className="text-xs flex items-center gap-1.5 bg-[#3D56A6]/10 text-[#3D56A6] px-4 py-2 rounded-full font-medium hover:bg-[#3D56A6]/20 transition-colors border border-[#3D56A6]/20"
                      onClick={()=>{
                        setEditingTree((prev)=>({ ...prev, systems: [...(prev.systems||[]), { name: "", components: [] }] }))
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Add System
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {(editingTree.systems||[]).map((sys, si)=>(
                      <div key={si} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                        {/* System Header */}
                        <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex items-center gap-4 group">
                           <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                             <svg className="w-4 h-4 text-[#3D56A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                           </div>
                           <div className="flex-1">
                              <input 
                                value={sys.name}
                                onChange={(e)=>{
                                  const v = e.target.value
                                  setEditingTree((prev)=>({
                                    ...prev,
                                    systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, name: v } : s)
                                  }))
                                }}
                                className="bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 placeholder-gray-400 w-full"
                                placeholder="System Name (e.g. Power Supply)"
                              />
                           </div>
                           <PhotoUpload photo={sys.photo} onUpload={(e)=>handleFileChange(e, (v)=>setEditingTree((prev)=>({...prev, systems: prev.systems.map((s,i)=>i===si ? {...s, photo: v} : s)})))} />
                           <button
                             className="text-gray-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                             onClick={()=> setEditingTree((prev)=>({ ...prev, systems: (prev.systems||[]).filter((_, i)=> i!==si) })) }
                             title="Remove system"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                           </button>
                        </div>
                        
                        {/* Components List */}
                        <div className="p-4 bg-white space-y-3">
                           {(sys.components||[]).map((c, ci)=>(
                             <div key={ci} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition-all">
                                <div className="w-6 text-gray-300 flex justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#3D56A6]"></div>
                                </div>
                                <div className="flex-1">
                                  <input
                                    value={c.name}
                                    onChange={(e)=>{
                                      const v = e.target.value
                                      setEditingTree((prev)=>({
                                        ...prev,
                                        systems: (prev.systems||[]).map((s, i)=> {
                                          if (i!==si) return s
                                          return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, name: v } : cc) }
                                        })
                                      }))
                                    }}
                                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#3D56A6] focus:border-[#3D56A6] px-3 py-1.5 placeholder-gray-400 border"
                                    placeholder="Component Name"
                                  />
                                </div>
                                <div className="w-24">
                                  <div className="relative">
                                      <input
                                        type="number" min="0" step="1"
                                        value={c.qty}
                                        onChange={(e)=>{
                                          const v = Math.max(0, Math.floor(Number(e.target.value||0)))
                                          setEditingTree((prev)=>({
                                            ...prev,
                                            systems: (prev.systems||[]).map((s, i)=> {
                                              if (i!==si) return s
                                              return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, qty: v } : cc) }
                                            })
                                          }))
                                        }}
                                        className="w-full text-sm border-gray-200 rounded-md focus:ring-[#3D56A6] focus:border-[#3D56A6] pl-3 pr-8 py-1.5 text-center border"
                                        placeholder="Qty"
                                      />
                                      <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">Qty</span>
                                  </div>
                                </div>
                                <PhotoUpload photo={c.photo} onUpload={(e)=>handleFileChange(e, (v)=>setEditingTree((prev)=> ({ ...prev, systems: (prev.systems||[]).map((s, i)=> { if (i!==si) return s; return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, photo: v } : cc) } }) })))} />
                                <button
                                  className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={()=> setEditingTree((prev)=>({
                                    ...prev,
                                    systems: (prev.systems||[]).map((s, i)=> {
                                      if (i!==si) return s
                                      return { ...s, components: (s.components||[]).filter((_, j)=> j!==ci) }
                                    })
                                  })) }
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                             </div>
                           ))}
                           <button
                             className="w-full py-2.5 border-2 border-dashed border-gray-100 rounded-lg text-xs font-medium text-gray-400 hover:border-[#3D56A6]/30 hover:text-[#3D56A6] hover:bg-[#3D56A6]/10 transition-all flex items-center justify-center gap-2 mt-2"
                             onClick={()=> setEditingTree((prev)=>({
                               ...prev,
                               systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, components: [...(s.components||[]), { name: "", qty: 1 }] } : s)
                             })) }
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                             Add Component
                           </button>
                        </div>
                      </div>
                    ))}
                    {(editingTree.systems||[]).length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                            <p>No systems added yet.</p>
                            <button className="text-[#3D56A6] font-medium hover:underline mt-1" onClick={()=>{
                              setEditingTree((prev)=>({ ...prev, systems: [...(prev.systems||[]), { name: "", components: [] }] }))
                            }}>Add your first system</button>
                        </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenTreeId(null)}>Cancel</button>
                <button
                   className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                   onClick={async ()=>{
                    const next = boms.map((x)=> x.id===openTreeId ? { ...x, productTree: editingTree, product: editingTree.product || "Untitled", version: editingTree.version || x.version || "", type: editingTree.type || x.type || "" } : x)
                    setAndPersist(next)
                    try {
                      const bom = next.find((x)=>x.id===openTreeId) || {}
                      const payload = {
                        product: editingTree.product || "Untitled",
                        version: editingTree.version || "",
                        type: editingTree.type || "",
                        systems: (Array.isArray(editingTree.systems) ? editingTree.systems : []).map(s => ({
                          name: s.name || "",
                          components: (Array.isArray(s.components) ? s.components : []).map(c => ({
                            name: c.name || "",
                            qty: Number(c.qty) || 0
                          }))
                        }))
                      }
                      const headers = { "Content-Type": "application/json" }
                      const res = await fetch(`${API_BASE_URL}/api/bom/import/`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(payload)
                      }).catch(()=>null)
                      if (!res || !res.ok) {
                        const msg = res ? await res.text().catch(()=> "") : ""
                        alert(`Failed to save BOM: ${res ? res.status : 'network'} ${msg}`)
                      } else {
                        await reloadBoms()
                      }
                    } catch {}
                    setOpenTreeId(null)
                   }}
                >
                   Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={viewingPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button 
              className="absolute -top-4 -right-4 bg-white text-black rounded-full p-1 shadow-lg hover:bg-gray-100"
              onClick={() => setViewingPhoto(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BOMPage />
  </React.StrictMode>
)
