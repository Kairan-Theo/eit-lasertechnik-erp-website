import React from "react"
import ReactDOM from "react-dom/client"
import CRMPage from "./crm.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <CRMPage />
    </LanguageProvider>
  </React.StrictMode>,
)
