import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

const initialPipeline = {
  New: [
    { id: 1, title: "Disscuing Goods Price", customer: "Big C Supercenter PLC", amount: 0, currency: "฿", priority: "none", contact: "", email: "", phone: "", notes: "" },
  ],
  Qualified: [
    { id: 2, title: "Selling New Machines", customer: "SIANGHAI EITING TRADING COMPANY", amount: 50000, currency: "฿", priority: "high", contact: "", email: "", phone: "", notes: "" },
  ],
  Proposition: [
    { id: 3, title: "Introduced New Plan about Manufacturing", customer: "METRO MACHINERY", amount: 100, currency: "฿", priority: "medium", contact: "", email: "", phone: "", notes: "" },
  ],
  Won: [
    { id: 4, title: "Negotitated and made contract", customer: "Konvy", amount: 80000, currency: "฿", priority: "low", contact: "", email: "", phone: "", notes: "" },
  ],
  Lost: [],
}

function CRMPage() {
  const [stages, setStages] = React.useState(
    Object.entries(initialPipeline).map(([name, deals], idx) => ({ id: idx + 1, name, deals }))
  )
  const [menuOpenIndex, setMenuOpenIndex] = React.useState(null)
  const [openCardMenu, setOpenCardMenu] = React.useState(null) // { stageIndex, cardIndex }
  const [showNewForm, setShowNewForm] = React.useState(false)
  const [openDetail, setOpenDetail] = React.useState(null) // { stageIndex, cardIndex }
  const [detailNotes, setDetailNotes] = React.useState("")
  const [detailContact, setDetailContact] = React.useState("")
  const [detailEmail, setDetailEmail] = React.useState("")
  const [detailPhone, setDetailPhone] = React.useState("")
  const defaultNewDeal = {
    company: "",
    contact: "",
    opportunity: "",
    email: "",
    phone: "",
    amount: 0,
    currency: "฿",
    priority: "none",
    stageIndex: 0,
  }
  const [newDeal, setNewDeal] = React.useState(defaultNewDeal)

  const totalFor = (deals) => deals.reduce((acc, d) => acc + (d.amount || 0), 0)

  const openDealDetail = (stageIndex, cardIndex) => {
    const d = stages[stageIndex].deals[cardIndex]
    setDetailNotes(d.notes || "")
    setDetailContact(d.contact || "")
    setDetailEmail(d.email || "")
    setDetailPhone(d.phone || "")
    setOpenDetail({ stageIndex, cardIndex })
  }

  const saveDetail = () => {
    if (!openDetail) return
    const { stageIndex, cardIndex } = openDetail
    setStages((prev) => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => (j === cardIndex ? { ...d, notes: detailNotes, contact: detailContact, email: detailEmail, phone: detailPhone } : d))
      return { ...s, deals }
    }))
    setOpenDetail(null)
  }

  // Drag cards between stages
  const onCardDragStart = (stageIndex, cardIndex, e) => {
    e.dataTransfer.setData("card", JSON.stringify({ stageIndex, cardIndex }))
  }
  const onCardDrop = (toStageIndex, e) => {
    const payload = e.dataTransfer.getData("card")
    if (!payload) return
    const { stageIndex: fromStageIndex, cardIndex } = JSON.parse(payload)
    if (fromStageIndex === toStageIndex) return
    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, deals: [...s.deals] }))
      const [card] = next[fromStageIndex].deals.splice(cardIndex, 1)
      next[toStageIndex].deals.push(card)
      return next
    })
  }

  // Drag stages to reorder
  const onStageDragStart = (stageIndex, e) => {
    // Show the full stage box as the drag image so it feels like the
    // entire column is moving, not just the header text
    try {
      e.dataTransfer.setDragImage(e.currentTarget, 40, 20)
    } catch {}
    e.dataTransfer.setData("stage", String(stageIndex))
  }
  const onStageDrop = (toStageIndex, e) => {
    const payload = e.dataTransfer.getData("stage")
    if (payload === "") return
    const fromStageIndex = Number(payload)
    if (fromStageIndex === toStageIndex) return
    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, deals: [...s.deals] }))
      const [stage] = next.splice(fromStageIndex, 1)
      next.splice(toStageIndex, 0, stage)
      return next
    })
  }

  // Stage actions
  const editStage = (index) => {
    const current = stages[index]
    const name = window.prompt("Edit stage name", current.name)
    if (!name) return
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, name } : s)))
    setMenuOpenIndex(null)
  }
  const deleteStage = (index) => {
    if (stages.length <= 1) return
    const ok = window.confirm("Delete this stage? Deals inside will be removed.")
    if (!ok) return
    setStages((prev) => prev.filter((_, i) => i !== index))
    setMenuOpenIndex(null)
  }
  const addStage = () => {
    const name = window.prompt("New stage name")
    if (!name) return
    setStages((prev) => [...prev, { id: Date.now(), name, deals: [] }])
  }

  // Deal card actions
  const setCardPriority = (stageIndex, cardIndex, priority) => {
    setStages((prev) => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => (j === cardIndex ? { ...d, priority } : d))
      return { ...s, deals }
    }))
    setOpenCardMenu(null)
  }
  const editCard = (stageIndex, cardIndex) => {
    const s = stages[stageIndex]
    const d = s.deals[cardIndex]
    const title = window.prompt("Edit opportunity title", d.title)
    if (title === null) return
    const customer = window.prompt("Edit customer", d.customer)
    if (customer === null) return
    const amountStr = window.prompt("Edit amount (number)", String(d.amount ?? 0))
    if (amountStr === null) return
    const amount = amountStr.trim() === "" ? d.amount : Number(amountStr)
    if (!Number.isFinite(amount)) {
      alert("Amount must be a number")
      return
    }
    setStages((prev) => prev.map((stage, i) => {
      if (i !== stageIndex) return stage
      const deals = stage.deals.map((deal, j) => (j === cardIndex ? { ...deal, title, customer, amount } : deal))
      return { ...stage, deals }
    }))
    setOpenCardMenu(null)
  }
  const deleteCard = (stageIndex, cardIndex) => {
    const ok = window.confirm("Delete this opportunity?")
    if (!ok) return
    setStages((prev) => prev.map((stage, i) => {
      if (i !== stageIndex) return stage
      const deals = stage.deals.filter((_, j) => j !== cardIndex)
      return { ...stage, deals }
    }))
    setOpenCardMenu(null)
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[92rem] mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM — Sales Pipeline</h1>
              <button
                onClick={() => {
                  setNewDeal(defaultNewDeal)
                  setShowNewForm(true)
                }}
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-purple-700 text-white hover:bg-purple-800"
                title="New customer"
              >
                New
              </button>
              {/*<button
                onClick={() => alert("Lead generation not implemented yet")}
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Generate leads"
              >
                Generate Leads
              </button>
              <button
                onClick={() => alert("Pipeline settings not implemented yet")}
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Pipeline settings"
              >
                Pipeline ⚙️
              </button>*/}
            </div>
            <button
              onClick={addStage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Add stage"
            >
              + Add stage
            </button>
          </div>
          <div className="flex flex-row flex-wrap gap-4 overflow-y-auto overflow-x-hidden pb-4">
            {stages.map((stage, stageIndex) => (
              <div
                key={stage.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 w-80 shrink-0 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => onStageDragStart(stageIndex, e)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (e.dataTransfer.getData("card")) onCardDrop(stageIndex, e)
                  else if (e.dataTransfer.getData("stage") !== "") onStageDrop(stageIndex, e)
                }}
              >
                <div
                  className="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="text-sm text-gray-600">{totalFor(stage.deals).toLocaleString()} ฿</span>
                  </div>
                  <div className="relative">
                    <button
                      className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
                      onClick={() => setMenuOpenIndex(menuOpenIndex === stageIndex ? null : stageIndex)}
                      title="Stage settings"
                    >
                      •••
                    </button>
                    {menuOpenIndex === stageIndex && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-md z-10">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => editStage(stageIndex)}>
                          Edit
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50" onClick={() => deleteStage(stageIndex)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-3 min-h-[160px]">
                  {stage.deals.length === 0 && <p className="text-sm text-gray-500">No deals</p>}
                  {stage.deals.map((d, cardIndex) => (
                    <div
                      key={d.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm relative"
                      draggable
                      onDragStart={(e) => onCardDragStart(stageIndex, cardIndex, e)}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900 pr-6 cursor-pointer hover:underline" onClick={() => openDealDetail(stageIndex, cardIndex)}>{d.customer}</p>
                        <div className="flex items-center gap-1">
                          {d.priority === "low" && <span title="Priority: Low" className="text-yellow-500">★</span>}
                          {d.priority === "medium" && (
                            <span title="Priority: Medium" className="text-orange-500">★★</span>
                          )}
                          {d.priority === "high" && <span title="Priority: High" className="text-red-500">★★★</span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{d.title}</p>
                      {d.amount !== undefined && (
                        <p className="text-sm text-gray-700 mt-1">
                          {d.amount.toLocaleString()} {d.currency}
                        </p>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1"
                          onClick={() => setOpenCardMenu(
                            openCardMenu && openCardMenu.stageIndex === stageIndex && openCardMenu.cardIndex === cardIndex
                              ? null
                              : { stageIndex, cardIndex }
                          )}
                          title="Opportunity settings"
                        >
                          ⋯
                        </button>
                        {openCardMenu && openCardMenu.stageIndex === stageIndex && openCardMenu.cardIndex === cardIndex && (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-md z-20">
                            <div className="px-3 py-2 text-xs text-gray-500">Priority</div>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "low")}>
                              ★ Low
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "medium")}>
                              ★★ Medium
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "high")}>
                              ★★★ High
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "none")}>
                              ✕ None
                            </button>
                            <div className="border-t border-gray-200 my-1" />
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => editCard(stageIndex, cardIndex)}>
                              Edit
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50" onClick={() => deleteCard(stageIndex, cardIndex)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {openDetail && (
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenDetail(null)}>
              <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[520px]" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-xl shadow-lg border-2 border-white">
                  <div className="px-4 py-3 border-b-2 border-white flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Company Details</h3>
                    <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenDetail(null)}>✕</button>
                  </div>
                  <div className="p-4 space-y-3">
                    {(() => { const d = stages[openDetail.stageIndex].deals[openDetail.cardIndex]; return (
                      <>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                          <div className="text-sm text-gray-500">Contact</div>
                          <input value={detailContact} onChange={(e)=>setDetailContact(e.target.value)} className="text-sm text-gray-900 border-2 border-white rounded-md px-3 py-2 w-full shadow" />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                          <div className="text-sm text-gray-500">Email</div>
                          <input value={detailEmail} onChange={(e)=>setDetailEmail(e.target.value)} className="text-sm text-gray-900 border-2 border-white rounded-md px-3 py-2 w-full shadow" />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                          <div className="text-sm text-gray-500">Phone</div>
                          <input value={detailPhone} onChange={(e)=>setDetailPhone(e.target.value)} className="text-sm text-gray-900 border-2 border-white rounded-md px-3 py-2 w-full shadow" />
                        </div>
                        <div className="mt-2">
                          <div className="px-1 py-2 text-sm text-purple-700">Notes</div>
                          <div>
                            <textarea value={detailNotes} onChange={(e)=>setDetailNotes(e.target.value)} className="w-full min-h-[120px] rounded-md border-2 border-white px-3 py-2 shadow" placeholder="Add notes" />
                          </div>
                        </div>
                      </>
                    )})()}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                    <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setOpenDetail(null)}>Close</button>
                    <button className="px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-800" onClick={saveDetail}>Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showNewForm && (
            <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setShowNewForm(false)}>
              <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[420px]" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-xl shadow-lg border-2 border-white">
                  <div className="px-4 py-3 border-b-2 border-white flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">New Customer</h3>
                    <button className="text-gray-500 hover:text-gray-900" onClick={() => setShowNewForm(false)}>✕</button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Company</div>
                      <input value={newDeal.company} onChange={(e)=>setNewDeal({...newDeal, company:e.target.value})} className="w-full border-2 border-white rounded-md px-3 py-2 shadow" />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Contact</div>
                      <input value={newDeal.contact} onChange={(e)=>setNewDeal({...newDeal, contact:e.target.value})} className="w-full border-2 border-white rounded-md px-3 py-2 shadow" />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Opportunity</div>
                      <input value={newDeal.opportunity} onChange={(e)=>setNewDeal({...newDeal, opportunity:e.target.value})} className="w-full border-2 border-white rounded-md px-3 py-2 shadow" />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Email</div>
                      <input value={newDeal.email} onChange={(e)=>setNewDeal({...newDeal, email:e.target.value})} className="w-full border-2 border-white rounded-md px-3 py-2 shadow" />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Phone</div>
                      <input value={newDeal.phone} onChange={(e)=>setNewDeal({...newDeal, phone:e.target.value})} className="w-full border-2 border-white rounded-md px-3 py-2 shadow" />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Amount</div>
                      <div className="w-full border-2 border-white rounded-md px-3 py-2 shadow flex items-center gap-2 overflow-hidden">
                        <input type="number" value={newDeal.amount} onChange={(e)=>setNewDeal({...newDeal, amount:Number(e.target.value)})} className="w-28 border-2 border-white rounded-md px-3 py-2 shadow bg-white" />
                        <input value={newDeal.currency} onChange={(e)=>setNewDeal({...newDeal, currency:e.target.value})} className="w-16 border-2 border-white rounded-md px-3 py-2 shadow bg-white" />
                        <div className="ml-auto flex items-center gap-1">
                          {[1,2,3].map(n => {
                            const p = n===1 ? 'low' : n===2 ? 'medium' : 'high'
                            const title = n===1 ? 'Priority: Low' : n===2 ? 'Priority: Medium' : 'Priority: High'
                            const active = newDeal.priority==='high' || (newDeal.priority==='medium' && n<=2) || (newDeal.priority==='low' && n===1)
                            const cls = `text-xl ${active ? (n===3 && newDeal.priority!=='high' ? 'text-gray-300' : 'text-purple-600') : 'text-gray-300'}`
                            return (
                              <button
                                key={n}
                                className={cls}
                                title={title}
                                onClick={()=>setNewDeal({...newDeal, priority: newDeal.priority===p ? 'none' : p})}
                              >
                                ★
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                      <div className="text-sm text-gray-500">Stage</div>
                      <select value={newDeal.stageIndex} onChange={(e)=>setNewDeal({...newDeal, stageIndex:Number(e.target.value)})} className="w-full border-2 border-white rounded-md px-3 py-2 shadow">
                        {stages.map((s, i) => (
                          <option key={s.id} value={i}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-800"
                          onClick={() => {
                            const deal = {
                              id: Date.now(),
                              title: newDeal.opportunity || newDeal.company || "Untitled",
                              customer: newDeal.company || newDeal.contact || "",
                              amount: Number(newDeal.amount) || 0,
                              currency: newDeal.currency || "฿",
                              priority: newDeal.priority,
                              contact: newDeal.contact || "",
                              email: newDeal.email || "",
                              phone: newDeal.phone || "",
                              notes: "",
                            }
                            setStages((prev)=>prev.map((s,i)=> i===newDeal.stageIndex ? { ...s, deals: [...s.deals, deal] } : s))
                            setShowNewForm(false)
                            setNewDeal(defaultNewDeal)
                          }}
                        >
                          Add
                        </button>
                        <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowNewForm(false)}>Cancel</button>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CRMPage />
  </React.StrictMode>,
)
