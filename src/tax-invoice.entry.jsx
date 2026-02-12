import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import TaxInvoicePage from "./tax-invoice.jsx"
import { LanguageProvider } from "./components/language-context"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <TaxInvoicePage />
    </LanguageProvider>
  </React.StrictMode>,
)
