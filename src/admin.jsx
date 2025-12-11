import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import AdminPage from "./components/admin-page.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

function AdminRoot() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <AdminPage />
      <Footer />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminRoot />
  </React.StrictMode>,
)
