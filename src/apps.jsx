import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import AppGrid from "./components/app-grid.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

function AppsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Apps</h1>
          <p className="text-gray-600 mt-2">All your ERP modules in one place.</p>
        </div>
        <AppGrid />
      </section>
      <Footer />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppsPage />
  </React.StrictMode>,
)