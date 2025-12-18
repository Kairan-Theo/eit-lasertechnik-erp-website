import React from "react"
import { Factory, Package, Users, Settings, Briefcase, ArrowRight } from "lucide-react"

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
  return (
    <section className="w-full bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
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
          ))}
        </div>
      </div>
    </section>
  )
}
