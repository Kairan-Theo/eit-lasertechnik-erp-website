import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL } from "./config"
import { format, parseISO } from "date-fns"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { Calendar as CalendarIcon, Plus, Trash, ArrowLeft, FileText, ClipboardList } from "lucide-react"
import "./index.css"

function DateField({ value, onChange, placeholder = "DD/MM/YYYY" }) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef(null)
  const defaultClassNames = getDefaultClassNames()
  const selected = (() => {
    try {
      return value ? parseISO(value) : undefined
    } catch {
      return undefined
    }
  })()
  const display = (() => {
    try {
      return selected ? format(selected, "dd/MM/yyyy") : ""
    } catch {
      return ""
    }
  })()
  React.useEffect(() => {
    if (!open) return
    const handle = (e) => {
      const el = containerRef.current
      if (el && !el.contains(e.target)) setOpen(false)
    }
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    document.addEventListener("touchstart", handle, { passive: true })
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handle)
      document.removeEventListener("touchstart", handle)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])
  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <input
        type="text"
        value={display}
        placeholder={placeholder}
        onClick={() => setOpen((o) => !o)}
        readOnly
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        aria-label="Open calendar"
      >
        <CalendarIcon className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <div onMouseDown={(e) => e.stopPropagation()} className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+2px)] z-50 bg-white border border-slate-200 rounded-[22px] shadow-xl p-4 w-[340px]">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return
              const v = format(d, "yyyy-MM-dd")
              onChange(v)
            }}
            captionLayout="buttons"
            classNames={{
              root: `w-fit ${defaultClassNames.root}`,
              months: `flex flex-col ${defaultClassNames.months}`,
              month: `rounded-2xl pt-8 ${defaultClassNames.month}`,
              caption: `relative h-8 ${defaultClassNames.caption}`,
              nav: `absolute left-3 right-3 top-0 flex items-center justify-between ${defaultClassNames.nav}`,
              nav_button: `p-2 rounded-full hover:bg-slate-100 ${defaultClassNames.nav_button}`,
              nav_button_previous: `${defaultClassNames.nav_button_previous}`,
              nav_button_next: `${defaultClassNames.nav_button_next}`,
              caption_label: `absolute left-1/2 -translate-x-1/2 top-0 h-8 leading-8 text-center font-semibold uppercase tracking-wide text-[#2D4485] ${defaultClassNames.caption_label}`,
              table: `w-full border-collapse`,
              weekdays: `flex justify-between border-b border-slate-200 pb-2 ${defaultClassNames.weekdays}`,
              weekday: `text-slate-500 flex-1 text-sm text-center ${defaultClassNames.weekday}`,
              week: `grid grid-cols-7 mt-2 ${defaultClassNames.week}`,
              day: `mx-auto size-10 flex items-center justify-center rounded-full hover:bg-blue-50 ${defaultClassNames.day}`,
              today: `bg-[#D6E4FF] text-[#2D4485] font-semibold ${defaultClassNames.today}`,
              outside: `text-slate-400 ${defaultClassNames.outside}`,
              disabled: `${defaultClassNames.disabled}`,
            }}
            modifiersClassNames={{
              selected: "border-2 border-[#2D4485]/30 !bg-transparent text-[#2D4485] font-semibold",
            }}
          />
        </div>
      )}
    </div>
  )
}

function useQuotationState() {
  const [customer, setCustomer] = React.useState({
    company: "",
    address: "",
    telephone: "",
    fax: "",
    attn: "",
    div: "",
    mobile: "",
    email: ""
  })

  const [details, setDetails] = React.useState({
    number: "",
    date: new Date().toISOString().slice(0, 10),
    validUntil: "",
    currency: "THB",
    deliveryTerms: "Ex-Works",
    salesPerson: "",
    eitMobile: "",
    eitTelephone: "",
    eitFax: "",
    tradeTerms: "",
    validity: "",
    delivery: "",
    shipmentLocation: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    remark: "",
    paymentTerms: ": "
  })

  const [items, setItems] = React.useState([{ item: "", model: "", description: "", qty: 1, price: 0 }])

  const total = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)

  const addItem = () => setItems((prev) => [...prev, { item: "", model: "", description: "", qty: 1, price: 0 }])
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) =>
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === i ? { ...row, [field]: field === "qty" || field === "price" ? (value === "" ? "" : Number(value)) : value } : row,
      ),
    )

  return { customer, setCustomer, details, setDetails, items, addItem, removeItem, updateItem, total }
}

