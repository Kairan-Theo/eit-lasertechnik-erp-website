// CRM Page Component
import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import emailjs from '@emailjs/browser';
import { Mail, Trash2 } from "lucide-react"
import "./index.css"
import { API_BASE_URL } from "./config"
import CRMCustomers from "./crm-customers.jsx"
import CRMTickets from "./crm-tickets.jsx"
import CRMLeads from "./crm-leads.jsx"
import CRMAnalytics from "./crm-analytics.jsx"

const initialPipeline = {
  "Appointment Schedule": [
    { id: 1, title: "Discussing Goods Price", customer: "Big C Supercenter PLC", amount: 0, currency: "฿", priority: "none", contact: "", email: "", phone: "", notes: "", createdAt: new Date().toISOString(), expectedClose: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] },
  ],
  "Presentation Schedule": [
    { id: 2, title: "Selling New Machines", customer: "SIANGHAI EITING TRADING COMPANY", amount: 50000, currency: "฿", priority: "high", contact: "", email: "", phone: "", notes: "", createdAt: new Date().toISOString(), expectedClose: new Date(Date.now() + 45*24*60*60*1000).toISOString().split('T')[0] },
  ],
  Quotation: [
    { id: 3, title: "Introduced New Plan about Manufacturing", customer: "METRO MACHINERY", amount: 100, currency: "฿", priority: "medium", contact: "", email: "", phone: "", notes: "", createdAt: new Date().toISOString(), expectedClose: new Date(Date.now() + 20*24*60*60*1000).toISOString().split('T')[0] },
  ],
  Demo: [],
  Decision: [],
  Connection: [],
  "Contract Sent": [],
  "Close Won": [
    { id: 4, title: "Negotiated and made contract", customer: "Konvy", amount: 80000, currency: "฿", priority: "low", contact: "", email: "", phone: "", notes: "", createdAt: new Date().toISOString(), expectedClose: new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0] },
  ],
}

