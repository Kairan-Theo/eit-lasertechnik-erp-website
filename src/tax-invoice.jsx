import React from "react"
import Navigation from "./components/navigation.jsx"
import { ArrowLeft, Receipt } from "lucide-react"
import InvoiceForm from "./components/invoice-form.jsx"
import { useInvoiceState } from "./invoice.jsx"

export default function TaxInvoicePage() {
  const inv = useInvoiceState()
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

        <InvoiceForm inv={inv} />

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-md border border-[#2D4485] text-[#2D4485] hover:bg-[#2D4485]/10" onClick={() => window.location.href = "/admin.html"}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]" onClick={() => setOpenCreateConfirm(true)}>Create Tax Invoice Form</button>
        </div>
      </div>
    </main>
    </>
  )
}
