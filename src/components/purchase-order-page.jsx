import React from "react"
import { createPortal } from "react-dom"
import { PurchaseOrderTemplate } from "./purchase-order-template.jsx"

export default function PurchaseOrderPage() {
  const [poNumber, setPoNumber] = React.useState("")
  const [customer, setCustomer] = React.useState({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
  const [extraFields, setExtraFields] = React.useState({ refQuotation: "", orderDate: "", deliveryDate: "", paymentTerms: "", deliveryTo: "" })
  const [items, setItems] = React.useState([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const [showForm, setShowForm] = React.useState(false)
  const [poList, setPoList] = React.useState([])
  const [printingPo, setPrintingPo] = React.useState(null)
  const [errors, setErrors] = React.useState({})
  const fileInputRef = React.useRef(null)

  const handlePrint = (po) => {
    setPrintingPo(po)
    // Allow time for the portal to render
    setTimeout(() => {
        window.print()
        // Optional: clear after print dialog closes (though in some browsers this runs immediately)
        // We'll keep it open or clear it? 
        // Better to clear it on user action or just leave it hidden (since CSS handles display)
        // But we want to stop rendering it to save memory/DOM.
        // The print dialog blocks the main thread in many browsers, so this runs after close.
        setPrintingPo(null)
    }, 100)
  }

  const prefilledRef = React.useRef(false)
  const saveTimer = React.useRef(null)
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const normalizePhone = (s) => {
    const input = (s || "").trim()
    const digits = input.replace(/\D+/g, "")
    return input.startsWith("+") ? `+${digits}` : digits
  }
  const digitCount = (s) => (s || "").replace(/\D/g, "").length
  const validateCustomer = React.useCallback((c) => {
    return {
      email: c.email && !emailRe.test(c.email) ? "Invalid email" : "",
      companyEmail: c.companyEmail && !emailRe.test(c.companyEmail) ? "Invalid email" : "",
      phone: c.phone && digitCount(c.phone) < 7 ? "Invalid phone" : "",
      companyPhone: c.companyPhone && digitCount(c.companyPhone) < 7 ? "Invalid phone" : "",
    }
  }, [])
  const isValid = React.useMemo(() => Object.values(errors).every((e) => !e), [errors])
  const generatePoNumber = React.useCallback(() => {
    try {
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const dateKey = `${yyyy}${mm}${dd}`
      const k = `poSeq:${dateKey}`
      const seq = Number(localStorage.getItem(k) || "0") + 1
      localStorage.setItem(k, String(seq))
      return `PO-${dateKey}-${String(seq).padStart(3, "0")}`
    } catch {
      const r = Math.floor(Math.random() * 1000)
      return `PO-${Date.now()}-${String(r).padStart(3, "0")}`
    }
  }, [])
  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("poList") || "[]")
      if (Array.isArray(data)) setPoList(data)
    } catch {}
  }, [])
  React.useEffect(() => {
    if (!showForm) return
    if (!poNumber) {
      setPoNumber(generatePoNumber())
    }
  }, [showForm, poNumber, generatePoNumber])
  const addItem = () => setItems((prev) => [...prev, { product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
  const updateItem = (i, field, value) => setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "qty" || field === "price" || field === "tax" ? Number(value) : value } : row)))
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const keyForCustomer = React.useCallback(() => {
    const e = (customer.email || "").trim().toLowerCase()
    if (e) return e
    const ce = (customer.companyEmail || "").trim().toLowerCase()
    if (ce) return ce
    const p = (customer.phone || "").trim()
    if (p) return p
    const n = (customer.name || "").trim().toLowerCase()
    if (n) return n
    return ""
  }, [customer])
  React.useEffect(() => {
    if (!showForm) return
    const k = keyForCustomer()
    if (!k) return
    if (!prefilledRef.current) {
      try {
        const h = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
        if (h.customer) {
          setCustomer((prev) => ({
            name: prev.name || h.customer.name || "",
            company: prev.company || h.customer.company || "",
            email: prev.email || h.customer.email || "",
            companyEmail: prev.companyEmail || h.customer.companyEmail || "",
            phone: prev.phone || h.customer.phone || "",
            companyPhone: prev.companyPhone || h.customer.companyPhone || "",
            deliveryTo: prev.deliveryTo || h.customer.deliveryTo || "",
          }))
          prefilledRef.current = true
        }
      } catch {}
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        const h = JSON.parse(localStorage.getItem(`history:${k}`) || "{}")
        const payload = {
          ...h,
          customer: { ...customer },
          quotations: Array.isArray(h.quotations) ? h.quotations : [],
          invoices: Array.isArray(h.invoices) ? h.invoices : [],
          emails: Array.isArray(h.emails) ? h.emails : [],
        }
        localStorage.setItem(`history:${k}`, JSON.stringify(payload))
      } catch {}
    }, 500)
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
    }
  }, [showForm, customer.name, customer.company, customer.email, customer.phone, keyForCustomer])
  const persistPoList = React.useCallback((next) => {
    setPoList(next)
    try {
      localStorage.setItem("poList", JSON.stringify(next))
    } catch {}
  }, [])
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }
  const normalizeImportedItem = (it) => {
    const qty = Number(it?.qty || 0)
    const price = Number(it?.price || 0)
    const tax = Number(it?.tax || 0)
    return {
      product: String(it?.product || ""),
      description: String(it?.description || ""),
      note: String(it?.note || ""),
      qty: Number.isFinite(qty) ? qty : 0,
      price: Number.isFinite(price) ? price : 0,
      tax: Number.isFinite(tax) ? tax : 0,
    }
  }
  const normalizeImportedPo = (p) => {
    const num = String(p?.poNumber || "").trim()
    const now = new Date().toISOString()
    return {
      poNumber: num || generatePoNumber(),
      customer: {
        name: String(p?.customer?.name || ""),
        company: String(p?.customer?.company || ""),
        email: String(p?.customer?.email || ""),
        companyEmail: String(p?.customer?.companyEmail || ""),
        phone: String(p?.customer?.phone || ""),
        companyPhone: String(p?.customer?.companyPhone || ""),
      },
      extraFields: {
        refQuotation: String(p?.extraFields?.refQuotation || ""),
        orderDate: String(p?.extraFields?.orderDate || ""),
        deliveryDate: String(p?.extraFields?.deliveryDate || ""),
        paymentTerms: String(p?.extraFields?.paymentTerms || ""),
        deliveryTo: String(p?.extraFields?.deliveryTo || ""),
      },
      items: Array.isArray(p?.items) ? p.items.map(normalizeImportedItem) : [],
      updatedAt: p?.updatedAt || now,
    }
  }
  const handleImportFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    try {
      const text = await f.text()
      const data = JSON.parse(text)
      let imported = []
      if (Array.isArray(data)) {
        imported = data
      } else if (data && typeof data === "object") {
        imported = [data]
      }
      const normalized = imported.map(normalizeImportedPo).filter((x) => Array.isArray(x.items) && x.items.length)
      if (!normalized.length) {
        e.target.value = ""
        return
      }
      const next = [...poList]
      normalized.forEach((p) => {
        const idx = next.findIndex((x) => String(x.poNumber || "") === String(p.poNumber || ""))
        if (idx >= 0) {
          next[idx] = p
        } else {
          next.unshift(p)
        }
      })
      persistPoList(next)
    } catch {}
    e.target.value = ""
  }
  const startNew = () => {
    setPoNumber("")
    setCustomer({ name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
    setExtraFields({ refQuotation: "", orderDate: new Date().toISOString().slice(0,10), deliveryDate: "", paymentTerms: "", deliveryTo: "" })
    setItems([{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
    prefilledRef.current = false
    setShowForm(true)
  }
  const editPo = (idx) => {
    const p = poList[idx]
    if (!p) return
    setPoNumber(p.poNumber || "")
    setCustomer(p.customer || { name: "", company: "", email: "", companyEmail: "", phone: "", companyPhone: "" })
    setExtraFields(p.extraFields || { refQuotation: "", orderDate: "", deliveryDate: "", paymentTerms: "", deliveryTo: "" })
    setItems(Array.isArray(p.items) && p.items.length ? p.items : [{ product: "", description: "", note: "", qty: 1, price: 0, tax: 0 }])
    setShowForm(true)
  }
  const deletePo = (idx) => {
    const next = poList.filter((_, i) => i !== idx)
    persistPoList(next)
  }
  const generate = async () => {
    const errs = validateCustomer(customer)
    setErrors(errs)
    if (Object.values(errs).some((e) => !!e)) return

    // Create the payload for saving and printing
    const payload = { poNumber, customer, extraFields, items, updatedAt: new Date().toISOString() }
    
    // Save to list (similar to saveDraft)
    const idx = poList.findIndex((p) => p.poNumber === poNumber)
    let nextList = []
    if (idx >= 0) {
      nextList = poList.slice()
      nextList[idx] = payload
    } else {
      nextList = [payload, ...poList]
    }
    persistPoList(nextList)
    
    // Trigger print/export
    handlePrint(payload)
    
    setShowForm(false)
  }
  const saveDraft = () => {
    const errs = validateCustomer(customer)
    setErrors(errs)
    if (Object.values(errs).some((e) => !!e)) return
    const payload = { poNumber, customer, extraFields, items, updatedAt: new Date().toISOString() }
    const idx = poList.findIndex((p) => p.poNumber === poNumber)
    if (idx >= 0) {
      const next = poList.slice()
      next[idx] = payload
      persistPoList(next)
    } else {
      persistPoList([payload, ...poList])
    }
    setShowForm(false)
  }
  const confirmAndInvoice = () => {
    const payload = {
      customer,
      items,
      details: { currency: "THB" },
    }
    localStorage.setItem("confirmedQuotation", JSON.stringify(payload))
    window.location.href = "/invoice.html"
  }
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-[#2D4485] mb-2">Purchase Order</h2>
      {!showForm && (
        <>
          <div className="mb-4">
            <div className="flex gap-2">
              <button onClick={startNew} className="btn-primary">Add Purchase Order</button>
              <button onClick={handleImportClick} className="btn-outline">Import</button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">PO Number</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Items</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {poList.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{p.poNumber}</td>
                    <td className="p-2">{p.customer?.name || p.customer?.company || p.customer?.email || p.customer?.phone || "-"}</td>
                    <td className="p-2">{Array.isArray(p.items) ? p.items.length : 0}</td>
                    <td className="p-2">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "-"}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                          <button onClick={() => editPo(i)} className="btn-outline">Edit</button>
                          <button onClick={() => handlePrint(p)} className="btn-outline">Export PDF</button>
                          <button onClick={() => deletePo(i)} className="btn-outline text-red-600">Delete</button>
                        </div>
                    </td>
                  </tr>
                ))}
                {poList.length === 0 && (
                  <tr>
                    <td className="p-2 text-gray-600" colSpan={5}>No purchase orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {showForm && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-1">Vendor Details</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vendor Name</label>
                <input
                  value={customer.company}
                  onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                  placeholder="Vendor Company Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contact Person</label>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Contact Person Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input
                        value={customer.email}
                        onChange={(e) => {
                            const next = { ...customer, email: e.target.value }
                            setCustomer(next)
                            setErrors(validateCustomer(next))
                        }}
                        placeholder="Vendor Email"
                        className={`w-full rounded-md border px-3 py-2 text-sm ${errors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input
                        value={customer.phone}
                        onChange={(e) => {
                            const next = { ...customer, phone: e.target.value }
                            setCustomer(next)
                            setErrors(validateCustomer(next))
                        }}
                        placeholder="Vendor Phone"
                        className={`w-full rounded-md border px-3 py-2 text-sm ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.phone && <div className="text-xs text-red-600 mt-1">{errors.phone}</div>}
                 </div>
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Delivery To</label>
                   <textarea
                      value={extraFields.deliveryTo}
                      onChange={(e) => setExtraFields({...extraFields, deliveryTo: e.target.value})}
                      placeholder="Delivery Address"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-20"
                   />
              </div>
            </div>

            <div className="space-y-3">
               <h3 className="font-semibold text-gray-700 border-b pb-1">Order Details</h3>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ref. Quotation No.</label>
                    <input
                      value={extraFields.refQuotation}
                      onChange={(e) => setExtraFields({...extraFields, refQuotation: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Order No.</label>
                    <input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date of Order</label>
                    <input
                      type="date"
                      value={extraFields.orderDate}
                      onChange={(e) => setExtraFields({...extraFields, orderDate: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={extraFields.deliveryDate}
                      onChange={(e) => setExtraFields({...extraFields, deliveryDate: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Terms</label>
                  <input
                    value={extraFields.paymentTerms}
                    onChange={(e) => setExtraFields({...extraFields, paymentTerms: e.target.value})}
                    placeholder="e.g. 30 Days"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto mb-3 border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-700 border-b">
                  <th className="p-3 w-16 text-center">Item</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 w-24 text-right">Q'ty</th>
                  <th className="p-3 w-32 text-right">Unit Price</th>
                  <th className="p-3 w-32 text-right">Total Amount</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it, i) => {
                   const amount = (Number(it.qty)||0) * (Number(it.price)||0)
                   return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-2 text-center text-gray-500">{i + 1}</td>
                    <td className="p-2">
                        <input
                           value={it.description}
                           onChange={(e) => updateItem(i, "description", e.target.value)}
                           placeholder="Description"
                           className="w-full border-none focus:ring-0 bg-transparent p-0 text-sm"
                        />
                        <input
                           value={it.product}
                           onChange={(e) => updateItem(i, "product", e.target.value)}
                           placeholder="Product Code/Name (Optional)"
                           className="w-full border-none focus:ring-0 bg-transparent p-0 text-xs text-gray-500 mt-1"
                        />
                    </td>
                    <td className="p-2">
                        <input
                           type="number" min="0"
                           value={it.qty}
                           onChange={(e) => updateItem(i, "qty", e.target.value)}
                           className="w-full text-right border rounded px-1 py-1"
                        />
                    </td>
                    <td className="p-2">
                        <input
                           type="number" min="0" step="0.01"
                           value={it.price}
                           onChange={(e) => updateItem(i, "price", e.target.value)}
                           className="w-full text-right border rounded px-1 py-1"
                        />
                    </td>
                    <td className="p-2 text-right font-medium text-gray-700">
                        {amount.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                        <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700" title="Remove">×</button>
                    </td>
                  </tr>
                )})}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                  <tr>
                      <td colSpan={6} className="p-2 text-center">
                          <button onClick={addItem} className="text-blue-600 hover:underline text-sm">+ Add Item</button>
                      </td>
                  </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end mb-6">
             <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Sub Total</span>
                    <span className="font-medium">
                        {items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Vat 7%</span>
                    <span className="font-medium">
                        {(items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 0.07).toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base">
                    <span className="font-bold text-[#2D4485]">Grand Total Amount</span>
                    <span className="font-bold text-[#2D4485]">
                        {(items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 1.07).toFixed(2)}
                    </span>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={saveDraft} disabled={!isValid} className="btn-outline disabled:opacity-50">Save</button>
            <button onClick={generate} disabled={!isValid} className="btn-primary disabled:opacity-50">Generate PO</button>
            <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </>
      )}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
         {/* Hidden containers removed as we use window.print() now */}
      </div>

      {printingPo && createPortal(
        <div className="print-portal">
            <style>
            {`
                @media print {
                    body > *:not(.print-portal) { display: none !important; }
                    .print-portal { 
                        display: block !important; 
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        width: 100%; 
                        background: white; 
                        z-index: 9999;
                    }
                    @page { margin: 0; size: auto; }
                }
                /* Hide on screen */
                .print-portal { display: none; }
                @media print { .print-portal { display: block; } }
            `}
            </style>
            <PurchaseOrderTemplate q={{
                customer: printingPo.customer || {},
                items: printingPo.items || [],
                extraFields: printingPo.extraFields || {},
                details: { number: printingPo.poNumber, currency: "THB" },
                subtotal: (printingPo.items||[]).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0),
                taxTotal: ((printingPo.items||[]).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 0.07),
                total: ((printingPo.items||[]).reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.price)||0), 0) * 1.07)
            }} />
        </div>,
        document.body
      )}
    </div>
  )
}
