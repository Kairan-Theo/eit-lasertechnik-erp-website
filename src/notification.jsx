import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { Trash, CheckCheck } from "lucide-react"
import "./index.css"
import { API_BASE_URL } from "./config"

function NotificationsPage() {
  const [notifications, setNotifications] = React.useState([])
  const [query, setQuery] = React.useState("")
  const [confirmClear, setConfirmClear] = React.useState(false)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Cache-Control": "no-store",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      const response = await fetch(`${API_BASE_URL}/api/notifications/`, { headers })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data)
          return
        }
      }
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      const data = list.map(n => ({
        id: n.id,
        message: n.message,
        created_at: n.timestamp,
        is_read: !n.unread,
        type: n.type || "info"
      }))
      setNotifications(data)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      // Fallback to local on error
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      const data = list.map(n => ({
        id: n.id,
        message: n.message,
        created_at: n.timestamp,
        is_read: !n.unread,
        type: n.type || "info"
      }))
      setNotifications(data)
    }
  }

  React.useEffect(() => {
    fetchNotifications()
    // Listen for updates from other components
    const handleUpdate = () => fetchNotifications()
    window.addEventListener("notificationUpdated", handleUpdate)
    window.addEventListener("storage", handleUpdate)
    const interval = setInterval(fetchNotifications, 5000)
    return () => {
      window.removeEventListener("notificationUpdated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
      clearInterval(interval)
    }
  }, [])

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    
    // Always try to update local storage if item exists
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      if (list.some(n => n.id === id)) {
        const next = list.map(n => n.id === id ? { ...n, unread: false } : n)
        localStorage.setItem("notifications", JSON.stringify(next))
      }
    } catch {}

    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        await fetch(`${API_BASE_URL}/api/notifications/read/`, {
          method: "POST",
          headers: { 
              "Authorization": `Token ${token}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ id })
        })
      }
      window.dispatchEvent(new Event("notificationUpdated"))
    } catch (err) {
      console.error("Failed to mark as read", err)
      // Don't revert if local update succeeded, as it might be a local-only notification
      // fetchNotifications() 
    }
  }

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    // Always update local storage
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      const next = list.map(n => ({ ...n, unread: false }))
      localStorage.setItem("notifications", JSON.stringify(next))
    } catch {}

    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        const unread = notifications.filter(n => !n.is_read)
        if (unread.length > 0) {
            await Promise.all(unread.map(n => 
            fetch(`${API_BASE_URL}/api/notifications/read/`, {
                method: "POST",
                headers: { 
                    "Authorization": `Token ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: n.id })
            })
            ))
        }
      }
      window.dispatchEvent(new Event("notificationUpdated"))
    } catch (err) {
      console.error("Failed to mark all as read", err)
      // fetchNotifications()
    }
  }

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation()
    
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id))

    // Always update local storage
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      if (list.some(n => n.id === id)) {
        const next = list.filter(n => n.id !== id)
        localStorage.setItem("notifications", JSON.stringify(next))
      }
    } catch {}

    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Token ${token}`
          }
        })
        if (!res.ok) {
          console.warn("Delete might not be implemented on backend or not found")
        }
      }
      window.dispatchEvent(new Event("notificationUpdated"))
    } catch (err) {
      console.error("Failed to delete notification", err)
    }
  }

  const clearAllNotifications = async () => {
    setNotifications([])
    setConfirmClear(false)
    
    // Always clear local storage
    try {
        localStorage.setItem("notifications", JSON.stringify([]))
    } catch {}

    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        await Promise.all(notifications.map(n => 
          fetch(`${API_BASE_URL}/api/notifications/${n.id}/`, {
              method: "DELETE",
              headers: { "Authorization": `Token ${token}` }
          })
        ))
      }
      window.dispatchEvent(new Event("notificationUpdated"))
    } catch (err) {
      console.error("Failed to clear all", err)
      fetchNotifications()
    }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notifications
    return notifications.filter((n) => {
      return (n.message || "").toLowerCase().includes(q)
    })
  }, [notifications, query])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-500 mt-1">
                You have <span className="font-semibold text-blue-600">{unreadCount}</span> unread messages
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                Refresh
              </button>
               <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                  ${unreadCount === 0 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                  <button
                    onClick={clearAllNotifications}
                    className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1 bg-white text-slate-600 text-xs font-bold rounded border hover:bg-slate-50"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  disabled={notifications.length === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                    ${notifications.length === 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-white text-red-600 border border-red-200 hover:bg-red-50"}`}
                >
                  <Trash className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCheck className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-600">All caught up!</p>
                <p className="text-sm">No notifications to display</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-4 items-start
                      ${!n.is_read ? "bg-blue-50/50" : ""}`}
                  >
                    <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 
                      ${!n.is_read ? "bg-blue-600" : "bg-transparent"}`} 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete notification"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LanguageProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NotificationsPage />
  </React.StrictMode>
)
