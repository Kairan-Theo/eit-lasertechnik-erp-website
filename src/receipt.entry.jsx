import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import ReceiptPage from "./receipt.jsx"
import { LanguageProvider } from "./components/language-context"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ReceiptPage />
    </LanguageProvider>
  </React.StrictMode>,
)
