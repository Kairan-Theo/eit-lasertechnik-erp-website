import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import Footer from "./components/footer.jsx"
import { LanguageProvider } from "./components/language-context"
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
  const [openPriority, setOpenPriority] = React.useState(null) // { stageIndex, cardIndex }
  const priorityClass = (p) => (p==='high' ? 'bg-red-100 text-red-700' : p==='medium' ? 'bg-orange-100 text-orange-700' : p==='low' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700')
  const priorityLabel = (p) => (p && p!=='none' ? p.charAt(0).toUpperCase()+p.slice(1) : 'Set Priority')
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
  const [openActivity, setOpenActivity] = React.useState(null)
  const [scheduleDueInput, setScheduleDueInput] = React.useState("")
  const [scheduleText, setScheduleText] = React.useState("")
  const [selectedScheduleKey, setSelectedScheduleKey] = React.useState(null)
  const [draggingScheduleKey, setDraggingScheduleKey] = React.useState(null)
  const [dragOverIdx, setDragOverIdx] = React.useState(null)
  const activityModalRef = React.useRef(null)
  const [openScheduleFor, setOpenScheduleFor] = React.useState(false)
  const [openScheduleMenuKey, setOpenScheduleMenuKey] = React.useState(null) // { stageIndex, cardIndex, idx }
  const [editingScheduleKey, setEditingScheduleKey] = React.useState(null) // { stageIndex, cardIndex, idx }

  const totalFor = (deals) => deals.reduce((acc, d) => acc + (d.amount || 0), 0)
  const nextDueMs = (d) => {
    const arr = (d.activitySchedules||[]).map((it)=>new Date(it.dueAt ?? it.startAt).getTime()).filter((n)=>Number.isFinite(n))
    if (!arr.length) return null
    const now = Date.now()
    const upcoming = arr.filter((t)=>t>=now)
    const pool = upcoming.length ? upcoming : arr
    return Math.min(...pool)
  }
  const nextSchedule = (d) => {
    const arr = (d.activitySchedules||[]).map((s)=>({ s, t: new Date(s.dueAt ?? s.startAt).getTime() })).filter((x)=>Number.isFinite(x.t))
    if (!arr.length) return null
    const now = Date.now()
    const upcoming = arr.filter((x)=>x.t>=now)
    const pool = upcoming.length ? upcoming : arr
    const targetT = Math.min(...pool.map((x)=>x.t))
    const found = pool.find((x)=>x.t===targetT) || arr.find((x)=>x.t===targetT)
    return found ? found.s : null
  }
  const isThisWeek = (ms) => {
    if (!ms) return false
    const d = new Date(ms)
    const today = new Date()
    const start = new Date(today)
    start.setHours(0,0,0,0)
    const dow = start.getDay()
    const mondayOffset = (dow+6)%7
    const monday = new Date(start)
    monday.setDate(start.getDate()-mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate()+6)
    return d>=monday && d<=sunday
  }
  const formatActivityPreviewText = (s) => {
    if (!s) return ""
    const t = String(s).trim()
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""
  }
  const updateDeal = (stageIndex, cardIndex, updater) => {
    setStages(prev => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => j===cardIndex ? updater(d) : d)
      return { ...s, deals }
    }))
  }
 
  const reorderSchedule = (stageIndex, cardIndex, fromIdx, toIdx) => {
    if (fromIdx===toIdx || fromIdx==null || toIdx==null) return
    updateDeal(stageIndex, cardIndex, (prev) => {
      const arr = [...(prev.activitySchedules||[])]
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      return { ...prev, activitySchedules: arr }
    })
  }
  const moveScheduleUp = (stageIndex, cardIndex, idx) => {
    updateDeal(stageIndex, cardIndex, (prev) => {
      const arr = [...(prev.activitySchedules||[])]
      if (idx<=0) return prev
      const tmp = arr[idx-1]
      arr[idx-1] = arr[idx]
      arr[idx] = tmp
      return { ...prev, activitySchedules: arr }
    })
  }
  const moveScheduleDown = (stageIndex, cardIndex, idx) => {
    updateDeal(stageIndex, cardIndex, (prev) => {
      const arr = [...(prev.activitySchedules||[])]
      if (idx>=arr.length-1) return prev
      const tmp = arr[idx+1]
      arr[idx+1] = arr[idx]
      arr[idx] = tmp
      return { ...prev, activitySchedules: arr }
    })
  }

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
    setOpenPriority(null)
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
                New Customer
              </button>
              <button
                onClick={addStage}
                className="inline-flex items-center justify-center px-3 py-2 min-w-[150px] rounded-md bg-purple-700 text-white hover:bg-purple-800"
                title="Add stage"
              >
                + Add stage
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
                        <span className="text-gray-400"></span>
                      </div>
                      <p className="text-sm text-gray-600">{d.title}</p>
                      {d.amount !== undefined && (
                        <div className="text-sm text-gray-700 mt-1 flex items-center justify-between">
                          <span>{d.amount.toLocaleString()} {d.currency}</span>
                          <div className="relative inline-block">
                            <button
                              className={`${priorityClass(d.priority)} px-2 py-1 rounded-full text-xs`}
                              onClick={() => {
                                const open = openPriority && openPriority.stageIndex===stageIndex && openPriority.cardIndex===cardIndex
                                setOpenPriority(open ? null : { stageIndex, cardIndex })
                              }}
                              title="Change priority"
                            >
                              {priorityLabel(d.priority)}
                            </button>
                            {openPriority && openPriority.stageIndex===stageIndex && openPriority.cardIndex===cardIndex && (
                              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-md z-20">
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "low")}>Low</button>
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "medium")}>Medium</button>
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "high")}>High</button>
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setCardPriority(stageIndex, cardIndex, "none")}>None</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mt-1 flex items-start gap-2">
                        <button
                          className="inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border border-gray-300 hover:bg-gray-100"
                          onClick={() => setOpenActivity(
                            openActivity && openActivity.stageIndex===stageIndex && openActivity.cardIndex===cardIndex ? null : { stageIndex, cardIndex }
                          )}
                          title="Next Activity"
                        >
                          📅
                        </button>
                        {(() => {
                          const ms = nextDueMs(d)
                          const inWeek = isThisWeek(ms)
                          const item = nextSchedule(d)
                          return item ? (
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <div className="flex flex-col items-start shrink-0">
                                  {inWeek && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">This week</span>}
                                  <span className="mt-1 text-[11px] leading-3 text-gray-500">
                                    {(d.activitySchedules||[]).length ? `${(d.activitySchedules||[]).length} scheduled` : "No schedules"}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-700 break-words">
                                  {formatActivityPreviewText(item.text || "Scheduled activity")}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No schedules</span>
                          )
                        })()}
                      </div>
                      
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
          {openActivity && (
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenActivity(null)}>
              <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[560px]" onClick={(e) => e.stopPropagation()}>
                <div
                  className="bg-white rounded-xl shadow-lg border-2 border-white"
                  tabIndex={0}
                  ref={(el)=>{ if (el) { activityModalRef.current = el } }}
                  onKeyDown={(e)=>{
                    const tag = e.target && e.target.tagName
                    if (tag==='INPUT' || tag==='TEXTAREA') return
                    const sel = (selectedScheduleKey && openActivity && selectedScheduleKey.stageIndex===openActivity.stageIndex && selectedScheduleKey.cardIndex===openActivity.cardIndex) ? selectedScheduleKey.idx : null
                    if (sel==null) return
                    if (e.key==='ArrowUp') {
                      e.preventDefault()
                      if (sel>0) {
                        moveScheduleUp(openActivity.stageIndex, openActivity.cardIndex, sel)
                        setSelectedScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: sel-1 })
                      }
                    } else if (e.key==='ArrowDown') {
                      e.preventDefault()
                      const len = (stages[openActivity.stageIndex].deals[openActivity.cardIndex].activitySchedules||[]).length
                      if (sel < len-1) {
                        moveScheduleDown(openActivity.stageIndex, openActivity.cardIndex, sel)
                        setSelectedScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: sel+1 })
                      }
                    }
                  }}
                >
                  <div className="px-4 py-3 border-b-2 border-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Next Activity</h3>
                      {(() => { 
                        const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]
                        const ms = nextDueMs(d)
                        const inWeek = isThisWeek(ms)
                        return inWeek ? <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">This week</span> : null
                      })()}
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                        {(() => { const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]; return (d.activitySchedules||[]).length ? `${(d.activitySchedules||[]).length} scheduled` : "No schedules" })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center justify-center px-3 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        onClick={()=>{ setOpenScheduleFor(true); setScheduleDueInput(""); setScheduleText(""); }}
                        title="Add schedule"
                      >
                        +
                      </button>
                      <button className="text-gray-500 hover:text-gray-900" onClick={() => setOpenActivity(null)}>✕</button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {(() => { const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]; return (
                      <>
                        
                        <div className="space-y-2">
                          {(d.activitySchedules||[]).map((it, i) => (
                            <div
                              key={i}
                              className={`flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-2 ${selectedScheduleKey && openActivity && selectedScheduleKey.stageIndex===openActivity.stageIndex && selectedScheduleKey.cardIndex===openActivity.cardIndex && selectedScheduleKey.idx===i ? 'ring-1 ring-purple-300' : ''} ${dragOverIdx===i ? 'ring-1 ring-blue-300' : ''} ${(editingScheduleKey && editingScheduleKey.stageIndex===openActivity.stageIndex && editingScheduleKey.cardIndex===openActivity.cardIndex && editingScheduleKey.idx===i) ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                              onClick={(e)=>{
                                const tag = e.target && e.target.tagName
                                if (tag==='INPUT' || tag==='TEXTAREA' || tag==='BUTTON') return
                                setSelectedScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i })
                                activityModalRef.current && activityModalRef.current.focus()
                              }}
                              draggable
                              onDragStart={(e)=>{
                                const el = e.target
                                const tag = el && el.tagName
                                const isField = tag==='INPUT' || tag==='TEXTAREA' || tag==='BUTTON'
                                const isEditing = !!(editingScheduleKey && editingScheduleKey.stageIndex===openActivity.stageIndex && editingScheduleKey.cardIndex===openActivity.cardIndex && editingScheduleKey.idx===i)
                                if (isField || isEditing) { e.preventDefault(); return }
                                setDraggingScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i })
                                setDragOverIdx(i)
                                e.dataTransfer.effectAllowed = 'move'
                              }}
                              onDragOver={(e)=>{ e.preventDefault(); if (draggingScheduleKey && draggingScheduleKey.stageIndex===openActivity.stageIndex && draggingScheduleKey.cardIndex===openActivity.cardIndex) setDragOverIdx(i) }}
                              onDrop={(e)=>{ e.preventDefault(); if (draggingScheduleKey && draggingScheduleKey.stageIndex===openActivity.stageIndex && draggingScheduleKey.cardIndex===openActivity.cardIndex) { reorderSchedule(openActivity.stageIndex, openActivity.cardIndex, draggingScheduleKey.idx, i); setSelectedScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i }); } setDraggingScheduleKey(null); setDragOverIdx(null) }}
                              onDragEnd={()=>{ setDraggingScheduleKey(null); setDragOverIdx(null) }}
                            >
                              <span className="text-xs text-gray-600">Due</span>
                              {(() => { 
                                const isEditing = !!(editingScheduleKey && editingScheduleKey.stageIndex===openActivity.stageIndex && editingScheduleKey.cardIndex===openActivity.cardIndex && editingScheduleKey.idx===i)
                                return (
                                  <>
                                    <input
                                      type="datetime-local"
                                      value={it.dueAt || ""}
                                      onChange={(e)=>{
                                        const { stageIndex, cardIndex } = openActivity
                                        updateDeal(stageIndex, cardIndex, (prev)=>({
                                          ...prev,
                                          activitySchedules: (prev.activitySchedules||[]).map((s, idx)=> idx===i ? { ...s, dueAt: e.target.value } : s)
                                        }))
                                      }}
                                      disabled={!isEditing}
                                      className="rounded-md border border-gray-300 bg-white px-2 py-1 w-[200px] text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                    />
                                    <input
                                      type="text"
                                      value={it.text || ""}
                                      onChange={(e)=>{
                                        const { stageIndex, cardIndex } = openActivity
                                        updateDeal(stageIndex, cardIndex, (prev)=>({
                                          ...prev,
                                          activitySchedules: (prev.activitySchedules||[]).map((s, idx)=> idx===i ? { ...s, text: e.target.value } : s)
                                        }))
                                      }}
                                      placeholder="Details"
                                      className="flex-1 min-w-[160px] rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                                    />
                                    <div className="relative">
                                      <button
                                        className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                        onClick={()=>{
                                          const open = openScheduleMenuKey && openScheduleMenuKey.stageIndex===openActivity.stageIndex && openScheduleMenuKey.cardIndex===openActivity.cardIndex && openScheduleMenuKey.idx===i
                                          setOpenScheduleMenuKey(open ? null : { stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i })
                                        }}
                                        title="Options"
                                      >
                                        ⋮
                                      </button>
                                      {openScheduleMenuKey && openScheduleMenuKey.stageIndex===openActivity.stageIndex && openScheduleMenuKey.cardIndex===openActivity.cardIndex && openScheduleMenuKey.idx===i && (
                                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10">
                                          <button
                                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                            onClick={()=>{ setEditingScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i }); setOpenScheduleMenuKey(null) }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                                            onClick={()=>{
                                              const { stageIndex, cardIndex } = openActivity
                                              updateDeal(stageIndex, cardIndex, (prev)=>({
                                                ...prev,
                                                activitySchedules: (prev.activitySchedules||[]).filter((_, idx)=> idx!==i)
                                              }))
                                              setOpenScheduleMenuKey(null)
                                              if (editingScheduleKey && editingScheduleKey.stageIndex===stageIndex && editingScheduleKey.cardIndex===cardIndex && editingScheduleKey.idx===i) {
                                                setEditingScheduleKey(null)
                                              }
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          ))}
                          {openScheduleFor && (
                            <div className="mt-2">
                              <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-3">
                                <span className="text-xs text-gray-600">Due</span>
                                <input
                                  type="datetime-local"
                                  value={scheduleDueInput}
                                  onChange={(e)=>setScheduleDueInput(e.target.value)}
                                  className="rounded-md border border-gray-300 bg-white px-2 py-1 w-[200px] text-sm"
                                />
                                <input
                                  type="text"
                                  value={scheduleText}
                                  onChange={(e)=>setScheduleText(e.target.value)}
                                  placeholder="Scheduled activity details"
                                  autoFocus
                                  className="flex-1 min-w-[160px] rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                  onClick={()=>{ setOpenScheduleFor(false); setScheduleDueInput(""); setScheduleText(""); }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-2 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-800"
                                  onClick={()=>{
                                    const dueAt = scheduleDueInput
                                    if (!dueAt) return
                                    const { stageIndex, cardIndex } = openActivity
                                    updateDeal(stageIndex, cardIndex, (prev)=>({
                                      ...prev,
                                      activitySchedules: [...(prev.activitySchedules||[]), { startAt: null, dueAt, text: scheduleText || "" }]
                                    }))
                                    setOpenScheduleFor(false)
                                    setScheduleDueInput("")
                                    setScheduleText("")
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )})()}
                  </div>
                </div>
              </div>
            </div>
          )}
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
                        <div className="ml-auto flex items-center gap-2">
                          {[1,2,3].map(n => {
                            const p = n===1 ? 'low' : n===2 ? 'medium' : 'high'
                            const title = n===1 ? 'Priority: Low' : n===2 ? 'Priority: Medium' : 'Priority: High'
                            const active = newDeal.priority===p
                            return (
                              <button
                                key={n}
                                className="flex items-center gap-1"
                                title={title}
                                onClick={()=>setNewDeal({...newDeal, priority: active ? 'none' : p})}
                              >
                                {Array.from({ length: n }).map((_, i) => (
                                  <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${active ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
                                ))}
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
    <LanguageProvider>
      <CRMPage />
    </LanguageProvider>
  </React.StrictMode>,
)
