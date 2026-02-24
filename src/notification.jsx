import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { Trash, CheckCheck, AlertCircle, User, Info, Truck, Package } from "lucide-react"
import { format } from "date-fns"
import "./index.css"
import { API_BASE_URL } from "./config"
// Comment: Fix incorrect relative path; notification.jsx is in src/, components also in src/
// Comment: Import Toaster from the shared UI components directory
import { Toaster } from "./components/ui/toaster"

function NotificationsPage() {
  const [notifications, setNotifications] = React.useState([])
  const [query, setQuery] = React.useState("")
  const [confirmClear, setConfirmClear] = React.useState(false)
  // Track which notifications are selected for bulk actions
  const [selectedIds, setSelectedIds] = React.useState([])

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
        if (Array.isArray(data)) {
          // Comment: Filter out IDs that were client-cleared when backend delete is unavailable
          let deletedIds = []
          try { deletedIds = JSON.parse(localStorage.getItem("notification_deleted_ids") || "[]") } catch {}
          const filteredApi = data.filter(n => !deletedIds.includes(n.id))
          setNotifications(filteredApi)
          return
        }
      }
      const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
      const list = Array.isArray(raw) ? raw : []
      // Comment: Apply client-side deleted IDs to local notifications as well
      let deletedIds = []
      try { deletedIds = JSON.parse(localStorage.getItem("notification_deleted_ids") || "[]") } catch {}
      const data = list.map(n => ({
        id: n.id,
        message: n.message,
        created_at: n.timestamp,
        is_read: !n.unread,
        type: n.type || "info"
      })).filter(n => !deletedIds.includes(n.id))
      setNotifications(data)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      // Fallback to local on error
      let list = []
      try {
        const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
        list = Array.isArray(raw) ? raw : []
      } catch {}
      
      let deletedIds = []
      try { deletedIds = JSON.parse(localStorage.getItem("notification_deleted_ids") || "[]") } catch {}
      const data = list.map(n => ({
        id: n.id,
        message: n.message,
        created_at: n.timestamp,
        is_read: !n.unread,
        type: n.type || "info"
      })).filter(n => !deletedIds.includes(n.id))
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
      const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
      const list = Array.isArray(raw) ? raw : []
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
      const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
      const list = Array.isArray(raw) ? raw : []
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
      const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
      const list = Array.isArray(raw) ? raw : []
      if (list.some(n => n.id === id)) {
        const next = list.filter(n => n.id !== id)
        localStorage.setItem("notifications", JSON.stringify(next))
      }
    } catch {}

    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/`, {
        method: "DELETE",
        headers
      })
      if (!res.ok) {
        console.warn("Delete might not be implemented on backend or not found")
      }
      
      window.dispatchEvent(new Event("notificationUpdated"))
    } catch (err) {
      console.error("Failed to delete notification", err)
    }
  }

  const clearAllNotifications = async () => {
    setConfirmClear(false)
    try {
      // Comment: Prefer backend bulk CLEAR endpoint for reliable DB deletion
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/api/notifications/clear_all/`, {
        method: "DELETE",
        headers
      })
      if (!res.ok) {
        console.warn("Bulk clear failed on backend; fallback to local clear")
      }
    } catch (err) {
      console.error("Failed to call bulk clear endpoint", err)
    }
    // Comment: Clear local mirror regardless to ensure UI consistency
    try {
      localStorage.setItem("notifications", JSON.stringify([]))
      localStorage.setItem("notification_deleted_ids", JSON.stringify([]))
    } catch {}
    setNotifications([])
    window.dispatchEvent(new Event("notificationUpdated"))
  }

  // Toggle selection for a single notification (used by checkboxes)
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Delete all currently selected notifications
  const deleteSelectedNotifications = async () => {
    if (selectedIds.length === 0) return
    // Perform deletes one by one, reusing existing deleteNotification logic
    await Promise.all(selectedIds.map((id) => deleteNotification(id)))
    setSelectedIds([])
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
        <Toaster />
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-500 mt-1">
                You have <span className="font-semibold text-blue-600">{unreadCount}</span> unread messages
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={fetchNotifications}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors bg-white/90 text-slate-700 border border-slate-200 hover:bg-white shadow-sm"
              >
                Refresh
              </button>
               <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm
                  ${unreadCount === 0 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>

              <button
                onClick={deleteSelectedNotifications}
                disabled={selectedIds.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors border
                  ${selectedIds.length === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}
              >
                <Trash className="w-4 h-4" />
                Delete selected
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                  <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                  <button
                    onClick={clearAllNotifications}
                    className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1 bg-white text-slate-600 text-xs font-bold rounded-full border hover:bg-slate-50"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  disabled={notifications.length === 0}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors border
                    ${notifications.length === 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}
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
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-4 items-center
                      ${!n.is_read ? "bg-blue-50/50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(n.id)}
                      onChange={() => toggleSelect(n.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-blue-600 rounded border-slate-300"
                    />
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        n.type === 'alert' || n.type === 'activity_schedule_reminder' ? 'bg-red-100 text-red-600' : 
                        n.type === 'billing_note_reminder' ? 'bg-orange-100 text-orange-600' :
                        n.type === 'manufacturing_finish' ? 'bg-blue-200 text-blue-900' :
                        n.type === 'delivery_updates' ? 'bg-green-100 text-green-800' :
                        n.type === 'inventory_updates' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                         {n.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : 
                          n.type === 'activity_schedule_reminder' ? <AlertCircle className="w-5 h-5" /> : 
                          n.type === 'billing_note_reminder' ? <AlertCircle className="w-5 h-5" /> :
                          n.type === 'manufacturing_finish' ? <CheckCheck className="w-5 h-5" /> :
                          n.type === 'delivery_updates' ? <Truck className="w-5 h-5" /> :
                          n.type === 'inventory_updates' ? <Package className="w-5 h-5" /> :
                          (n.type === 'signup' || n.type === 'user_registration') ? <User className="w-5 h-5" /> : 
                          <Info className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(() => {
                            try {
                                return format(new Date(n.created_at), "MMM d, h:mm a")
                            } catch {
                                return "Just now"
                            }
                        })()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                         {!n.is_read && (
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm"></div>
                         )}
                         <button
                           onClick={(e) => deleteNotification(n.id, e)}
                           className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                           title="Delete notification"
                         >
                           <Trash className="w-4 h-4" />
                         </button>
                    </div>
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
