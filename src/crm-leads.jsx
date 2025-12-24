import React, { useState, useEffect } from "react"
import { API_BASE_URL } from "./config"

const LEAD_STAGES = {
  new: { label: "New", color: "bg-blue-50 border-blue-200 text-blue-700" },
  contacted: { label: "Contacted", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  qualified: { label: "Qualified", color: "bg-purple-50 border-purple-200 text-purple-700" },
  converted: { label: "Converted", color: "bg-green-50 border-green-200 text-green-700" },
  lost: { label: "Lost", color: "bg-gray-50 border-gray-200 text-gray-700" }
}

export default function CRMLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    notes: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      
      const res = await fetch(`${API_BASE_URL}/api/leads/`, { headers })

      if (res.ok) setLeads(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("authToken")
      const url = editing 
        ? `${API_BASE_URL}/api/leads/${editing.id}/`
        : `${API_BASE_URL}/api/leads/`
      const method = editing ? "PUT" : "POST"
      
      const payload = { ...formData }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Token ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        setShowModal(false)
        setEditing(null)
        setFormData({ first_name: "", last_name: "", company: "", email: "", phone: "", source: "", status: "new", notes: "" })
        fetchData()
      } else {
        const err = await res.json()
        alert("Failed: " + JSON.stringify(err))
      }
    } catch (err) {
      alert("Error: " + err.message)
    }
  }

  const handleEdit = (l) => {
    setEditing(l)
    setFormData({
      first_name: l.first_name,
      last_name: l.last_name,
      company: l.company,
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
      notes: l.notes
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete lead?")) return
    try {
      const token = localStorage.getItem("authToken")
      await fetch(`${API_BASE_URL}/api/leads/${id}/`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Token ${token}` } : {}
      })
      fetchData()
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leads...</div>

  // Group by status
  const columns = { new: [], contacted: [], qualified: [], converted: [], lost: [] }
  leads.forEach(l => {
    if (columns[l.status]) columns[l.status].push(l)
  })

  return (
    <div className="p-6 bg-gray-50 min-h-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leads Pipeline</h2>
        <button 
          onClick={() => { setEditing(null); setFormData({ first_name: "", last_name: "", company: "", email: "", phone: "", source: "", status: "new", notes: "" }); setShowModal(true) }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm"
        >
          + New Lead
        </button>
      </div>

      <div className="flex gap-6 min-w-max pb-4">
        {Object.keys(columns).map(status => (
          <div key={status} className="w-80 flex-shrink-0">
            <div className={`mb-3 px-3 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide border ${LEAD_STAGES[status].color}`}>
              {LEAD_STAGES[status].label}
              <span className="float-right bg-white/50 px-2 rounded text-xs py-0.5">{columns[status].length}</span>
            </div>
            <div className="space-y-3">
              {columns[status].map(l => (
                <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800">{l.first_name} {l.last_name}</span>
                    {l.company && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 truncate max-w-[120px]">{l.company}</span>}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {l.email && <div className="truncate">{l.email}</div>}
                    {l.phone && <div>{l.phone}</div>}
                  </div>
                  {l.source && <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block mb-2">{l.source}</div>}
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3 mt-1">
                    <span className="truncate max-w-[150px]">{l.notes || "No notes"}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                      <button onClick={() => handleEdit(l)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline">Del</button>
                    </div>
                  </div>
                </div>
              ))}
              {columns[status].length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editing ? "Edit Lead" : "New Lead"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                    value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                    value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input type="text" placeholder="e.g. Website, Referral" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                    value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows="3" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
