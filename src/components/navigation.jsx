"use client"
import React from "react"
import { API_BASE_URL } from "../config"
import { User, LogOut, ChevronDown, Lock, Edit, Bell, Clock, AlertCircle, Check, CheckCheck, Info, Settings, LayoutDashboard, Menu, X, Truck, Package } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"

export default function Navigation({ require }) {
  const { toast } = useToast()
  const lastNotifIdRef = React.useRef(null)
  const initialToastShownRef = React.useRef(false)
  const nextProbeTimeRef = React.useRef(0)
  const handleLogoClick = () => {
    window.location.href = "/"
  }

  const handleNavClick = (e) => {
    e.preventDefault()
  }

  const [user, setUser] = React.useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const dropdownRef = React.useRef(null)
  const notificationRef = React.useRef(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [allowedApps, setAllowedApps] = React.useState(null)

  const isAllowed = (app) => {
    // Admins always have access
    if (user && user.role === "Admin") return true
    
    if (!allowedApps) return false
    if (allowedApps === "all") return true
    return allowedApps.split(",").map(s => s.trim()).includes(app)
  }

  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false)
  
  // Profile Form State
  const [profileName, setProfileName] = React.useState("")
  const [profileCompany, setProfileCompany] = React.useState("")
  const [profileEmail, setProfileEmail] = React.useState("")
  const [profileImage, setProfileImage] = React.useState(null)
  const [previewImage, setPreviewImage] = React.useState(null)

  // Password Form State
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Comment: Popup state for warning when notification count grows too large
  const [showNotifCleanupPopup, setShowNotifCleanupPopup] = React.useState(false)
  const [hasShownNotifCleanupPopup, setHasShownNotifCleanupPopup] = React.useState(false)

  // Comment: Small auth popup state anchored under header buttons
  const [isAuthPopupOpen, setIsAuthPopupOpen] = React.useState(false)
  const [authMode, setAuthMode] = React.useState("login") // 'login' | 'signup'
  const [popupStyle, setPopupStyle] = React.useState({ top: 0, left: 0 })
  const authGoogleRef = React.useRef(null)
  const loginBtnRef = React.useRef(null)
  const signupBtnRef = React.useRef(null)

  // Comment: Reuse same Google auth flow; sign-up does NOT auto-login
  const handleGoogleCallback = async (response) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json()
      if (res.ok) {
        if (authMode === "signup") {
          // Comment: On sign-up, do NOT auto-login; show success and keep popup closed
          toast({
            title: "Sign up successful",
            description: "Please log in using the Log in button.",
          })
          setIsAuthPopupOpen(false)
        } else {
          // Comment: Login flow remains unchanged
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem("userRole", data.role)
          localStorage.setItem("authToken", data.token)
          localStorage.setItem("allowedApps", data.allowed_apps)
          localStorage.setItem("currentUser", JSON.stringify({
            email: data.email, role: data.role, name: data.name,
            profile_picture: data.profile_picture, company: data.company,
            account_type: data.account_type
          }))
          window.location.href = "/apps.html"
        }
      } else {
        alert(data.error || "Google auth failed")
      }
    } catch (err) {
      console.error("Google auth error:", err)
      alert("Unable to connect to server")
    }
  }

  // Comment: Load GIS script and render button when auth popup opens
  React.useEffect(() => {
    if (!isAuthPopupOpen) return
    let script
    const init = async () => {
      const { GOOGLE_CLIENT_ID } = await import("../config.js")
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID" || GOOGLE_CLIENT_ID.includes("placeholder")) {
        // Dev: render simple mock button
        if (authGoogleRef.current) {
          const btn = document.createElement("button")
          btn.type = "button"
          btn.className = "w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          const label = authMode === "signup" ? "Sign up with Google" : "Continue with Google"
          btn.innerHTML = `<svg viewBox="0 0 24 24" class="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> ${label}`
          btn.onclick = () => handleGoogleCallback({ credential: "mock_token_dev_user" })
          authGoogleRef.current.innerHTML = ''
          authGoogleRef.current.appendChild(btn)
        }
        return
      }
      // Real Google buttons
      script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (!script) {
        script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        document.body.appendChild(script)
      }
      const renderButtons = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true
          })
          if (authGoogleRef.current) {
            const text = authMode === "signup" ? "signup_with" : "continue_with"
            window.google.accounts.id.renderButton(authGoogleRef.current, {
              theme: "outline", size: "large", text, shape: "rectangular", logo_alignment: "left",
              width: authGoogleRef.current.offsetWidth || 320
            })
          }
        }
      }
      if (script && !script.onload) script.onload = renderButtons
      else renderButtons()
    }
    init()
    return () => {
      // Comment: popup cleanup minimal; script remains for reuse
    }
  }, [isAuthPopupOpen, authMode])
  React.useEffect(() => {
    if (!require) return
    try {
      const role = localStorage.getItem("userRole")
      if (role === "Admin") return

      const apps = localStorage.getItem("allowedApps")
      if (!apps) {
        window.location.href = "/apps.html"
        return
      }
      if (apps === "all") return

      const list = apps.split(",").map(s => s.trim())
      if (!list.includes(require)) {
        window.location.href = "/apps.html"
      }
    } catch {}
  }, [require])

  React.useEffect(() => {
    if (user) {
      setProfileName(user.name || "")
      setProfileCompany(user.company || "")
      setProfileEmail(user.email || "")
      setPreviewImage(user.profile_picture || null)
    }
  }, [user])

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("authToken")
      const formData = new FormData()
      formData.append("name", profileName)
      formData.append("email", profileEmail)
      formData.append("company", profileCompany)
      if (profileImage) {
        formData.append("profile_picture", profileImage)
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/update/`, {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Token ${token}` } : {})
        },
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        const updatedUser = { 
          ...user, 
          name: data.name, 
          email: data.email, 
          profile_picture: data.profile_picture,
          company: data.company
        }
        setUser(updatedUser)
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setIsEditProfileOpen(false)
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("An error occurred while updating profile")
    }
  }

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault()
    if (!currentPassword) {
      alert("Please enter your current password")
      return
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match")
      return
    }
    // Simulate password change
    setIsChangePasswordOpen(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    alert("Password changed successfully")
  }

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      const auth = localStorage.getItem("isAuthenticated")
      setIsAuthenticated(auth === "true")
      setAllowedApps(localStorage.getItem("allowedApps"))
    } catch (e) {
      // ignore
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
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
      localStorage.removeItem("authToken")
      localStorage.removeItem("allowedApps")
      localStorage.removeItem("notifications")
    } catch {}
    window.location.href = "/"
  }

  const [dueCount, setDueCount] = React.useState(0)
  const [notificationsCount, setNotificationsCount] = React.useState(0)
  const [notifications, setNotifications] = React.useState([])

  // Comment: Sanitize notification text to hide verification codes/auth info
  const getSafeNotifMessage = (n) => {
    const msg = typeof n.message === "string" ? n.message : ""
    const authLike = ['signup', 'user_registration', 'login', 'login_attempt', 'email_verification', 'verification'].includes(n.type)
      || /verify|verification\s*code|otp|auth|login|sign\s*up|signup/i.test(msg)
    if (authLike) {
      if (n.type === 'signup' || n.type === 'user_registration') return "New user registration"
      if (/verify|verification\s*code|otp/i.test(msg)) return "Email verification requested"
      return "Account notification"
    }
    return msg.replace(/\b(code|otp)\s*[:\-]?\s*\d+\b/ig, "$1: *****")
  }
  // Comment: When total notifications (read + unread) reach 50 or more, show a one-time cleanup reminder
  React.useEffect(() => {
    const totalNotifications = Array.isArray(notifications) ? notifications.length : 0
    if (totalNotifications >= 50 && !hasShownNotifCleanupPopup) {
      setShowNotifCleanupPopup(true)
      setHasShownNotifCleanupPopup(true)
    }
  }, [notifications, hasShownNotifCleanupPopup])

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setNotificationsCount(prev => Math.max(0, prev - 1))
    
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
    }
  }

  const markAllRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setNotificationsCount(0)

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
    }
  }

  React.useEffect(() => {
    if (!isAuthenticated) {
      setDueCount(0)
      setNotificationsCount(0)
      setNotifications([])
    }
    const compute = () => {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("history:"))
        let count = 0
        keys.forEach((k) => {
          const h = JSON.parse(localStorage.getItem(k) || "{}")
          const invoices = Array.isArray(h.invoices) ? h.invoices : []
          invoices.forEach((inv) => {
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

        // Notifications: gracefully avoid repeated network errors when backend is down
        const nowTs = Date.now()
        if (nowTs < (nextProbeTimeRef.current || 0)) {
          try {
            const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
            const local = Array.isArray(raw) ? raw : []
            const unread = local.reduce((acc, n) => acc + (n && (n.unread === true || n.is_read === false) ? 1 : 0), 0)
            setNotificationsCount(unread)
            setNotifications(local.map(n => {
              const msg = typeof n.message === "string" && (n.type === "signup" || n.type === "user_registration") ? n.message.replace("New Google user:", "New user:") : n.message
              return {
                id: n.id,
                message: msg,
                created_at: n.timestamp || n.created_at,
                is_read: !n.unread,
                type: n.type || "info"
              }
            }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
          } catch {
            setNotificationsCount(0)
            setNotifications([])
          }
          return
        }

        const token = localStorage.getItem("authToken")
        
        // If no token, avoid 401 errors by using local storage only
        if (!token) {
          try {
            const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
            const local = Array.isArray(raw) ? raw : []
            const unread = local.reduce((acc, n) => acc + (n && (n.unread === true || n.is_read === false) ? 1 : 0), 0)
            setNotificationsCount(unread)
            setNotifications(local.map(n => {
              const msg = typeof n.message === "string" && (n.type === "signup" || n.type === "user_registration") ? n.message.replace("New Google user:", "New user:") : n.message
              return {
                id: n.id,
                message: msg,
                created_at: n.timestamp || n.created_at,
                is_read: !n.unread,
                type: n.type || "info"
              }
            }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
          } catch {
            setNotificationsCount(0)
            setNotifications([])
          }
          return
        }

        const headers = {
          "Cache-Control": "no-store",
          "Authorization": `Token ${token}`
        }
        const controller = new AbortController()
        const tid = setTimeout(() => controller.abort(), 3500)
        fetch(`${API_BASE_URL}/api/notifications/`, { headers, signal: controller.signal })
          .then(r => {
            if (r.status === 401) {
              console.warn("Navigation: 401 Unauthorized - clearing token")
              // Token invalid/expired - clear it so we don't retry in vain
              localStorage.removeItem("authToken")
              throw new Error("Unauthorized")
            }
            return r.ok ? r.json() : Promise.resolve([])
          })
          .then(list => {
            clearTimeout(tid)
            nextProbeTimeRef.current = 0
            console.log("Navigation: fetched notifications:", list.length, list)
            if (Array.isArray(list) && list.length) {
              // Toast Logic for new alerts
              const newestId = Math.max(...list.map(n => n.id))
              if (lastNotifIdRef.current !== null) {
                const newNotifs = list.filter(n => n.id > lastNotifIdRef.current)
                newNotifs.forEach(n => {
                  if (['alert', 'signup', 'user_registration', 'activity_schedule_reminder'].includes(n.type)) {
                    let title = "New Notification"
                    if (n.type === 'alert') title = "Reminder"
                    else if (n.type === 'activity_schedule_reminder') title = "Activity Reminder"
                    else if (['signup', 'user_registration'].includes(n.type)) title = "New Registration"

                    toast({
                      title: title,
                      description: (typeof n.message === "string" && n.type === "signup") ? n.message.replace("New Google user:", "New user:") : n.message,
                    })
                  }
                })
              } else if (!initialToastShownRef.current) {
                const freshAlerts = list.filter(n => {
                  if (!['alert', 'signup', 'user_registration', 'activity_schedule_reminder'].includes(n.type)) return false
                  const t = new Date(n.created_at).getTime()
                  return Date.now() - t < 2 * 60 * 1000
                })
                freshAlerts.forEach(n => {
                  let title = "New Notification"
                  if (n.type === 'alert') title = "Reminder"
                  else if (n.type === 'activity_schedule_reminder') title = "Activity Reminder"
                  else if (['signup', 'user_registration'].includes(n.type)) title = "New Registration"

                  toast({ title: title, description: getSafeNotifMessage(n) })
                })
                initialToastShownRef.current = true
              }
              lastNotifIdRef.current = newestId
              setNotifications(list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
              return
            }
            try {
              const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
              const local = Array.isArray(raw) ? raw : []
              const unread = local.reduce((acc, n) => acc + (n && n.unread === true ? 1 : 0), 0)
              setNotificationsCount(unread)
              setNotifications(local.map(n => ({
                id: n.id,
                message: getSafeNotifMessage({ type: n.type, message: n.message }),
                created_at: n.timestamp || n.created_at,
                is_read: !n.unread,
                type: n.type || "info"
              })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
            } catch {
              setNotificationsCount(0)
              setNotifications([])
            }
          })
          .catch((err) => {
            clearTimeout(tid)
            console.error("Navigation: fetch failed:", err)
            // Backoff 5s (dev mode)
            nextProbeTimeRef.current = Date.now() + 5 * 1000
            try {
              const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
              const local = Array.isArray(raw) ? raw : []
              const unread = local.reduce((acc, n) => acc + (n && (n.unread === true || n.is_read === false) ? 1 : 0), 0)
              setNotificationsCount(unread)
              setNotifications(local.map(n => ({
                id: n.id,
                message: getSafeNotifMessage({ type: n.type, message: n.message }),
                created_at: n.timestamp || n.created_at,
                is_read: !n.unread,
                type: n.type || "info"
              })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
            } catch {
              setNotificationsCount(0)
              setNotifications([])
            }
          })
      } catch {
        setDueCount(0)
        setNotificationsCount(0)
        setNotifications([])
      }
    }
    compute()
    const id = setInterval(compute, 2000)
    window.addEventListener("storage", compute)
    window.addEventListener("notificationUpdated", compute)
    return () => {
      clearInterval(id)
      window.removeEventListener("storage", compute)
      window.removeEventListener("notificationUpdated", compute)
    }
  }, [isAuthenticated])

  return (
    // Increase z-index to 90 to ensure the user profile box (and other dropdowns) appear above the project management page's sticky headers and bars (which use z-30 to z-60)
    <nav className="sticky top-0 z-[90] w-full bg-gradient-to-r from-[#2D4485] to-[#3D56A6] text-white shadow-md">
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
              Apps
            </a>
            <a href="/admin.html" className="nav-link text-white hover:text-gray-200 transition">
              Admin
            </a>
            {user && (user.role === "Admin" || user.account_type === "permission_control") && (
              <a href="/support.html" className="nav-link text-white hover:text-gray-200 transition">
                User Permissions
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full transition ${isNotificationOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  aria-label="Due notifications"
                  title={notificationsCount > 0 ? `${notificationsCount} notifications` : "No notifications"}
                >
                  <Bell className="w-6 h-6" />
                  {notificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-red-300">
                      {notificationsCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-[400px] bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                         {/* Header */}
                         <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                             <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                             <div className="flex items-center gap-2">
                                 <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={notificationsCount === 0}>
                                    Mark all as read
                                 </button>
                             </div>
                         </div>
                         
                         {/* List */}
                         <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="bg-gray-100 p-3 rounded-full mb-3">
                                         <Bell className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(n => (
                                        <div 
                                          key={n.id} 
                                          className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-blue-50/30' : ''}`} 
                                          onClick={(e) => markAsRead(n.id, e)}
                                        >
                                            {/* Icon */}
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
                                                 <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                    {getSafeNotifMessage(n)}
                                                 </p>
                                                 <p className="text-xs text-gray-400 mt-1">
                                                    {(() => {
                                                        try {
                                                            return format(new Date(n.created_at), "MMM d, h:mm a")
                                                        } catch {
                                                            return "Just now"
                                                        }
                                                    })()}
                                                 </p>
                                            </div>
                                            {!n.is_read && (
                                                <div className="flex-shrink-0 self-center">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>

                         {/* Footer */}
                         <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                             <a href="/notification.html" className="text-xs font-medium text-blue-600 hover:text-blue-700 block w-full py-1">View all notifications</a>
                         </div>
                    </div>
                )}
              </div>
            )}
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition ${isDropdownOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className={`w-8 h-8 rounded-full object-cover bg-white shadow-sm ${!user.profile_picture ? 'hidden' : ''}`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={`w-8 h-8 rounded-full bg-white text-[#2D4485] flex items-center justify-center font-bold text-sm shadow-sm ${user.profile_picture ? 'hidden' : 'flex'}`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-none max-w-[100px] truncate">
                      {user.name || (user.email ? user.email.split('@')[0] : "User")}
                    </p>
                    <p className="text-[10px] text-gray-200 leading-none max-w-[100px] truncate">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name || (user.email ? user.email.split('@')[0] : "User")}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.company && <p className="text-xs text-gray-400 truncate mt-0.5">{user.company}</p>}
                    </div>
                    
                    <button onClick={() => { setIsEditProfileOpen(true); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button onClick={() => { setIsChangePasswordOpen(true); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <Lock className="w-4 h-4" />
                      Change Password
                    </button>
                    
                    <div className="h-px bg-gray-100 my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2D4485] hover:bg-blue-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Comment: Only Log in kept; Sign up button removed */}
                <button
                  type="button"
                  ref={loginBtnRef}
                  onClick={(e) => {
                    setAuthMode("login")
                    const rect = loginBtnRef.current?.getBoundingClientRect()
                    if (rect) {
                      // Comment: center under button and clamp within viewport
                      const popupW = 320
                      const margin = 12
                      const center = rect.left + rect.width / 2
                      const minLeft = margin + popupW / 2
                      const maxLeft = (window.innerWidth - margin) - popupW / 2
                      const clamped = Math.max(minLeft, Math.min(maxLeft, center))
                      setPopupStyle({ top: rect.bottom + 8, left: clamped })
                    }
                    setIsAuthPopupOpen(true)
                  }}
                  className="rounded-full px-3 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 transition"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfileSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="picture" className="text-right">
                  Picture
                </Label>
                <div className="col-span-3">
                  <Input
                    id="picture"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                          setProfileImage(file)
                          setPreviewImage(URL.createObjectURL(file))
                      }
                    }}
                    accept="image/*"
                  />
                  {previewImage && <img src={previewImage} alt="Preview" className="mt-2 w-16 h-16 rounded-full object-cover" />}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Company
                </Label>
                <Input
                  id="company"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-password" className="text-right">
                  Current
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-password" className="text-right">
                  Confirm
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Change Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showNotifCleanupPopup && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 relative">
            {/* Comment: Popup warning when notification bell count reaches 50 or more */}
            <button
              type="button"
              onClick={() => setShowNotifCleanupPopup(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              aria-label="Close notification cleanup warning"
            >
              ×
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Too many notifications
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  You have reached {Array.isArray(notifications) ? notifications.length : 0} notifications. Please consider deleting old items to keep things organized and reduce confusion.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNotifCleanupPopup(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Later
              </button>
              <button
                onClick={() => setShowNotifCleanupPopup(false)}
                className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-red-500 hover:bg-red-600 shadow-sm"
              >
                OK, I&apos;ll clean up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment: Small anchored auth popup showing one Google option */}
      {isAuthPopupOpen && (
        <div
          className="fixed z-[96]"
          style={{ top: popupStyle.top, left: popupStyle.left, transform: "translateX(-50%)" }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-[320px] p-3 relative">
            <button
              type="button"
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
              aria-label="Close auth popup"
              onClick={() => setIsAuthPopupOpen(false)}
            >
              ×
            </button>
            <div className="text-xs font-medium text-slate-600 mb-2">
              {authMode === "signup" ? "Sign up with Google" : "Continue with Google"}
            </div>
            <div ref={authGoogleRef} className="w-full flex justify-center"></div>
          </div>
        </div>
      )}
    </nav>
  )
}