function QuotationPage() {
  const q = useQuotationState()
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = "/admin.html"}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Back to List"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              New Quotation
            </h1>
          </div>
        </div>

        {/* Codes Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">Codes</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
               <input value={q.details.number} onChange={(e) => q.setDetails({ ...q.details, number: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Quotation number" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
               <DateField value={q.details.date} onChange={(val) => q.setDetails({ ...q.details, date: val })} />
             </div>
          </div>
        </div>

        {/* EIT Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
           <h2 className="text-xl font-bold text-[#2D4485]">EIT/Einstein organization</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
               <select value={q.details.salesPerson} onChange={(e) => q.setDetails({ ...q.details, salesPerson: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none">
                 <option value="">Select Organization</option>
                 <option value="EIT LASERTECHNIK CO.,LTD">EIT LASERTECHNIK CO.,LTD</option>
                 <option value="EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD">EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
               <input value={q.details.eitMobile} onChange={(e) => q.setDetails({ ...q.details, eitMobile: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
               <input value={q.details.eitTelephone} onChange={(e) => q.setDetails({ ...q.details, eitTelephone: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
               <input value={q.details.eitFax} onChange={(e) => q.setDetails({ ...q.details, eitFax: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
             </div>
           </div>
        </div>

        {/* Customer Information Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 space-y-8 mb-8">
          <h2 className="text-xl font-bold text-[#2D4485]">Customer Information</h2>
          


          <h3 className="text-base font-bold text-gray-900 pt-2">Customer Company</h3>

          {/* Company Name (50% width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
               <input value={q.customer.company} onChange={(e) => q.setCustomer({ ...q.customer, company: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Company name" />
             </div>
          </div>

          {/* Telephone / Fax / Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input value={q.customer.telephone} onChange={(e) => q.setCustomer({ ...q.customer, telephone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Telephone" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input value={q.customer.fax} onChange={(e) => q.setCustomer({ ...q.customer, fax: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Fax" />
            </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
               <textarea value={q.customer.address} onChange={(e) => q.setCustomer({ ...q.customer, address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="2" placeholder="Address" />
             </div>
          </div>

          <h3 className="text-base font-bold text-gray-900 pt-2">Customer Responsible</h3>

          {/* Attn / Div / Mobile */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attention(Attn.)</label>
                <input value={q.customer.attn} onChange={(e) => q.setCustomer({ ...q.customer, attn: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Attention" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division(Div.)</label>
                <input value={q.customer.div} onChange={(e) => q.setCustomer({ ...q.customer, div: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Division" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input value={q.customer.mobile} onChange={(e) => q.setCustomer({ ...q.customer, mobile: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Mobile" />
            </div>
          </div>
        </div>



        {/* Quotation Description Box */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6 mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#2D4485]">Quotation Description</h2>
             <button onClick={q.addItem} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#2D4485]/10 text-[#2D4485] hover:bg-[#2D4485]/15">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-medium">Add Item</span>
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                 <tr>
                   <th className="p-3 border-b w-16">Item</th>
                   <th className="p-3 border-b">Model</th>
                   <th className="p-3 border-b">Description</th>
                   <th className="p-3 border-b w-32">Price</th>
                   <th className="p-3 border-b w-20">Quantity</th>
                   <th className="p-3 border-b w-32">Total (Baht)</th>
                   <th className="p-3 border-b w-12"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {q.items.map((item, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                     <td className="p-3 text-center text-sm text-gray-700">
                       {i + 1}
                     </td>
                     <td className="p-3">
                       <input value={item.model} onChange={(e) => q.updateItem(i, "model", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" placeholder="Model" />
                     </td>
                    <td className="p-3">
                      <input value={item.description} onChange={(e) => q.updateItem(i, "description", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" placeholder="Description" />
                    </td>
                    <td className="p-3">
                      <input type="number" value={item.price} onChange={(e) => q.updateItem(i, "price", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                    </td>
                    <td className="p-3">
                      <input type="number" value={item.qty} onChange={(e) => q.updateItem(i, "qty", e.target.value)} className="w-full bg-transparent border-b border-gray-300 px-2 py-1 text-sm focus:border-[#2D4485] outline-none" />
                    </td>
                     <td className="p-3 text-right text-sm text-gray-700">
                       {(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}
                     </td>
                     <td className="p-3 text-right">
                       <button onClick={() => q.removeItem(i)} className="text-red-600 hover:text-red-800" title="Delete"><Trash className="w-4 h-4" /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex justify-end mt-4">
             <div className="w-64 space-y-2">
               <div className="flex justify-between text-base font-bold text-gray-900"><span>Total:</span> <span>{q.total.toFixed(2)}</span></div>
               <div className="flex justify-between text-base font-bold text-gray-900"><span>VAT 7%:</span> <span>{(q.total * 0.07).toFixed(2)}</span></div>
               <div className="flex justify-between text-base font-bold text-[#2D4485] pt-2 border-t"><span>Grand Total:</span> <span>{(q.total * 1.07).toFixed(2)}</span></div>
             </div>
           </div>
        </div>
        
        {/* Terms & Conditions Box */}
        <div className="mb-8">
           <div className="bg-white rounded-xl shadow-lg border border-gray-400 p-6">
             <h2 className="text-xl font-bold text-[#2D4485] mb-4">Terms & Conditions</h2>
             <div className="space-y-4">
                {/* Row 1: Trade Terms, Validity, Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Trade Terms</label>
                     <input value={q.details.tradeTerms} onChange={(e) => q.setDetails({ ...q.details, tradeTerms: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Trade Terms" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Validity</label>
                     <input value={q.details.validity} onChange={(e) => q.setDetails({ ...q.details, validity: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Validity" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label>
                     <input value={q.details.delivery} onChange={(e) => q.setDetails({ ...q.details, delivery: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Delivery" />
                  </div>
                </div>

                {/* Row 2: Payment Terms */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                   <textarea 
                     name="paymentTerms"
                     value={q.details.paymentTerms} 
                     onChange={(e) => {
                       let val = e.target.value
                       if (!val.startsWith(": ")) {
                         if (val.startsWith(":")) {
                           val = ": " + val.substring(1)
                         } else if (val.startsWith(" ")) {
                           val = ":" + val
                         } else {
                           val = ": " + val
                         }
                       }
                       q.setDetails({ ...q.details, paymentTerms: val })
                     }} 
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         const val = e.target.value;
                         const selectionStart = e.target.selectionStart;
                         const currentLineStart = val.lastIndexOf('\n', selectionStart - 1) + 1;
                         const currentLine = val.substring(currentLineStart, selectionStart);
                         if (currentLine.trim().startsWith(':')) {
                           e.preventDefault();
                           const newValue = val.substring(0, selectionStart) + "\n: " + val.substring(e.target.selectionEnd);
                           q.setDetails({ ...q.details, paymentTerms: newValue });
                           setTimeout(() => {
                             const ta = document.getElementsByName("paymentTerms")[0];
                             if (ta) ta.setSelectionRange(selectionStart + 3, selectionStart + 3);
                           }, 0);
                         }
                       }
                     }}
                     className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" 
                     rows="4" 
                     placeholder=": Payment terms" 
                   />
                </div>

                {/* Row 3: Shipment Location, Invoice Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Location</label>
                     <input value={q.details.shipmentLocation} onChange={(e) => q.setDetails({ ...q.details, shipmentLocation: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" placeholder="Shipment Location" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                     <DateField value={q.details.invoiceDate} onChange={(val) => q.setDetails({ ...q.details, invoiceDate: val })} />
                  </div>
                </div>

                {/* Row 4: Remark */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                   <textarea value={q.details.remark} onChange={(e) => q.setDetails({ ...q.details, remark: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none" rows="4" placeholder="Remark" />
                </div>
             </div>
           </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href="/admin.html"}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create QO Form</button>
        </div>

        {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpenCreateConfirm(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Create QO Form</h3>
                  <div className="text-sm text-gray-600 mt-1">Choose how you want to proceed</div>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenCreateConfirm(false)}>✕</button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <button
                  className="w-full px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10 min-w-[140px]"
                  onClick={() => { setOpenCreateConfirm(false); window.location.href = "/admin.html" }}
                >
                  Discard
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6] min-w-[140px]"
                  onClick={() => {
                    // Mock save functionality
                    alert("Changes saved!")
                    setOpenCreateConfirm(false)
                    window.location.href = "/crm.html"
                  }}
                >
                  Save Changes
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center"
                  onClick={() => {
                    // Mock download functionality
                    alert("Downloading form...")
                    setOpenCreateConfirm(false)
                  }}
                >
                  Download Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QuotationPage />
  </React.StrictMode>,
)
