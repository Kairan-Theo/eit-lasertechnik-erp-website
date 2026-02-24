import React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Combobox } from "./combobox"
import { CustomerCombobox } from "./customer-combobox"
import { DateField } from "./ui/date-field"
import { THBText } from "../utils/currency"
// Comment: Import API base to fetch canonical Customer by ID for Branch hydration
import { API_BASE_URL } from "../config"

export function TaxInvoiceForm({ ti }) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
        <h2 className="text-xl font-bold text-[#2D4485]">Code</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Invoice Number</label>
            <input value={ti.details.number || ""} onChange={(e) => ti.setDetails({ ...ti.details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="INV 2026-0001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
            <DateField value={ti.details.date || ""} onChange={(val) => ti.setDetails({ ...ti.details, date: val })} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
        <h2 className="text-xl font-bold text-[#2D4485]">EIT organization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input 
              value={ti.details.onBehalfOf || ""} 
              onChange={(e) => ti.setDetails({ ...ti.details, onBehalfOf: e.target.value, salesPerson: e.target.value })} 
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
              placeholder="EIT LASERTECHNIK CO.,LTD"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={ti.details.eitAddress || ""} onChange={(e) => ti.setDetails({ ...ti.details, eitAddress: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="3" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <input value={ti.details.eitTelephone || ""} onChange={(e) => ti.setDetails({ ...ti.details, eitTelephone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
            <input value={ti.details.eitFax || ""} onChange={(e) => ti.setDetails({ ...ti.details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
        <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <CustomerCombobox
              value={ti.customer?.company || ""}
              options={ti.customerOptions}
              onChange={(val) => {
                // Try matching by either 'customer_name' (legacy) or 'company_name' (current)
                const match = ti.customerOptions.find(c => (c.customer_name || c.company_name) === val)
                if (match) {
                  ti.setCustomer({
                    ...(ti.customer || {}),
                    company: val,
                    // Map known fields from backend Customer model
                    taxId: match.tax_id || ti.customer?.taxId || "",
                    // Comment: Do not set branch here; hydrate in onSelect by ID fetch to avoid stale data
                    branch: ti.customer?.branch || "",
                    address: match.address || ti.customer?.address || "",
                    telephone: match.phone || ti.customer?.telephone || "",
                    // Map fax from 'cus_fax' if present
                    fax: match.cus_fax || ti.customer?.fax || "",
                    // 'contact' may not be present; preserve existing
                    attn: ti.customer?.attn || "",
                    email: match.email || ti.customer?.email || ""
                  })
                } else {
                  ti.setCustomer({ ...(ti.customer || {}), company: val })
                }
              }}
              // Comment: On selection (ID-based), fetch canonical Customer and hydrate Branch and other fields
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
                          ti.setCustomer({ ...(ti.customer || {}), ...mergedTop })
                        })
                        .catch(() => {
                          ti.setCustomer({ ...(ti.customer || {}), ...nextTop })
                        })
                    } else {
                      ti.setCustomer({ ...(ti.customer || {}), ...nextTop })
                    }
                  })
                  .catch(() => {})
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Code</label>
            <input value={ti.customer?.taxId || ""} onChange={(e) => ti.setCustomer({ ...(ti.customer || {}), taxId: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <input value={ti.customer?.branch || ""} onChange={(e) => ti.setCustomer({ ...(ti.customer || {}), branch: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={ti.customer?.address || ""} onChange={(e) => ti.setCustomer({ ...(ti.customer || {}), address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <input value={ti.customer?.telephone || ""} onChange={(e) => ti.setCustomer({ ...(ti.customer || {}), telephone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
            <input value={ti.customer?.fax || ""} onChange={(e) => ti.setCustomer({ ...(ti.customer || {}), fax: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
        <h2 className="text-xl font-bold text-[#2D4485]">Payment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <input value={ti.details.paymentType || ""} onChange={(e) => ti.setDetails({ ...ti.details, paymentType: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <DateField value={ti.details.dueDate || ""} onChange={(val) => ti.setDetails({ ...ti.details, dueDate: val })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO No.</label>
            <Combobox value={ti.details.poNo || ""} onChange={(val) => ti.setDetails({ ...ti.details, poNo: val })} options={ti.poOptions} placeholder="PO Number" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2D4485]">Tax Invoice Description</h2>
          <button onClick={ti.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Item</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[#2D4485] uppercase text-xs font-bold">
              <tr>
                <th className="p-3 border-b">Description</th>
                <th className="p-3 border-b">Sales (ex. Vat)</th>
                <th className="p-3 border-b">Quantity</th>
                <th className="p-3 border-b">Unit</th>
                <th className="p-3 border-b">Discount</th>
                <th className="p-3 border-b text-right">Amount</th>
                <th className="p-3 border-b w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ti.items.map((it, i) => (
                <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                  <td className="p-3">
                    <textarea value={it.description || ""} onChange={(e) => ti.updateItem(i, "description", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none resize-y min-h-[32px]" rows={1} placeholder="Description" />
                  </td>
                  <td className="p-3">
                    <input type="number" min="0" step="0.01" value={it.price || ""} onChange={(e) => ti.updateItem(i, "price", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                  </td>
                  <td className="p-3">
                    <input type="number" min="0" value={it.qty || ""} onChange={(e) => ti.updateItem(i, "qty", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                  </td>
                  <td className="p-3">
                    <input value={it.unit || ""} onChange={(e) => ti.updateItem(i, "unit", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                  </td>
                  <td className="p-3">
                    <input type="number" min="0" step="0.01" value={it.discount || ""} onChange={(e) => ti.updateItem(i, "discount", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                  </td>
                  <td className="p-3 text-right text-sm text-gray-700">
                    {(((Number(it.qty) || 0) * (Number(it.price) || 0)) - (Number(it.discount) || 0)).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    {/* Delete button removes this item row */}
                    <button
                      type="button"
                      onClick={() => ti.removeItem(i)}
                      className="inline-flex items-center justify-center p-2 rounded hover:bg-red-50"
                      aria-label="Delete item"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
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
              <span className="font-medium text-gray-900">{ti.subtotal.toFixed(2)} {ti.details.currency}</span>
            </div>
            <div className="flex justify-between text-sm gap-8">
              <span className="text-gray-600">Vat 7%</span>
              <span className="font-medium text-gray-900">{ti.taxTotal.toFixed(2)} {ti.details.currency}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-gray-200 gap-8">
              <span className="font-bold text-gray-900">Total of sales</span>
              <span className="font-bold text-[#2D4485]">{ti.total.toFixed(2)} {ti.details.currency}</span>
            </div>
            <div className="text-right text-base font-bold text-[#2D4485]">
              {THBText(ti.total)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
