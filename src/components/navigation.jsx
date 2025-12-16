"use client"
import React from "react"

export default function Navigation() {
  const handleLogoClick = () => {
    window.location.href = "/"
  }

  const handleNavClick = (e) => {
    e.preventDefault()
  }

  const [dueCount, setDueCount] = React.useState(0)
  React.useEffect(() => {
    const compute = () => {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("history:"))
        let count = 0
        keys.forEach((k) => {
          const h = JSON.parse(localStorage.getItem(k) || "{}")
          ;(h.invoices || []).forEach((inv) => {
            const due = inv.details?.dueDate
            if (due) {
              const d = new Date(due).getTime()
              const now = Date.now()
              const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
              if (diffDays <= 3 && diffDays >= 0) {
                count += 1
              }
            }
          })
        })
        setDueCount(count)
      } catch {
        setDueCount(0)
      }
    }
    compute()
    const id = setInterval(compute, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#2D4485] to-[#3D56A6] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition"
          >
            <span className="font-semibold text-lg">EIT Lasertechnik</span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            <a href="/apps.html" className="nav-link text-white hover:text-gray-200 transition">
              App
            </a>
            <a href="#" onClick={handleNavClick} className="nav-link text-white hover:text-gray-200 transition">
              Industry
            </a>
            <a href="#" onClick={handleNavClick} className="nav-link text-white hover:text-gray-200 transition">
              Community
            </a>
            <a href="#" onClick={handleNavClick} className="nav-link text-white hover:text-gray-200 transition">
              Pricing
            </a>
            <a href="#" onClick={handleNavClick} className="nav-link text-white hover:text-gray-200 transition">
              Help
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/admin.html?view=notifications")}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Due notifications"
              title={dueCount > 0 ? `${dueCount} upcoming payment due` : "No upcoming payments"}
            >
              <span className="text-lg">🔔</span>
              {dueCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                  {dueCount}
                </span>
              )}
            </button>
            <a href="/login.html" className="hidden sm:block rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 transition">
              Log in
            </a>
            <a href="/signup.html" className="bg-white text-[#3D56A6] hover:bg-gray-100 rounded-full px-5 py-2 font-semibold shadow-sm transition hover:-translate-y-0.5">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
