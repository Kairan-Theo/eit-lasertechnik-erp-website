import React from "react"
import { Factory, Package, Users, Settings, Briefcase, ArrowRight } from "lucide-react"
import { API_BASE_URL } from "../config"

const apps = [
  {
    name: "Manufacturing",
    description: "Production planning, work orders, and shop floor control.",
    icon: Factory,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    href: "/manufacturing.html"
  },
  {
    name: "Inventory",
    description: "Real-time stock tracking, warehousing, and logistics.",
    icon: Package,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    href: "/inventory.html"
  },
  {
    name: "CRM",
    description: "Customer relationship management and sales pipeline.",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    href: "/crm.html"
  },
  {
    name: "Project Management",
    description: "Task tracking, timelines, and resource allocation.",
    icon: Briefcase,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    href: "/project.html"
  },
  {
    name: "Admin",
    description: "System configuration, user roles, and security settings.",
    icon: Settings,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    href: "/admin.html"
  },
]

export default function AppGrid() {
  const [allowedApps, setAllowedApps] = React.useState("all")
  const fetchAllowed = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return
      const r = await fetch(`${API_BASE_URL}/api/auth/me/allowed-apps/`, {
        headers: { "Authorization": `Token ${token}` }
      })
      if (r.ok) {
        const d = await r.json()
        if (typeof d.allowed_apps === "string") {
          setAllowedApps(d.allowed_apps)
          localStorage.setItem("allowedApps", d.allowed_apps)
        }
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    const apps = localStorage.getItem("allowedApps")
    setAllowedApps(apps === null ? "all" : apps)
    fetchAllowed()
    const id = setInterval(fetchAllowed, 5000)
    return () => clearInterval(id)
  }, [])

  // Check if user has NO access at all
  if (allowedApps === "") {
      return (
        <section className="w-full bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto text-center mt-10">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                    <p className="text-gray-500 mb-6">
                        You are not allowed to use any applications yet. 
                        Please contact the Administrator or wait for approval.
                    </p>
                </div>
            </div>
        </section>
      )
  }

  return (
    <section className="w-full bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            const isAllowed = allowedApps === "all" || allowedApps.includes(app.name)
            
            if (!isAllowed) {
               return (
                <div
                  key={app.name}
                  className="group flex flex-col p-6 bg-gray-50 border border-gray-200 rounded-xl opacity-60 cursor-not-allowed text-left h-full grayscale relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <span className="bg-gray-200 text-gray-500 text-xs font-bold px-2 py-1 rounded">Access Restricted</span>
                  </div>
                  <div className="flex items-start justify-between w-full mb-4">
                    <div className={`p-3 rounded-lg bg-gray-100 text-gray-400`}>
                      <app.icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    {app.name}
                  </h3>
                  
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {app.description}
                  </p>
                </div>
               )
            }

            return (
            <button
              key={app.name}
              type="button"
              onClick={() => {
                if (app.href) window.location.href = app.href
              }}
              className="group flex flex-col p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 text-left h-full"
            >
              <div className="flex items-start justify-between w-full mb-4">
                <div className={`p-3 rounded-lg ${app.bgColor} ${app.color} transition-colors group-hover:bg-white group-hover:ring-1 group-hover:ring-gray-200`}>
                  <app.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors -mr-1" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#2D4485] transition-colors">
                {app.name}
              </h3>
              
              <p className="text-sm text-gray-500 leading-relaxed">
                {app.description}
              </p>
            </button>
          )})}
        </div>
      </div>
    </section>
  )
}
