import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function ProductsPage() {
  const [products, setProducts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("mfgProducts") || "[]") } catch { return [] }
  })
  React.useEffect(() => {
    if (!products.length) {
      const seed = [
        { id: 1, name: "Laser Cladding Machine", sku: "LCM-001", category: "Machine", qty: 12, state: "Active", favorite: false },
        { id: 2, name: "Laser Welding Machine", sku: "LWM-002", category: "Machine", qty: 8, state: "Active", favorite: true },
        { id: 3, name: "Cake", sku: "CK-003", category: "Food", qty: 50, state: "Inactive", favorite: false },
        { id: 4, name: "mohinga", sku: "MHG-004", category: "Food", qty: 24, state: "Active", favorite: false },
      ]
      setProducts(seed)
      localStorage.setItem("mfgProducts", JSON.stringify(seed))
    }
  }, [])
  const setAndPersist = (next) => { setProducts(next); localStorage.setItem("mfgProducts", JSON.stringify(next)) }
  const toggleFavorite = (id) => setAndPersist(products.map(p => p.id===id ? { ...p, favorite: !p.favorite } : p))

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
              <button
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-purple-700 text-white hover:bg-purple-800"
                title="New product"
                onClick={() => alert("New product not implemented yet")}
              >
                New
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Manufacturing Orders"
                onClick={() => window.location.href = "/manufacturing.html"}
              >
                Manufacturing Orders
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="p-2 w-8"></th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Quantity Available</th>
                  <th className="p-2 text-left">State</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p)=> (
                  <tr key={p.id} className="border-t">
                    <td className="p-2 text-center">
                      <button className={`text-lg ${p.favorite? 'text-yellow-500':'text-gray-300'}`} onClick={()=>toggleFavorite(p.id)}>★</button>
                    </td>
                    <td className="p-2">
                      <a className="text-blue-600 hover:underline" href="#">{p.name}</a>
                    </td>
                    <td className="p-2 text-gray-700">{p.sku}</td>
                    <td className="p-2 text-gray-700">{p.category}</td>
                    <td className="p-2 text-right">
                      <span className="text-blue-600">{Number(p.qty).toFixed(2)}</span>
                    </td>
                    <td className="p-2">
                      <span className={`${p.state==='Active' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-700'} px-2 py-1 rounded-full text-xs`}>{p.state}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ProductsPage />
    </LanguageProvider>
  </React.StrictMode>,
)

