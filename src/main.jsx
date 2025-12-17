import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)
