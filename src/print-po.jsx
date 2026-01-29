import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { PurchaseOrderTemplate } from "./components/purchase-order-template"
import "./index.css"

function PrintPage() {
  const [poData, setPoData] = useState(null)

  useEffect(() => {
    try {
      const data = localStorage.getItem("print_po_data")
      if (data) {
        setPoData(JSON.parse(data))
      }
    } catch (e) {
      console.error("Failed to parse PO data", e)
    }
  }, [])

  useEffect(() => {
    if (poData) {
      document.title = `PO_${poData.details?.poNumber || 'Draft'}`
      // Small delay to ensure fonts and layout are settled
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [poData])

  if (!poData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold text-gray-500">Loading Purchase Order...</div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen w-full">
      <PurchaseOrderTemplate q={poData} />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PrintPage />
  </React.StrictMode>
)
