// CRM Page Component
import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
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
  const [notification, setNotification] = React.useState({ show: false, message: "" })

  const showNotification = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  const notifyTeam = (msg) => {
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      list.unshift({
        id: Date.now(),
        message: msg,
        timestamp: new Date().toISOString(),
        unread: true,
        type: "info"
      })
      // Keep only last 50
      if (list.length > 50) list.length = 50
      localStorage.setItem("notifications", JSON.stringify(list))
      // Dispatch storage event for current window to update immediately if listening
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }

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
    // Get card details for notification before state update
    const card = stages[fromStageIndex].deals[cardIndex]
    if (card) {
      const msg = `Moved "${card.title}" to ${stages[toStageIndex].name}`
      showNotification(msg)
      notifyTeam(msg)
    }

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

  const getProbability = (stageName) => {
    switch(stageName) {
      case "New": return 10;
      case "Qualified": return 20;
      case "Proposition": return 50;
      case "Won": return 100;
      case "Lost": return 0;
      default: return 10;
    }
  }

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <Navigation />
      
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              Deals
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <select className="bg-transparent border-none text-sm font-medium text-slate-600 hover:text-slate-900 focus:ring-0 cursor-pointer">
              <option>Talent Acquisition</option>
              <option>Sales Pipeline</option>
            </select>
            <select className="bg-transparent border-none text-sm font-medium text-slate-600 hover:text-slate-900 focus:ring-0 cursor-pointer">
              <option>All deals</option>
              <option>My deals</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Import</button>
            <button 
              onClick={() => { setNewDeal(defaultNewDeal); setShowNewForm(true); }}
              className="px-5 py-2 text-sm font-medium text-white bg-[#2D4485] rounded-lg hover:bg-[#3D56A6] shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5"
            >
              + Create deal
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between flex-wrap gap-4 shadow-sm z-10 relative">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search deals..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all bg-slate-50 focus:bg-white" 
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-[#2D4485] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 overflow-x-auto">
            {['Deal owner', 'Create date', 'Last activity', 'Close date'].map((label) => (
               <button key={label} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap transition-colors flex items-center gap-1">
                 {label} <span className="text-[10px] opacity-50">▼</span>
               </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <section className="w-full overflow-x-auto h-[calc(100vh-140px)] bg-slate-50">
        <div className="flex h-full p-6 gap-6">

          {stages.map((stage, stageIndex) => {
             const total = totalFor(stage.deals);
             const prob = getProbability(stage.name);
             const weighted = total * (prob / 100);
             
             return (
              <div
                key={stage.id}
                className="w-80 min-w-[20rem] flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200/60 group"
                draggable
                onDragStart={(e) => onStageDragStart(stageIndex, e)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (e.dataTransfer.getData("card")) onCardDrop(stageIndex, e)
                  else if (e.dataTransfer.getData("stage") !== "") onStageDrop(stageIndex, e)
                }}
              >
                {/* Column Header */}
                <div 
                  className="p-4 text-center border-b border-slate-200/60 cursor-grab active:cursor-grabbing bg-transparent group/header relative"
                  draggable
                  onDragStart={(e) => onStageDragStart(stageIndex, e)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">{stage.name}</span>
                    <div className="flex items-center gap-1">
                       <span className="text-slate-500 text-xs font-medium bg-slate-200/60 px-2 py-0.5 rounded-full">{stage.deals.length}</span>
                       <button 
                         className="text-slate-400 hover:text-slate-600 opacity-0 group-hover/header:opacity-100 transition-opacity"
                         onClick={(e) => { e.stopPropagation(); setMenuOpenIndex(menuOpenIndex === stageIndex ? null : stageIndex); }}
                       >
                         ⋯
                       </button>
                    </div>
                  </div>
                  {menuOpenIndex === stageIndex && (
                    <div className="absolute right-2 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-30 w-32 text-left py-1">
                      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => editStage(stageIndex)}>Edit Stage</button>
                      <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 text-red-600" onClick={() => deleteStage(stageIndex)}>Delete Stage</button>
                    </div>
                  )}
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-[#2D4485]/60" style={{ width: `${prob}%` }}></div>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3">
                  {stage.deals.map((d, cardIndex) => (
                    <div
                      key={d.id}
                      className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4 mb-3 hover:shadow-md hover:ring-[#2D4485]/30 transition-all cursor-grab relative group/card"
                      draggable
                      onDragStart={(e) => onCardDragStart(stageIndex, cardIndex, e)}
                    >
                      <div className="flex justify-between items-start gap-2 mb-3">
                         <h4 
                           className="font-semibold text-slate-800 text-sm leading-snug hover:text-[#2D4485] cursor-pointer transition-colors"
                           onClick={() => openDealDetail(stageIndex, cardIndex)}
                         >
                           {d.title}
                         </h4>
                         <button 
                            className="text-slate-300 hover:text-slate-500 opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-slate-50 rounded"
                            onClick={(e) => { e.stopPropagation(); setOpenCardMenu({ stageIndex, cardIndex }); }}
                         >
                           ⋯
                         </button>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <span className="truncate">{d.customer}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                          <span className="text-xs font-normal text-slate-400">{d.currency}</span>
                          {d.amount.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-2 relative">
                           <div 
                             className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm ${d.priority === 'high' ? 'bg-red-500 ring-2 ring-red-100' : d.priority === 'medium' ? 'bg-orange-400 ring-2 ring-orange-100' : 'bg-[#2D4485] ring-2 ring-blue-100'} cursor-pointer hover:scale-110 transition-transform`}
                             onClick={(e) => {
                                e.stopPropagation();
                                const open = openPriority && openPriority.stageIndex===stageIndex && openPriority.cardIndex===cardIndex
                                setOpenPriority(open ? null : { stageIndex, cardIndex })
                             }}
                             title={`Priority: ${d.priority}`}
                           >
                              {d.customer.charAt(0)}
                           </div>
                           {openPriority && openPriority.stageIndex===stageIndex && openPriority.cardIndex===cardIndex && (
                              <div className="absolute left-0 bottom-8 bg-white border border-slate-200 rounded-lg shadow-xl z-20 w-32 py-1">
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setCardPriority(stageIndex, cardIndex, "low"); setOpenPriority(null); }}>Low</button>
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setCardPriority(stageIndex, cardIndex, "medium"); setOpenPriority(null); }}>Medium</button>
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setCardPriority(stageIndex, cardIndex, "high"); setOpenPriority(null); }}>High</button>
                                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setCardPriority(stageIndex, cardIndex, "none"); setOpenPriority(null); }}>None</button>
                              </div>
                           )}

                           <div 
                             className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 rounded px-1.5 py-0.5 transition-colors"
                             onClick={(e) => {
                                e.stopPropagation();
                                setOpenActivity(
                                  openActivity && openActivity.stageIndex===stageIndex && openActivity.cardIndex===cardIndex ? null : { stageIndex, cardIndex }
                                )
                             }}
                           >
                             {(() => {
                                const item = nextSchedule(d)
                                return item ? (
                                   <>
                                     <div className={`w-2 h-2 rounded-full ${isThisWeek(item.dueAt) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                     <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">{formatActivityPreviewText(item.text || "Activity")}</span>
                                   </>
                                ) : (
                                   <>
                                     <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                   </>
                                )
                             })()}
                           </div>
                        </div>
                      </div>

                      {/* Card Menu Dropdown */}
                      {openCardMenu && openCardMenu.stageIndex === stageIndex && openCardMenu.cardIndex === cardIndex && (
                         <div className="absolute right-2 top-8 z-10 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1">
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => editCard(stageIndex, cardIndex)}>Edit</button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50" onClick={() => deleteCard(stageIndex, cardIndex)}>Delete</button>
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setOpenCardMenu(null)}>Close</button>
                         </div>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                        setNewDeal({...defaultNewDeal, stageIndex: stageIndex});
                        setShowNewForm(true);
                    }}
                    className="w-full py-2.5 mt-2 text-sm font-medium text-slate-500 hover:text-[#2D4485] hover:bg-slate-200/50 rounded-lg border border-transparent hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-lg leading-none">+</span> New deal
                  </button>
                </div>

                {/* Column Footer */}
                <div className="p-3 border-t border-slate-200/60 bg-slate-50/50 rounded-b-2xl">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-slate-700 font-semibold">Total: {total.toLocaleString()} ฿</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">Weighted: {weighted.toLocaleString()} ฿</div>
                  </div>
                </div>
              </div>
            )
          })}
          
          <div className="w-80 shrink-0 p-4">
             <button 
               onClick={addStage}
               className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium hover:border-[#2D4485] hover:text-[#2D4485] hover:bg-[#2D4485]/5 transition-all"
             >
               + Add Stage
             </button>
          </div>
          </div>
          {openActivity && (
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenActivity(null)}>
              <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[560px]" onClick={(e) => e.stopPropagation()}>
                <div
                  className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl mx-4"
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
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-800 text-lg">Next Activity</h3>
                      {(() => { 
                        const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]
                        const ms = nextDueMs(d)
                        const inWeek = isThisWeek(ms)
                        return inWeek ? <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2D4485] text-xs font-medium border border-blue-100">This week</span> : null
                      })()}
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                        {(() => { const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]; return (d.activitySchedules||[]).length ? `${(d.activitySchedules||[]).length} scheduled` : "No schedules" })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        onClick={()=>{ setOpenScheduleFor(true); setScheduleDueInput(""); setScheduleText(""); }}
                        title="Add schedule"
                      >
                        +
                      </button>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setOpenActivity(null)}>✕</button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {(() => { const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]; return (
                      <>
                        
                        <div className="space-y-3">
                          {(d.activitySchedules||[]).map((it, i) => (
                            <div
                              key={i}
                              className={`flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm ${selectedScheduleKey && openActivity && selectedScheduleKey.stageIndex===openActivity.stageIndex && selectedScheduleKey.cardIndex===openActivity.cardIndex && selectedScheduleKey.idx===i ? 'ring-2 ring-[#2D4485]/20 border-[#2D4485]' : ''} ${dragOverIdx===i ? 'ring-2 ring-blue-300' : ''} ${(editingScheduleKey && editingScheduleKey.stageIndex===openActivity.stageIndex && editingScheduleKey.cardIndex===openActivity.cardIndex && editingScheduleKey.idx===i) ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:border-slate-300'}`}
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
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due</span>
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
                                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 w-[200px] text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-transparent focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
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
                                      className="flex-1 min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                    />
                                    <div className="relative">
                                      <button
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                        onClick={()=>{
                                          const open = openScheduleMenuKey && openScheduleMenuKey.stageIndex===openActivity.stageIndex && openScheduleMenuKey.cardIndex===openActivity.cardIndex && openScheduleMenuKey.idx===i
                                          setOpenScheduleMenuKey(open ? null : { stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i })
                                        }}
                                        title="Options"
                                      >
                                        ⋮
                                      </button>
                                      {openScheduleMenuKey && openScheduleMenuKey.stageIndex===openActivity.stageIndex && openScheduleMenuKey.cardIndex===openActivity.cardIndex && openScheduleMenuKey.idx===i && (
                                        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden w-32">
                                          <button
                                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            onClick={()=>{ setEditingScheduleKey({ stageIndex: openActivity.stageIndex, cardIndex: openActivity.cardIndex, idx: i }); setOpenScheduleMenuKey(null) }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
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
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-inner">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due</span>
                                <input
                                  type="datetime-local"
                                  value={scheduleDueInput}
                                  onChange={(e)=>setScheduleDueInput(e.target.value)}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 w-[200px] text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                                />
                                <input
                                  type="text"
                                  value={scheduleText}
                                  onChange={(e)=>setScheduleText(e.target.value)}
                                  placeholder="Scheduled activity details"
                                  autoFocus
                                  className="flex-1 min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-3 mt-3">
                                <button
                                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm"
                                  onClick={()=>{ setOpenScheduleFor(false); setScheduleDueInput(""); setScheduleText(""); }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-4 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
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
                                  Add Schedule
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setOpenDetail(null)}>
              <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[520px] transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Company Details</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setOpenDetail(null)}>✕</button>
                  </div>
                  <div className="p-6">
                    {(() => { const d = stages[openDetail.stageIndex].deals[openDetail.cardIndex]; return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                          <label className="text-sm font-medium text-slate-500">Contact</label>
                          <input 
                            value={detailContact} 
                            onChange={(e)=>setDetailContact(e.target.value)} 
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                            placeholder="Contact person"
                          />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                          <label className="text-sm font-medium text-slate-500">Email</label>
                          <input 
                            value={detailEmail} 
                            onChange={(e)=>setDetailEmail(e.target.value)} 
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                            placeholder="Email address"
                          />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                          <label className="text-sm font-medium text-slate-500">Phone</label>
                          <input 
                            value={detailPhone} 
                            onChange={(e)=>setDetailPhone(e.target.value)} 
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                            placeholder="Phone number"
                          />
                        </div>
                        <div className="pt-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                          <textarea 
                            value={detailNotes} 
                            onChange={(e)=>setDetailNotes(e.target.value)} 
                            className="w-full min-h-[120px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all resize-y" 
                            placeholder="Add notes about this deal..." 
                          />
                        </div>
                      </div>
                    )})()}
                  </div>
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                    <button 
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm" 
                      onClick={() => setOpenDetail(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-6 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium" 
                      onClick={saveDetail}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showNewForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity" onClick={() => setShowNewForm(false)}>
              <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[520px] transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">New Customer</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowNewForm(false)}>✕</button>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Company</label>
                        <input 
                          value={newDeal.company} 
                          onChange={(e)=>setNewDeal({...newDeal, company:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                          placeholder="Company name"
                        />
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Contact</label>
                        <input 
                          value={newDeal.contact} 
                          onChange={(e)=>setNewDeal({...newDeal, contact:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                          placeholder="Contact person"
                        />
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Opportunity</label>
                        <input 
                          value={newDeal.opportunity} 
                          onChange={(e)=>setNewDeal({...newDeal, opportunity:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                          placeholder="Deal opportunity name"
                        />
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Email</label>
                        <input 
                          value={newDeal.email} 
                          onChange={(e)=>setNewDeal({...newDeal, email:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                          placeholder="Email address"
                        />
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Phone</label>
                        <input 
                          value={newDeal.phone} 
                          onChange={(e)=>setNewDeal({...newDeal, phone:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Amount</label>
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{newDeal.currency}</span>
                            <input 
                              type="number" 
                              value={newDeal.amount} 
                              onChange={(e)=>setNewDeal({...newDeal, amount:Number(e.target.value)})} 
                              className="w-full pl-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                            />
                          </div>
                          <input 
                            value={newDeal.currency} 
                            onChange={(e)=>setNewDeal({...newDeal, currency:e.target.value})} 
                            className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all text-center uppercase" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Priority</label>
                        <div className="flex items-center gap-3">
                          {[1,2,3].map(n => {
                            const p = n===1 ? 'low' : n===2 ? 'medium' : 'high'
                            const title = n===1 ? 'Low' : n===2 ? 'Medium' : 'High'
                            const active = newDeal.priority===p
                            const colorClass = n===1 ? 'bg-[#2D4485]' : n===2 ? 'bg-orange-400' : 'bg-red-500'
                            return (
                              <button
                                key={n}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? `${colorClass} text-white border-transparent shadow-md transform scale-105` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                onClick={()=>setNewDeal({...newDeal, priority: active ? 'none' : p})}
                              >
                                {title} Priority
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label className="text-sm font-medium text-slate-500">Stage</label>
                        <select 
                          value={newDeal.stageIndex} 
                          onChange={(e)=>setNewDeal({...newDeal, stageIndex:Number(e.target.value)})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        >
                          {stages.map((s, i) => (
                            <option key={s.id} value={i}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                    <button
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm"
                      onClick={() => setShowNewForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
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
                          activitySchedules: [],
                          probability: 10,
                          expectedClose: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
                        }
                        setStages((prev)=>prev.map((s,i)=> i===newDeal.stageIndex ? { ...s, deals: [...s.deals, deal] } : s))
                        setShowNewForm(false)
                        setNewDeal(defaultNewDeal)
                      }}
                    >
                      Create Deal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </section>
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