const thaiCompanies = [
  { name: "EIT LASERTECHNIK (Einstein Industrie Technik)", contact: "Sales Team", email: "sales@eitlaser.com", phone: "02-052-9544", address: "1/120 Ramkamhaeng Soi 184, Minburi, Minburi, Bangkok 10510", taxId: "" },
  { name: "PTT Public Company Limited", contact: "Auttapol Rerkpiboon", email: "auttapol.r@pttplc.com", phone: "02-537-2000", address: "555 Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900", taxId: "0107544000108" },
  { name: "SCG (Siam Cement Group)", contact: "Roongrote Rangsiyopash", email: "roongrote.r@scg.com", phone: "02-586-3333", address: "1 Siam Cement Rd, Bang Sue, Bangkok 10800", taxId: "0107537000114" },
  { name: "CP All Public Company Limited", contact: "Korsak Chairasmisak", email: "korsak.c@cpall.co.th", phone: "02-071-9000", address: "313 C.P. Tower, Silom Rd, Bang Rak, Bangkok 10500", taxId: "0107542000011" },
  { name: "Advanced Info Service (AIS)", contact: "Somchai Lertsutiwong", email: "somchai.l@ais.co.th", phone: "02-029-5000", address: "414 Phaholyothin Rd, Phaya Thai, Bangkok 10400", taxId: "0107535000265" },
  { name: "Kasikornbank", contact: "Kattiya Indaravijaya", email: "kattiya.i@kasikornbank.com", phone: "02-888-8888", address: "400/22 Phahon Yothin Rd, Phaya Thai, Bangkok 10400", taxId: "0107536000315" },
  { name: "Siam Commercial Bank", contact: "Arthid Nanthawithaya", email: "arthid.n@scb.co.th", phone: "02-777-7777", address: "9 Ratchadapisek Rd, Chatuchak, Bangkok 10900", taxId: "0107536000102" },
  { name: "Bangkok Bank", contact: "Chartsiri Sophonpanich", email: "chartsiri.s@bangkokbank.com", phone: "1333", address: "333 Silom Rd, Bang Rak, Bangkok 10500", taxId: "0107536000374" },
  { name: "True Corporation", contact: "Manat Manavutiveth", email: "manat.m@truecorp.co.th", phone: "1242", address: "18 True Tower, Ratchadaphisek Rd, Huai Khwang, Bangkok 10310", taxId: "0107536000081" },
  { name: "Thai Beverage", contact: "Thapana Sirivadhanabhakdi", email: "thapana.s@thaibev.com", phone: "02-785-5555", address: "14 Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900", taxId: "0107546000342" },
  { name: "Central Retail Corporation", contact: "Yol Phokasub", email: "yol.p@central.co.th", phone: "02-650-3600", address: "22 Soi Somkid, Ploenchit Rd, Pathum Wan, Bangkok 10330", taxId: "0107562000386" },
  { name: "Charoen Pokphand Foods", contact: "Prasit Boondoungprasert", email: "prasit.b@cpf.co.th", phone: "02-766-8000", address: "313 C.P. Tower, Silom Rd, Bang Rak, Bangkok 10500", taxId: "0107537000246" },
  { name: "PTT Exploration and Production", contact: "Montri Rawanchaikul", email: "montri.r@pttep.com", phone: "02-537-4000", address: "555/1 Energy Complex, Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900", taxId: "0107535000206" },
  { name: "Airports of Thailand", contact: "Nitinai Sirismatthakarn", email: "nitinai.s@aot.co.th", phone: "02-535-1111", address: "333 Cherdwutagard Rd, Don Mueang, Bangkok 10210", taxId: "0107545000292" },
  { name: "Energy Absolute", contact: "Somphote Ahunai", email: "somphote.a@energyabsolute.co.th", phone: "02-248-2455", address: "89 AIA Capital Center, Ratchadaphisek Rd, Din Daeng, Bangkok 10400", taxId: "0107551000061" },
  { name: "Gulf Energy Development", contact: "Sarath Ratanavadi", email: "sarath.r@gulf.co.th", phone: "02-080-4499", address: "87 M. Thai Tower, All Seasons Place, Wireless Rd, Pathum Wan, Bangkok 10330" },
  { name: "Intouch Holdings", contact: "Kim Siritaweechai", email: "kim.s@intouchcompany.com", phone: "02-118-6900", address: "87 M. Thai Tower, All Seasons Place, Wireless Rd, Pathum Wan, Bangkok 10330" },
  { name: "Minor International", contact: "William Heinecke", email: "william.h@minor.com", phone: "02-365-7500", address: "88 The Parq Building, Ratchadaphisek Rd, Khlong Toei, Bangkok 10110" },
  { name: "Indorama Ventures", contact: "Aloke Lohia", email: "aloke.l@indorama.net", phone: "02-661-6661", address: "75/102 Ocean Tower 2, Sukhumvit Soi 19, Watthana, Bangkok 10110" },
  { name: "Bangkok Dusit Medical Services", contact: "Poramaporn Prasarttong-Osoth", email: "poramaporn.p@bdms.co.th", phone: "02-310-3000", address: "2 Soi Soonvijai 7, New Phetchaburi Rd, Huai Khwang, Bangkok 10310" },
  { name: "Electricity Generating Public Company", contact: "Thepparat Theppitak", email: "thepparat.t@egco.com", phone: "02-998-5000", address: "222 Vibhavadi Rangsit Rd, Lak Si, Bangkok 10210" },
  { name: "Delta Electronics (Thailand)", contact: "Jackie Chang", email: "info@deltathailand.com", phone: "02-709-2800", address: "909 Soi 9, Bangpoo Ind. Estate, Samut Prakan 10280" },
  { name: "Global Power Synergy (GPSC)", contact: "Worawat Pitayasiri", email: "gpsc@gpscgroup.com", phone: "02-140-4600", address: "555/2 Energy Complex B, Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900" },
  { name: "Thai Oil", contact: "Wirat Uanarumit", email: "thayoil@thaioilgroup.com", phone: "02-797-2999", address: "555/1 Energy Complex A, Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900" },
  { name: "Ratch Group", contact: "Choosri Kietkajornkul", email: "ratch@ratch.co.th", phone: "02-794-9999", address: "72 Ngam Wong Wan Rd, Nonthaburi 11000" },
  { name: "Krung Thai Bank", contact: "Payong Srivanich", email: "call.center@krungthai.com", phone: "02-111-1111", address: "35 Sukhumvit Rd, Watthana, Bangkok 10110" },
  { name: "TMBThanachart Bank (TTB)", contact: "Piti Tantakasem", email: "ttb@ttbbank.com", phone: "1428", address: "3000 Phahon Yothin Rd, Chatuchak, Bangkok 10900" },
  { name: "PTT Global Chemical (GC)", contact: "Kongkrapan Intarajang", email: "gc@pttgcgroup.com", phone: "02-265-8400", address: "555/1 Energy Complex A, Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900" },
  { name: "Osotspa", contact: "Wannipa Bhakdibutr", email: "osotspa@osotspa.com", phone: "02-351-1000", address: "348 Ramkhamhaeng Rd, Bang Kapi, Bangkok 10240" },
  { name: "Carabao Group", contact: "Sathien Setthasit", email: "carabao@carabaogroup.com", phone: "02-636-6111", address: "393 Silom Rd, Bang Rak, Bangkok 10500" },
  { name: "B.Grimm Power", contact: "Harald Link", email: "bgrimm@bgrimmpower.com", phone: "02-710-3000", address: "5 Krungthepkreetha Rd, Bang Kapi, Bangkok 10240" },
  { name: "Banpu", contact: "Somruedee Chaimongkol", email: "banpu@banpu.co.th", phone: "02-694-6600", address: "1550 Thanapoom Tower, Phetchaburi Rd, Ratchathewi, Bangkok 10400" },
  { name: "Berli Jucker (BJC)", contact: "Aswin Techajareonvikul", email: "bjc@bjc.co.th", phone: "02-367-1111", address: "99 Soi Rubia, Sukhumvit 42, Khlong Toei, Bangkok 10110" },
  { name: "Home Product Center (HomePro)", contact: "Khunawut Thumpomkul", email: "contact@homepro.co.th", phone: "1284", address: "96/27 Moo 9 Bang Khen, Mueang Nonthaburi, Nonthaburi 11000" },
  { name: "Land and Houses", contact: "Naporn Sunthornchitcharoen", email: "lh@lh.co.th", phone: "1198", address: "1 Q. House Lumpini, Sathon Tai Rd, Sathon, Bangkok 10120" },
  { name: "Supalai", contact: "Prateep Tangmatitham", email: "supalai@supalai.com", phone: "1720", address: "1011 Supalai Grand Tower, Rama 3 Rd, Yan Nawa, Bangkok 10120" },
  { name: "AP (Thailand)", contact: "Anuphong Assavabhokhin", email: "ap@apthai.com", phone: "1623", address: "170/57 Ocean Tower 1, Ratchadaphisek Rd, Khlong Toei, Bangkok 10110" },
  { name: "Sansiri", contact: "Apichet Bunyakiet", email: "sansiri@sansiri.com", phone: "1685", address: "475 Siripinyo Bldg, Si Ayutthaya Rd, Ratchathewi, Bangkok 10400" },
  { name: "Central Pattana (CPN)", contact: "Wallaya Chirathivat", email: "cpn@centralpattana.co.th", phone: "02-667-5555", address: "999/9 Rama 1 Rd, Pathum Wan, Bangkok 10330" },
  { name: "MK Restaurant Group", contact: "Rit Thirakomen", email: "mk@mkrestaurantgroup.com", phone: "02-836-1000", address: "1200 Debaratna Rd, Bang Na, Bangkok 10260" },
  { name: "Siam Makro (CP Axtra)", contact: "Saowaluck Thithapant", email: "cpaxtra@cpaxtra.co.th", phone: "02-067-8999", address: "1468 Phatthanakan Rd, Suan Luang, Bangkok 10250" },
  { name: "Thai Union Group", contact: "Thiraphong Chansiri", email: "tu@thaiunion.com", phone: "02-298-0024", address: "72/1 Moo 7 Sethakit 1 Rd, Mueang Samut Sakhon, Samut Sakhon 74000" },
  { name: "Sri Trang Agro-Industry", contact: "Viyavood Sincharoenkul", email: "sta@sritranggroup.com", phone: "02-207-4500", address: "10 Soi 10, Phetkasem Rd, Hat Yai, Songkhla 90110" },
  { name: "KCE Electronics", contact: "Bancha Ongkosit", email: "kce@kce.co.th", phone: "02-326-0196", address: "72-72/1-3 Lat Krabang Ind. Estate, Lat Krabang, Bangkok 10520" },
  { name: "Hana Microelectronics", contact: "Richard Han", email: "hana@hanagroup.com", phone: "02-551-1297", address: "10/4 Moo 3, Vibhavadi Rangsit Rd, Lak Si, Bangkok 10210" },
  { name: "Muangthai Capital", contact: "Chuchat Petaumpai", email: "mtc@muangthaicap.com", phone: "02-483-8888", address: "32/1 Charan Sanitwong Rd, Bang Phlat, Bangkok 10700" },
  { name: "Srisawad Corporation", contact: "Chatchai Kaewbootta", email: "sawad@srisawad.com", phone: "1652", address: "99/392 Chaeng Watthana Rd, Lak Si, Bangkok 10210" },
  { name: "VGI", contact: "Nelson Leung", email: "vgi@vgi.co.th", phone: "02-273-8884", address: "21 TST Tower, Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900" },
  { name: "Plan B Media", contact: "Palin Lojanagosin", email: "planb@planbmedia.co.th", phone: "02-530-8053", address: "1213/420 Soi Lat Phrao 94, Wang Thonglang, Bangkok 10310" },
  { name: "BTS Group Holdings", contact: "Keeree Kanjanapas", email: "bts@bts.co.th", phone: "02-617-7300", address: "21 Phahon Yothin Rd, Chatuchak, Bangkok 10900" },
  { name: "Bangkok Expressway and Metro (BEM)", contact: "Sombat Kitjalaksana", email: "bem@bemplc.co.th", phone: "02-641-4611", address: "587 Sutthisan Winitchai Rd, Din Daeng, Bangkok 10400" }
]

