import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import AppGrid from "./components/app-grid.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function AppsPage() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navigation />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Enterprise Modules</h1>
              <p className="mt-2 text-lg text-gray-500">
                Manage your manufacturing operations with our integrated suite of tools.
              </p>
            </div>
            {/* Optional: Add search or actions here later */}
          </div>
        </div>
      </div>
      <AppGrid />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AppsPage />
    </LanguageProvider>
  </React.StrictMode>,
)
