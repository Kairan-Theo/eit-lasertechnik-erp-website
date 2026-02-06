import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context.jsx"
import { PermissionsManager } from "./components/admin-page.jsx"
import "./index.css"

// SupportPermissionsPage: A standalone page for managing user permissions
// Restricted to specific administrative users
function SupportPermissionsPage() {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  // Load current user from local storage on mount
  React.useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "{}")
      setUser(u)
    } catch {}
    setLoading(false)
  }, [])

  if (loading) return null

  // Strict Access Control: Only allow specific email (htetyunn06@gmail.com)
  // This is a hardcoded safety check for this specific support page
  if (!user || user.email !== "htetyunn06@gmail.com") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
           </div>
           <h1 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
           <p className="text-gray-600 mb-6">You do not have permission to access this page. This area is restricted to administrators only.</p>
           <a href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition w-full">
             Return to Dashboard
           </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation require="Permission" />
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Permission Control</h1>
          <p className="text-sm text-gray-500 mt-1">Manage which apps each user can access.</p>
        </div>
        {/* Reuse the PermissionsManager component from admin-page */}
        <PermissionsManager />
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <SupportPermissionsPage />
    </LanguageProvider>
  </React.StrictMode>
)
