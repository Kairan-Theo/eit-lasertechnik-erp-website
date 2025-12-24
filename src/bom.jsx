import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

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
    try { return JSON.parse(localStorage.getItem("mfgBOMs") || "[]") } catch { return [] }
  })
  const [openTreeId, setOpenTreeId] = React.useState(null)
  const [editingTree, setEditingTree] = React.useState({ product: "", systems: [] })
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
  React.useEffect(() => {
    if (!boms.length) {
      const seed = [
        { id: 1, name: "LCM Standard", product: "Laser Cladding Machine", version: "v1", type: "Manufacture", active: true },
        { id: 2, name: "LWM Standard", product: "Laser Welding Machine", version: "v2", type: "Manufacture", active: true },
        { id: 3, name: "Cake BOM", product: "Cake", version: "v1", type: "Manufacture", active: false },
      ]
      setBoms(seed)
      localStorage.setItem("mfgBOMs", JSON.stringify(seed))
    }
  }, [])
  const setAndPersist = (next) => { setBoms(next); localStorage.setItem("mfgBOMs", JSON.stringify(next)) }

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

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bill of Materials</h1>
              <button
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                title="New BOM"
                onClick={() => setShowNew(true)}
              >
                New BOM
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Manufacturing Order"
                onClick={() => window.location.href = "/manufacturing.html"}
              >
                Manufacturing Order
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Component"
                onClick={() => window.location.href = "/products.html"}
              >
                Component
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Version</th>
                  <th className="p-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {boms.map((b)=> (
                  <tr key={b.id} className="border-t">
                    <td className="p-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-[#3D56A6] hover:underline font-medium flex items-center gap-2 text-lg"
                            onClick={() => toggleExpand(b.id)}
                            title="Toggle details"
                          >
                            {b.productTree?.photo && <img src={b.productTree.photo} className="h-8 w-8 rounded object-cover border" />}
                            <span>{b.product || "Untitled"}</span>
                            <span className="text-gray-400 text-xs">{expandedIds.has(b.id) ? "▲" : "▼"}</span>
                          </button>
                          
                          <button
                            className="text-gray-500 hover:text-[#3D56A6] p-1 rounded-full hover:bg-gray-100 transition-colors"
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
                                  setEditingTree({ product: b.product || "", photo: pt.photo, systems: [first] })
                                } else {
                                  setEditingTree({ product: b.product || "", photo: pt.photo, systems })
                                }
                              } else if (Array.isArray(pt)) {
                                const systems = (pt || []).map((s) => ({
                                  name: s.system || "",
                                  components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 }))
                                }))
                                setEditingTree({ product: b.product || "", systems })
                              } else {
                                setEditingTree({ product: b.product || "", systems: [] })
                              }
                            }}
                            title="Edit Settings"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                          <button
                            className="text-gray-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm("Are you sure you want to delete this product?")) {
                                const next = boms.filter((x) => x.id !== b.id)
                                setAndPersist(next)
                              }
                            }}
                            title="Delete Product"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>

                        {expandedIds.has(b.id) && (() => {
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
                                .mm-branch:only-child::before { width: 2rem; } /* Keep horizontal line */
                              `}</style>
                              
                              <div className="flex items-center p-4 min-w-max">
                                {/* Product Node (Root) */}
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
                                          // Initialize editing tree same as the edit button
                                          const systems = (pt && !Array.isArray(pt)) ? (pt.systems || []).map((s) => ({
                                            name: s.name || "",
                                            photo: s.photo,
                                            components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1, photo: c.photo }))
                                          })) : (pt || []).map((s) => ({
                                            name: s.system || "",
                                            components: (s.components || []).map((c) => ({ name: c.name || "", qty: Number(c.qty) || 1 }))
                                          }))
                                          
                                          if (pt && !Array.isArray(pt)) {
                                            setEditingTree({ product: b.product || "", photo: pt.photo, systems })
                                          } else {
                                            setEditingTree({ product: b.product || "", systems })
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

                                {/* Connector to Systems */}
                                {systems.length > 0 && <div className="w-8 h-px bg-gray-200 flex-shrink-0"></div>}

                                {/* Systems List */}
                                {systems.length > 0 && (
                                  <div className="flex flex-col justify-center">
                                    {systems.map((sys, i) => (
                                      <div key={`s${i}`} className="mm-branch flex items-center py-2">
                                        {/* System Node */}
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
                                                  // Open main editor for now
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
                                                    setEditingTree({ product: b.product || "", photo: pt.photo, systems: systemsData })
                                                  } else {
                                                    setEditingTree({ product: b.product || "", systems: systemsData })
                                                  }
                                                }}
                                                onDelete={() => deleteSystem(b.id, i)}
                                              />
                                           </div>
                                        </div>

                                        {/* Connector to Components */}
                                        {(sys.components || []).length > 0 && <div className="w-8 h-px bg-gray-200 flex-shrink-0"></div>}

                                        {/* Components List */}
                                        {(sys.components || []).length > 0 && (
                                           <div className="flex flex-col justify-center">
                                              {(sys.components || []).map((c, j) => (
                                                 <div key={`c${i}-${j}`} className="mm-branch flex items-center py-1">
                                                    {/* Component Node */}
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
                                                                setEditingTree({ product: b.product || "", photo: pt.photo, systems: systemsData })
                                                              } else {
                                                                setEditingTree({ product: b.product || "", systems: systemsData })
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
                      </div>
                    </td>
                    <td className="p-2"><span className="text-gray-700">{b.version}</span></td>
                    <td className="p-2"><span className="text-gray-700">{b.type}</span></td>
                  </tr>
                ))}
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
                    const next = [o, ...boms]
                    setAndPersist(next)
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
                   onClick={()=>{
                    const next = boms.map((x)=> x.id===openTreeId ? { ...x, productTree: editingTree, product: editingTree.product || "Untitled" } : x)
                    setAndPersist(next)
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
      <Footer />
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
  </React.StrictMode>,
)
