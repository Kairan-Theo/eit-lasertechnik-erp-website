import React, { useState, useEffect } from "react"
import { API_BASE_URL } from "../config"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"

// Component to manage EIT Organizations
// Lists existing organizations and allows adding/editing details
export default function EitManagement() {
  const [eits, setEits] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [isAdding, setIsAdding] = useState(false)

  // Fetch EITs on mount
  useEffect(() => {
    fetchEits()
  }, [])

  const fetchEits = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/eits/`)
      if (res.ok) {
        const data = await res.json()
        setEits(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error("Failed to fetch EITs", e)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this organization?")) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/eits/${id}/`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchEits()
      } else {
        alert("Failed to delete")
      }
    } catch (e) {
      console.error("Delete error", e)
    }
  }

  // Handle save (create or update)
  const handleSave = async () => {
    try {
      const url = isAdding 
        ? `${API_BASE_URL}/api/eits/`
        : `${API_BASE_URL}/api/eits/${editingId}/`
      
      const method = isAdding ? "POST" : "PUT"
      
      // Remove header_image from the payload to avoid "The submitted data was not a file" error
      // when updating existing records that have an image URL string.
      // We are only editing text fields here.
      const { header_image, image_path, ...dataToSend } = formData
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      if (res.ok) {
        setEditingId(null)
        setIsAdding(false)
        setFormData({})
        fetchEits()
      } else {
        const errorData = await res.json()
        console.error("Save failed:", errorData)
        alert("Failed to save: " + JSON.stringify(errorData))
      }
    } catch (e) {
      console.error("Save error", e)
      alert("An error occurred while saving")
    }
  }

  const startEdit = (eit) => {
    setEditingId(eit.id)
    setFormData(eit)
    setIsAdding(false)
  }

  const startAdd = () => {
    setEditingId(null)
    setIsAdding(true)
    setFormData({
      organization_name: "",
      eit_mobile: "000-000-0000",
      eit_telephone: "02-052-9544",
      eit_fax: "02-052-9544",
      // Initialize tax_number to empty string so input is controlled
      tax_number: "",
      address: "1/120 ซอยรามคําแหง 184 \n แขวงมีนบุรี เขตมีนบุรี \n กรุงเทพมหานคร 10510"
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({})
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">EIT Organizations</h2>
        <button 
          onClick={startAdd}
          className="flex items-center gap-2 px-3 py-2 bg-[#2D4485] text-white rounded-lg hover:bg-[#1e2e5c] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b">
                <th className="p-3 text-left">Organization Name</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Telephone</th>
                <th className="p-3 text-left">Fax</th>
                {/* New column: Tax Number placed between Fax and Address */}
                <th className="p-3 text-left">Tax Number</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Add/Edit Row */}
              {(isAdding || editingId) && (
                <tr className="bg-blue-50">
                  <td className="p-3 align-top">
                    <input 
                      className="w-full p-2 border rounded"
                      placeholder="Organization Name"
                      value={formData.organization_name || ""}
                      onChange={e => setFormData({...formData, organization_name: e.target.value})}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <input 
                      className="w-full p-2 border rounded"
                      placeholder="Mobile"
                      value={formData.eit_mobile || ""}
                      onChange={e => setFormData({...formData, eit_mobile: e.target.value})}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <input 
                      className="w-full p-2 border rounded"
                      placeholder="Telephone"
                      value={formData.eit_telephone || ""}
                      onChange={e => setFormData({...formData, eit_telephone: e.target.value})}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <input 
                      className="w-full p-2 border rounded"
                      placeholder="Fax"
                      value={formData.eit_fax || ""}
                      onChange={e => setFormData({...formData, eit_fax: e.target.value})}
                    />
                  </td>
                  {/* Input for Tax Number - sits between Fax and Address */}
                  <td className="p-3 align-top">
                    <input
                      className="w-full p-2 border rounded"
                      placeholder="Tax Number"
                      value={formData.tax_number || ""}
                      onChange={e => setFormData({...formData, tax_number: e.target.value})}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <textarea 
                      className="w-full p-2 border rounded"
                      placeholder="Address"
                      rows={3}
                      value={formData.address || ""}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </td>
                  <td className="p-3 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-2 text-red-600 hover:bg-red-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {eits.map(eit => {
                if (eit.id === editingId) return null // Hide row being edited
                return (
                  <tr key={eit.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{eit.organization_name}</td>
                    <td className="p-3 text-gray-600">{eit.eit_mobile}</td>
                    <td className="p-3 text-gray-600">{eit.eit_telephone}</td>
                    <td className="p-3 text-gray-600">{eit.eit_fax}</td>
                    {/* Display Tax Number value fetched from API */}
                    <td className="p-3 text-gray-600">{eit.tax_number || ""}</td>
                    <td className="p-3 text-gray-600 whitespace-pre-line">{eit.address}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEdit(eit)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(eit.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              
              {eits.length === 0 && !isAdding && (
                <tr>
                  {/* Update colSpan to include new Tax Number column */}
                  <td colSpan={7} className="p-8 text-center text-gray-500">No organizations found. Click "Add Organization" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
