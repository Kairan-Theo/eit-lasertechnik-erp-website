const apps = [
  { name: "Manufacturing", color: "bg-orange-500", icon: "🏭" },
  { name: "Inventory", color: "bg-green-500", icon: "📦" },
  { name: "CRM", color: "bg-red-500", icon: "👥" },
  { name: "Admin", color: "bg-pink-500", icon: "👔", href: "/admin.html" },
  { name: "Project Management", color: "bg-lime-500", icon: "🎯" },
]

export default function AppGrid() {
  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">All Your Business Needs in One Platform</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Integrated ERP apps designed specifically for manufacturing operations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apps.map((app) => {
            const card = (
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="flex flex-col items-center gap-4">
                  <div className={`${app.color} w-16 h-16 rounded-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                    {app.icon}
                  </div>
                  <p className="text-center font-semibold text-gray-900 text-sm">{app.name}</p>
                </div>
              </div>
            )
            return app.href ? (
              <a key={app.name} href={app.href} aria-label={app.name}>
                {card}
              </a>
            ) : (
              <div key={app.name}>{card}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
