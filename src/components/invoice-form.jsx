import React from "react"
import { Plus, Trash } from "lucide-react"
import { Combobox } from "./combobox"
import { CustomerCombobox } from "./customer-combobox"
import { DateField } from "./ui/date-field"
import { THBText } from "../utils/currency"
// Comment: Import API base to hydrate customer fields (including Branch) by ID selection
import { API_BASE_URL } from "../config"

export function InvoiceForm({ inv }) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">Code</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
               <input value={inv.details.number || ""} onChange={(e) => inv.setDetails({ ...inv.details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Invoice number" />
             </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <DateField value={inv.details.date || ""} onChange={(val) => inv.setDetails({ ...inv.details, date: val })} />
            </div>
          </div>
        </div>

        {/* EIT Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">EIT/Einstein organization</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select 
                value={inv.details.eit || ""} 
                onChange={(e) => {
                  const val = e.target.value
                  if (!val) {
                    inv.setDetails({ 
                      ...inv.details, 
                      eit: null, 
                      salesPerson: "", 
                      onBehalfOf: "",
                      eitAddress: "",
                      eitTelephone: "",
                      eitFax: "",
                      eitMobile: ""
                    })
                    return
                  }
                  const selected = inv.eitOptions.find(o => String(o.id) === val)
                  if (selected) {
                    inv.setDetails({ 
                      ...inv.details, 
                      eit: selected.id, 
                      salesPerson: selected.organization_name, 
                      onBehalfOf: selected.organization_name, 
                      eitAddress: selected.address || "", 
                      eitTelephone: selected.eit_telephone || "", 
                      eitFax: selected.eit_fax || "", 
                      eitMobile: selected.eit_mobile || ""
                    })
                  }
                }} 
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
              >
                <option value="">Select Organization</option>
                {inv.eitOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.organization_name}</option>
                ))}
              </select>
             </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={inv.details.eitAddress || ""} onChange={(e) => inv.setDetails({ ...inv.details, eitAddress: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
              <input value={inv.details.eitTelephone || ""} onChange={(e) => inv.setDetails({ ...inv.details, eitTelephone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
              <input value={inv.details.eitFax || ""} onChange={(e) => inv.setDetails({ ...inv.details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
            </div>
           </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
               <CustomerCombobox
                  value={inv.customer?.company || ""}
                  options={inv.customerOptions}
                  onChange={(val) => {
                    // Comment: Match by display label (supports legacy customer_name and current company_name)
                    const match = inv.customerOptions.find(c => (c.customer_name || c.company_name) === val)
                    if (match) {
                      inv.setCustomer({
                        ...(inv.customer || {}),
                        company: val,
                        taxId: match.tax_id || inv.customer?.taxId || "",
                        // Comment: Preserve existing branch here; hydrate branch via onSelect (ID-based)
                        branch: inv.customer?.branch || "",
                        address: match.address || inv.customer?.address || "",
                        telephone: match.phone || inv.customer?.telephone || "",
                        fax: match.fax || match.cus_fax || inv.customer?.fax || "",
                        attn: match.contact || inv.customer?.attn || "",
                        email: match.email || inv.customer?.email || ""
                      })
                    } else {
                      inv.setCustomer({ ...(inv.customer || {}), company: val })
                    }
                  }}
                  // Comment: On actual selection (ID available), fetch canonical Customer to hydrate Branch and other fields
                  onSelect={(payload) => {
                    const option = typeof payload === 'object' && payload !== null 
                      ? payload 
                      : { label: String(payload || ""), value: payload }
                    if (option?.value == null || option.value === "") return
                    fetch(`${API_BASE_URL}/api/customers/${option.value}/`)
                      .then(res => res.ok ? res.json() : null)
                      .then(c => {
                        if (!c) return
                        // Comment: Populate customer top fields including Branch from DB
                        const nextTop = {
                          company: option.label || c.company_name || "",
                          taxId: c.tax_id || "",
                          branch: c.branch || "",
                          address: c.address || "",
                          telephone: c.phone || "",
                          fax: c.cus_fax || "",
                          attn: c.attn || "",
                          email: c.email || ""
                        }
                        // Comment: Fallback Branch from latest Deal when Customer.branch is empty
                        const needsBranchFallback = !String(nextTop.branch || "").trim()
                        if (needsBranchFallback) {
                          fetch(`${API_BASE_URL}/api/deals/`)
                            .then(r => r.ok ? r.json() : [])
                            .then(deals => {
                              const latest = Array.isArray(deals)
                                ? deals.filter(d => String(d.customer) === String(c.id)).sort((a, b) => (b.id || 0) - (a.id || 0))[0]
                                : null
                              const mergedTop = {
                                ...nextTop,
                                branch: nextTop.branch || latest?.branch || ""
                              }
                              inv.setCustomer({ ...(inv.customer || {}), ...mergedTop })
                            })
                            .catch(() => {
                              inv.setCustomer({ ...(inv.customer || {}), ...nextTop })
                            })
                        } else {
                          inv.setCustomer({ ...(inv.customer || {}), ...nextTop })
                        }
                      })
                      .catch(() => {})
                  }}
                />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tax Code</label>
               <input value={inv.customer?.taxId || ""} onChange={(e) => inv.setCustomer({ ...(inv.customer || {}), taxId: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Tax Code" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
               <input value={inv.customer?.branch || ""} onChange={(e) => inv.setCustomer({ ...(inv.customer || {}), branch: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Head Office / Branch No." />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
               <input value={inv.customer?.telephone || ""} onChange={(e) => inv.setCustomer({ ...(inv.customer || {}), telephone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
               <input value={inv.customer?.fax || ""} onChange={(e) => inv.setCustomer({ ...(inv.customer || {}), fax: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
             </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={inv.customer?.address || ""} onChange={(e) => inv.setCustomer({ ...(inv.customer || {}), address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
             </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <input 
                value={inv.details.paymentType || ""} 
                onChange={(e) => inv.setDetails({ ...inv.details, paymentType: e.target.value })} 
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                placeholder="Payment Type" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <DateField value={inv.details.dueDate || ""} onChange={(val) => inv.setDetails({ ...inv.details, dueDate: val })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO No.</label>
              <Combobox 
                value={inv.details.poNo || ""} 
                onChange={(val) => inv.setDetails({ ...inv.details, poNo: val })} 
                options={inv.poOptions} 
                placeholder="PO Number" 
              />
            </div>
          </div>
        </div>

        {/* Description Box (Items) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#2D4485]">Invoice Description</h2>
             <button onClick={inv.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Item</span>
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 text-[#2D4485] uppercase text-xs font-bold">
                 <tr>
                   <th className="p-3 border-b w-16">No.</th>
                   <th className="p-3 border-b">Description</th>
                   <th className="p-3 border-b">Sales (ex. Vat)</th>
                   <th className="p-3 border-b">Quantity</th>
                   <th className="p-3 border-b">Unit</th>
                  <th className="p-3 border-b text-right">Amount</th>
                  <th className="p-3 border-b w-12"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {inv.items.map((it, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                      <td className="p-3 text-center text-sm text-gray-700">
                        {i + 1}
                      </td>
                      <td className="p-3">
                        <textarea 
                          value={it.description || ""} 
                          onChange={(e) => inv.updateItem(i, "description", e.target.value)} 
                          className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none resize-y min-h-[32px]"
                          rows={1}
                          placeholder="Description"
                        />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" step="0.01" value={it.price || ""} onChange={(e) => inv.updateItem(i, "price", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" value={it.qty || ""} onChange={(e) => inv.updateItem(i, "qty", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                      </td>
                      <td className="p-3">
                        <input value={it.unit || ""} onChange={(e) => inv.updateItem(i, "unit", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                      </td>
                      <td className="p-3 text-right text-sm text-gray-700">
                        {((Number(it.qty) || 0) * (Number(it.price) || 0)).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => inv.removeItem(i)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>

           <div className="flex justify-end mt-4">
              <div className="w-auto min-w-[250px] space-y-2">
                <div className="flex justify-between text-sm gap-8">
                  <span className="text-gray-600">Net amount</span>
                  <span className="font-medium text-gray-900">{inv.subtotal.toFixed(2)} {inv.details.currency}</span>
                </div>
                <div className="flex justify-between text-sm gap-8">
                  <span className="text-gray-600">Vat 7%</span>
                  <span className="font-medium text-gray-900">{inv.taxTotal.toFixed(2)} {inv.details.currency}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 gap-8">
                  <span className="font-bold text-gray-900">Total of sales</span>
                  <span className="font-bold text-[#2D4485]">{inv.total.toFixed(2)} {inv.details.currency}</span>
                </div>
                <div className="text-right text-base font-bold text-[#2D4485]">
                  {THBText(inv.total)}
                </div>
              </div>
           </div>
           
           <div className="mt-8 border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Payment Terms</label>
              <textarea 
                value={inv.details.notes || ""} 
                onChange={(e) => inv.setDetails({ ...inv.details, notes: e.target.value })} 
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                rows="3" 
                placeholder="Additional notes, payment terms, etc." 
              />
           </div>
        </div>
    </>
  )
}
