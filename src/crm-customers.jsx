import React, { useState, useEffect } from "react"
import { API_BASE_URL } from "./config"

export default function CRMCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    industry: "",
    address: "",
    tax_id: ""
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/customers/`, {
        headers: token ? { "Authorization": `Token ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
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
        ? `${API_BASE_URL}/api/customers/${editing.id}/`
        : `${API_BASE_URL}/api/customers/`
      const method = editing ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Token ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setShowModal(false)
        setEditing(null)
        setFormData({ company_name: "", email: "", phone: "", industry: "", address: "", tax_id: "" })
        fetchCustomers()
      } else {
        alert("Failed to save customer")
      }
    } catch (err) {
      alert("Error: " + err.message)
    }
  }

  const handleEdit = (c) => {
    setEditing(c)
    setFormData({
      company_name: c.company_name,
      email: c.email || "",
      phone: c.phone || "",
      industry: c.industry || "",
      address: c.address || "",
      tax_id: c.tax_id || ""
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return
    try {
      const token = localStorage.getItem("authToken")
      await fetch(`${API_BASE_URL}/api/customers/${id}/`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Token ${token}` } : {}
      })
      fetchCustomers()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading customers...</div>

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button 
          onClick={() => { setEditing(null); setFormData({ company_name: "", email: "", phone: "", industry: "", address: "", tax_id: "" }); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b">Company</th>
              <th className="p-4 border-b">Contact Info</th>
              <th className="p-4 border-b">Industry</th>
              <th className="p-4 border-b">Tax ID</th>
              <th className="p-4 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{c.company_name}</td>
                <td className="p-4 text-gray-600">
                  <div className="text-sm">{c.email}</div>
                  <div className="text-xs text-gray-400">{c.phone}</div>
                </td>
                <td className="p-4 text-gray-600">{c.industry || "-"}</td>
                <td className="p-4 text-gray-600 font-mono text-sm">{c.tax_id || "-"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editing ? "Edit Customer" : "New Customer"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                  <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows="3" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