const API_BASE = `${API_BASE_URL}/api`

function CRMPage() {
  const [stages, setStages] = React.useState(
    Object.keys(initialPipeline).map((name, idx) => ({ id: idx + 1, name, deals: [] }))
  )
  const [activeTab, setActiveTab] = React.useState("Deals")
  const [menuOpenIndex, setMenuOpenIndex] = React.useState(null)
  const [showNewForm, setShowNewForm] = React.useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState(null)
  const [users, setUsers] = React.useState([])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = { 
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json"
      }
      const res = await fetch(`${API_BASE}/users/`, { headers })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  React.useEffect(() => {
    fetchDeals()
    fetchUsers()
  }, [])

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      const res = await fetch(`${API_BASE}/deals/`, { headers })
      if (!res.ok) throw new Error("Failed to fetch deals")
      const data = await res.json()
      
      setStages(prev => {
        const newStages = prev.map(s => ({ ...s, deals: [] }))
        data.forEach(d => {
          const deal = {
            id: d.id,
            title: d.title,
            customer: d.customer_name || "",
            amount: Number(d.amount),
            currency: d.currency,
            priority: d.priority,
            contact: d.contact,
            email: d.email,
            phone: d.phone,
            address: d.address,
            taxId: d.tax_id,
            notes: d.notes,
            createdAt: d.created_at,
            expectedClose: d.expected_close,
            poNumber: d.po_number || "",
            salesperson: d.salesperson || "",
            salespersonName: d.salesperson_name || "",
            activitySchedules: (d.activity_schedules || []).map(s => ({
              id: s.id,
              dueAt: s.due_at ? s.due_at.slice(0, 16) : "",
              text: s.text
            }))
          }
          const stageIndex = newStages.findIndex(s => s.name === d.stage)
          if (stageIndex >= 0) {
            newStages[stageIndex].deals.push(deal)
          } else if (newStages.length > 0) {
            newStages[0].deals.push(deal)
          }
        })
        return newStages
      })
    } catch (err) {
      console.error("Error loading deals:", err)
    }
  }
  const [openDetail, setOpenDetail] = React.useState(null) // { stageIndex, cardIndex }
  const [openPriority, setOpenPriority] = React.useState(null) // { stageIndex, cardIndex }
  const priorityClass = (p) => (p==='high' ? 'bg-red-100 text-red-700' : p==='medium' ? 'bg-orange-100 text-orange-700' : p==='low' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700')
  const priorityLabel = (p) => (p && p!=='none' ? p.charAt(0).toUpperCase()+p.slice(1) : 'Set Priority')
  const defaultNewDeal = {
    company: "",
    contact: "",
    opportunity: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    poNumber: "",
    amount: 0,
    currency: "฿",
    priority: "none",
    stageIndex: 0,
    salesperson: "",
  }
  const [newDeal, setNewDeal] = React.useState(defaultNewDeal)
  const [detailDeal, setDetailDeal] = React.useState(defaultNewDeal)
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
  const [sortBy, setSortBy] = React.useState(null) // 'createdAt' | 'lastActivity' | 'expectedClose'
  const [sortAsc, setSortAsc] = React.useState(false)
  const [showCompanySuggestions, setShowCompanySuggestions] = React.useState(false)
  const [openEmail, setOpenEmail] = React.useState(null) // { stageIndex, cardIndex, to }
  const [emailSubject, setEmailSubject] = React.useState("")
  const [emailBody, setEmailBody] = React.useState("")
  const [openEdit, setOpenEdit] = React.useState(null) // { stageIndex, cardIndex }
  const [editingDeal, setEditingDeal] = React.useState(defaultNewDeal)
  const [isSending, setIsSending] = React.useState(false)
  const [emailConfig, setEmailConfig] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("email_config")) || { serviceId: "", templateId: "", publicKey: "" }
    } catch {
      return { serviceId: "", templateId: "", publicKey: "" }
    }
  })
  const [showEmailSettings, setShowEmailSettings] = React.useState(false)

  const saveEmailConfig = (cfg) => {
    setEmailConfig(cfg)
    localStorage.setItem("email_config", JSON.stringify(cfg))
    setShowEmailSettings(false)
    showNotification("Email settings saved")
  }

  const showNotification = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  const notifyTeam = (msg, type = "info", company = "", source = "") => {
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]")
      list.unshift({
        id: Date.now(),
        message: msg,
        timestamp: new Date().toISOString(),
        unread: true,
        type,
        company: company || "",
        source: source || ""
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
  const lastActivityMs = (d) => {
    const arr = (d.activitySchedules||[])
      .map((s)=>new Date(s.dueAt ?? s.startAt).getTime())
      .filter((n)=>Number.isFinite(n))
    return arr.length ? Math.max(...arr) : null
  }
  const createdMs = (d) => {
    const t = d.createdAt ? new Date(d.createdAt).getTime() : null
    return Number.isFinite(t) ? t : null
  }
  const closeMs = (d) => {
    const t = d.expectedClose ? new Date(d.expectedClose).getTime() : null
    return Number.isFinite(t) ? t : null
  }
  const sortDeals = (deals, by, asc) => {
    if (!by) return deals
    const getKey = (d) => {
      if (by==='createdAt') return createdMs(d)
      if (by==='lastActivity') return lastActivityMs(d)
      if (by==='expectedClose') return closeMs(d)
      return null
    }
    const normalized = deals.map((d)=>({ d, k: getKey(d) }))
    normalized.sort((a,b)=>{
      const ka = a.k ?? (asc ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
      const kb = b.k ?? (asc ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
      return asc ? (ka - kb) : (kb - ka)
    })
    return normalized.map((x)=>x.d)
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

  const addSchedule = async (stageIndex, cardIndex, dueAt, text) => {
    const deal = stages[stageIndex].deals[cardIndex]
    const tempId = Date.now()
    const newSchedule = { id: tempId, dueAt, text }
    
    setStages(prev => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => j === cardIndex ? { ...d, activitySchedules: [...(d.activitySchedules || []), newSchedule] } : d)
      return { ...s, deals }
    }))

    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      const res = await fetch(`${API_BASE}/activity_schedules/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          deal: deal.id,
          due_at: dueAt,
          text: text
        })
      })
      if (!res.ok) throw new Error("Failed to add schedule")
      const saved = await res.json()
      
      setStages(prev => prev.map((s, i) => {
        if (i !== stageIndex) return s
        const deals = s.deals.map((d, j) => {
          if (j !== cardIndex) return d
          const activitySchedules = (d.activitySchedules || []).map(sch => sch.id === tempId ? { ...sch, id: saved.id } : sch)
          return { ...d, activitySchedules }
        })
        return { ...s, deals }
      }))
    } catch (err) {
      console.error("Failed to add schedule", err)
    }
  }

  const updateSchedule = async (stageIndex, cardIndex, scheduleIdx, updates) => {
    const deal = stages[stageIndex].deals[cardIndex]
    const schedule = deal.activitySchedules[scheduleIdx]
    if (!schedule.id) return

    setStages(prev => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => {
        if (j !== cardIndex) return d
        const activitySchedules = d.activitySchedules.map((sch, k) => k === scheduleIdx ? { ...sch, ...updates } : sch)
        return { ...d, activitySchedules }
      })
      return { ...s, deals }
    }))

    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      const body = {}
      if (updates.dueAt !== undefined) body.due_at = updates.dueAt
      if (updates.text !== undefined) body.text = updates.text

      await fetch(`${API_BASE}/activity_schedules/${schedule.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body)
      })
    } catch (err) {
      console.error("Failed to update schedule", err)
    }
  }

  const deleteSchedule = async (stageIndex, cardIndex, scheduleIdx) => {
    const deal = stages[stageIndex].deals[cardIndex]
    const schedule = deal.activitySchedules[scheduleIdx]
    if (!schedule.id) return

    setStages(prev => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => {
        if (j !== cardIndex) return d
        const activitySchedules = d.activitySchedules.filter((_, k) => k !== scheduleIdx)
        return { ...d, activitySchedules }
      })
      return { ...s, deals }
    }))

    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      await fetch(`${API_BASE}/activity_schedules/${schedule.id}/`, {
        method: "DELETE",
        headers
      })
    } catch (err) {
      console.error("Failed to delete schedule", err)
    }
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
    setDetailDeal({
        company: d.customer || d.customer_name || "",
        contact: d.contact || "",
        opportunity: d.title || "",
        email: d.email || "",
        phone: d.phone || "",
        address: d.address || "",
        taxId: d.taxId || "",
        poNumber: d.poNumber || "",
        amount: d.amount || 0,
        currency: d.currency || "฿",
        priority: d.priority || "none",
        stageIndex: stageIndex,
        notes: d.notes || "",
        salesperson: d.salesperson || d.salespersonName || ""
    })
    setOpenDetail({ stageIndex, cardIndex })
  }

  const saveDetail = async () => {
    if (!openDetail) return
    const { stageIndex, cardIndex } = openDetail
    const dealId = stages[stageIndex].deals[cardIndex].id

    // Optimistic Update
    setStages((prev) => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => (j === cardIndex ? { 
          ...d, 
          customer: detailDeal.company,
          customer_name: detailDeal.company,
          title: detailDeal.opportunity,
          amount: detailDeal.amount,
          currency: detailDeal.currency,
          priority: detailDeal.priority,
          contact: detailDeal.contact, 
          email: detailDeal.email, 
          phone: detailDeal.phone, 
          address: detailDeal.address, 
          taxId: detailDeal.taxId,
          poNumber: detailDeal.poNumber,
          notes: detailDeal.notes,
          salesperson: detailDeal.salesperson,
          salespersonName: detailDeal.salesperson
      } : d))
      return { ...s, deals }
    }))
    setOpenDetail(null)

    // API Update
    try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
        
        const stageName = stages[stageIndex].name
        
        const apiBody = {
            title: detailDeal.opportunity,
            customer_name: detailDeal.company,
            amount: detailDeal.amount,
            currency: detailDeal.currency,
            priority: detailDeal.priority,
            contact: detailDeal.contact,
            email: detailDeal.email,
            phone: detailDeal.phone,
            address: detailDeal.address,
            tax_id: detailDeal.taxId,
            po_number: detailDeal.poNumber,
            notes: detailDeal.notes,
            stage: stageName,
            salesperson: detailDeal.salesperson
        }

        await fetch(`${API_BASE}/deals/${dealId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(apiBody)
        })
    } catch (err) {
        console.error("Failed to update deal details", err)
        showNotification("Failed to update deal details")
    }
  }

  const openEmailModal = (stageIndex, cardIndex) => {
    const d = stages[stageIndex].deals[cardIndex]
    setOpenEmail({ stageIndex, cardIndex, to: d.email || "" })
    setEmailSubject(`Regarding: ${d.title}`)
    setEmailBody(`Dear ${d.contact || "Partner"},\n\n`)
  }

  // Drag cards between stages
  const onCardDragStart = (stageIndex, cardIndex, e) => {
    e.dataTransfer.setData("card", JSON.stringify({ stageIndex, cardIndex }))
  }
  const onCardDrop = async (toStageIndex, e) => {
    const payload = e.dataTransfer.getData("card")
    if (!payload) return
    const { stageIndex: fromStageIndex, cardIndex } = JSON.parse(payload)
    if (fromStageIndex === toStageIndex) return
    
    const card = stages[fromStageIndex].deals[cardIndex]
    if (card) {
      const fromStageName = stages[fromStageIndex].name
      const stageName = stages[toStageIndex].name
      const sname = String(stageName || "").toLowerCase()
      const isClosedWon = sname.includes("close") && sname.includes("won")
      const baseMsg = `CRM: Moved "${card.title}" from ${fromStageName} --> ${stageName}`
      const msg = isClosedWon ? `${baseMsg} — Create PO or Receive PO` : baseMsg
      showNotification(msg)
      notifyTeam(msg, isClosedWon ? "success" : "info", card.customer || "", "CRM")
      window.dispatchEvent(new Event("notificationUpdated"))
      try {
        const token = localStorage.getItem("authToken")
        await fetch(`${API_BASE}/deals/${card.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Token ${token}` } : {})
          },
          body: JSON.stringify({ stage: stageName })
        })
        window.dispatchEvent(new Event("notificationUpdated"))
      } catch (err) {
        console.error("Failed to persist stage change", err)
      }
    }

    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, deals: [...s.deals] }))
      const [movedCard] = next[fromStageIndex].deals.splice(cardIndex, 1)
      next[toStageIndex].deals.push(movedCard)
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
  const setCardPriority = async (stageIndex, cardIndex, priority) => {
    const currentDeal = stages[stageIndex].deals[cardIndex]
    
    // Optimistic update
    setStages((prev) => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => (j === cardIndex ? { ...d, priority } : d))
      return { ...s, deals }
    }))
    setOpenPriority(null)

    // API Update
    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      await fetch(`${API_BASE}/deals/${currentDeal.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ priority })
      })
    } catch (err) {
      console.error("Failed to update priority", err)
      // Revert if needed (optional)
    }
  }

  const editCard = (stageIndex, cardIndex) => {
    const s = stages[stageIndex]
    const d = s.deals[cardIndex]
    setEditingDeal({
        company: d.customer || "",
        contact: d.contact || "",
        opportunity: d.title || "",
        email: d.email || "",
        phone: d.phone || "",
        address: d.address || "",
        taxId: d.taxId || "",
        poNumber: d.poNumber || "",
        amount: d.amount || 0,
        currency: d.currency || "฿",
        priority: d.priority || "none",
        stageIndex: stageIndex,
        salesperson: d.salesperson || "",
    })
    setOpenEdit({ stageIndex, cardIndex })
  }
  const saveEditCard = async () => {
    if (!openEdit) return
    const { stageIndex, cardIndex } = openEdit
    const newStageIndex = editingDeal.stageIndex
    
    const dealId = stages[stageIndex].deals[cardIndex].id
    
    const updatedFields = {
        title: editingDeal.opportunity || editingDeal.company || "Untitled",
        customer: editingDeal.company || "",
        amount: Number(editingDeal.amount) || 0,
        currency: editingDeal.currency || "฿",
        priority: editingDeal.priority || "none",
        contact: editingDeal.contact || "",
        email: editingDeal.email || "",
        phone: editingDeal.phone || "",
        address: editingDeal.address || "",
        taxId: editingDeal.taxId || "",
        poNumber: editingDeal.poNumber || "",
        salesperson: editingDeal.salesperson || "",
    }

    setStages((prev) => {
        if (stageIndex !== newStageIndex) {
            const oldStage = prev[stageIndex]
            const deal = oldStage.deals[cardIndex]
            const newStages = [...prev]
            newStages[stageIndex] = {
                ...oldStage,
                deals: oldStage.deals.filter((_, i) => i !== cardIndex)
            }
            const updatedDeal = { ...deal, ...updatedFields }
            newStages[newStageIndex] = {
                ...newStages[newStageIndex],
                deals: [...newStages[newStageIndex].deals, updatedDeal]
            }
            return newStages
        } else {
            return prev.map((stage, i) => {
                if (i !== stageIndex) return stage
                const deals = stage.deals.map((deal, j) => (j === cardIndex ? { ...deal, ...updatedFields } : deal))
                return { ...stage, deals }
            })
        }
    })
    
    setOpenEdit(null)
    
    try {
        const token = localStorage.getItem("authToken")
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Token ${token}` } : {})
        }
        
        const stageName = stages[newStageIndex].name
        
        const apiBody = {
            title: updatedFields.title,
            customer_name: updatedFields.customer,
            amount: updatedFields.amount,
            currency: updatedFields.currency,
            priority: updatedFields.priority,
            contact: updatedFields.contact,
            email: updatedFields.email,
            phone: updatedFields.phone,
            address: updatedFields.address,
            tax_id: updatedFields.taxId,
            po_number: updatedFields.poNumber,
            stage: stageName,
            salesperson: updatedFields.salesperson
        }

        await fetch(`${API_BASE}/deals/${dealId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(apiBody)
        })
    } catch (err) {
        console.error("Failed to update deal", err)
        showNotification("Failed to update deal")
    }
  }

  const deleteCard = (stageIndex, cardIndex) => {
    setDeleteConfirmation({ stageIndex, cardIndex })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return
    const { stageIndex, cardIndex } = deleteConfirmation
    
    const dealId = stages[stageIndex].deals[cardIndex].id

    // Optimistic update
    setStages((prev) => prev.map((stage, i) => {
      if (i !== stageIndex) return stage
      const deals = stage.deals.filter((_, j) => j !== cardIndex)
      return { ...stage, deals }
    }))

    setDeleteConfirmation(null)

    // API Update
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      await fetch(`${API_BASE}/deals/${dealId}/`, {
        method: "DELETE",
        headers
      })
    } catch (err) {
      console.error("Failed to delete deal", err)
    }
  }

  const getProbability = (stageName) => {
    switch(stageName) {
      case "Appointment Schedule": return 10;
      case "Presentation Schedule": return 25;
      case "Quotation": return 40;
      case "Demo": return 55;
      case "Decision": return 75;
      case "Connection": return 90;
      case "Close Won": return 100;
      default: return 10;
    }
  }

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <Navigation />
      
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              CRM
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              {["Deals", "Customers", "Tickets", "Leads", "Analytics"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab === "Deals" ? "Sales Pipeline" : tab}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "Deals" && (
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Import</button>
              <button 
                onClick={() => { setNewDeal(defaultNewDeal); setShowNewForm(true); }}
                className="px-5 py-2 text-sm font-medium text-white bg-[#2D4485] rounded-lg hover:bg-[#3D56A6] shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5"
              >
                + Create deal
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "Deals" && (
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
              {[
                { label: 'Create date', key: 'createdAt' },
                { label: 'Last activity', key: 'lastActivity' },
                { label: 'Close date', key: 'expectedClose' },
              ].map((item) => {
                const active = sortBy === item.key
                return (
                  <button
                    key={item.key}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${active ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                    onClick={() => {
                      if (sortBy === item.key) setSortAsc(!sortAsc)
                      else { setSortBy(item.key); setSortAsc(false) }
                    }}
                    title={`Sort by ${item.label}${active ? (sortAsc ? ' (asc)' : ' (desc)') : ''}`}
                  >
                    {item.label} <span className="text-[10px] opacity-50">{active ? (sortAsc ? '▲' : '▼') : '▼'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Deals" ? (
        <section className="w-full overflow-x-auto h-[calc(100vh-140px)] bg-slate-50">
          <div className="flex h-full p-6 gap-6">
            {stages.map((stage, stageIndex) => {
              const total = totalFor(stage.deals);
              const prob = getProbability(stage.name);
              const weighted = total * (prob / 100);
              const sortedDeals = sortDeals(stage.deals, sortBy, sortAsc);
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
                  <div className="flex-1 overflow-y-auto p-3">
                    {sortedDeals.map((d, cardIndex) => (
                      <div
                        key={d.id}
                        className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4 mb-3 hover:shadow-md hover:ring-[#2D4485]/30 transition-all cursor-grab relative group/card"
                        draggable
                        onDragStart={(e) => onCardDragStart(stageIndex, cardIndex, e)}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5">
                            <span 
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2D4485] text-sm font-semibold border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors max-w-full"
                              onClick={(e) => { e.stopPropagation(); openDealDetail(stageIndex, cardIndex); }}
                              title="View company details"
                            >
                              <span className="truncate text-xs leading-tight">{d.customer || d.customer_name || d.contact || d.email || d.title}</span>
                            </span>

                            {d.poNumber && (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                                title="PO Number"
                              >
                                <span className="truncate leading-tight max-w-[180px]">PO: {String(d.poNumber || "").trim()}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-blue-100 bg-blue-50 text-[#2D4485] hover:bg-blue-100 transition-colors"
                              onClick={(e) => { e.stopPropagation(); openEmailModal(stageIndex, cardIndex); }}
                              title="Send email"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                              </svg>
                            </button>
                            <button
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              onClick={(e) => { e.stopPropagation(); deleteCard(stageIndex, cardIndex); }}
                              title="Delete deal"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                         <h4 
                           className="font-semibold text-slate-800 text-sm leading-snug"
                         >
                           {d.title}
                         </h4>
                       </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                            <span className="text-xs font-normal text-slate-400">{d.currency}</span>
                            {d.amount.toLocaleString()}
                          </div>
                          {(d.salesperson || d.salespersonName) && (
                            <span 
                              className="text-xs text-slate-600 font-medium px-1 flex items-center gap-1.5"
                              title={`Salesperson: ${d.salesperson || d.salespersonName}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {d.salesperson || d.salespersonName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-2 relative">
                           <div 
                             className={`inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] text-white font-bold shadow-sm ${d.priority === 'high' ? 'bg-red-500 ring-2 ring-red-100' : d.priority === 'medium' ? 'bg-orange-400 ring-2 ring-orange-100' : d.priority === 'low' ? 'bg-[#2D4485] ring-2 ring-blue-100' : 'bg-slate-400 ring-2 ring-slate-200'} cursor-pointer hover:scale-110 transition-transform`}
                             onClick={(e) => {
                                e.stopPropagation();
                                const open = openPriority && openPriority.stageIndex===stageIndex && openPriority.cardIndex===cardIndex
                                setOpenPriority(open ? null : { stageIndex, cardIndex })
                             }}
                             title={`Priority: ${priorityLabel(d.priority)}`}
                           >
                              {priorityLabel(d.priority)}
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
                             title={(() => {
                                const item = nextSchedule(d)
                                if (!item) return "No upcoming activity"
                                const txt = formatActivityPreviewText(item.text || "Activity")
                                const dt = item.dueAt ? new Date(item.dueAt).toLocaleString() : ""
                                return dt ? `${txt} — ${dt}` : txt
                             })()}
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
                              title={`${formatActivityPreviewText(it.text || "Activity")}${it.dueAt ? ` — ${new Date(it.dueAt).toLocaleString()}` : ""}`}
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
                                        updateSchedule(stageIndex, cardIndex, i, { text: e.target.value })
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
                                    addSchedule(stageIndex, cardIndex, dueAt, scheduleText || "")
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
          {openEdit && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setOpenEdit(null)}>
              <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[640px] z-50 transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Edit Deal</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setOpenEdit(null)}>✕</button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Sales Person</div>
                        <input 
                          type="text"
                          value={editingDeal.salesperson} 
                          onChange={(e)=>setEditingDeal({...editingDeal, salesperson:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                          placeholder="Enter sales person name"
                        />
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Company</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                            <div className="relative">
                              <input 
                                value={editingDeal.company} 
                                onChange={(e)=> {
                                  setEditingDeal({...editingDeal, company:e.target.value})
                                  setShowCompanySuggestions(true)
                                }}
                                onFocus={() => setShowCompanySuggestions(true)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                                placeholder="Search or enter company name..."
                              />
                              {showCompanySuggestions && editingDeal.company && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                  {thaiCompanies.filter(c => c.name.toLowerCase().includes(editingDeal.company.toLowerCase())).map((c, i) => (
                                    <button
                                      key={i}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                      onClick={() => {
                                        setEditingDeal({...editingDeal, company: c.name, contact: c.contact, email: c.email || "", phone: c.phone || "", address: c.address || "", taxId: c.taxId || ""})
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      <div className="font-medium">{c.name}</div>
                                      <div className="text-xs text-slate-500">Contact: {c.contact}</div>
                                    </button>
                                  ))}
                                  {editingDeal.company && !thaiCompanies.some(c => c.name.toLowerCase() === editingDeal.company.toLowerCase()) && (
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-[#2D4485] font-medium"
                                      onClick={() => {
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      + Add "{editingDeal.company}"
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Opportunity</label>
                            <input 
                              value={editingDeal.opportunity} 
                              onChange={(e)=>setEditingDeal({...editingDeal, opportunity:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Deal opportunity name"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                            <input 
                              value={editingDeal.email} 
                              onChange={(e)=>setEditingDeal({...editingDeal, email:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                            <input 
                              value={editingDeal.phone} 
                              onChange={(e)=>setEditingDeal({...editingDeal, phone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Phone number"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                            <input 
                              value={editingDeal.address} 
                              onChange={(e)=>setEditingDeal({...editingDeal, address:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                            <input 
                              value={editingDeal.contact} 
                              onChange={(e)=>setEditingDeal({...editingDeal, contact:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Contact person"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Codes</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tax ID</label>
                            <input 
                              value={editingDeal.taxId} 
                              onChange={(e)=>setEditingDeal({...editingDeal, taxId:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Tax ID"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">PO Number</label>
                            <input 
                              value={editingDeal.poNumber} 
                              onChange={(e)=>setEditingDeal({...editingDeal, poNumber:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Purchase Order Number"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Amount</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{editingDeal.currency}</span>
                              <input 
                                type="number" 
                                value={editingDeal.amount} 
                                onChange={(e)=>setEditingDeal({...editingDeal, amount:Number(e.target.value)})} 
                                className="w-full pl-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                            <input 
                              value={editingDeal.currency} 
                              onChange={(e)=>setEditingDeal({...editingDeal, currency:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all text-center uppercase" 
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Priority</div>
                        <div className="flex items-center gap-3">
                          {[1,2,3].map(n => {
                            const p = n===1 ? 'low' : n===2 ? 'medium' : 'high'
                            const title = n===1 ? 'Low' : n===2 ? 'Medium' : 'High'
                            const active = editingDeal.priority===p
                            const colorClass = n===1 ? 'bg-[#2D4485]' : n===2 ? 'bg-orange-400' : 'bg-red-500'
                            return (
                              <button
                                key={n}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? `${colorClass} text-white border-transparent shadow-md transform scale-105` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                onClick={()=>setEditingDeal({...editingDeal, priority: active ? 'none' : p})}
                              >
                                {title} Priority
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Stage</div>
                        <select 
                          value={editingDeal.stageIndex} 
                          onChange={(e)=>setEditingDeal({...editingDeal, stageIndex:Number(e.target.value)})} 
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
                      onClick={() => setOpenEdit(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-5 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
                      onClick={saveEditCard}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {openDetail && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setOpenDetail(null)}>
              <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[640px] transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Company Details</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setOpenDetail(null)}>✕</button>
                  </div>
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Sales Person</div>
                        <input 
                          type="text"
                          value={detailDeal.salesperson} 
                          onChange={(e)=>setDetailDeal({...detailDeal, salesperson:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                          placeholder="Enter sales person name"
                        />
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Company</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                            <div className="relative">
                              <input 
                                value={detailDeal.company} 
                                onChange={(e)=> {
                                  setDetailDeal({...detailDeal, company:e.target.value})
                                  setShowCompanySuggestions(true)
                                }}
                                onFocus={() => setShowCompanySuggestions(true)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                                placeholder="Search or enter company name..."
                              />
                              {showCompanySuggestions && detailDeal.company && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                  {thaiCompanies.filter(c => c.name.toLowerCase().includes(detailDeal.company.toLowerCase())).map((c, i) => (
                                    <button
                                      key={i}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                      onClick={() => {
                                        setDetailDeal({...detailDeal, company: c.name, contact: c.contact, email: c.email || "", phone: c.phone || "", address: c.address || "", taxId: c.taxId || ""})
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      <div className="font-medium">{c.name}</div>
                                      <div className="text-xs text-slate-500">Contact: {c.contact}</div>
                                    </button>
                                  ))}
                                  {detailDeal.company && !thaiCompanies.some(c => c.name.toLowerCase() === detailDeal.company.toLowerCase()) && (
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-[#2D4485] font-medium"
                                      onClick={() => {
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      + Add "{detailDeal.company}"
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Opportunity</label>
                            <input 
                              value={detailDeal.opportunity} 
                              onChange={(e)=>setDetailDeal({...detailDeal, opportunity:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Deal opportunity name"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                            <input 
                              value={detailDeal.email} 
                              onChange={(e)=>setDetailDeal({...detailDeal, email:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                            <input 
                              value={detailDeal.phone} 
                              onChange={(e)=>setDetailDeal({...detailDeal, phone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Phone number"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                            <input 
                              value={detailDeal.address} 
                              onChange={(e)=>setDetailDeal({...detailDeal, address:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                            <input 
                              value={detailDeal.contact} 
                              onChange={(e)=>setDetailDeal({...detailDeal, contact:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Contact person"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Codes</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tax ID</label>
                            <input 
                              value={detailDeal.taxId} 
                              onChange={(e)=>setDetailDeal({...detailDeal, taxId:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Tax ID"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">PO Number</label>
                            <input 
                              value={detailDeal.poNumber} 
                              onChange={(e)=>setDetailDeal({...detailDeal, poNumber:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Purchase Order Number"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Amount</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{detailDeal.currency}</span>
                              <input 
                                type="number" 
                                value={detailDeal.amount} 
                                onChange={(e)=>setDetailDeal({...detailDeal, amount:Number(e.target.value)})} 
                                className="w-full pl-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                            <input 
                              value={detailDeal.currency} 
                              onChange={(e)=>setDetailDeal({...detailDeal, currency:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all text-center uppercase" 
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Priority</div>
                        <div className="flex items-center gap-3">
                          {[1,2,3].map(n => {
                            const p = n===1 ? 'low' : n===2 ? 'medium' : 'high'
                            const title = n===1 ? 'Low' : n===2 ? 'Medium' : 'High'
                            const active = detailDeal.priority===p
                            const colorClass = n===1 ? 'bg-[#2D4485]' : n===2 ? 'bg-orange-400' : 'bg-red-500'
                            return (
                              <button
                                key={n}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? `${colorClass} text-white border-transparent shadow-md transform scale-105` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                onClick={()=>setDetailDeal({...detailDeal, priority: active ? 'none' : p})}
                              >
                                {title} Priority
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Notes</div>
                        <textarea 
                          value={detailDeal.notes} 
                          onChange={(e)=>setDetailDeal({...detailDeal, notes:e.target.value})} 
                          className="w-full min-h-[120px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all resize-y" 
                          placeholder="Add notes about this deal..." 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                    <button 
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm" 
                      onClick={() => setOpenDetail(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-5 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
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
              <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[640px] z-50 transition-all" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">New Deal</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowNewForm(false)}>✕</button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Sales Person</div>
                        <input 
                          type="text"
                          value={newDeal.salesperson} 
                          onChange={(e)=>setNewDeal({...newDeal, salesperson:e.target.value})} 
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                          placeholder="Enter sales person name"
                        />
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Company</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                            <div className="relative">
                              <input 
                                value={newDeal.company} 
                                onChange={(e)=> {
                                  setNewDeal({...newDeal, company:e.target.value})
                                  setShowCompanySuggestions(true)
                                }}
                                onFocus={() => setShowCompanySuggestions(true)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                                placeholder="Search or enter company name..."
                              />
                              {showCompanySuggestions && newDeal.company && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                  {thaiCompanies.filter(c => c.name.toLowerCase().includes(newDeal.company.toLowerCase())).map((c, i) => (
                                    <button
                                      key={i}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                      onClick={() => {
                                        setNewDeal({...newDeal, company: c.name, contact: c.contact, email: c.email || "", phone: c.phone || "", address: c.address || "", taxId: c.taxId || ""})
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      <div className="font-medium">{c.name}</div>
                                      <div className="text-xs text-slate-500">Contact: {c.contact}</div>
                                    </button>
                                  ))}
                                  {newDeal.company && !thaiCompanies.some(c => c.name.toLowerCase() === newDeal.company.toLowerCase()) && (
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-[#2D4485] font-medium"
                                      onClick={() => {
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      + Add "{newDeal.company}"
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Opportunity</label>
                            <input 
                              value={newDeal.opportunity} 
                              onChange={(e)=>setNewDeal({...newDeal, opportunity:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Deal opportunity name"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                            <input 
                              value={newDeal.email} 
                              onChange={(e)=>setNewDeal({...newDeal, email:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                            <input 
                              value={newDeal.phone} 
                              onChange={(e)=>setNewDeal({...newDeal, phone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Phone number"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                            <input 
                              value={newDeal.address} 
                              onChange={(e)=>setNewDeal({...newDeal, address:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                            <input 
                              value={newDeal.contact} 
                              onChange={(e)=>setNewDeal({...newDeal, contact:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Contact person"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Codes</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tax ID</label>
                            <input 
                              value={newDeal.taxId} 
                              onChange={(e)=>setNewDeal({...newDeal, taxId:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Tax ID"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">PO Number</label>
                            <input 
                              value={newDeal.poNumber} 
                              onChange={(e)=>setNewDeal({...newDeal, poNumber:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Purchase Order Number"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Amount</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{newDeal.currency}</span>
                              <input 
                                type="number" 
                                value={newDeal.amount} 
                                onChange={(e)=>setNewDeal({...newDeal, amount:Number(e.target.value)})} 
                                className="w-full pl-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                            <input 
                              value={newDeal.currency} 
                              onChange={(e)=>setNewDeal({...newDeal, currency:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all text-center uppercase" 
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Priority</div>
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

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Stage</div>
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
                      type="button"
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm"
                      onClick={() => setShowNewForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
                      onClick={async () => {
                        let stageName = ""
                        try {
                          stageName = stages[newDeal.stageIndex]?.name || stages[0]?.name || ""
                        } catch {}
                        const dealData = {
                          title: newDeal.opportunity || newDeal.company || "Untitled",
                          customer: null,
                          amount: Number(newDeal.amount) || 0,
                          currency: newDeal.currency || "฿",
                          po_number: newDeal.poNumber || "",
                          priority: newDeal.priority || "none",
                          contact: newDeal.contact || "",
                          email: newDeal.email || "",
                          phone: newDeal.phone || "",
                          address: newDeal.address || "",
                          tax_id: newDeal.taxId || "",
                          notes: "",
                          stage: stageName,
                          write_customer_name: newDeal.company || "",
                          salesperson: newDeal.salesperson || null
                        }
                        if ((newDeal.company || "").trim()) {
                          dealData.write_customer_name = newDeal.company.trim()
                        }

                        try {
                          const token = localStorage.getItem("authToken")
                          const headers = {
                            "Content-Type": "application/json",
                            ...(token ? { "Authorization": `Token ${token}` } : {})
                          }
                          const res = await fetch(`${API_BASE}/deals/`, {
                            method: "POST",
                            headers,
                            body: JSON.stringify(dealData)
                          })
                          
                          if (res.ok) {
                            await fetchDeals()
                            setShowNewForm(false)
                            setNewDeal(defaultNewDeal)
                            try {
                              const sname = String(stageName).toLowerCase()
                              const isClosedWon = sname.includes("close") && sname.includes("won")
                              const baseMsg = `CRM: Created "${dealData.title}" in ${stageName}`
                              const msg = isClosedWon ? `${baseMsg} — Create PO or Receive PO` : baseMsg
                              showNotification(msg)
                              notifyTeam(msg, isClosedWon ? "success" : "info", dealData.customer || "", "CRM")
                            } catch {}
                          } else {
                            const errorText = await res.text()
                            console.error("Failed to create deal:", errorText)
                            showNotification("Failed to create deal: " + errorText)
                          }
                        } catch (err) {
                          console.error("Error creating deal", err)
                          showNotification("Error creating deal: " + err.message)
                        }
                      }}
                    >
                      Create Deal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {openEmail && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity" onClick={() => setOpenEmail(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-800 text-lg">
                     {showEmailSettings ? "Email Configuration" : "Send Email"}
                   </h3>
                   <div className="flex items-center gap-2">
                     {!showEmailSettings && (
                       <button 
                         onClick={() => setShowEmailSettings(true)} 
                         className="p-1.5 text-slate-400 hover:text-[#2D4485] hover:bg-blue-50 rounded-full transition-colors"
                         title="Configure Email Service"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                       </button>
                     )}
                     <button onClick={() => setOpenEmail(null)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                   </div>
                 </div>
                 
                 {showEmailSettings ? (
                   <div className="p-6 space-y-4">
                     <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                       To send emails directly from this app (without opening Outlook/Mail), you need a free account from <a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">EmailJS.com</a>.
                       <br/><br/>
                       1. Sign up & Create a Service (e.g. Gmail)<br/>
                       2. Create an Email Template<br/>
                       3. Copy your keys here:
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1.5">Service ID</label>
                       <input 
                         type="text" 
                         value={emailConfig.serviceId} 
                         onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                         className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                         placeholder="service_..."
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1.5">Template ID</label>
                       <input 
                         type="text" 
                         value={emailConfig.templateId} 
                         onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})}
                         className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                         placeholder="template_..."
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1.5">Public Key</label>
                       <input 
                         type="text" 
                         value={emailConfig.publicKey} 
                         onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                         className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                         placeholder="User ID / Public Key"
                       />
                     </div>
                     <div className="pt-4 flex justify-end gap-3">
                        <button 
                          onClick={() => setShowEmailSettings(false)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => saveEmailConfig(emailConfig)}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#2D4485] hover:bg-[#3D56A6] rounded-lg shadow-sm transition-all"
                        >
                          Save Configuration
                        </button>
                     </div>
                   </div>
                 ) : (
                   <>
                     <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">To</label>
                          <input 
                            type="email" 
                            value={openEmail.to} 
                            onChange={e => setOpenEmail({...openEmail, to: e.target.value})}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                          <input 
                            type="text" 
                            value={emailSubject} 
                            onChange={e => setEmailSubject(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                          <textarea 
                            rows={6}
                            value={emailBody} 
                            onChange={e => setEmailBody(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none resize-none transition-all"
                          />
                        </div>
                     </div>
                     <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-end gap-3 items-center">
                       {!emailConfig.serviceId && (
                         <span className="text-xs text-slate-500 mr-auto max-w-[200px] leading-tight">
                           Tip: Click the gear icon <span className="inline-block align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></span> to configure instant sending.
                         </span>
                       )}
                       
                       <button 
                         onClick={() => {
                           const subject = encodeURIComponent(emailSubject);
                           const body = encodeURIComponent(emailBody.replace(/\n/g, "\r\n"));
                           const mailtoLink = `mailto:${openEmail.to}?subject=${subject}&body=${body}`;
                           const link = document.createElement('a');
                           link.href = mailtoLink;
                           link.target = '_blank';
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                           setOpenEmail(null);
                         }}
                         className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                       >
                         Open Mail App
                       </button>

                       {emailConfig.serviceId && (
                         <button 
                           onClick={async () => {
                             if (!openEmail.to) {
                               showNotification("Please enter an email address");
                               return;
                             }
                             setIsSending(true);
                             try {
                               await emailjs.send(emailConfig.serviceId, emailConfig.templateId, {
                                  to_email: openEmail.to,
                                  subject: emailSubject,
                                  message: emailBody,
                               }, emailConfig.publicKey);
                               showNotification(`Email sent successfully to ${openEmail.to}`);
                               setOpenEmail(null);
                             } catch (error) {
                               console.error("Email failed:", error);
                               showNotification("Failed to send. Check configuration.");
                             } finally {
                               setIsSending(false);
                             }
                           }}
                           disabled={isSending}
                           className="px-4 py-2 text-sm font-medium text-white bg-[#2D4485] hover:bg-[#3D56A6] rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                         >
                           {isSending ? (
                             <>
                               <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                               </svg>
                               Sending...
                             </>
                           ) : (
                             "Send Now"
                           )}
                         </button>
                       )}
                     </div>
                   </>
                 )}
              </div>
            </div>
          )}
      </section>
      ) : activeTab === "Customers" ? (
        <div className="min-h-screen bg-white">
          <CRMCustomers />
        </div>
      ) : activeTab === "Tickets" ? (
        <div className="min-h-screen bg-white">
          <CRMTickets />
        </div>
      ) : activeTab === "Leads" ? (
        <div className="min-h-screen bg-white">
          <CRMLeads />
        </div>
      ) : activeTab === "Analytics" ? (
        <div className="min-h-screen bg-white">
          <CRMAnalytics />
        </div>
      ) : (
        <div className="p-6 text-slate-600">Coming soon</div>
      )}
      
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDeleteConfirmation(null)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg border-2 border-white">
              <div className="px-4 py-3 border-b-2 border-white">
                <h3 className="font-semibold text-gray-900">Confirm Delete</h3>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-800">Delete this opportunity?</div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setDeleteConfirmation(null)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#2D4485] text-white hover:bg-[#3D56A6]"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
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
      <CRMPage />
    </LanguageProvider>
  </React.StrictMode>,
)
