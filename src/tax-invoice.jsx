import React from "react"
import Navigation from "./components/navigation.jsx"
import { ArrowLeft, Receipt } from "lucide-react"
import { TaxInvoiceForm } from "./components/tax-invoice-form.jsx"
import { API_BASE_URL } from "./config"
import { THBText } from "./utils/currency"

export default function TaxInvoicePage() {
  const inv = useTaxInvoiceState()
  const [openCreateConfirm, setOpenCreateConfirm] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [notice, setNotice] = React.useState({ show: false, text: "" })

  React.useEffect(() => {
    inv.setDetails({ ...inv.details, isTaxInvoice: true })
  }, [])

  const cancelConfirm = () => {
    setOpenCreateConfirm(false)
  }

  const doConfirmSend = async () => {
    await inv.sendToCustomer()
    setOpenCreateConfirm(false)
    setNotice({ show: true, text: "Sent successfully" })
    setTimeout(() => setNotice({ show: false, text: "" }), 3000)
  }

  return (
    <>
    <main className="min-h-screen bg-gray-50">
      <Navigation />

      {isGenerating && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg p-5 flex flex-col items-center shadow-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2D4485] mb-3"></div>
              <div className="text-lg font-semibold text-gray-900">Generating PDF...</div>
              <div className="text-sm text-gray-500 mb-4">Please wait</div>
              <button 
                onClick={() => setIsGenerating(false)}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                Cancel / Unfreeze
              </button>
            </div>
          </div>
      )}

      {openCreateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[55] flex items-center justify-center print:hidden" onClick={() => setOpenCreateConfirm(false)}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-[560px] max-w-[95vw] relative" onClick={(e)=>e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Create Tax Invoice Form</h3>
                  <div className="text-sm text-gray-600 mt-1">Choose how you want to proceed</div>
                </div>
                <button className="text-gray-500 hover:text-gray-900 p-2" onClick={() => setOpenCreateConfirm(false)}>✕</button>
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
                  onClick={async () => { 
                    const success = await inv.confirm()
                    if (success) {
                      window.location.href = "/admin.html"
                    }
                  }}
                >
                  Save Changes
                </button>
                <button
                  className="w-full px-4 py-2 rounded-md text-[#2D4485] underline underline-offset-2 hover:text-[#3D56A6] min-w-[140px] whitespace-nowrap text-center disabled:opacity-50"
                  disabled={isGenerating}
                  onClick={async () => {
                    setIsGenerating(true)
                    await new Promise(r => setTimeout(r, 100))
                    try {
                      await inv.exportPdf()
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setIsGenerating(false)
                      setOpenCreateConfirm(false)
                    }
                  }}
                >
                  {isGenerating ? "Generating..." : "Download Form"}
                </button>
              </div>
            </div>
        </div>
      )}

      {notice.show && (
        <div className="fixed bottom-4 right-4 z-[60] print:hidden">
          <div className="bg-[#2D4485] text-white rounded-md shadow-md px-4 py-2 text-sm">
            {notice.text}
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">New Tax Invoice</h1>
            </div>
          </div>
        </div>

        <TaxInvoiceForm ti={inv} />

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href = "/admin.html"}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create Tax Invoice Form</button>
        </div>
      </div>
    </main>
    </>
  )
}

function useTaxInvoiceState() {
  const [customer, setCustomer] = React.useState({
    company: "",
    taxId: "",
    branch: "",
    address: "",
    telephone: "",
    fax: "",
    attn: "",
    email: ""
  })
  const [details, setDetails] = React.useState({
    number: "INV 2026-0001",
    date: new Date().toISOString().slice(0, 10),
    isTaxInvoice: true,
    paymentType: "",
    dueDate: "",
    poNo: "",
    eit: null,
    salesPerson: "EIT LASERTECHNIK CO.,LTD",
    onBehalfOf: "EIT LASERTECHNIK CO.,LTD",
    eitAddress: "1/120 ซอยรามคําแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510",
    eitTelephone: "02-052-9544",
    eitFax: "02-052 9544",
    eitMobile: "000-000-0000",
    notes: "",
    currency: "THB"
  })
  const [items, setItems] = React.useState([{ description: "", qty: 1, price: 0, unit: "pcs" }])
  const [eitOptions, setEitOptions] = React.useState([])
  const [customerOptions, setCustomerOptions] = React.useState([])
  const [poOptions, setPoOptions] = React.useState([])

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/eits/`).then(r=>r.json()).then(d=>Array.isArray(d)?setEitOptions(d):setEitOptions([])).catch(()=>setEitOptions([]))
    fetch(`${API_BASE_URL}/api/customers/`).then(r=>r.json()).then(d=>Array.isArray(d)?setCustomerOptions(d):setCustomerOptions([])).catch(()=>setCustomerOptions([]))
    fetch(`${API_BASE_URL}/api/purchase-orders/numbers/`).then(r=>r.json()).then(d=>Array.isArray(d)?setPoOptions(d):setPoOptions([])).catch(()=>setPoOptions([]))
  }, [])

  React.useEffect(() => {
    if (!details.eit && Array.isArray(eitOptions) && eitOptions.length) {
      const defaultEit = eitOptions.find(opt => !String(opt.organization_name || "").toUpperCase().includes("EINSTEIN")) || eitOptions[0]
      if (defaultEit) {
        setDetails(prev => ({
          ...prev,
          eit: defaultEit.id,
          salesPerson: defaultEit.organization_name,
          onBehalfOf: defaultEit.organization_name,
          eitAddress: defaultEit.address || "",
          eitTelephone: defaultEit.eit_telephone || "",
          eitFax: defaultEit.eit_fax || "",
          eitMobile: defaultEit.eit_mobile || ""
        }))
      }
    }
  }, [details.eit, eitOptions])

  // Set default Tax Invoice number if empty
  React.useEffect(() => {
    setDetails(prev => ({ ...prev, number: prev.number || "INV 2026-0001" }))
  }, [])

  const addItem = () => setItems(prev => [...prev, { description: "", qty: 1, price: 0, unit: "pcs" }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const parseNumber = (val) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    return parseFloat(String(val).replace(/,/g, '')) || 0
  }

  const subtotal = items.reduce((s, it) => s + parseNumber(it.qty) * parseNumber(it.price), 0)
  const taxTotal = subtotal * 0.07
  const total = subtotal + taxTotal

  const exportPdf = async () => {
    const payload = {
      details: { ...details, isTaxInvoice: true },
      customer,
      items: items.map(i => ({ ...i, qty: parseNumber(i.qty), price: parseNumber(i.price) })),
      totals: { subtotal, taxTotal, total, thaiText: THBText(total) }
    }
    const res = await fetch(`${API_BASE_URL}/api/generate-invoice-pdf/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error("Failed to generate PDF")
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    }, 500)
    setTimeout(() => {
      document.body.removeChild(iframe)
      window.URL.revokeObjectURL(url)
    }, 60000)
  }

  const confirm = async () => true
  const sendToCustomer = async () => {}

  return {
    customer, setCustomer,
    details, setDetails,
    eitOptions, customerOptions, poOptions,
    items, setItems, addItem, removeItem, updateItem,
    subtotal, taxTotal, total,
    confirm, exportPdf, sendToCustomer
  }
}
