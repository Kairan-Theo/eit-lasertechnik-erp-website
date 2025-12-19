import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { Trash } from "lucide-react"
import "./index.css"

function NotificationsPage() {
  const [notifications, setNotifications] = React.useState([])
  const [query, setQuery] = React.useState("")
  const [confirmClear, setConfirmClear] = React.useState(false)
  const [hoveredIndex, setHoveredIndex] = React.useState(-1)
  const [confirmDeleteKey, setConfirmDeleteKey] = React.useState(null)

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return

      const response = await fetch("http://localhost:8001/api/notifications/", {
        headers: { "Authorization": `Token ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (err) {
      console.error("Failed to load notifications", err)
      setNotifications([])
    }
  }

  React.useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      await fetch("http://localhost:8001/api/notifications/read/", {
        method: "POST",
        headers: { 
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id })
      })
      // Remove from list or mark as read? User asked to "clear", so let's remove it from the view effectively
      // But usually we just mark read. The "Delete" button suggests removal.
      // So "Delete" -> Mark Read & Remove from local state
      setNotifications(notifications.filter(n => n.id !== id))
      
      // Update badge count in Navigation (via event dispatch if needed, or Navigation polls)
      window.dispatchEvent(new Event("notificationUpdated"))
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }

  const clearAllNotifications = async () => {
    // Since backend doesn't have bulk clear, we loop through unread ones or all
    // For now, just mark all visible as read/cleared locally and try to sync
    const token = localStorage.getItem("authToken")
    const promises = notifications.map(n => 
        fetch("http://localhost:8001/api/notifications/read/", {
            method: "POST",
            headers: { 
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: n.id })
        })
    )
    await Promise.all(promises)
    setNotifications([])
    window.dispatchEvent(new Event("notificationUpdated"))
  }
  
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notifications
    return notifications.filter((n) => {
      return (n.message || "").toLowerCase().includes(q)
    })
  }, [notifications, query])
  
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#2D4485]">Notifications</h1>
            {notifications.length > 0 && (
              <button 
                className="btn-outline"
                onClick={() => setConfirmClear(true)}
              >
                Clear All
              </button>
            )}
          </div>
          <div className="card p-6">
            <div className="mb-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="text-sm text-gray-600">No recent activity.</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
                {filtered.map((n, i) => {
                  const baseClass = !n.is_read ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                  const hoverClass = hoveredIndex === i ? 'bg-[#2D4485]/10 border-[#2D4485]/20' : baseClass
                  
                  return (
                    <div 
                      key={n.id || i}
                      className={`p-3 rounded-md border ${hoverClass} flex justify-between items-start transition-colors`}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(-1)}
                    >
                      <div className="text-sm text-gray-800 flex items-start flex-1">
                        <span className={`flex-1 ${!n.is_read ? 'font-semibold text-[#2D4485]' : ''}`}>
                          {n.message}
                        </span>
                      </div>
                      <div className="flex items-center ml-4">
                          <span className="text-xs text-gray-500 whitespace-nowrap mr-3">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                          {hoveredIndex === i && (
                            <button
                              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete / Mark Read"
                              onClick={() => setConfirmDeleteKey({ id: n.id })}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      {confirmClear && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setConfirmClear(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="text-sm font-semibold text-slate-800">Clear Notifications</div>
            </div>
            <div className="p-4 text-sm text-slate-700">
              Are you sure you want to clear all notifications?
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={() => { setConfirmClear(false); clearAllNotifications() }}>Clear All</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteKey != null && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setConfirmDeleteKey(null)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="text-sm font-semibold text-slate-800">Delete Notification</div>
            </div>
            <div className="p-4 text-sm text-slate-700">
              Are you sure you want to delete this notification?
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setConfirmDeleteKey(null)}>Cancel</button>
              <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={() => { const key = confirmDeleteKey; setConfirmDeleteKey(null); markAsRead(key.id) }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function NotificationRoot() {
  const [allowed, setAllowed] = React.useState(false)
  React.useEffect(() => {
    try {
      const auth = localStorage.getItem("isAuthenticated")
      if (auth === "true") {
        setAllowed(true)
      } else {
        window.location.href = "/login.html"
      }
    } catch {
      window.location.href = "/login.html"
    }
  }, [])
  if (!allowed) return null
  return <NotificationsPage />
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <NotificationRoot />
    </LanguageProvider>
  </React.StrictMode>,
)
