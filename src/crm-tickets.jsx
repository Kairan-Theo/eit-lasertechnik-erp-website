import React, { useState, useEffect } from "react"
import { API_BASE_URL } from "./config"

const TICKET_STAGES = {
  open: { label: "Open", color: "bg-red-50 border-red-200 text-red-700" },
  in_progress: { label: "In Progress", color: "bg-blue-50 border-blue-200 text-blue-700" },
  resolved: { label: "Resolved", color: "bg-green-50 border-green-200 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-50 border-gray-200 text-gray-700" }
}

export default function CRMTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer: "",
    priority: "medium",
    status: "open"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      
      const [ticketRes, custRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tickets/`, { headers }),
        fetch(`${API_BASE_URL}/api/customers/`, { headers })
      ])

      if (ticketRes.ok) setTickets(await ticketRes.json())
      if (custRes.ok) setCustomers(await custRes.json())
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
        ? `${API_BASE_URL}/api/tickets/${editing.id}/`
        : `${API_BASE_URL}/api/tickets/`
      const method = editing ? "PUT" : "POST"
      
      const payload = { ...formData, ticket_id: editing ? editing.ticket_id : `T-${Date.now()}` } // Simple ID gen

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
        setFormData({ title: "", description: "", customer: "", priority: "medium", status: "open" })
        fetchData()
      } else {
        const err = await res.json()
        alert("Failed: " + JSON.stringify(err))
      }
    } catch (err) {
      alert("Error: " + err.message)
    }
  }

  const handleEdit = (t) => {
    setEditing(t)
    setFormData({
      title: t.title,
      description: t.description,
      customer: t.customer,
      priority: t.priority,
      status: t.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete ticket?")) return
    try {
      const token = localStorage.getItem("authToken")
      await fetch(`${API_BASE_URL}/api/tickets/${id}/`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Token ${token}` } : {}
      })
      fetchData()
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tickets...</div>

  // Group by status
  const columns = { open: [], in_progress: [], resolved: [], closed: [] }
  tickets.forEach(t => {
    if (columns[t.status]) columns[t.status].push(t)
  })

  return (
    <div className="p-6 bg-gray-50 min-h-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Support Tickets</h2>
        <button 
          onClick={() => { setEditing(null); setFormData({ title: "", description: "", customer: "", priority: "medium", status: "open" }); setShowModal(true) }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm"
        >
          + New Ticket
        </button>
      </div>

      <div className="flex gap-6 min-w-max pb-4">
        {Object.keys(columns).map(status => (
          <div key={status} className="w-80 flex-shrink-0">
            <div className={`mb-3 px-3 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide border ${TICKET_STAGES[status].color}`}>
              {TICKET_STAGES[status].label}
              <span className="float-right bg-white/50 px-2 rounded text-xs py-0.5">{columns[status].length}</span>
            </div>
            <div className="space-y-3">
              {columns[status].map(t => (
                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-gray-400">#{t.ticket_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{t.priority}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">{t.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{t.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3 mt-1">
                    <span>{t.customer_name || "Unknown Customer"}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                      <button onClick={() => handleEdit(t)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">Del</button>
                    </div>
                  </div>
                </div>
              ))}
              {columns[status].length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  No tickets
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
              <h3 className="font-bold text-lg text-gray-800">{editing ? "Edit Ticket" : "New Ticket"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select required className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white"
                  value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                  <option value="">Select Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white"
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="4" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Save Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
