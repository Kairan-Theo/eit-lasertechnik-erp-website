import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

function BOMPage() {
  const [boms, setBoms] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("mfgBOMs") || "[]") } catch { return [] }
  })
  const [openTreeId, setOpenTreeId] = React.useState(null)
  const [editingTree, setEditingTree] = React.useState({ product: "", systems: [] })
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
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-purple-700 text-white hover:bg-purple-800"
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
                      <div className="space-y-1">
                        <button
                          className="text-[#3D56A6] hover:underline font-medium"
                          onClick={()=>{
                            setOpenTreeId(b.id)
                            const pt = b.productTree
                            if (pt && !Array.isArray(pt)) {
                              const systems = (pt.systems||[]).map((s)=>({
                                name: s.name || "",
                                components: (s.components||[]).map((c)=>({ name: c.name || "", qty: Number(c.qty)||1 }))
                              }))
                              if (!systems.length && (pt.components||[]).length) {
                                const first = { name: b.product || "", components: (pt.components||[]).map((c)=>({ name: c.name || "", qty: Number(c.qty)||1 })) }
                                setEditingTree({ product: b.product || "", systems: [first] })
                              } else {
                                setEditingTree({ product: b.product || "", systems })
                              }
                            } else if (Array.isArray(pt)) {
                              const systems = (pt||[]).map((s)=>({
                                name: s.system || "",
                                components: (s.components||[]).map((c)=>({ name: c.name || "", qty: Number(c.qty)||1 }))
                              }))
                              setEditingTree({ product: b.product || "", systems })
                            } else {
                              setEditingTree({ product: b.product || "", systems: [] })
                            }
                          }}
                          title="Edit product tree"
                        >
                          {b.product || "Untitled"}
                        </button>
                        {(() => {
                          const pt = b.productTree
                          const systems = pt && !Array.isArray(pt)
                            ? (pt.systems||[])
                            : Array.isArray(pt)
                              ? (pt||[]).map((s)=>({ name: s.system||"", components: s.components||[] }))
                              : []
                          if (!systems.length) return null
                          return (
                            <div className="text-xs text-gray-700">
                              {systems.map((sys, i)=>(
                                <div key={`s${i}`} className="pl-3">
                                  <span className="text-gray-500">↳</span> <span className="text-gray-800">{sys.name || "Untitled"}</span>
                                  {(sys.components||[]).map((c, j)=>(
                                    <div key={`c${i}-${j}`} className="pl-3">
                                      <span className="text-gray-500">•</span> <span className="text-gray-800">{c.name || "Untitled"}</span> <span className="text-gray-500">({Number(c.qty)||0})</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
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
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Product</div>
                    <input value={newBom.product} onChange={(e)=>setNewBom({...newBom, product:e.target.value})} placeholder="Product name" className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Version</div>
                    <input value={newBom.version} onChange={(e)=>setNewBom({...newBom, version:e.target.value})} placeholder="Version" className="w-full rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Type</div>
                    <select value={newBom.type} onChange={(e)=>setNewBom({...newBom, type:e.target.value})} className="w-full rounded-md border border-gray-300 px-2 py-1">
                      <option value="Manufacture">Manufacture</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">Systems</div>
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={()=> setNewBom((prev)=> ({ ...prev, systems: [...(prev.systems||[]), { name: "", components: [] }] })) }
                      title="+ Add system"
                    >
                      + Add system
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(newBom.systems||[]).map((sys, si)=>(
                      <div key={si} className="border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-700">System</span>
                          <input
                            value={sys.name}
                            onChange={(e)=>{
                              const v = e.target.value
                              setNewBom((prev)=> ({
                                ...prev,
                                systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, name: v } : s)
                              }))
                            }}
                            className="w-72 rounded-md border border-gray-300 px-2 py-1"
                            placeholder="System name"
                          />
                          <button
                            className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={()=> setNewBom((prev)=> ({ ...prev, systems: (prev.systems||[]).filter((_, i)=> i!==si) })) }
                            title="Remove system"
                          >
                            Delete
                          </button>
                        </div>
                        {(sys.components||[]).map((c, ci)=>(
                          <div key={ci} className="grid grid-cols-[140px_1fr_100px_80px] items-center gap-3">
                            <div className="text-sm text-gray-700">Component</div>
                            <input
                              value={c.name}
                              onChange={(e)=>{
                                const v = e.target.value
                                setNewBom((prev)=> ({
                                  ...prev,
                                  systems: (prev.systems||[]).map((s, i)=> {
                                    if (i!==si) return s
                                    return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, name: v } : cc) }
                                  })
                                }))
                              }}
                              className="w-full rounded-md border border-gray-300 px-2 py-1"
                              placeholder="Component name"
                            />
                            <div className="text-sm text-gray-700">Qty</div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={c.qty}
                              onChange={(e)=>{
                                const v = Math.max(0, Math.floor(Number(e.target.value||0)))
                                setNewBom((prev)=> ({
                                  ...prev,
                                  systems: (prev.systems||[]).map((s, i)=> {
                                    if (i!==si) return s
                                    return { ...s, components: (s.components||[]).map((cc, j)=> j===ci ? { ...cc, qty: v } : cc) }
                                  })
                                }))
                              }}
                              className="w-20 rounded-md border border-gray-300 px-2 py-1"
                            />
                            <button
                              className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                              onClick={()=> setNewBom((prev)=> ({
                                ...prev,
                                systems: (prev.systems||[]).map((s, i)=> {
                                  if (i!==si) return s
                                  return { ...s, components: (s.components||[]).filter((_, j)=> j!==ci) }
                                })
                              })) }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <div>
                          <button
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={()=> setNewBom((prev)=> ({
                              ...prev,
                              systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, components: [...(s.components||[]), { name: "", qty: 1 }] } : s)
                            })) }
                          >
                            + Add component
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowNew(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-800"
                  onClick={()=>{
                    const o = { id: Date.now(), product: newBom.product || "Untitled", version: newBom.version || "", type: newBom.type || "Manufacture", productTree: { product: newBom.product || "Untitled", systems: (newBom.systems||[]).map((s)=>({ name: s.name || "", components: (s.components||[]).map((c)=>({ name: c.name || "", qty: Number(c.qty)||0 })) })) } }
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
              <div className="p-4 space-y-4">
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Product</span>
                    <input
                      value={editingTree.product}
                      onChange={(e)=> setEditingTree((prev)=>({ ...prev, product: e.target.value })) }
                      className="w-96 rounded-md border border-gray-300 px-2 py-1"
                      placeholder="Product name"
                    />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">Systems</div>
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={()=>{
                        setEditingTree((prev)=>({ ...prev, systems: [...(prev.systems||[]), { name: "", components: [] }] }))
                      }}
                      title="+ Add system"
                    >
                      + Add system
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editingTree.systems||[]).map((sys, si)=>(
                      <div key={si} className="border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-700">System</span>
                          <input
                            value={sys.name}
                            onChange={(e)=>{
                              const v = e.target.value
                              setEditingTree((prev)=>({
                                ...prev,
                                systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, name: v } : s)
                              }))
                            }}
                            className="w-72 rounded-md border border-gray-300 px-2 py-1"
                            placeholder="System name"
                          />
                          <button
                            className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={()=> setEditingTree((prev)=>({ ...prev, systems: (prev.systems||[]).filter((_, i)=> i!==si) })) }
                            title="Remove system"
                          >
                            Delete
                          </button>
                        </div>
                        {(sys.components||[]).map((c, ci)=>(
                          <div key={ci} className="grid grid-cols-[140px_1fr_100px_80px] items-center gap-3">
                            <div className="text-sm text-gray-700">Component</div>
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
                              className="w-full rounded-md border border-gray-300 px-2 py-1"
                              placeholder="Component name"
                            />
                            <div className="text-sm text-gray-700">Qty</div>
                            <input
                              type="number"
                              min="0"
                              step="1"
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
                              className="w-20 rounded-md border border-gray-300 px-2 py-1"
                            />
                            <button
                              className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                              onClick={()=> setEditingTree((prev)=>({
                                ...prev,
                                systems: (prev.systems||[]).map((s, i)=> {
                                  if (i!==si) return s
                                  return { ...s, components: (s.components||[]).filter((_, j)=> j!==ci) }
                                })
                              })) }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <div>
                          <button
                            className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={()=> setEditingTree((prev)=>({
                              ...prev,
                              systems: (prev.systems||[]).map((s, i)=> i===si ? { ...s, components: [...(s.components||[]), { name: "", qty: 1 }] } : s)
                            })) }
                          >
                            + Add component
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenTreeId(null)}>Cancel</button>
                <button
                   className="px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-800"
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
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BOMPage />
  </React.StrictMode>,
)
