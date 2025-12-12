import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

function InventoryTabs() {
  const tabs = ["Inventory", "Overview", "Operation", "Product", "Reporting", "Configuration"]
  const [active, setActive] = React.useState("Inventory")
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={
            "px-3 py-1 rounded-md text-sm border " +
            (active === t ? "bg-gray-200 border-gray-300" : "bg-gray-100 border-gray-200 hover:bg-gray-200")
          }
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function StatCard({ title }) {
  return (
    <div className="border rounded-md p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-teal-700 font-semibold">{title}</h3>
        <span className="px-2 py-1 text-xs rounded-md bg-purple-100 text-purple-700">open</span>
      </div>
      <div className="grid grid-cols-6 gap-2 text-gray-200">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

function InventoryOverview() {
  const [query, setQuery] = React.useState("")
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Inventory Overview <span className="inline-block align-middle">⚙️</span>
        </h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 rounded-md border border-gray-300 px-3 py-2"
            placeholder="search..."
          />
          <button className="px-3 py-2 rounded-md border border-gray-300 bg-white">▾</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="receipt" />
        <StatCard title="Shipping order" />
        <StatCard title="Production" />
      </div>
    </div>
  )
}

function InventoryPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <InventoryTabs />
          <InventoryOverview />
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InventoryPage />
  </React.StrictMode>,
)
