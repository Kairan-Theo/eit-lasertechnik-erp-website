import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function useContacts() {
  const [query, setQuery] = React.useState("")
  const [contacts, setContacts] = React.useState(() => {
    try { 
      const v = JSON.parse(localStorage.getItem("crmContacts") || "[]")
      return Array.isArray(v) ? v : []
    } catch { 
      return [] 
    }
  })
  const addContact = (c) => {
    const next = [{ 
      name: c.name?.trim() || "Untitled", 
      contact: c.contact?.trim() || "", 
      email: c.email?.trim() || "", 
      phone: c.phone?.trim() || "", 
      address: c.address?.trim() || "", 
      updatedAt: new Date().toISOString() 
    }, ...contacts]
    setContacts(next)
    try { localStorage.setItem("crmContacts", JSON.stringify(next.slice(0, 500))) } catch {}
  }
  const filtered = contacts.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [c.name, c.contact, c.email, c.phone, c.address].some((x) => String(x || "").toLowerCase().includes(q))
  })
  return { query, setQuery, filtered, addContact }
}

function ContactsPage() {
  const cx = useContacts()
  const [showAdd, setShowAdd] = React.useState(false)
  const [f, setF] = React.useState({ name: "", contact: "", email: "", phone: "", address: "" })
  const canAdd = Boolean(f.name)
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contacts Directory</h1>
            <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white" onClick={() => setShowAdd(true)}>Add Contact</button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <input value={cx.query} onChange={(e) => cx.setQuery(e.target.value)} placeholder="Search by company, contact, email, phone" className="w-full sm:w-96 rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cx.filtered.map((c, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-500">{new Date(c.updatedAt || Date.now()).toLocaleDateString()}</div>
                </div>
                <div className="mt-2 text-sm text-gray-800">{c.contact || "-"}</div>
                <div className="mt-1 text-xs text-gray-600">
                  <a href={`mailto:${c.email || ""}`} className="underline">{c.email || "-"}</a>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  <a href={`tel:${c.phone || ""}`} className="underline">{c.phone || "-"}</a>
                </div>
                <div className="mt-2 text-xs text-gray-600">{c.address || "-"}</div>
              </div>
            ))}
            {!cx.filtered.length && (
              <div className="text-sm text-gray-600">No contacts yet. Add from here or update deals in CRM.</div>
            )}
          </div>
        </div>
      </section>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">New Contact</div>
            <div className="space-y-3">
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Company name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="Contact person" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Address" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white">Cancel</button>
                <button disabled={!canAdd} onClick={() => { cx.addContact(f); setShowAdd(false); setF({ name: "", contact: "", email: "", phone: "", address: "" }) }} className="px-3 py-1.5 rounded-md bg-[#2D4485] text-white disabled:opacity-50">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ContactsPage />
    </LanguageProvider>
  </React.StrictMode>,
)
