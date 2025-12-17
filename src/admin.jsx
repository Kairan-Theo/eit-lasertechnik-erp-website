import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import AdminPage from "./components/admin-page.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function AdminRoot() {
  const [allowed, setAllowed] = React.useState(false)
  React.useEffect(() => {
    try {
      const role = localStorage.getItem("userRole")
      const auth = localStorage.getItem("isAuthenticated")
      if (auth === "true" && role === "Admin") {
        setAllowed(true)
      } else {
        window.location.href = "/login.html"
      }
    } catch {
      window.location.href = "/login.html"
    }
  }, [])
  if (!allowed) return null
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <AdminPage />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AdminRoot />
    </LanguageProvider>
  </React.StrictMode>,
)
