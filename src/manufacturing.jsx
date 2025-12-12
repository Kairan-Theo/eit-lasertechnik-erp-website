import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

function ManufacturingOrderPage() {
  const [orders, setOrders] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("mfgOrders") || "[]") } catch { return [] }
  })
  const [showNew, setShowNew] = React.useState(false)
  const [newOrder, setNewOrder] = React.useState({ product: "", quantity: 1, scheduledDate: "", bom: "", responsible: "Shwin Pyone Thu" })
  React.useEffect(() => {
    if (!orders.length) {
      const seed = [
        { id: 1, ref: "WH/MO/00001", start: new Date(Date.now() - 2*24*60*60*1000).toISOString(), product: "Laser Cladding Machine", nextActivity: "", source: "", componentStatus: "Available", quantity: 1, state: "Draft", favorite: false, selected: false },
        { id: 2, ref: "WH/MO/00002", start: new Date(Date.now() - 1*24*60*60*1000).toISOString(), product: "Laser Welding Machine", nextActivity: "", source: "", componentStatus: "Available", quantity: 1, state: "Draft", favorite: true, selected: false },
        { id: 3, ref: "WH/MO/00003", start: new Date().toISOString(), product: "Cake", nextActivity: "", source: "", componentStatus: "Available", quantity: 10, state: "Draft", favorite: false, selected: false },
        { id: 4, ref: "WH/MO/00004", start: new Date().toISOString(), product: "mohinga", nextActivity: "", source: "", componentStatus: "Not Available", quantity: 5, state: "Confirmed", favorite: false, selected: false },
      ]
      setOrders(seed)
      localStorage.setItem("mfgOrders", JSON.stringify(seed))
    }
  }, [])
  const setAndPersist = (next) => { setOrders(next); localStorage.setItem("mfgOrders", JSON.stringify(next)) }
  const toggleFavorite = (id) => setAndPersist(orders.map(o => o.id===id ? { ...o, favorite: !o.favorite } : o))
  const toggleSelected = (id) => setAndPersist(orders.map(o => o.id===id ? { ...o, selected: !o.selected } : o))
  const totalQty = orders.reduce((a,b)=>a+(Number(b.quantity)||0),0)
  const relStart = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const diffDays = Math.floor((today.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / (24*60*60*1000))
    if (diffDays<=0) return "Today"
    if (diffDays===1) return "Yesterday"
    return `${diffDays} days ago`
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manufacturing Order</h1>
              <button
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-purple-700 text-white hover:bg-purple-800"
                title="New order"
                onClick={() => setShowNew(true)}
              >
                New
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Products"
                onClick={() => window.location.href = "/products.html"}
              >
                Products
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="p-2 w-8"></th>
                  <th className="p-2 w-8"></th>
                  <th className="p-2 text-left">Reference</th>
                  <th className="p-2 text-left">Start</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Next Activity</th>
                  <th className="p-2 text-left">Source</th>
                  <th className="p-2 text-left">Component Status</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-left">State</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o)=> (
                  <tr key={o.id} className="border-t">
                    <td className="p-2 text-center">
                      <input type="checkbox" checked={o.selected} onChange={()=>toggleSelected(o.id)} />
                    </td>
                    <td className="p-2 text-center">
                      <button className={`text-lg ${o.favorite? 'text-yellow-500':'text-gray-300'}`} onClick={()=>toggleFavorite(o.id)}>★</button>
                    </td>
                    <td className="p-2">
                      <a className="text-blue-600 hover:underline" href="#">{o.ref}</a>
                    </td>
                    <td className="p-2">
                      <span className={`${relStart(o.start)==='Today' ? 'text-green-600' : relStart(o.start)==='Yesterday' ? 'text-orange-600' : 'text-red-600'}`}>{relStart(o.start)}</span>
                    </td>
                    <td className="p-2">
                      <a className="text-blue-600 hover:underline" href="#">{o.product}</a>
                    </td>
                    <td className="p-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300">⏲</span>
                    </td>
                    <td className="p-2">
                      <span className="text-gray-700">{o.source || ''}</span>
                    </td>
                    <td className="p-2">
                      <span className={`${o.componentStatus==='Not Available' ? 'text-red-600' : 'text-gray-700'}`}>{o.componentStatus}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-blue-600">{Number(o.quantity).toFixed(2)}</span>
                    </td>
                    <td className="p-2">
                      <span className={`${o.state==='Confirmed' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-700'} px-2 py-1 rounded-full text-xs`}>{o.state}</span>
                    </td>
                    <td className="p-2 text-center">
                      <button className="text-gray-600">⚙️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td className="p-2" colSpan={8}></td>
                  <td className="p-2 text-right font-semibold">{totalQty.toFixed(2)}</td>
                  <td className="p-2" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
      {showNew && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setShowNew(false)}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[960px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">New Manufacturing Order</h3>
                </div>
                <button className="text-gray-500 hover:text-gray-900" onClick={() => setShowNew(false)}>✕</button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Product</div>
                    <div className="flex items-center gap-2">
                      <input value={newOrder.product} onChange={(e)=>setNewOrder({...newOrder, product:e.target.value})} placeholder="Product to build..." className="w-full border-b border-gray-300 px-2 py-1 focus:outline-none" />
                      <button className="px-2 py-1 rounded border border-gray-300">▾</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Scheduled Date</div>
                    <input type="datetime-local" value={newOrder.scheduledDate} onChange={(e)=>setNewOrder({...newOrder, scheduledDate:e.target.value})} className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Quantity</div>
                    <div className="flex items-center gap-3">
                      <input type="number" value={newOrder.quantity} onChange={(e)=>setNewOrder({...newOrder, quantity:Number(e.target.value)})} className="w-28 rounded-md border border-gray-300 px-2 py-1" />
                      <span className="text-gray-700">To Produce</span>
                      <button className="px-2 py-1 rounded-md border border-gray-300 bg-gray-50">📈</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Responsible</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500 text-white text-sm">A</span>
                      <input value={newOrder.responsible} onChange={(e)=>setNewOrder({...newOrder, responsible:e.target.value})} className="w-64 rounded-md border border-gray-300 px-2 py-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <div className="text-sm text-gray-700">Bill of Material</div>
                    <input value={newOrder.bom} onChange={(e)=>setNewOrder({...newOrder, bom:e.target.value})} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center border-b">
                    <button className="px-3 py-2 text-purple-700 border-b-2 border-purple-700">Components</button>
                    <button className="px-3 py-2 text-gray-600">Miscellaneous</button>
                  </div>
                  <div className="border rounded-b-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-700">
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-left">To Consume</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">
                            <a className="text-teal-700" href="#">Add a line</a>
                            <span className="mx-3"></span>
                            <a className="text-teal-700" href="#">Catalog</a>
                          </td>
                          <td className="p-2"></td>
                        </tr>
                        <tr className="h-12 border-t"><td></td><td></td></tr>
                        <tr className="h-12 border-t"><td></td><td></td></tr>
                        <tr className="h-12 border-t"><td></td><td></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowNew(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-800"
                  onClick={() => {
                    const ref = `WH/MO/${String((orders[0]?.id||0)+1).padStart(5,'0')}`
                    const o = { id: Date.now(), ref, start: newOrder.scheduledDate || new Date().toISOString(), product: newOrder.product || "Untitled", nextActivity: "", source: "", componentStatus: "Available", quantity: Number(newOrder.quantity)||1, state: "Draft", favorite: false, selected: false }
                    const next = [o, ...orders]
                    setOrders(next)
                    localStorage.setItem("mfgOrders", JSON.stringify(next))
                    setShowNew(false)
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ManufacturingOrderPage />
  </React.StrictMode>,
)
