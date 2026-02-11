import React from "react"
import { Plus, Trash2, ChevronRight, ChevronDown, Save, X, Edit2 } from "lucide-react"
import { API_BASE_URL } from "../config"

// =================================================================================================
// Sub-component: Specification List
// Handles adding/removing specifications using a multiline textarea box with Save/Edit/Delete modes.
// =================================================================================================
function SpecificationList({ specs, onChange }) {
  // isEditing: Controls whether the textarea (edit mode) or the list (view mode) is shown.
  // Initialize to false unless there are no specs, but let's stick to explicit user action for consistency.
  const [isEditing, setIsEditing] = React.useState(false)
  
  // text: Local state to hold the textarea content before saving.
  // Initialized from the 'specs' prop, joining array items with newlines.
  const [text, setText] = React.useState(specs.join("\n"))

  // Effect to sync local text state when specs prop changes externally (and we are not editing)
  React.useEffect(() => {
    if (!isEditing) {
      setText(specs.join("\n"))
    }
  }, [specs, isEditing])

  // handleSave: Persists the changes to the parent component.
  const handleSave = () => {
    // Split the text by newline characters to create the array of specifications.
    // trim() cleans up whitespace, and filter() removes empty lines.
    const newSpecs = text.split("\n").map(line => line.trim()).filter(line => line !== "")
    onChange(newSpecs)
    setIsEditing(false) // Switch back to view mode
  }

  // handleDelete: Clears all specifications after confirmation.
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete all specifications?")) {
      onChange([]) // Clear the parent state
      setText("")  // Clear the local text state
      // Switch to edit mode so the user can immediately start typing new ones if they want,
      // or they can just leave it empty.
      setIsEditing(true) 
    }
  }

  // Render Edit Mode (Textarea)
  if (isEditing) {
    return (
      <div className="space-y-3 mt-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specifications</div>
        <div className="space-y-2">
          {/* Multiline textarea for easy entry of multiple specifications */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[120px]"
            placeholder="Enter specifications (one per line)..."
          />
          <div className="flex gap-2">
            {/* Save Button */}
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            >
              <Save size={14} /> Save
            </button>
            {/* Cancel Button - Reverts changes and exits edit mode */}
            <button 
              onClick={() => { setIsEditing(false); setText(specs.join("\n")); }}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render View Mode (List display)
  return (
    <div className="space-y-3 mt-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specifications</div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
        {/* Display specs as a bulleted list or a placeholder if empty */}
        {specs.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {specs.map((spec, i) => (
              <li key={i}>{spec}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 italic">No specifications added.</p>
        )}
        
        {/* Action Buttons: Edit and Delete */}
        <div className="flex gap-3 mt-4">
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Edit2 size={14} /> Edit
          </button>
          {specs.length > 0 && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 hover:underline"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// =================================================================================================
// Sub-component: System Child Products Manager
// Handles adding/removing child products for a specific System.
// =================================================================================================
function ChildProductsManager({ products, onChange, onSync }) {
  const addProduct = () => {
    const next = [
      ...products,
      { id: Date.now(), name: "", specifications: [] }
    ]
    onChange(next)
    if (onSync) onSync()
  }

  const updateProduct = (index, field, value) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    onChange(newProducts)
    if (onSync) onSync()
  }

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index)
    onChange(newProducts)
    if (onSync) onSync()
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-sm font-bold text-gray-700 mb-3">Child Products</h4>
      
      {products.length === 0 && (
        <div className="text-sm text-gray-400 italic mb-3">No child products added.</div>
      )}

      <div className="space-y-4">
        {products.map((prod, i) => (
          <div key={prod.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm relative group">
            <button 
                onClick={() => removeProduct(i)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
            
            <div className="mb-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Name</label>
                <input
                    type="text"
                    value={prod.name}
                    onChange={(e) => updateProduct(i, "name", e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Sub-module A"
                />
            </div>

            <SpecificationList 
                specs={prod.specifications} 
                onChange={(newSpecs) => updateProduct(i, "specifications", newSpecs)} 
            />
          </div>
        ))}
      </div>

      <button 
        onClick={addProduct}
        className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
      >
        <Plus size={16} /> Add Child Product
      </button>
    </div>
  )
}

// =================================================================================================
// Tab Component: System Tab
// =================================================================================================
function SystemTab() {
  const [systems, setSystems] = React.useState([])
  const [selectedIds, setSelectedIds] = React.useState([])
  const timers = React.useRef({})
  const token = React.useMemo(() => localStorage.getItem("authToken"), [])
  const headers = React.useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Token ${token}` } : {})
  }), [token])

  const toArray = (s) => String(s || "").split("\n").map(x => x.trim()).filter(Boolean)
  const toText = (arr) => Array.isArray(arr) ? arr.join("\n") : ""

  const refresh = React.useCallback(async () => {
    try {
      const [sysRes, childRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pd_systems/`, { headers }),
        fetch(`${API_BASE_URL}/api/pd_system_childproducts/`, { headers }),
      ])
      if (!sysRes.ok) return
      const sysData = await sysRes.json()
      const childData = childRes.ok ? await childRes.json() : []
      const grouped = {}
      childData.forEach(c => {
        const sid = c.system
        if (!grouped[sid]) grouped[sid] = []
        grouped[sid].push({
          id: c.id,
          name: c.name || "",
          specifications: toArray(c.specification || ""),
          api: true,
        })
      })
      const mapped = sysData.map(s => ({
        id: s.id,
        name: s.name || "",
        description: s.description || "",
        specifications: toArray(s.specification || ""),
        products: grouped[s.id] || [],
        expanded: false,
        api: true,
      }))
      setSystems(mapped)
    } catch {}
  }, [headers])

  React.useEffect(() => { refresh() }, [refresh])

  const toggleExpand = (id) => {
    setSystems(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s))
  }

  const addSystem = () => {
    setSystems(prev => ([
      ...prev,
      { id: Date.now(), name: "", description: "", specifications: [], products: [], expanded: true, api: false }
    ]))
  }

  const updateSystem = (id, field, value) => {
    let nextSys
    setSystems(prev => prev.map(s => {
      if (s.id === id) {
        nextSys = { ...s, [field]: value }
        return nextSys
      }
      return s
    }))
    if (nextSys) {
      if (timers.current[id]) clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => saveSystem(nextSys), 500)
    }
  }

  const removeSystem = (id) => {
    if (window.confirm("Are you sure you want to delete this system?")) {
      const sys = systems.find(s => s.id === id)
      ;(async () => {
        try {
          if (sys?.api) {
            await fetch(`${API_BASE_URL}/api/pd_systems/${id}/`, { method: "DELETE", headers })
          }
        } catch {}
        setSystems(prev => prev.filter(s => s.id !== id))
        setSelectedIds(prev => prev.filter(sid => sid !== id))
      })()
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === systems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(systems.map(s => s.id))
    }
  }

  const saveSystem = async (sys) => {
    const payload = {
      name: sys.name,
      description: sys.description,
      specification: toText(sys.specifications),
      product_total: Array.isArray(sys.products) ? sys.products.length : 0,
    }
    let systemId = sys.id
    try {
      if (sys.api) {
        const res = await fetch(`${API_BASE_URL}/api/pd_systems/${systemId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        })
        if (!res.ok) return
      } else {
        const res = await fetch(`${API_BASE_URL}/api/pd_systems/`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })
        if (!res.ok) return
        const d = await res.json()
        systemId = d.id
        setSystems(prev => prev.map(s => s.id === sys.id ? { ...s, id: d.id, api: true } : s))
      }
      const childRes = await fetch(`${API_BASE_URL}/api/pd_system_childproducts/`, { headers })
      const allChildren = childRes.ok ? await childRes.json() : []
      const existingForSystem = allChildren.filter(c => c.system === systemId)
      const existingIds = new Set(existingForSystem.map(c => c.id))
      const localIds = new Set((sys.products || []).filter(p => p.api).map(p => p.id))
      const toDelete = [...existingIds].filter(id => !localIds.has(id))
      await Promise.all(toDelete.map(id => fetch(`${API_BASE_URL}/api/pd_system_childproducts/${id}/`, { method: "DELETE", headers })))
      await Promise.all((sys.products || []).map(async (p) => {
        const childPayload = { name: p.name, specification: toText(p.specifications), system: systemId }
        if (p.api) {
          await fetch(`${API_BASE_URL}/api/pd_system_childproducts/${p.id}/`, { method: "PATCH", headers, body: JSON.stringify(childPayload) })
        } else {
          const res = await fetch(`${API_BASE_URL}/api/pd_system_childproducts/`, { method: "POST", headers, body: JSON.stringify(childPayload) })
          if (res.ok) {
            const d = await res.json()
            setSystems(prev => prev.map(s => s.id === systemId ? {
              ...s,
              products: s.products.map(x => x === p ? { ...x, id: d.id, api: true } : x)
            } : s))
          }
        }
      }))
    } catch {}
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={addSystem}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add System
        </button>
      </div>

      <div className="overflow-x-auto border rounded-xl shadow-sm">
        <table className="min-w-full text-sm bg-white">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="p-3 w-10 text-center">
                 <input 
                    type="checkbox" 
                    checked={systems.length > 0 && selectedIds.length === systems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]"
                 />
              </th>
              <th className="p-3 w-10 text-center font-semibold">Index</th>
              <th className="p-3 w-10"></th>
              <th className="p-3 text-left">System Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-center">Product Total</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {systems.map((sys, index) => (
              <React.Fragment key={sys.id}>
                {/* Main Row */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(sys.id)}
                        onChange={() => toggleSelect(sys.id)}
                        className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]"
                    />
                  </td>
                  <td className="p-3 text-center text-gray-500">{index + 1}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleExpand(sys.id)} className="text-gray-400 hover:text-blue-600">
                      {sys.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={sys.name}
                      onChange={(e) => updateSystem(sys.id, "name", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                      placeholder="System Name"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={sys.description}
                      onChange={(e) => updateSystem(sys.id, "description", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                      placeholder="Description"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">
                        {sys.products.length}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => saveSystem(sys)} className="text-gray-500 hover:text-green-600 transition-colors" title="Save">
                        <Save size={16} />
                      </button>
                      <button onClick={() => removeSystem(sys.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {sys.expanded && (
                  <tr className="bg-gray-50/50">
                    <td colSpan={7} className="p-4 pl-12 border-b">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: System Specifications */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                             System Specifications
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                             <SpecificationList 
                                specs={sys.specifications} 
                                onChange={(newSpecs) => updateSystem(sys.id, "specifications", newSpecs)} 
                             />
                          </div>
                        </div>

                        {/* Right: Child Products */}
                        <div>
                           <ChildProductsManager 
                                products={sys.products}
                                onChange={(newProds) => updateSystem(sys.id, "products", newProds)}
                                onSync={() => saveSystem(sys)}
                           />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {systems.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No systems defined. Click "Add System" to start.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =================================================================================================
// Tab Component: Flat Product Tab (Reusable for Machine, Wire, Spare Part, Service)
// Handles flat list of items with specifications (no child products).
// =================================================================================================
function FlatProductTab({ type }) {
  // type: "Machine" | "Wire" | "Spare Part" | "Service"
  const [items, setItems] = React.useState([])
  const [selectedIds, setSelectedIds] = React.useState([])
  const endpoint = React.useMemo(() => {
    const map = {
      "Machine": "pd_machines",
      "Wire": "pd_wires",
      "Spare Part": "pd_spareparts",
      "Service": "pd_services",
    }
    return map[type]
  }, [type])
  const token = React.useMemo(() => localStorage.getItem("authToken"), [])
  const headers = React.useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Token ${token}` } : {})
  }), [token])

  const toArray = (s) => String(s || "").split("\n").map(x => x.trim()).filter(Boolean)
  const toText = (arr) => Array.isArray(arr) ? arr.join("\n") : ""

  const refresh = React.useCallback(async () => {
    if (!endpoint) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/${endpoint}/`, { headers })
      if (!res.ok) return
      const data = await res.json()
      const mapped = data.map(d => ({
        id: d.id,
        name: d.name || "",
        description: d.description || "",
        specifications: toArray(d.specification || ""),
        expanded: false,
        api: true,
      }))
      setItems(mapped)
    } catch {}
  }, [endpoint, headers])

  React.useEffect(() => { refresh() }, [refresh])

  const toggleExpand = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i))
  }

  const addItem = () => {
    setItems(prev => ([
      ...prev,
      { id: Date.now(), name: "", description: "", specifications: [], expanded: true, api: false }
    ]))
  }

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
    const item = items.find(i => i.id === id)
    if (!item) return
    const payload = {
      name: field === "name" ? value : item.name,
      description: field === "description" ? value : item.description,
      specification: field === "specifications" ? toText(value) : toText(item.specifications),
    }
    ;(async () => {
      try {
        if (item.api) {
          await fetch(`${API_BASE_URL}/api/${endpoint}/${item.id}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          })
        } else {
          const res = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          })
          if (res.ok) {
            const d = await res.json()
            setItems(prev => prev.map(i => i.id === id ? { ...i, id: d.id, api: true } : i))
          }
        }
      } catch {}
    })()
  }

  const removeItem = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const item = items.find(i => i.id === id)
      ;(async () => {
        try {
          if (item?.api) {
            await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
              method: "DELETE",
              headers,
            })
          }
        } catch {}
        setItems(prev => prev.filter(i => i.id !== id))
        setSelectedIds(prev => prev.filter(sid => sid !== id))
      })()
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map(i => i.id))
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2f5c] transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add {type}
        </button>
      </div>

      <div className="overflow-x-auto border rounded-xl shadow-sm">
        <table className="min-w-full text-sm bg-white">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="p-3 w-10 text-center">
                 <input 
                    type="checkbox" 
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]"
                 />
              </th>
              <th className="p-3 w-10 text-center font-semibold">Index</th>
              <th className="p-3 w-10"></th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]"
                    />
                  </td>
                  <td className="p-3 text-center text-gray-500">{index + 1}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleExpand(item.id)} className="text-gray-400 hover:text-blue-600">
                      {item.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                      placeholder={`${type} Name`}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                      placeholder="Description"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
                {/* Expanded Details Row */}
                {item.expanded && (
                  <tr className="bg-gray-50/50">
                    <td colSpan={6} className="p-4 pl-12 border-b">
                       <h4 className="text-sm font-bold text-gray-800 mb-2">Specifications</h4>
                       <div className="bg-white p-4 rounded-lg border border-gray-200 max-w-2xl">
                          <SpecificationList 
                             specs={item.specifications} 
                             onChange={(newSpecs) => updateItem(item.id, "specifications", newSpecs)} 
                          />
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {items.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No {type.toLowerCase()}s defined. Click "Add {type}" to start.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =================================================================================================
// Main Component: ProductDetails
// =================================================================================================
export default function ProductDetails() {
  // Tabs: Machine, System, Wire, Spare Part, Service
  const [activeTab, setActiveTab] = React.useState("machine") 

  const tabs = [
    { id: "machine", label: "Machine" },
    { id: "system", label: "System" },
    { id: "wire", label: "Wire" },
    { id: "spare-part", label: "Spare Part" },
    { id: "service", label: "Service" },
  ]

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Product Details Management</h2>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(tab => (
           <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                  ? "border-[#2D4485] text-[#2D4485]" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
           >
              {tab.label}
           </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="animate-in fade-in duration-300">
         {activeTab === "system" && <SystemTab />}
         {activeTab === "machine" && <FlatProductTab type="Machine" />}
         {activeTab === "wire" && <FlatProductTab type="Wire" />}
         {activeTab === "spare-part" && <FlatProductTab type="Spare Part" />}
         {activeTab === "service" && <FlatProductTab type="Service" />}
      </div>
    </div>
  )
}
