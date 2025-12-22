"use client"
import React from "react"
import { API_BASE_URL } from "../config"
import { User, LogOut, ChevronDown, Lock, Edit, Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"

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
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

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

  React.useEffect(() => {
    if (user) {
      setProfileName(user.name || "")
      setProfileCompany(user.company || "")
      setProfileEmail(user.email || "")
      setPreviewImage(user.profile_picture || null)
    }
  }, [user])

  const handleEditProfileSubmit = (e) => {
    e.preventDefault()
    const updatedUser = { ...user, name: profileName, company: profileCompany, email: profileEmail }
    setUser(updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))
    setIsEditProfileOpen(false)
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
  const [notificationsCount, setNotificationsCount] = React.useState(0)
  React.useEffect(() => {
    if (!isAuthenticated) {
      setDueCount(0)
      setNotificationsCount(0)
      return
    }
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
        const token = localStorage.getItem("authToken")
        if (!token) {
          setNotificationsCount(0)
        } else {
          fetch(`${API_BASE_URL}/api/notifications/`, {
            headers: { 
              "Authorization": `Token ${token}`,
              "Cache-Control": "no-store"
            }
          })
            .then(r => r.ok ? r.json() : [])
            .then(list => {
              if (Array.isArray(list)) {
                const unread = list.reduce((acc, n) => acc + (n && n.is_read === false ? 1 : 0), 0)
                setNotificationsCount(unread)
              } else {
                setNotificationsCount(0)
              }
            })
            .catch(() => setNotificationsCount(0))
        }
      } catch {
        setDueCount(0)
        setNotificationsCount(0)
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
              Apps
            </a>
            <a href="/admin.html" className="nav-link text-white hover:text-gray-200 transition">
              Admin
            </a>
            <a href="mailto:it-support@eit.local" className="nav-link text-white hover:text-gray-200 transition">
              Support
            </a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => (window.location.href = "/notification.html")}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
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
            )}
            
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
                <a href="/login.html" className="hidden sm:block rounded-full px-3 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 transition">
                  Log in
                </a>
                <a href="/signup.html" className="bg-white text-[#3D56A6] hover:bg-gray-100 rounded-full px-4 py-1.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5">
                  Sign up
                </a>
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
    </nav>
  )
}
