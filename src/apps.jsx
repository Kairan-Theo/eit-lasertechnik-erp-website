import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import AppGrid from "./components/app-grid.jsx"
import { LanguageProvider } from "./components/language-context"
import { API_BASE_URL } from "./config"
import "./index.css"

function AppsPage() {
  const [auth, setAuth] = React.useState({ isAuthenticated: false, allowedApps: null, user: null })
  
  React.useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
        if (!isAuthenticated) {
          window.location.href = "/"
          return
        }

        // Initial load from local storage
        let allowedApps = localStorage.getItem("allowedApps")
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}")
        const token = localStorage.getItem("authToken")

        if (mounted) {
          setAuth({ isAuthenticated, allowedApps, user })
        }

        // Fetch fresh permissions from backend
        if (token) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/auth/me/allowed-apps/`, {
              headers: {
                "Authorization": `Token ${token}`
              }
            })
            if (res.ok) {
              const data = await res.json()
              if (data.allowed_apps !== undefined) {
                const newAllowed = data.allowed_apps || ""
                localStorage.setItem("allowedApps", newAllowed)
                if (mounted) {
                  setAuth(prev => ({ ...prev, allowedApps: newAllowed }))
                }
              }
            }
          } catch (err) {
            console.error("Failed to refresh permissions:", err)
          }
        }
      } catch (e) {
        console.error("Auth check error:", e)
        if (mounted) {
          setAuth({ isAuthenticated: false, allowedApps: null, user: null })
        }
      }
    }

    checkAuth()
    
    return () => { mounted = false }
  }, [])

  const canViewApps = (() => {
    if (!auth.isAuthenticated) return false
    if (!auth.allowedApps) return false
    if (auth.allowedApps === "all") return true
    return auth.allowedApps.split(",").map(s => s.trim()).filter(Boolean).length > 0
  })()

  if (!canViewApps) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto p-8">
          <div className="bg-white rounded-xl shadow-md border p-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600 mb-6">
              You are logged in, but your account does not have access to any apps yet.
              Please contact the administrator to request access.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Refresh Permissions
              </button>
              <a href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition">
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    )
  }

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
