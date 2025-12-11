import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import "./index.css"

const initialPipeline = {
  New: [
    { id: 1, title: "Big C Supercenter", customer: "Big C Supercenter PLC", amount: 0, currency: "฿", priority: "none" },
  ],
  Qualified: [
    { id: 2, title: "SIANGHAI EITING TRADING COMPANY LIMITED's opportunity", customer: "SIANGHAI EITING TRADING COMPANY", amount: 50000, currency: "฿", priority: "high" },
  ],
  Proposition: [
    { id: 3, title: "METRO MACHINERY COMPANY LIMITED's opportunity", customer: "METRO MACHINERY", amount: 100, currency: "฿", priority: "medium" },
  ],
  Won: [
    { id: 4, title: "Konvy", customer: "Konvy", amount: 80000, currency: "฿", priority: "low" },
  ],
  Lost: [],
}

function CRMPage() {
  const [stages, setStages] = React.useState(
    Object.entries(initialPipeline).map(([name, deals], idx) => ({ id: idx + 1, name, deals }))
  )
  const [menuOpenIndex, setMenuOpenIndex] = React.useState(null)
  const [openCardMenu, setOpenCardMenu] = React.useState(null) // { stageIndex, cardIndex }

  const totalFor = (deals) => deals.reduce((acc, d) => acc + (d.amount || 0), 0)

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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM — Sales Pipeline</h1>
            <button
              onClick={addStage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Add stage"
            >
              + Add stage
            </button>
          </div>
          <div className="flex flex-row gap-4 overflow-x-auto pb-4">
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
                        <p className="font-medium text-gray-900 pr-6">{d.title}</p>
                        <div className="flex items-center gap-1">
                          {d.priority === "low" && <span title="Priority: Low" className="text-yellow-500">★</span>}
                          {d.priority === "medium" && (
                            <span title="Priority: Medium" className="text-orange-500">★★</span>
                          )}
                          {d.priority === "high" && <span title="Priority: High" className="text-red-500">★★★</span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{d.customer}</p>
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