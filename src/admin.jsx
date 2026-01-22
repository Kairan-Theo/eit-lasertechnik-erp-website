import React from "react"  //hello 
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import AdminPage from "./components/admin-page.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function AdminRoot() {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    // Automatically grant admin access
    try {
      const role = localStorage.getItem("userRole")
      const auth = localStorage.getItem("isAuthenticated")
      if (auth !== "true" || role !== "Admin") {
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("userRole", "Admin")
        localStorage.setItem("currentUser", JSON.stringify({ 
          email: "admin@eit.com", 
          name: "Admin User", 
          role: "Admin",
          company: "EIT Lasertechnik" 
        }))
        localStorage.setItem("allowedApps", "all")
      }
    } catch {}
    setReady(true)
  }, [])

  if (!ready) return null

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
