"use client"
import React from "react"
import { User, LogOut, ChevronDown, Lock, Edit } from "lucide-react"

export default function Navigation() {
  const handleLogoClick = () => {
    window.location.href = "/"
  }

  const handleNavClick = (e) => {
    e.preventDefault()
  }

  const [user, setUser] = React.useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef(null)

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      // ignore
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    try {
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userRole")
      localStorage.removeItem("currentUser")
    } catch {}
    window.location.href = "/"
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
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-white/10 rounded-full pl-1 pr-3 py-1 transition"
                >
                  <img
                    src="/jn.jpg"
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover bg-white shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-8 h-8 rounded-full bg-white text-[#2D4485] flex items-center justify-center font-bold text-sm shadow-sm hidden">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-none max-w-[100px] truncate">{user.email ? user.email.split('@')[0] : "User"}</p>
                    <p className="text-[10px] text-gray-200 leading-none max-w-[100px] truncate">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email ? user.email.split('@')[0] : "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </a>
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Lock className="w-4 h-4" />
                      Change Password
                    </a>
                    
                    <div className="h-px bg-gray-100 my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/login.html" className="hidden sm:block rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 transition">
                  Log in
                </a>
                <a href="/signup.html" className="bg-white text-[#3D56A6] hover:bg-gray-100 rounded-full px-5 py-2 font-semibold shadow-sm transition hover:-translate-y-0.5">
                  Sign up
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
