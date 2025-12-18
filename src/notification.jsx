import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { Trash } from "lucide-react"
import "./index.css"

function NotificationsPage() {
  const [teamAlerts, setTeamAlerts] = React.useState([])
  const [query, setQuery] = React.useState("")
  const [confirmClear, setConfirmClear] = React.useState(false)
  const [hoveredIndex, setHoveredIndex] = React.useState(-1)
  const [confirmDeleteKey, setConfirmDeleteKey] = React.useState(null)

  const loadNotifications = () => {
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      const cleaned = list.filter((n) => {
        const isWelcome = String(n?.message || "").toLowerCase().startsWith("welcome")
        return !isWelcome
      })
      setTeamAlerts(cleaned)
    } catch {
      setTeamAlerts([])
    }
  }

  React.useEffect(() => {
    loadNotifications()
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      if (list.some(n => n.unread !== false)) {
        const next = list.map(n => ({ ...n, unread: false }))
        localStorage.setItem("notifications", JSON.stringify(next))
        window.dispatchEvent(new Event("storage"))
        setTeamAlerts(next)
      }
    } catch {}
    const handleStorage = () => loadNotifications()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])
  
  const clearNotifications = () => {
    localStorage.removeItem("notifications")
    setTeamAlerts([])
    window.dispatchEvent(new Event("storage"))
  }
  
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teamAlerts
    const getSourceFromMessage = (m) => {
      const t = String(m || "")
      const idx = t.indexOf(":")
      return idx > 0 ? t.slice(0, idx).trim().toLowerCase() : ""
    }
    return teamAlerts.filter((n) => {
      const company = (n.company || "").toLowerCase()
      const source = (n.source || "").toLowerCase() || getSourceFromMessage(n.message)
      return company.includes(q) || source.includes(q)
    })
  }, [teamAlerts, query])
  
  const deleteNotification = (key) => {
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      let removed = false
      const next = []
      for (const n of list) {
        const matchById = key && key.id != null && n.id === key.id
        const matchByContent = key && key.id == null && n.message === key.message && n.timestamp === key.timestamp
        if (!removed && (matchById || matchByContent)) {
          removed = true
          continue
        }
        next.push(n)
      }
      localStorage.setItem("notifications", JSON.stringify(next))
      setTeamAlerts(next)
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#2D4485]">Notifications</h1>
            {teamAlerts.length > 0 && (
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
                placeholder="Search by company or page (CRM, MO, PO)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="text-sm text-gray-600">No recent activity.</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
                {filtered.map((n, i) => {
                  const baseClass = n.type==='success' ? 'bg-green-50 border-green-200' : (n.unread ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200')
                  const hoverClass = hoveredIndex === i ? 'bg-[#2D4485]/10 border-[#2D4485]/20' : baseClass
                  const m = String(n.message || "")
                  const idx = m.indexOf(":")
                  const inferred = idx > 0 ? m.slice(0, idx).trim() : ""
                  const src = (n.source || inferred || "").trim()
                  const rest = idx > 0 ? m.slice(idx + 1).trim() : m
                  return (
                    <div 
                      key={n.id || i}
                      className={`p-3 rounded-md border ${hoverClass} flex justify-between items-start`}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(-1)}
                    >
                      <div className="text-sm text-gray-800 flex items-start">
                        <span className="font-semibold mr-2">{src}</span>
                        <span className="font-semibold mr-2">{n.company || ""}</span>
                        <span className="flex-1">
                          {(() => {
                            const t = String(rest || "")
                            const re = /\bfrom\s+(.+?)\s+-->\s+(.+?)(?:\s|$)/i
                            const m2 = re.exec(t)
                            if (!m2) return t
                            const before = t.slice(0, m2.index).trimEnd()
                            const after = t.slice(m2.index + m2[0].length)
                            return (
                              <>
                                {before}
                                {before ? " " : ""}
                                <span className="font-semibold">{`from ${m2[1]} --> ${m2[2]}`}</span>
                                {after ? ` ${after}` : ""}
                              </>
                            )
                          })()}
                        </span>
                      </div>
                      {hoveredIndex === i ? (
                        <button
                          className="ml-4 p-1.5 rounded-md text-red-600 hover:bg-red-50"
                          title="Delete"
                          onClick={() => setConfirmDeleteKey({ id: n.id ?? null, message: n.message, timestamp: n.timestamp })}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{new Date(n.timestamp).toLocaleString()}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      {confirmClear && (
        <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setConfirmClear(false)}>
          <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="text-sm font-semibold text-slate-800">Clear Notifications</div>
              </div>
              <div className="p-4 text-sm text-slate-700">
                Are you sure you want to clear all notifications?
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setConfirmClear(false)}>Cancel</button>
                <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={() => { setConfirmClear(false); clearNotifications() }}>Clear All</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteKey != null && (
        <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setConfirmDeleteKey(null)}>
          <div className="absolute left-1/2 top-32 -translate-x-1/2 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="text-sm font-semibold text-slate-800">Delete Notification</div>
              </div>
              <div className="p-4 text-sm text-slate-700">
                Are you sure you want to delete this notification?
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setConfirmDeleteKey(null)}>Cancel</button>
                <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={() => { const key = confirmDeleteKey; setConfirmDeleteKey(null); deleteNotification(key) }}>Delete</button>
              </div>
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
