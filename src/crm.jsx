// CRM Page Component
import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import { Mail, Trash, Trash2, FileText, Undo, Redo, ChevronDown, Paperclip, Link as LinkIcon, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Indent, Baseline, X, Check } from "lucide-react"
import "./index.css"
import { API_BASE_URL } from "./config"
import CRMCustomers from "./crm-customers.jsx"
import CRMActivities from "./crm-activities.jsx"
import CRMHistory from "./components/crm/CRMHistory.jsx"
import { Toaster } from "./components/ui/toaster"

const initialPipeline = {
  "Appointment Schedule": [
    { 
      id: 1, 
      title: "Discussing Goods Price", 
      customer: "Big C Supercenter PLC", 
      amount: 0, 
      currency: "฿", 
      priority: "none", 
      contact: "", 
      email: "", 
      phone: "", 
      notes: "", 
      createdAt: new Date().toISOString(), 
      expectedClose: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      activitySchedules: [
        { id: 101, dueAt: new Date().toISOString(), activityName: "Initial Meeting", salesperson: "Sales Team", customer: "Big C Supercenter PLC" },
        { id: 102, dueAt: new Date(Date.now() + 2*24*60*60*1000).toISOString(), activityName: "Follow up Email", salesperson: "Sales Team", customer: "Big C Supercenter PLC" }
      ]
    },
  ],
  "Presentation Schedule": [
    { 
      id: 2, 
      title: "Selling New Machines", 
      customer: "SIANGHAI EITING TRADING COMPANY", 
      amount: 50000, 
      currency: "฿", 
      priority: "high", 
      contact: "", 
      email: "", 
      phone: "", 
      notes: "", 
      createdAt: new Date().toISOString(), 
      expectedClose: new Date(Date.now() + 45*24*60*60*1000).toISOString().split('T')[0],
      activitySchedules: [
        { id: 201, dueAt: new Date(Date.now() + 5*24*60*60*1000).toISOString(), activityName: "Product Demo", salesperson: "Sales Team", customer: "SIANGHAI EITING" }
      ]
    },
  ],
  Quotation: [
    { 
      id: 3, 
      title: "Introduced New Plan about Manufacturing", 
      customer: "METRO MACHINERY", 
      amount: 100, 
      currency: "฿", 
      priority: "medium", 
      contact: "", 
      email: "", 
      phone: "", 
      notes: "", 
      createdAt: new Date().toISOString(), 
      expectedClose: new Date(Date.now() + 20*24*60*60*1000).toISOString().split('T')[0] 
    },
  ],
  Demo: [],
  Decision: [],
  Connection: [],
  "Contract Sent": [],
  "Close Won": [
    { 
      id: 4, 
      title: "Negotiated and made contract", 
      customer: "Konvy", 
      amount: 80000, 
      currency: "฿", 
      priority: "low", 
      contact: "", 
      email: "", 
      phone: "", 
      notes: "", 
      createdAt: new Date().toISOString(), 
      expectedClose: new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0] 
    },
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
  // Comment: Validation popup state for user-friendly UI alerts (e.g., missing required fields)
  // Comment: Shape: { title: string, message: string }
  const [validationModal, setValidationModal] = React.useState(null)
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

  const fetchStages = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}
      const res = await fetch(`${API_BASE}/stages/`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
           setStages(data.map(s => ({ ...s, deals: [] })))
           return true
        }
      }
      return false
    } catch (err) {
      console.error("Error fetching stages:", err)
      return false
    }
  }

  const seedStages = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      
      const stageNames = Object.keys(initialPipeline)
      for (let i = 0; i < stageNames.length; i++) {
        await fetch(`${API_BASE}/stages/`, {
          method: "POST",
          headers,
          body: JSON.stringify({ name: stageNames[i], order: i })
        })
      }
    } catch (err) {
      console.error("Error seeding stages:", err)
    }
  }

  React.useEffect(() => {
    const init = async () => {
       let loaded = await fetchStages()
       if (!loaded) {
          await seedStages()
          await fetchStages()
       }
       fetchDeals()
       fetchUsers()
    }
    init()
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
            customerId: d.customer || null,
            amount: Number(d.amount),
            currency: d.currency,
            priority: d.priority,
            contact: d.contact,
            email: d.email,
            phone: d.phone,
            address: d.address,
            taxId: d.tax_id,
            extraContacts: d.extra_contacts || [],
            notes: d.notes,
            createdAt: d.created_at,
            expectedClose: d.expected_close,
            poNumber: d.po_number || "",
            salesperson: d.salesperson || "",
            salespersonName: d.salesperson_name || "",
            branch: d.branch || "",
            activitySchedules: (d.activity_schedules || []).map(s => ({
              id: s.id,
              startAt: s.start_at ? s.start_at.slice(0, 16) : "",
              dueAt: s.due_at ? s.due_at.slice(0, 16) : "",
              activityName: s.activity_name || "",
              salesperson: s.salesperson || "",
              customer: s.customer || "",
              completed: s.completed || false,
              linked_task: s.linked_task,
              linked_task_title: s.linked_task_title,
              linked_task_due_date: s.linked_task_due_date
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
  // Comment: Force re-mount of Customers tab component to reload from backend
  const [customerRefreshKey, setCustomerRefreshKey] = React.useState(0)
  const [openPriority, setOpenPriority] = React.useState(null) // { stageIndex, cardIndex }
  const priorityClass = (p) => (p==='high' ? 'bg-red-100 text-red-700' : p==='medium' ? 'bg-orange-100 text-orange-700' : p==='low' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700')
  const priorityLabel = (p) => (p && p!=='none' ? p.charAt(0).toUpperCase()+p.slice(1) : 'Set Priority')
  // Extracted note preview logic into a helper to keep JSX simple and readable
  // - Returns "Today"/"Yesterday"/date based on latest valid note header
  // - Falls back to "Notes" when there is no meaningful content
  const getNotePreviewLabel = (notes) => {
    if (!notes) return "Notes";
    const fragments = notes.split("\n\n──────────────────────────\n");
    let hasNonEmptyContent = false;
    let validDateMatch = null;
    fragments.forEach(fragment => {
      const dateMatch = fragment.match(/^\[(\d{1,2}\/\d{1,2}\/\d{4}.*?)\]\s*/);
      let contentWithoutDate = dateMatch ? fragment.replace(/^\[(\d{1,2}\/\d{1,2}\/\d{4}.*?)\]\s*/, "") : fragment;
      const attachmentRegex = /[\r\n]*(<<Attachment:([^:]+):([^:]+):(.+?)>>)/g;
      const cleanContent = contentWithoutDate.replace(attachmentRegex, "").trim();
      const hasAttachments = contentWithoutDate.match(attachmentRegex);
      if (cleanContent.length > 0 || (hasAttachments && hasAttachments.length > 0)) {
        hasNonEmptyContent = true;
        if (dateMatch && !validDateMatch) {
          validDateMatch = dateMatch;
        }
      }
    });
    if (!hasNonEmptyContent) return "Notes";
    if (validDateMatch) {
      const datePart = validDateMatch[1].split(',')[0].trim();
      if (!datePart) return "Notes";
      const [day, month, year] = datePart.split('/').map(Number);
      if (!day || !month || !year) return datePart;
      const noteDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (noteDate.getTime() === today.getTime()) return "Today";
      if (noteDate.getTime() === yesterday.getTime()) return "Yesterday";
      return datePart;
    }
    return "Notes";
  }
  const defaultNewDeal = {
    company: "",
    branch: "",
    contact: "",
    // Comment: Track Contact Person division and position (attn columns from Customer)
    division: "",
    position: "",
    // Comment: Separate company-level email/phone from Contact Person email/phone
    companyEmail: "",
    companyPhone: "",
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
  const [scheduleSalesperson, setScheduleSalesperson] = React.useState("")
  const [scheduleCustomer, setScheduleCustomer] = React.useState("")
  const [selectedScheduleKey, setSelectedScheduleKey] = React.useState(null)
  const [draggingScheduleKey, setDraggingScheduleKey] = React.useState(null)
  const [dragOverIdx, setDragOverIdx] = React.useState(null)
  const activityModalRef = React.useRef(null)
  const [openScheduleFor, setOpenScheduleFor] = React.useState(false)
  const [openScheduleMenuKey, setOpenScheduleMenuKey] = React.useState(null) // { stageIndex, cardIndex, idx }
  const [editingScheduleKey, setEditingScheduleKey] = React.useState(null) // { stageIndex, cardIndex, idx }
  const [notification, setNotification] = React.useState({ show: false, message: "" })
  const [emailSuccess, setEmailSuccess] = React.useState(false)
  const [sortBy, setSortBy] = React.useState(null) // 'createdAt' | 'lastActivity' | 'expectedClose'
  const [sortAsc, setSortAsc] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showCompanySuggestions, setShowCompanySuggestions] = React.useState(false)
  const [openEmail, setOpenEmail] = React.useState(null) // { stageIndex, cardIndex, to }
  const [emailSubject, setEmailSubject] = React.useState("")
  const [emailBody, setEmailBody] = React.useState("")
  // Undo/Redo history
  const [emailHistory, setEmailHistory] = React.useState([])
  const [historyStep, setHistoryStep] = React.useState(0)
  const historyTimeoutRef = React.useRef(null)
  const [showFormatting, setShowFormatting] = React.useState(false)
  const editorRef = React.useRef(null)

  const [openEdit, setOpenEdit] = React.useState(null) // { stageIndex, cardIndex }
  const [editingDeal, setEditingDeal] = React.useState(defaultNewDeal)
  const [extraContacts, setExtraContacts] = React.useState([])
  const [editExtraContacts, setEditExtraContacts] = React.useState([])
  const [detailExtraContacts, setDetailExtraContacts] = React.useState([])
  const [isSending, setIsSending] = React.useState(false)
  const [emailConfig, setEmailConfig] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("email_config")) || { serviceId: "", templateId: "", publicKey: "" }
    } catch {
      return { serviceId: "", templateId: "", publicKey: "" }
    }
  })
  const [showEmailSettings, setShowEmailSettings] = React.useState(false)
  const isInternalUpdate = React.useRef(false)
  const [attachments, setAttachments] = React.useState([])
  const fileInputRef = React.useRef(null)
  
  // Link Popup State
  const [showLinkPopup, setShowLinkPopup] = React.useState(false)
  const [linkValues, setLinkValues] = React.useState({ text: '', url: '' })
  const savedSelection = React.useRef(null)
  
  // Link Tooltip State
  const [activeLink, setActiveLink] = React.useState(null)
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 })

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const [crmCompanyOptions, setCrmCompanyOptions] = React.useState([])

  React.useEffect(() => {
    const loadCrmCompanies = async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { Authorization: `Token ${token}` } : {}
        const res = await fetch(`${API_BASE_URL}/api/customers/`, { headers })
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data)) return
        const mapped = data
          .map(c => {
            // Comment: Build extra contacts list from Customer cc* CSV fields
            const splitCsv = (s) => String(s || "").split(",").map(v => v.trim()).filter(Boolean)
            const names = splitCsv(c.cc)
            const divs = splitCsv(c.cc_division)
            const emails = splitCsv(c.cc_email)
            const mobiles = splitCsv(c.cc_mobile)
            const positions = splitCsv(c.cc_position)
            const maxLen = Math.max(names.length, divs.length, emails.length, mobiles.length, positions.length)
            const extraPersons = []
            for (let i = 0; i < maxLen; i++) {
              extraPersons.push({
                name: names[i] || "",
                position: positions[i] || "-",
                division: divs[i] || "",
                email: emails[i] || "",
                mobile: mobiles[i] || "",
              })
            }
            return {
              name: c.company_name || "",
              contact: c.attn || "",
              // Comment: Prefer attn email/mobile for Contact Person; fall back to company-level
              attnEmail: c.attn_email || "",
              attnMobile: c.attn_mobile || "",
              email: c.email || "",
              phone: c.phone || "",
              address: c.address || "",
              taxId: c.tax_id || "",
              branch: c.branch || "",
              attnDivision: c.attn_division || "",
              attnPosition: c.attn_position || "",
              extraContacts: extraPersons,
            }
          })
          .filter(c => c.name)
        setCrmCompanyOptions(mapped)
      } catch {}
    }
    loadCrmCompanies()
  }, [])

  const companyOptions = React.useMemo(
    () => [...crmCompanyOptions, ...thaiCompanies],
    [crmCompanyOptions],
  )

  const flatDeals = React.useMemo(
    () =>
      stages.flatMap((stage, stageIndex) =>
        stage.deals.map((d, cardIndex) => ({
          id: d.id,
          title: d.title,
          customer: d.customer,
          stageName: stage.name,
          stageIndex,
          cardIndex,
          pipelineNumber: stageIndex + 1,
        })),
      ),
    [stages],
  )

  const searchResults = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return []
    return flatDeals
      .filter((deal) => {
        const customer = String(deal.customer || "").toLowerCase()
        const title = String(deal.title || "").toLowerCase()
        return customer.includes(q) || title.includes(q)
      })
      .slice(0, 20)
  }, [flatDeals, searchTerm])

  const [highlightedDealKey, setHighlightedDealKey] = React.useState(null)

  const handleSearchResultClick = (deal) => {
    const key = `${deal.stageIndex}-${deal.id}`
    setHighlightedDealKey(key)
    const cardId = `deal-card-${key}`
    requestAnimationFrame(() => {
      const el = document.getElementById(cardId)
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
      }
    })
  }

  // Comment: After highlighting a deal from search, dismiss highlight on next click anywhere
  React.useEffect(() => {
    if (!highlightedDealKey) return
    const handleClickOutside = () => {
      setHighlightedDealKey(null)
    }
    document.addEventListener("mousedown", handleClickOutside, { once: true })
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [highlightedDealKey])

  const saveEmailConfig = (cfg) => {
    setEmailConfig(cfg)
    localStorage.setItem("email_config", JSON.stringify(cfg))
    setShowEmailSettings(false)
    showNotification("Email settings saved")
  }

  const updateEmailBody = (val, fromEditor = false) => {
    if (fromEditor) isInternalUpdate.current = true
    setEmailBody(val)
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)
    historyTimeoutRef.current = setTimeout(() => {
      setEmailHistory(prev => {
         const newHistory = prev.slice(0, historyStep + 1)
         newHistory.push(val)
         return newHistory
      })
      setHistoryStep(prev => prev + 1)
    }, 700)
  }

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1
      setHistoryStep(prevStep)
      setEmailBody(emailHistory[prevStep])
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)
    }
  }

  const handleRedo = () => {
    if (historyStep < emailHistory.length - 1) {
      const nextStep = historyStep + 1
      setHistoryStep(nextStep)
      setEmailBody(emailHistory[nextStep])
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current)
    }
  }

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      editorRef.current.focus()
      updateEmailBody(editorRef.current.innerHTML, true)
    }
  }

  const handleInsertLink = () => {
    setActiveLink(null) // Ensure we are in new link mode
    // Save current selection to restore later
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0)
      setLinkValues({ text: selection.toString(), url: '' })
    } else {
      savedSelection.current = null
      setLinkValues({ text: '', url: '' })
    }
    setShowLinkPopup(true)
  }

  const applyLink = () => {
    setShowLinkPopup(false)
    if (!linkValues.url) return

    if (editorRef.current) {
      editorRef.current.focus()
      
      // EDIT MODE
      if (activeLink) {
        activeLink.href = linkValues.url
        activeLink.textContent = linkValues.text
        updateEmailBody(editorRef.current.innerHTML, true)
        setActiveLink(null)
        return
      }
      
      // Restore selection if we have one
      if (savedSelection.current) {
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(savedSelection.current)
      }

      // If text provided is different from selection or no selection, we insert HTML
      if (linkValues.text) {
        // Simple heuristic: if we have a range and the text matches, just linkify
        // Otherwise insert full anchor tag
        const selection = window.getSelection()
        const selectedText = selection.toString()
        
        if (selectedText === linkValues.text) {
          execCmd('createLink', linkValues.url)
        } else {
          // Insert HTML with new text
          const html = `<a href="${linkValues.url}" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline; cursor: pointer;">${linkValues.text}</a>`
          document.execCommand('insertHTML', false, html)
          updateEmailBody(editorRef.current.innerHTML, true)
        }
      } else {
        // Fallback if no text provided but URL exists (unlikely given UI, but safe)
        execCmd('createLink', linkValues.url)
      }
    }
  }

  const handleEditorClick = (e) => {
    if (e.target.tagName === 'A') {
      const rect = e.target.getBoundingClientRect()
      const container = editorRef.current.parentElement
      const containerRect = container.getBoundingClientRect()
      
      setTooltipPos({
        top: rect.bottom - containerRect.top + editorRef.current.scrollTop + 5,
        left: rect.left - containerRect.left
      })
      setActiveLink(e.target)
      
      // Ctrl+Click to open
      if (e.ctrlKey || e.metaKey) {
        window.open(e.target.href, '_blank')
      }
    } else {
      setActiveLink(null)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        // Create preview URL for the file
        file.preview = URL.createObjectURL(file)
        return file
      })
      setAttachments(prev => [...prev, ...newFiles])
    }
    // Reset input so same file can be selected again if needed
    e.target.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Cleanup object URLs to avoid memory leaks
  React.useEffect(() => {
    return () => {
      attachments.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview)
      })
    }
  }, [attachments])

  React.useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    if (editorRef.current && editorRef.current.innerHTML !== emailBody) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = emailBody
      } else {
        // If focused, we generally don't want to overwrite unless it's an undo/redo action
        // But here we can't distinguish easily. 
        // For now, we trust onInput keeps them in sync, so this only fires on Undo/Redo or initial load
        // We'll allow overwrite which might lose cursor position but ensures consistency
        const selection = window.getSelection()
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        editorRef.current.innerHTML = emailBody
        // Try to restore cursor to end if possible, or just leave it
      }
    }
  }, [emailBody])

  const showNotification = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: "" }), 3000)
  }

  const notifyTeam = (msg, type = "info", company = "", source = "") => {
    try {
      const raw = JSON.parse(localStorage.getItem("notifications") || "[]")
      const list = Array.isArray(raw) ? raw : []
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
    const arr = (d.activitySchedules||[]).filter(s => !s.completed).map((s)=>({ s, t: new Date(s.dueAt ?? s.startAt).getTime() })).filter((x)=>Number.isFinite(x.t))
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

  const addSchedule = async (stageIndex, cardIndex, dueAt, text, sp, cust) => {
    const deal = stages[stageIndex].deals[cardIndex]
    const tempId = Date.now()
    const finalSp = sp || deal.salesperson || deal.salespersonName || ""
    const finalCust = cust || deal.customer || deal.customer_name || ""

    const newSchedule = { 
        id: tempId, 
        dueAt, 
        activityName: text, 
        salesperson: finalSp,
        customer: finalCust 
    }
    
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
      const body = JSON.stringify({
          deal: deal.id,
          due_at: dueAt,
          activity_name: text,
          salesperson: finalSp,
          customer: finalCust
      })

      let res = await fetch(`${API_BASE}/activity_schedules/`, {
        method: "POST",
        headers,
        body
      })

      // Retry without token if 401 Unauthorized (in case token is invalid but endpoint is public)
      if (res.status === 401 && token) {
         res = await fetch(`${API_BASE}/activity_schedules/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
         })
      }

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Server error ${res.status}: ${errText}`)
      }
      const saved = await res.json()
      
      setStages(prev => prev.map((s, i) => {
        if (i !== stageIndex) return s
        const deals = s.deals.map((d, j) => {
          if (j !== cardIndex) return d
          const activitySchedules = (d.activitySchedules || []).map(sch => sch.id === tempId ? { 
              ...sch, 
              id: saved.id,
              salesperson: saved.salesperson || sch.salesperson,
              customer: saved.customer || sch.customer
          } : sch)
          return { ...d, activitySchedules }
        })
        return { ...s, deals }
      }))
    } catch (err) {
      console.error("Failed to add schedule", err)
      alert(`Failed to save schedule: ${err.message}`)
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
      if (updates.activityName !== undefined) body.activity_name = updates.activityName

      let res = await fetch(`${API_BASE}/activity_schedules/${schedule.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body)
      })

      if (res.status === 401 && token) {
        res = await fetch(`${API_BASE}/activity_schedules/${schedule.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      }
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
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      
      console.log(`Attempting to delete schedule ${schedule.id} at ${API_BASE}/activity_schedules/${schedule.id}/`)

      let res = await fetch(`${API_BASE}/activity_schedules/${schedule.id}/`, {
        method: "DELETE",
        headers
      })

      if (res.status === 401 && token) {
        res = await fetch(`${API_BASE}/activity_schedules/${schedule.id}/`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        })
      }

      if (res.status === 404) {
        console.warn("Schedule not found on server, considering deleted.")
        return // Treat as success
      }

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Server returned ${res.status}: ${errText}`)
      }
    } catch (err) {
      console.error("Failed to delete schedule", err)
      alert(`Failed to delete schedule: ${err.message}`)
      fetchDeals() // Revert changes by reloading
    }
  }

  const handleDeleteActivityFromTable = (dealId, scheduleId) => {
    for (let sIdx = 0; sIdx < stages.length; sIdx++) {
      const stage = stages[sIdx]
      const dIdx = stage.deals.findIndex(d => d.id === dealId)
      if (dIdx !== -1) {
        const deal = stage.deals[dIdx]
        const schIdx = (deal.activitySchedules || []).findIndex(s => s.id === scheduleId)
        if (schIdx !== -1) {
            if (window.confirm("Delete this activity schedule?")) {
                deleteSchedule(sIdx, dIdx, schIdx)
            }
            return
        }
      }
    }
    console.warn("Could not find activity to delete", dealId, scheduleId)
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
    setDetailExtraContacts(d.extraContacts || d.extra_contacts || [])
    setDetailDeal({
        company: d.customer || d.customer_name || "",
        branch: d.branch || "",
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
    // Comment: Fetch latest Customer record to hydrate Company-level and attn fields
    const cid = d.customerId || d.customer || null
    if (cid) {
      (async () => {
        try {
          const token = localStorage.getItem("authToken")
          const headers = token ? { "Authorization": `Token ${token}` } : {}
          const res = await fetch(`${API_BASE}/customers/${cid}/`, { headers })
          if (res.ok) {
            const c = await res.json()
            // Comment: Build CC contacts list from Customer cc* CSVs
            const splitCsv = (s) => String(s || "").split(",").map(v => v.trim()).filter(Boolean)
            const names = splitCsv(c.cc)
            const divs = splitCsv(c.cc_division)
            const emails = splitCsv(c.cc_email)
            const mobiles = splitCsv(c.cc_mobile)
            const positions = splitCsv(c.cc_position)
            const maxLen = Math.max(names.length, divs.length, emails.length, mobiles.length, positions.length)
            const persons = []
            for (let i = 0; i < maxLen; i++) {
              persons.push({
                name: names[i] || "",
                position: positions[i] || "-",
                division: divs[i] || "",
                email: emails[i] || "",
                mobile: mobiles[i] || "",
              })
            }
            setDetailExtraContacts(persons)
            // Comment: Hydrate Company Details form with branch, company email/phone, and attn division/position
            setDetailDeal(prev => ({
              ...prev,
              branch: c.branch || prev.branch || "",
              companyEmail: c.email || "",
              companyPhone: c.phone || "",
              division: c.attn_division || prev.division || "",
              position: c.attn_position || prev.position || "",
            }))
          }
        } catch {}
      })()
    }
    setOpenDetail({ stageIndex, cardIndex })
  }

  const saveDetail = async () => {
    if (!openDetail) return
    const { stageIndex, cardIndex } = openDetail
    const dealId = stages[stageIndex].deals[cardIndex].id

    // Clean up notes: remove date from empty fragments
    const separator = "\n\n──────────────────────────\n"
    let rawNotes = detailDeal.notes || ""
    let fragments = rawNotes.split(separator)
    
    fragments = fragments.map(fragment => {
        // Use lenient regex
        const dateRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}(?:\s?[a-zA-Z]{2})?)\]\s*/;
        const dateMatch = fragment.match(dateRegex)
        let contentWithoutDate = dateMatch ? fragment.replace(dateRegex, "") : fragment
        
        const attachmentRegex = /[\r\n]*(<<Attachment:([^:]+):([^:]+):(.+?)>>)/g
        let hasAttachments = false
        let match
        let contentForDisplay = contentWithoutDate
        
        while ((match = attachmentRegex.exec(contentWithoutDate)) !== null) {
             hasAttachments = true
             contentForDisplay = contentForDisplay.replace(match[0], "")
        }
        
        const hasText = contentForDisplay.trim().length > 0
        
        if (!hasText && !hasAttachments) {
            return ""
        }
        return fragment
    })
    
    const cleanedNotes = fragments.join(separator)

    // Optimistic Update
    setStages((prev) => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => (j === cardIndex ? { 
          ...d, 
          customer: detailDeal.company,
          customer_name: detailDeal.company,
          branch: detailDeal.branch,
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
          extraContacts: detailExtraContacts,
          notes: cleanedNotes,
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
            branch: detailDeal.branch,
            amount: detailDeal.amount,
            currency: detailDeal.currency,
            priority: detailDeal.priority,
            contact: detailDeal.contact,
            email: detailDeal.email,
            phone: detailDeal.phone,
            address: detailDeal.address,
            tax_id: detailDeal.taxId,
            po_number: detailDeal.poNumber,
            notes: cleanedNotes,
            stage: stageName,
            extra_contacts: detailExtraContacts,
            salesperson: detailDeal.salesperson
        }

        await fetch(`${API_BASE}/deals/${dealId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(apiBody)
        })
        // Comment: Trigger Customers tab re-render to fetch latest customer data (including cc CSV updates)
        setCustomerRefreshKey(prev => prev + 1)
        // Comment: After saving, reload Customer CC contacts so Company Details reflects latest extras
        try {
          const currentDeal = stages[stageIndex].deals[cardIndex]
          const cid = currentDeal.customerId || currentDeal.customer || null
          if (cid) {
            const custHeaders = token ? { "Authorization": `Token ${token}` } : {}
            const res = await fetch(`${API_BASE}/customers/${cid}/`, { headers: custHeaders })
            if (res.ok) {
              const c = await res.json()
              const splitCsv = (s) => String(s || "").split(",").map(v => v.trim()).filter(Boolean)
              const names = splitCsv(c.cc)
              const divs = splitCsv(c.cc_division)
              const emails = splitCsv(c.cc_email)
              const mobiles = splitCsv(c.cc_mobile)
              const positions = splitCsv(c.cc_position)
              const maxLen = Math.max(names.length, divs.length, emails.length, mobiles.length, positions.length)
              const persons = []
              for (let i = 0; i < maxLen; i++) {
                persons.push({
                  name: names[i] || "",
                  position: positions[i] || "-",
                  division: divs[i] || "",
                  email: emails[i] || "",
                  mobile: mobiles[i] || "",
                })
              }
              setDetailExtraContacts(persons)
            }
          }
        } catch {}
    } catch (err) {
        console.error("Failed to update deal details", err)
        showNotification("Failed to update deal details")
    }
  }

  const [openNote, setOpenNote] = React.useState(null)

  const openDealNote = (stageIndex, cardIndex) => {
    const d = stages[stageIndex].deals[cardIndex]
    setDetailDeal({
        ...defaultNewDeal,
        notes: d.notes || "",
    })
    setOpenNote({ stageIndex, cardIndex })
  }

  const saveNote = async () => {
    if (!openNote) return
    const { stageIndex, cardIndex } = openNote
    const dealId = stages[stageIndex].deals[cardIndex].id

    // Clean up notes: remove date from empty fragments
    const separator = "\n\n──────────────────────────\n"
    let rawNotes = detailDeal.notes || ""
    let fragments = rawNotes.split(separator)
    
    fragments = fragments.map(fragment => {
        // Use lenient regex
        const dateRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}(?:\s?[a-zA-Z]{2})?)\]\s*/;
        const dateMatch = fragment.match(dateRegex)
        let contentWithoutDate = dateMatch ? fragment.replace(dateRegex, "") : fragment
        
        const attachmentRegex = /[\r\n]*(<<Attachment:([^:]+):([^:]+):(.+?)>>)/g
        let hasAttachments = false
        let match
        let contentForDisplay = contentWithoutDate
        
        while ((match = attachmentRegex.exec(contentWithoutDate)) !== null) {
             hasAttachments = true
             contentForDisplay = contentForDisplay.replace(match[0], "")
        }
        
        const hasText = contentForDisplay.trim().length > 0
        
        if (!hasText && !hasAttachments) {
            return ""
        }
        return fragment
    })
    
    const cleanedNotes = fragments.join(separator)

    // Optimistic Update
    setStages((prev) => prev.map((s, i) => {
      if (i !== stageIndex) return s
      const deals = s.deals.map((d, j) => (j === cardIndex ? { 
          ...d, 
          notes: cleanedNotes,
      } : d))
      return { ...s, deals }
    }))
    setOpenNote(null)

    // API Update
    try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { "Authorization": `Token ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
        
        const apiBody = {
            notes: cleanedNotes,
        }

        await fetch(`${API_BASE}/deals/${dealId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(apiBody)
        })
    } catch (err) {
        console.error("Failed to update deal notes", err)
        showNotification("Failed to update deal notes")
    }
  }

  const openEmailModal = (stageIndex, cardIndex) => {
    const d = stages[stageIndex].deals[cardIndex]
    setOpenEmail({ stageIndex, cardIndex, to: d.email || "" })
    setEmailSubject(`Regarding: ${d.title}`)
    const initialBody = ""
    setEmailBody(initialBody)
    setEmailHistory([initialBody])
    setHistoryStep(0)
  }

  // Drag cards between stages
  const onCardDragStart = (stageIndex, cardIndex, e) => {
    e.dataTransfer.setData("card", JSON.stringify({ stageIndex, cardIndex }))
  }
  // Handle dropping a deal card into a new stage
  const onCardDrop = async (toStageIndex, e) => {
    // Retrieve the dragged card's origin data
    const payload = e.dataTransfer.getData("card")
    if (!payload) return
    const { stageIndex: fromStageIndex, cardIndex } = JSON.parse(payload)
    
    // If dropped in the same stage, do nothing
    if (fromStageIndex === toStageIndex) return
    
    const card = stages[fromStageIndex].deals[cardIndex]
    if (card) {
      const fromStageName = stages[fromStageIndex].name
      const stageName = stages[toStageIndex].name
      const sname = String(stageName || "").toLowerCase()
      const isClosedWon = sname.includes("close") && sname.includes("won")
      
      // Construct notification message for the move
      const baseMsg = `CRM: Moved "${card.title}" from ${fromStageName} --> ${stageName}`
      const msg = isClosedWon ? `${baseMsg} — Create PO or Receive PO` : baseMsg
      
      // Show local UI notification and notify team
      showNotification(msg)
      notifyTeam(msg, isClosedWon ? "success" : "info", card.customer || "", "CRM")
      
      // Dispatch event to update other components (like CRMHistory) immediately
      window.dispatchEvent(new Event("notificationUpdated"))

      // Persist the change to the backend
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
        // Trigger another update after successful persistence to ensure data consistency
        window.dispatchEvent(new Event("notificationUpdated"))
      } catch (err) {
        console.error("Failed to persist stage change", err)
      }
    }

    // Update local state for immediate UI feedback (Optimistic Update)
    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, deals: [...s.deals] }))
      // Remove from old stage
      const [movedCard] = next[fromStageIndex].deals.splice(cardIndex, 1)
      // Add to new stage
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
  const onStageDrop = async (toStageIndex, e) => {
    const payload = e.dataTransfer.getData("stage")
    if (payload === "") return
    const fromStageIndex = Number(payload)
    if (fromStageIndex === toStageIndex) return

    let newStages = []
    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, deals: [...s.deals] }))
      const [stage] = next.splice(fromStageIndex, 1)
      next.splice(toStageIndex, 0, stage)
      newStages = next
      return next
    })

    // Persist new order
    try {
      const token = localStorage.getItem("authToken")
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      
      // Update order for all stages to ensure consistency
      await Promise.all(newStages.map((stage, index) => 
        fetch(`${API_BASE}/stages/${stage.id}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ order: index })
        })
      ))
    } catch (err) {
      console.error("Error reordering stages:", err)
    }
  }

  // Stage actions
  const editStage = async (index) => {
    const current = stages[index]
    const oldName = current.name
    const name = window.prompt("Edit stage name", oldName)
    if (!name || name === oldName) return

    // Optimistic update
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, name } : s)))
    setMenuOpenIndex(null)

    try {
      const token = localStorage.getItem("authToken")
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }

      // Update Stage
      await fetch(`${API_BASE}/stages/${current.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name })
      })

      // Update Deals in this stage (since they store stage as string)
      if (current.deals && current.deals.length > 0) {
        await Promise.all(current.deals.map(deal => 
             fetch(`${API_BASE}/deals/${deal.id}/`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ stage: name })
             })
        ))
      }
    } catch (err) {
      console.error("Error editing stage:", err)
      showNotification("Error updating stage name")
    }
  }

  const deleteStage = async (index) => {
    if (stages.length <= 1) return
    const ok = window.confirm("Delete this stage? Deals inside will be removed.")
    if (!ok) return

    const stageToDelete = stages[index]

    // Optimistic update
    setStages((prev) => prev.filter((_, i) => i !== index))
    setMenuOpenIndex(null)

    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { "Authorization": `Token ${token}` } : {}

      // Delete Stage
      await fetch(`${API_BASE}/stages/${stageToDelete.id}/`, {
        method: "DELETE",
        headers
      })

      // Delete Deals in this stage
      if (stageToDelete.deals && stageToDelete.deals.length > 0) {
        await Promise.all(stageToDelete.deals.map(deal => 
             fetch(`${API_BASE}/deals/${deal.id}/`, {
                method: "DELETE",
                headers
             })
        ))
      }
    } catch (err) {
      console.error("Error deleting stage:", err)
      showNotification("Error deleting stage")
    }
  }

  const addStage = async () => {
    const name = window.prompt("New stage name")
    if (!name) return

    const tempId = Date.now()
    // Optimistic update
    setStages((prev) => [...prev, { id: tempId, name, deals: [] }])

    try {
      const token = localStorage.getItem("authToken")
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Token ${token}` } : {})
      }
      
      const order = stages.length

      const res = await fetch(`${API_BASE}/stages/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, order })
      })
      
      if (res.ok) {
        const newStage = await res.json()
        setStages((prev) => prev.map(s => s.id === tempId ? { ...s, id: newStage.id, deals: [] } : s))
      } else {
         console.error("Failed to add stage")
         setStages((prev) => prev.filter(s => s.id !== tempId))
      }
    } catch (err) {
      console.error("Error adding stage:", err)
      setStages((prev) => prev.filter(s => s.id !== tempId))
    }
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
    setEditExtraContacts(d.extraContacts || d.extra_contacts || [])
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
        extraContacts: editExtraContacts,
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
            extra_contacts: editExtraContacts,
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

  const handleDeleteDeals = (ids) => {
    setDeleteConfirmation({ ids })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    if (deleteConfirmation.type === 'schedule') {
        const { stageIndex, cardIndex, scheduleIdx } = deleteConfirmation
        deleteSchedule(stageIndex, cardIndex, scheduleIdx)
        setDeleteConfirmation(null)
        return
    }
    
    let idsToDelete = []
    
    if (deleteConfirmation.ids) {
        idsToDelete = deleteConfirmation.ids
    } else if (deleteConfirmation.stageIndex !== undefined) {
        const { stageIndex, cardIndex } = deleteConfirmation
        // Safety check
        if (stages[stageIndex] && stages[stageIndex].deals[cardIndex]) {
            idsToDelete = [stages[stageIndex].deals[cardIndex].id]
        }
    }

    if (idsToDelete.length === 0) {
        setDeleteConfirmation(null)
        return
    }

    // Comment: Do NOT collect related customer IDs for deletion
    // Comment: Business rule — deleting deals must never delete Customer records

    // Optimistic update
    setStages((prev) => prev.map((stage) => ({
      ...stage,
      deals: stage.deals.filter(d => !idsToDelete.includes(d.id))
    })))

    setDeleteConfirmation(null)

    // API Update
    const token = localStorage.getItem("authToken")
    const headers = token ? { "Authorization": `Token ${token}` } : {}

    for (const dealId of idsToDelete) {
        try {
          await fetch(`${API_BASE}/deals/${dealId}/`, {
            method: "DELETE",
            headers
          })
        } catch (err) {
          console.error("Failed to delete deal", dealId, err)
        }
    }

    // Comment: Removed API calls that deleted customers when their last deal was removed
    // Comment: Customers are preserved in CRM even if they have no active deals
  }



  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <Navigation require="CRM" />
      
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              CRM
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              {["Deals", "Customers", "Activities", "History"].map((tab) => (
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
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search company or opportunity..."
                  className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear Search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {searchTerm && (
                  <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto py-1">
                    {searchResults.map((deal) => (
                      <button
                        type="button"
                        key={`${deal.id}-${deal.stageIndex}-${deal.cardIndex}`}
                        className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 mx-1 rounded-lg"
                        onClick={() => handleSearchResultClick(deal)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-slate-800">
                            {deal.customer || "-"}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {deal.title}
                          </div>
                        </div>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#2D4485]/8 text-[11px] font-semibold text-[#2D4485] border border-[#2D4485]/30 flex-shrink-0">
                          {deal.pipelineNumber}
                        </span>
                      </button>
                    ))}
                    {searchResults.length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-400 text-center">
                        No matching deals
                      </div>
                    )}
                  </div>
                )}
              </div>
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



      {activeTab === "Deals" ? (
        <section className="w-full overflow-x-auto h-[calc(100vh-140px)] bg-slate-50">
          <div className="flex h-full p-6 gap-6">
            {stages.map((stage, stageIndex) => {
              const total = totalFor(stage.deals);
              // Calculate probability based on stage position (index) to show process flow
              const prob = Math.round(((stageIndex + 1) / stages.length) * 100);
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
                      <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                        <span className="mr-1 opacity-60">{stageIndex + 1}.</span> {stage.name}
                        <span className="ml-2 text-slate-500 font-normal normal-case bg-slate-200 px-1.5 py-0.5 rounded-full text-[10px]">{stage.deals.length}</span>
                      </span>
                      <div className="flex items-center gap-1">
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
                    {/* Cleaned up sortedDeals.map JSX so each deal returns one card and braces are balanced */}
                    {sortedDeals.map((d, cardIndex) => {
                      const cardKey = `${stageIndex}-${d.id}`
                      const isHighlighted = highlightedDealKey === cardKey
                      return (
                        <div
                          key={d.id}
                          id={`deal-card-${cardKey}`}
                          className={`bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4 mb-3 hover:shadow-md hover:ring-[#2D4485]/30 transition-all cursor-grab relative group/card ${
                            isHighlighted ? "ring-2 ring-offset-2 ring-yellow-400" : ""
                          }`}
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


                              {/* PO Number display removed */}
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
                              <div className="flex flex-col items-end gap-1">
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
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                            <div className="flex items-center gap-2 relative">
                              {/* Made the Next Activity chip more prominent: pill style, border, shadow, stronger text */}
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
                                className="flex items-center gap-1.5 cursor-pointer rounded-full px-2 py-0.5 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors"
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
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="text-xs text-slate-700 font-semibold truncate max-w-[100px]">{formatActivityPreviewText(item.text || "Activity")}</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                            
                            {/* Made the Notes chip more noticeable and tied to getNotePreviewLabel(d.notes) */}
                            <div 
                              className={`flex items-center gap-1.5 max-w-[140px] cursor-pointer group/note px-2 py-0.5 rounded-full border text-[11px] ${
                                d.notes ? "bg-[#2D4485]/5 border-[#2D4485]/40" : "bg-slate-50 border-slate-200"
                              }`}
                              onClick={(e) => { e.stopPropagation(); openDealNote(stageIndex, cardIndex); }}
                              title={d.notes || "Add note"}
                            >
                              <FileText className={`w-3.5 h-3.5 shrink-0 transition-colors ${d.notes ? "text-[#2D4485]" : "text-slate-400 group-hover/note:text-[#2D4485]"}`} />
                              <span className={`truncate transition-colors ${d.notes ? "text-[#2D4485] font-semibold" : "text-slate-500 group-hover/note:text-[#2D4485]"}`}>
                                {getNotePreviewLabel(d.notes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button 
                      onClick={() => {
                        setNewDeal({ ...defaultNewDeal, stageIndex: stageIndex });
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setOpenActivity(null)}>
              <div className="absolute left-1/2 top-24 -translate-x-1/2 w-full max-w-3xl px-4" onClick={(e) => e.stopPropagation()}>
                <div
                  className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full"
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
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
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
                        onClick={()=>{ 
                           const d = stages[openActivity.stageIndex].deals[openActivity.cardIndex]
                           setOpenScheduleFor(true); 
                           setScheduleDueInput(""); 
                           setScheduleText(""); 
                           setScheduleSalesperson(""); 
                           setScheduleCustomer(d.customer || d.customer_name || ""); 
                        }}
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
                              title={`${formatActivityPreviewText(it.activityName || "Activity")}${it.dueAt ? ` — ${new Date(it.dueAt).toLocaleString()}` : ""}`}
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
                                      onBlur={(e)=>{
                                        const { stageIndex, cardIndex } = openActivity
                                        updateSchedule(stageIndex, cardIndex, i, { dueAt: e.target.value })
                                      }}
                                      disabled={!isEditing}
                                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 w-[220px] text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-transparent focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                    />
                                    <input
                                      type="text"
                                      value={it.activityName || ""}
                                      onChange={(e)=>{
                                        const { stageIndex, cardIndex } = openActivity
                                        updateDeal(stageIndex, cardIndex, (prev)=>({
                                          ...prev,
                                          activitySchedules: (prev.activitySchedules||[]).map((s, idx)=> idx===i ? { ...s, activityName: e.target.value } : s)
                                        }))
                                      }}
                                      onBlur={(e)=>{
                                        const { stageIndex, cardIndex } = openActivity
                                        updateSchedule(stageIndex, cardIndex, i, { activityName: e.target.value })
                                      }}
                                      placeholder="Details"
                                      className="flex-1 min-w-[120px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
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
                                              setDeleteConfirmation({ 
                                                  type: 'schedule', 
                                                  stageIndex, 
                                                  cardIndex, 
                                                  scheduleIdx: i 
                                              })
                                              setOpenScheduleMenuKey(null)
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
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 w-[220px] text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                                />
                                <input
                                  type="text"
                                  value={scheduleText}
                                  onChange={(e)=>setScheduleText(e.target.value)}
                                  placeholder="Scheduled activity details"
                                  autoFocus
                                  className="flex-1 min-w-[120px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none"
                                />
                                <input
                                  type="text"
                                  value={scheduleCustomer}
                                  readOnly
                                  title="Customer is automatically set from the deal"
                                  className="w-[110px] rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-500 cursor-not-allowed outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-3 mt-3">
                                <button
                                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm"
                                  onClick={()=>{ setOpenScheduleFor(false); setScheduleDueInput(""); setScheduleText(""); setScheduleSalesperson(""); setScheduleCustomer(""); }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-4 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
                                  onClick={()=>{
                                    const dueAt = scheduleDueInput
                                    if (!dueAt) return
                                    const { stageIndex, cardIndex } = openActivity
                                    addSchedule(stageIndex, cardIndex, dueAt, scheduleText || "", scheduleSalesperson, scheduleCustomer)
                                    setOpenScheduleFor(false)
                                    setScheduleDueInput("")
                                    setScheduleText("")
                                    setScheduleSalesperson("")
                                    setScheduleCustomer("")
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
                                  {companyOptions.filter(c => c.name.toLowerCase().includes(editingDeal.company.toLowerCase())).map((c, i) => (
                                    <button
                                      key={i}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                      onClick={() => {
                                        // Comment: Prefill edit form from selected Customer (include branch and attn columns)
                                        setEditingDeal({
                                          ...editingDeal,
                                          company: c.name,
                                          branch: c.branch || "",
                                          contact: c.contact,
                                          // Comment: Contact Person email/phone prefer attn_* fields
                                          email: (c.attnEmail || c.email || ""),
                                          phone: (c.attnMobile || c.phone || ""),
                                          address: c.address || "",
                                          taxId: c.taxId || "",
                                          division: c.attnDivision || "",
                                          position: c.attnPosition || "",
                                          // Comment: Store company-level contact info separately
                                          companyEmail: c.email || "",
                                          companyPhone: c.phone || "",
                                        })
                                        // Comment: Prefill CC contacts list for Edit modal
                                        setEditExtraContacts(Array.isArray(c.extraContacts) ? c.extraContacts : [])
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      <div className="font-medium">{c.name}</div>
                                      <div className="text-xs text-slate-500">Contact: {c.contact}</div>
                                    </button>
                                  ))}
                                  {editingDeal.company && !companyOptions.some(c => c.name.toLowerCase() === editingDeal.company.toLowerCase()) && (
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
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
                            <input 
                              value={editingDeal.branch || ""} 
                              onChange={(e)=>setEditingDeal({...editingDeal, branch:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Branch (e.g. Head Office / Branch 1)"
                            />
                          </div>
                          {/* Comment: Company Email maps to editingDeal.email in Edit modal */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company Email</label>
                            <input
                              type="email"
                              value={editingDeal.email || ""}
                              onChange={(e)=>setEditingDeal({...editingDeal, email:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                              placeholder="Company email address"
                            />
                          </div>
                          {/* Comment: Company Phone maps to editingDeal.phone in Edit modal */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company Phone</label>
                            <input
                              type="text"
                              value={editingDeal.phone || ""}
                              onChange={(e)=>setEditingDeal({...editingDeal, phone:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                              placeholder="Company phone number"
                            />
                          </div>
                          {/* Comment: Address maps to editingDeal.address and is persisted in the deal */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                            <input
                              type="text"
                              value={editingDeal.address || ""}
                              onChange={(e)=>setEditingDeal({...editingDeal, address:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                              placeholder="Company address"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact</div>
                        <div className="rounded-2xl border border-[#2D4485]/40 bg-white shadow-md px-5 py-4 space-y-3">
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
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                            <input 
                              value={editingDeal.position || ""}
                              onChange={(e)=>setEditingDeal({...editingDeal, position:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Position"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                            <input 
                              value={editingDeal.division || ""}
                              onChange={(e)=>setEditingDeal({...editingDeal, division:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Division"
                            />
                          </div>
                          {editExtraContacts.map((c, index) => {
                            const update = (field, value) => {
                              const next = [...editExtraContacts]
                              next[index] = { ...next[index], [field]: value }
                              setEditExtraContacts(next)
                            }
                            const remove = () => {
                              const next = editExtraContacts.filter((_, i) => i !== index)
                              setEditExtraContacts(next)
                            }
                            return (
                              <div
                                key={index}
                                className="sm:col-span-2 mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 space-y-3"
                              >
                                <div className="flex items-center justify-between text-sm font-semibold text-[#2D4485]">
                                  <span>Additional contact {index + 1}</span>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-800"
                                    onClick={remove}
                                    title="Delete contact"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                                    <input
                                      value={c.name || ""}
                                      onChange={(e) => update("name", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Contact person name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input
                                      value={c.email || ""}
                                      onChange={(e) => update("email", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Email address"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                                    <input
                                      value={c.mobile || ""}
                                      onChange={(e) => update("mobile", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Mobile number"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                                    <input
                                      value={c.position || ""}
                                      onChange={(e) => update("position", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Position"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                                    <input
                                      value={c.division || ""}
                                      onChange={(e) => update("division", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Division"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#2D4485]/50 text-xs font-semibold text-[#2D4485] bg-white hover:bg-[#2D4485]/5 transition-colors"
                              onClick={() => setEditExtraContacts([...editExtraContacts, {}])}
                            >
                              + Add more contact person
                            </button>
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
                                  {companyOptions.filter(c => c.name.toLowerCase().includes(detailDeal.company.toLowerCase())).map((c, i) => (
                                    <button
                                      key={i}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                      onClick={() => {
                                        // Comment: Prefill details form from selected Customer (include branch and attn columns)
                                        setDetailDeal({
                                          ...detailDeal,
                                          company: c.name,
                                          branch: c.branch || "",
                                          contact: c.contact,
                                          // Comment: Contact Person email/phone prefer attn_* fields
                                          email: (c.attnEmail || c.email || ""),
                                          phone: (c.attnMobile || c.phone || ""),
                                          address: c.address || "",
                                          taxId: c.taxId || "",
                                          division: c.attnDivision || "",
                                          position: c.attnPosition || "",
                                          // Comment: Store company-level contact info separately
                                          companyEmail: c.email || "",
                                          companyPhone: c.phone || "",
                                        })
                                        // Comment: Prefill CC contacts list for Company Details modal
                                        setDetailExtraContacts(Array.isArray(c.extraContacts) ? c.extraContacts : [])
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      <div className="font-medium">{c.name}</div>
                                      <div className="text-xs text-slate-500">Contact: {c.contact}</div>
                                    </button>
                                  ))}
                                  {detailDeal.company && !companyOptions.some(c => c.name.toLowerCase() === detailDeal.company.toLowerCase()) && (
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
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
                            <input 
                              value={detailDeal.branch || ""} 
                              onChange={(e)=>setDetailDeal({...detailDeal, branch:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Branch (e.g. Head Office / Branch 1)"
                            />
                          </div>
                          {/* Comment: Company Email/Phone placed under Company section to match New Deal */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company Email</label>
                            <input 
                              type="email"
                              value={detailDeal.companyEmail || ""} 
                              onChange={(e)=>setDetailDeal({...detailDeal, companyEmail:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company email address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company Phone</label>
                            <input 
                              type="text"
                              value={detailDeal.companyPhone || ""} 
                              onChange={(e)=>setDetailDeal({...detailDeal, companyPhone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company phone number"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                            <input 
                              type="text"
                              value={detailDeal.address || ""} 
                              onChange={(e)=>setDetailDeal({...detailDeal, address:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company address"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact</div>
                        <div className="rounded-2xl border border-[#2D4485]/40 bg-white shadow-md px-5 py-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Comment: Email/Phone moved to Company section for consistency */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                              <input 
                                value={detailDeal.contact} 
                                onChange={(e)=>setDetailDeal({...detailDeal, contact:e.target.value})} 
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                                placeholder="Contact person"
                              />
                            </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Email</label>
                            <input 
                              value={detailDeal.email || ""} 
                              onChange={(e)=>setDetailDeal({...detailDeal, email:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone</label>
                            <input 
                              value={detailDeal.phone || ""} 
                              onChange={(e)=>setDetailDeal({...detailDeal, phone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                            <input 
                              value={detailDeal.position || ""}
                              onChange={(e)=>setDetailDeal({...detailDeal, position:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Position"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                            <input 
                              value={detailDeal.division || ""}
                              onChange={(e)=>setDetailDeal({...detailDeal, division:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Division"
                            />
                          </div>
                            {detailExtraContacts.map((c, index) => {
                              const update = (field, value) => {
                                const next = [...detailExtraContacts]
                                next[index] = { ...next[index], [field]: value }
                                setDetailExtraContacts(next)
                              }
                              const remove = () => {
                                const next = detailExtraContacts.filter((_, i) => i !== index)
                                setDetailExtraContacts(next)
                              }
                              return (
                                <div
                                  key={index}
                                  className="sm:col-span-2 mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 space-y-3"
                                >
                                  <div className="flex items-center justify-between text-sm font-semibold text-[#2D4485]">
                                    <span>Additional contact {index + 1}</span>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-800"
                                      onClick={remove}
                                      title="Delete contact"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                                      <input
                                        value={c.name || ""}
                                        onChange={(e) => update("name", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                        placeholder="Contact person name"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                      <input
                                        value={c.email || ""}
                                        onChange={(e) => update("email", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                        placeholder="Email address"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                                      <input
                                        value={c.mobile || ""}
                                        onChange={(e) => update("mobile", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                        placeholder="Mobile number"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                                      <input
                                        value={c.position || ""}
                                        onChange={(e) => update("position", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                        placeholder="Position"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                                      <input
                                        value={c.division || ""}
                                        onChange={(e) => update("division", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                        placeholder="Division"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#2D4485]/50 text-xs font-semibold text-[#2D4485] bg-white hover:bg-[#2D4485]/5 transition-colors"
                              onClick={() => setDetailExtraContacts([...detailExtraContacts, {}])}
                            >
                              + Add more contact person
                            </button>
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
          {openNote && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setOpenNote(null)}>
              <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[640px] transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Note</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setOpenNote(null)}>✕</button>
                  </div>
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Note Content</div>
                          <button
                              className="px-3 py-1.5 rounded-lg border border-[#2D4485] text-[#2D4485] bg-white hover:bg-blue-50 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
                              onClick={() => {
                                  const separator = detailDeal.notes ? "\n\n──────────────────────────\n" : ""
                                  setDetailDeal({
                                      ...detailDeal,
                                      notes: separator + (detailDeal.notes || "")
                                  })
                              }}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              Create another note
                          </button>
                        </div>
                        <div className="space-y-4">
                          {(detailDeal.notes ? detailDeal.notes.split("\n\n──────────────────────────\n") : [""]).map((noteFragment, idx, arr) => {
                            // Use lenient regex to handle potential single-digit dates/times or format variations
                            const dateRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}(?:\s?[a-zA-Z]{2})?)\]\s*/;
                            const dateMatch = noteFragment.match(dateRegex);
                            const dateDisplay = dateMatch ? dateMatch[1] : "";
                            let contentWithoutDate = dateMatch ? noteFragment.replace(dateRegex, "") : noteFragment;
                            
                            // Extract attachments (supports multiple)
                            const attachmentRegex = /[\r\n]*(<<Attachment:([^:]+):([^:]+):(.+?)>>)/g;
                            const attachments = [];
                            let match;
                            let contentForDisplay = contentWithoutDate;
                            
                            while ((match = attachmentRegex.exec(contentWithoutDate)) !== null) {
                              attachments.push({
                                fullMatch: match[1],
                                type: match[2],
                                name: match[3],
                                data: match[4]
                              });
                              contentForDisplay = contentForDisplay.replace(match[0], "");
                            }
                            const cleanContent = contentForDisplay;
                            
                            return (
                            <div key={idx} className="relative group/note-box">
                              <textarea 
                                value={cleanContent} 
                                onChange={(e)=>{
                                  const newText = e.target.value;
                                  let fullContent = newText;
                                  // Append all existing attachments to the new text
                                  attachments.forEach(att => {
                                    fullContent += `\n${att.fullMatch}`;
                                  });
                                  
                                  // Logic for date: update on any change if content exists
                                  let finalDateDisplay = dateDisplay;
                                  const hasContent = newText.trim().length > 0 || attachments.length > 0;
                                  
                                  if (hasContent) {
                                    // Always update to current time on edit
                                    finalDateDisplay = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
                                  } else {
                                    finalDateDisplay = "";
                                  }
                                  
                                  const fullFragment = finalDateDisplay ? `[${finalDateDisplay}] ${fullContent}` : fullContent;
                                  const newFragments = [...arr];
                                  newFragments[idx] = fullFragment;
                                  setDetailDeal({
                                    ...detailDeal, 
                                    notes: newFragments.join("\n\n──────────────────────────\n")
                                  });
                                }} 
                                className="w-full min-h-[120px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all resize-y pb-10" 
                                placeholder="Add notes about this deal..."
                                autoFocus={idx === 0}
                              />
                              
                              {/* Date Display - Bottom Right */}
                              {dateDisplay && (
                                <div className="absolute bottom-2 right-3 text-xs text-slate-400 font-medium select-none pointer-events-none">
                                  {dateDisplay}
                                </div>
                              )}

                              {/* Attachment Badges - Bottom Left */}
                              {attachments.length > 0 && (
                                <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 flex-wrap max-w-[70%]">
                                  {attachments.map((att, attIdx) => (
                                    <div 
                                      key={attIdx}
                                      className="group/att-badge flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition-all cursor-pointer select-none"
                                      onClick={() => {
                                        if (att.type.startsWith("image/")) {
                                          const win = window.open();
                                          if (win) win.document.write(`<img src="${att.data}" style="max-width:100%; height:auto;" />`);
                                        } else {
                                          // Convert base64 PDF to Blob and open in new tab
                                          try {
                                            const arr = att.data.split(',');
                                            const mime = arr[0].match(/:(.*?);/)[1];
                                            const bstr = atob(arr[1]);
                                            let n = bstr.length;
                                            const u8arr = new Uint8Array(n);
                                            while(n--){
                                              u8arr[n] = bstr.charCodeAt(n);
                                            }
                                            const blob = new Blob([u8arr], {type: mime});
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                          } catch (e) {
                                            // Fallback to download if conversion fails
                                            const link = document.createElement('a');
                                            link.href = att.data;
                                            link.download = att.name;
                                            link.click();
                                          }
                                        }
                                      }}
                                    >
                                      {att.type.startsWith("image/") ? (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                          <span className="truncate max-w-[80px]" title={att.name}>Image</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                          <span className="truncate max-w-[80px]" title={att.name}>PDF</span>
                                        </>
                                      )}
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm("Remove attachment?")) {
                                            let fullContent = cleanContent;
                                            // Reconstruct content with all attachments EXCEPT the one being removed
                                            let remainingAttachmentsCount = 0;
                                            attachments.forEach((a, i) => {
                                              if (i !== attIdx) {
                                                fullContent += `\n${a.fullMatch}`;
                                                remainingAttachmentsCount++;
                                              }
                                            });
                                            
                                            let finalDateDisplay = dateDisplay;
                                            const hasContent = cleanContent.trim().length > 0 || remainingAttachmentsCount > 0;
                                            
                                            if (!hasContent) {
                                                 finalDateDisplay = "";
                                            }
                                            
                                            const fullFragment = finalDateDisplay ? `[${finalDateDisplay}] ${fullContent}` : fullContent;
                                            const newFragments = [...arr];
                                            newFragments[idx] = fullFragment;
                                            setDetailDeal({
                                              ...detailDeal, 
                                              notes: newFragments.join("\n\n──────────────────────────\n")
                                            });
                                          }
                                        }}
                                        className="ml-1 p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover/att-badge:opacity-100 transition-all"
                                        title="Remove"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                      </button>

                                      {/* Hover Preview for Image */}
                                      {att.type.startsWith("image/") && (
                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/att-badge:block z-50 pointer-events-none">
                                          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-xl">
                                            <img src={att.data} alt="Preview" className="max-w-[160px] max-h-[160px] rounded object-cover" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <label className="p-1 text-slate-400 hover:text-[#2D4485] hover:bg-blue-50 rounded cursor-pointer transition-all" title="Attachment">
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const base64 = reader.result;
                                          // Append new attachment to clean content AND existing attachments
                                          let fullContent = cleanContent;
                                          
                                          // Add existing attachments back
                                          attachments.forEach(att => {
                                            fullContent += `\n${att.fullMatch}`;
                                          });
                                          
                                          // Add new attachment
                                          const safeName = file.name.replace(/:/g, "-");
                                          const safeType = file.type || "application/octet-stream";
                                          const attachmentStr = `\n<<Attachment:${safeType}:${safeName}:${base64}>>`;
                                          fullContent += attachmentStr;
                                          
                                          // If there is no existing date, use current date/time to initialize this note section
                                          let finalDateDisplay = dateDisplay;
                                          if (!finalDateDisplay) {
                                            finalDateDisplay = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                          }
                                          
                                          const fullFragment = finalDateDisplay ? `[${finalDateDisplay}] ${fullContent}` : fullContent;
                                          const newFragments = [...arr];
                                          newFragments[idx] = fullFragment;
                                          setDetailDeal({
                                            ...detailDeal, 
                                            notes: newFragments.join("\n\n──────────────────────────\n")
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                </label>
                                {arr.length > 1 && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm("Delete this note section?")) {
                                        const newFragments = arr.filter((_, i) => i !== idx);
                                        setDetailDeal({
                                          ...detailDeal,
                                          notes: newFragments.join("\n\n──────────────────────────\n")
                                        });
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover/note-box:opacity-100 transition-all"
                                    title="Delete this note section"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                    <button 
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm" 
                      onClick={() => setOpenNote(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-5 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-md transition-all text-sm font-medium"
                      onClick={saveNote}
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
                                  {companyOptions.filter(c => c.name.toLowerCase().includes(newDeal.company.toLowerCase())).map((c, i) => (
                                    <button
                                      key={i}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                      onClick={() => {
                                        // Comment: Prefill all fields from selected Customer record (CRM tab)
                                        // Comment: Branch and attn columns (division/position) included
                                        setNewDeal({
                                          ...newDeal,
                                          company: c.name,
                                          branch: c.branch || "",
                                          contact: c.contact,
                                          // Comment: Prefer attn email/mobile for Contact Person; fallback to company-level email/phone
                                          email: (c.attnEmail || c.email || ""),
                                          phone: (c.attnMobile || c.phone || ""),
                                          // Comment: Company-level contacts fetched from Customer.email/phone columns
                                          companyEmail: c.email || "",
                                          companyPhone: c.phone || "",
                                          address: c.address || "",
                                          taxId: c.taxId || "",
                                          division: c.attnDivision || "",
                                          position: c.attnPosition || "",
                                        })
                                        // Comment: Prefill CC contacts from Customer cc* columns into extraContacts UI
                                        setExtraContacts(Array.isArray(c.extraContacts) ? c.extraContacts : [])
                                        setShowCompanySuggestions(false)
                                      }}
                                    >
                                      <div className="font-medium">{c.name}</div>
                                      <div className="text-xs text-slate-500">Contact: {c.contact}</div>
                                    </button>
                                  ))}
                                  {newDeal.company && !companyOptions.some(c => c.name.toLowerCase() === newDeal.company.toLowerCase()) && (
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
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
                            <input 
                              value={newDeal.branch || ""} 
                              onChange={(e)=>setNewDeal({...newDeal, branch:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Branch (e.g. Head Office / Branch 1)"
                            />
                          </div>
                          {/* Comment: Company Email input under Company section; stored in newDeal.companyEmail */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company Email</label>
                            <input 
                              type="email"
                              value={newDeal.companyEmail || ""} 
                              onChange={(e)=>setNewDeal({...newDeal, companyEmail:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company email address"
                            />
                          </div>
                          {/* Comment: Company Phone input under Company section; stored in newDeal.companyPhone */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Company Phone</label>
                            <input 
                              type="text"
                              value={newDeal.companyPhone || ""} 
                              onChange={(e)=>setNewDeal({...newDeal, companyPhone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company phone number"
                            />
                          </div>
                          {/* Comment: Company Address input under Company section; stored in newDeal.address */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                            <input 
                              type="text"
                              value={newDeal.address || ""} 
                              onChange={(e)=>setNewDeal({...newDeal, address:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Company address"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Contact Person</div>
                        <div className="rounded-2xl border border-[#2D4485]/40 bg-white shadow-md px-5 py-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                            <input 
                              value={newDeal.contact} 
                              onChange={(e)=>setNewDeal({...newDeal, contact:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Contact person name"
                            />
                          </div>
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
                            <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                            <input 
                              value={newDeal.phone} 
                              onChange={(e)=>setNewDeal({...newDeal, phone:e.target.value})} 
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Mobile number"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                            <input 
                              value={newDeal.position || ""}
                              onChange={(e)=>setNewDeal({...newDeal, position:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Position"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                            <input 
                              value={newDeal.division || ""}
                              onChange={(e)=>setNewDeal({...newDeal, division:e.target.value})}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all" 
                              placeholder="Division"
                            />
                          </div>
                          {extraContacts.map((c, index) => {
                            const update = (field, value) => {
                              const next = [...extraContacts]
                              next[index] = { ...next[index], [field]: value }
                              setExtraContacts(next)
                            }
                            const remove = () => {
                              const next = extraContacts.filter((_, i) => i !== index)
                              setExtraContacts(next)
                            }
                            return (
                              <div
                                key={index}
                                className="sm:col-span-2 mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 space-y-3"
                              >
                                <div className="flex items-center justify-between text-sm font-semibold text-[#2D4485]">
                                  <span>Additional contact {index + 1}</span>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-800"
                                    onClick={remove}
                                    title="Delete contact"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                                    <input
                                      value={c.name || ""}
                                      onChange={(e) => update("name", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Contact person name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input
                                      value={c.email || ""}
                                      onChange={(e) => update("email", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Email address"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                                    <input
                                      value={c.mobile || ""}
                                      onChange={(e) => update("mobile", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Mobile number"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                                    <input
                                      value={c.position || ""}
                                      onChange={(e) => update("position", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Position"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                                    <input
                                      value={c.division || ""}
                                      onChange={(e) => update("division", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                                      placeholder="Division"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#2D4485]/50 text-xs font-semibold text-[#2D4485] bg-white hover:bg-[#2D4485]/5 transition-colors"
                              onClick={() => setExtraContacts([...extraContacts, {}])}
                            >
                              + Add more contact person
                            </button>
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
                        // Comment: Validate Salesperson before creating a deal
                        // Comment: Backend requires salesperson to be non-null; show UI popup and block submit if empty
                        if (!(newDeal.salesperson || "").trim()) {
                            setValidationModal({
                              title: "Missing Required Information",
                              message: "Please complete all required fields to create a deal."
                            })
                            showNotification("Please complete all required fields to create a deal.")
                            return
                        }
                        if (!newDeal.company || !newDeal.company.trim()) {
                            showNotification("Please enter a company name")
                            return
                        }
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
                          extra_contacts: extraContacts,
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
                            setExtraContacts([])
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity" onClick={() => { setOpenEmail(null); setShowDeleteConfirm(false); }}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 relative" onClick={e => e.stopPropagation()}>
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-800 text-lg">
                     {showEmailSettings ? "Email Configuration" : "Send Email"}
                   </h3>
                   <div className="flex items-center gap-2">
                     <button onClick={() => { setOpenEmail(null); setShowDeleteConfirm(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
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
                        {/* Message Input Area with Rich Text Toolbar */}
                        {/* This section replaces the standard textarea with a UI resembling a rich text editor */}
                        <div>
                           {/* Editor Container */}
                           <div className="border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-[#2D4485]/20 focus-within:border-[#2D4485] transition-all bg-white relative">
                              
                              {/* Top Toolbar */}
                              <div className="flex flex-col border-b border-slate-200 bg-slate-50 select-none rounded-t-lg">
                                {/* Basic Toolbar (Undo/Redo) */}
                                <div className="flex items-center gap-1 p-2">
                                   <button onClick={handleUndo} className={`p-1.5 rounded transition-colors ${historyStep > 0 ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-300 cursor-not-allowed'}`} title="Undo (Ctrl+Z)" disabled={historyStep <= 0} onMouseDown={e => e.preventDefault()}>
                                     <Undo size={14} />
                                   </button>
                                   <button onClick={handleRedo} className={`p-1.5 rounded transition-colors ${historyStep < emailHistory.length - 1 ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-300 cursor-not-allowed'}`} title="Redo (Ctrl+Y)" disabled={historyStep >= emailHistory.length - 1} onMouseDown={e => e.preventDefault()}>
                                     <Redo size={14} />
                                   </button>
                                </div>

                                {/* Extended Formatting Toolbar */}
                                {showFormatting && (
                                  <div className="flex items-center flex-wrap gap-2 p-2 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                    {/* Font Family */}
                                    <select onChange={(e) => execCmd('fontName', e.target.value)} className="h-7 text-xs border border-slate-300 rounded px-1 bg-white focus:outline-none focus:border-[#2D4485]" title="Font Family">
                                      <option value="Arial">Arial</option>
                                      <option value="Times New Roman">Times New Roman</option>
                                      <option value="Courier New">Courier New</option>
                                      <option value="Georgia">Georgia</option>
                                      <option value="Verdana">Verdana</option>
                                    </select>

                                    {/* Font Size */}
                                    <select onChange={(e) => execCmd('fontSize', e.target.value)} className="h-7 text-xs border border-slate-300 rounded px-1 bg-white focus:outline-none focus:border-[#2D4485]" title="Font Size">
                                      <option value="3">Normal</option>
                                      <option value="1">Small</option>
                                      <option value="5">Large</option>
                                      <option value="7">Huge</option>
                                    </select>

                                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                                    {/* Styles */}
                                    <button onClick={() => execCmd('bold')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Bold" onMouseDown={e => e.preventDefault()}><Bold size={14} /></button>
                                    <button onClick={() => execCmd('italic')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Italic" onMouseDown={e => e.preventDefault()}><Italic size={14} /></button>
                                    <button onClick={() => execCmd('underline')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Underline" onMouseDown={e => e.preventDefault()}><Underline size={14} /></button>
                                    
                                    {/* Color - simplified as a button for now, usually needs a picker */}
                                    <div className="relative group">
                                      <button className="p-1.5 text-slate-600 hover:bg-slate-200 rounded flex items-center gap-1" title="Text Color" onMouseDown={e => e.preventDefault()}>
                                        <Baseline size={14} /> <ChevronDown size={10} />
                                      </button>
                                      {/* Simple Color Picker Dropdown */}
                                      <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded shadow-lg hidden group-hover:grid grid-cols-4 gap-1 z-50">
                                        {['#000000', '#444444', '#888888', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'].map(c => (
                                          <button key={c} onClick={() => execCmd('foreColor', c)} className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c }} onMouseDown={e => e.preventDefault()} />
                                        ))}
                                      </div>
                                    </div>

                                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                                    {/* Alignment */}
                                    <button onClick={() => execCmd('justifyLeft')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Align Left" onMouseDown={e => e.preventDefault()}><AlignLeft size={14} /></button>
                                    <button onClick={() => execCmd('justifyCenter')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Align Center" onMouseDown={e => e.preventDefault()}><AlignCenter size={14} /></button>
                                    <button onClick={() => execCmd('justifyRight')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Align Right" onMouseDown={e => e.preventDefault()}><AlignRight size={14} /></button>

                                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                                    {/* Lists & Indent */}
                                    <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Bullet List" onMouseDown={e => e.preventDefault()}><List size={14} /></button>
                                    <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Numbered List" onMouseDown={e => e.preventDefault()}><ListOrdered size={14} /></button>
                                    <button onClick={() => execCmd('indent')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Indent" onMouseDown={e => e.preventDefault()}><Indent size={14} /></button>
                                  </div>
                                )}
                              </div>

                              {/* Message Editor (ContentEditable) */}
                              <div className="relative rounded-b-lg">
                                {!emailBody && (
                                  <div className="absolute top-3 left-4 text-slate-400 text-sm pointer-events-none select-none">
                                    Write email...
                                  </div>
                                )}
                                <div
                                  ref={editorRef}
                                  contentEditable
                                  className="w-full px-4 py-3 text-sm outline-none min-h-[192px] max-h-[500px] overflow-y-auto block text-slate-700"
                                  onInput={e => updateEmailBody(e.currentTarget.innerHTML, true)}
                                  onClick={handleEditorClick}
                                  onScroll={() => setActiveLink(null)}
                                  suppressContentEditableWarning={true}
                                  onKeyDown={e => {
                                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                                      e.preventDefault();
                                      if (e.shiftKey) {
                                        handleRedo();
                                      } else {
                                        handleUndo();
                                      }
                                    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                                      e.preventDefault();
                                      handleRedo();
                                    }
                                  }}
                                />
                                
                                {/* Link Tooltip */}
                                {activeLink && (
                                  <div 
                                    className="absolute z-50 bg-white border border-slate-300 shadow-lg rounded px-3 py-2 flex items-center gap-2 text-sm animate-in fade-in zoom-in-95 duration-150"
                                    style={{ top: tooltipPos.top, left: tooltipPos.left }}
                                    onMouseDown={e => e.preventDefault()} // Prevent taking focus from editor
                                  >
                                    <a 
                                      href={activeLink.href} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-[#1a73e8] hover:underline whitespace-nowrap"
                                    >
                                      Go to link: {activeLink.href.length > 30 ? activeLink.href.substring(0, 30) + '...' : activeLink.href}
                                    </a>
                                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                    <button 
                                      onClick={() => {
                                        setLinkValues({ text: activeLink.textContent, url: activeLink.href })
                                        setShowLinkPopup(true)
                                      }}
                                      className="text-[#1a73e8] hover:underline whitespace-nowrap"
                                    >
                                      Change
                                    </button>
                                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                    <button 
                                      onClick={() => {
                                         // Remove link logic: replace A with its children
                                         const parent = activeLink.parentNode
                                         while(activeLink.firstChild) parent.insertBefore(activeLink.firstChild, activeLink)
                                         parent.removeChild(activeLink)
                                         updateEmailBody(editorRef.current.innerHTML, true)
                                         setActiveLink(null)
                                      }}
                                      className="text-[#1a73e8] hover:underline whitespace-nowrap"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                           </div>
                           
                           {/* Attachments List */}
                           {attachments.length > 0 && (
                             <div className="flex flex-wrap gap-2 mt-3">
                               {attachments.map((file, i) => (
                                 <div key={i} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 animate-in fade-in zoom-in duration-200 group">
                                   <Paperclip size={14} className="text-slate-400" />
                                   <a 
                                     href={file.preview} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="truncate max-w-[200px] hover:text-[#2D4485] hover:underline cursor-pointer"
                                     title={`View ${file.name}`}
                                   >
                                     {file.name}
                                   </a>
                                   <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                   <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 transition-colors ml-1" title="Remove attachment">
                                     <X size={14} />
                                   </button>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                     </div>
                     
                     {/* Footer Action Bar: Contains Send Button and secondary actions */}
                     <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          {/* Send Split Button */}
                          <div className="flex items-center shadow-sm relative z-10">
                             {/* Primary Send Button */}
                             <button 
                               onClick={async () => {
                                 // Check if recipient exists
                                 if (!openEmail.to) {
                                   showNotification("Please enter an email address");
                                   return;
                                 }
                                 // Perform send operation
                                 setIsSending(true);
                                 try {
                                   const formData = new FormData();
                                   formData.append('to_email', openEmail.to);
                                   formData.append('subject', emailSubject);
                                   formData.append('message', emailBody);
                                   
                                   // Attach files
                                   if (attachments && attachments.length > 0) {
                                     attachments.forEach(file => {
                                       formData.append('attachments', file);
                                     });
                                   }

                                   const response = await fetch(`${API_BASE_URL}/api/send-email/`, {
                                     method: 'POST',
                                     body: formData,
                                   });

                                   if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Failed to send email');
                                  }

                                  setOpenEmail(null);
                                  setAttachments([]);
                                  setEmailSubject("");
                                  setEmailBody("");
                                  
                                  setEmailSuccess(true);
                                  setTimeout(() => setEmailSuccess(false), 5000);
                                } catch (error) {
                                   console.error("Email failed:", error);
                                   showNotification(`Failed to send: ${error.message}`);
                                 } finally {
                                   setIsSending(false);
                                 }
                               }}
                               disabled={isSending}
                               className="px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-slate-400 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                             >
                               {isSending ? "Sending..." : "Send"}
                             </button>
                             

                          </div>
                          
                          {/* Formatting & Attachment Icons */}
                          <div className="flex items-center gap-1 ml-2">
                            <button 
                              onClick={() => setShowFormatting(!showFormatting)}
                              className={`p-2 rounded-full transition-colors ${showFormatting ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`} 
                              title="Formatting Options"
                            >
                               <div className="flex items-baseline font-serif font-bold italic select-none">
                                 <span className="text-lg">A</span><span className="text-sm">a</span>
                               </div>
                            </button>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors" 
                              title="Attach File"
                            >
                               <Paperclip size={20} />
                            </button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              multiple 
                              onChange={handleFileSelect} 
                            />
                            <button 
                               onClick={handleInsertLink}
                               className={`p-2 rounded-full transition-colors ${showLinkPopup ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                               title="Insert Link"
                             >
                                <LinkIcon size={20} />
                             </button>
                             

                          </div>
                       </div>
                       
                       {/* Delete/Discard Button */}
                       <div className="relative">
                         <button 
                           onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} 
                           className={`p-2 rounded-full transition-colors ${showDeleteConfirm ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} 
                           title="Discard Draft"
                         >
                           <Trash2 size={18} />
                         </button>
                         
                         {/* Delete Confirmation Popup */}
                         {showDeleteConfirm && (
                           <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                             <h4 className="text-sm font-semibold text-slate-800 mb-1">Discard draft?</h4>
                             <p className="text-xs text-slate-500 mb-3">This will clear all content and close the email editor.</p>
                             <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => setShowDeleteConfirm(false)}
                                 className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
                               >
                                 Cancel
                               </button>
                               <button 
                                 onClick={() => {
                                   setOpenEmail(null)
                                   setEmailSubject("")
                                   setEmailBody("")
                                   setAttachments([])
                                   setEmailHistory([])
                                   setHistoryStep(0)
                                   setShowDeleteConfirm(false)
                                 }}
                                 className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                               >
                                 Discard
                               </button>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   </>
                 )}
                 {showLinkPopup && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">Insert Link</h4>
                        <div className="flex flex-col gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Text to display</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-[#2D4485]/20 focus-within:border-[#2D4485] bg-slate-50">
                                <Type size={14} className="text-slate-400 shrink-0" />
                                <input 
                                type="text" 
                                placeholder="Text" 
                                className="text-sm outline-none w-full text-slate-700 bg-transparent placeholder:text-slate-400"
                                value={linkValues.text}
                                onChange={e => setLinkValues({...linkValues, text: e.target.value})}
                                autoFocus
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Link URL</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-[#2D4485]/20 focus-within:border-[#2D4485] bg-slate-50">
                                <LinkIcon size={14} className="text-slate-400 shrink-0" />
                                <input 
                                type="text" 
                                placeholder="https://example.com" 
                                className="text-sm outline-none w-full text-slate-700 bg-transparent placeholder:text-slate-400"
                                value={linkValues.url}
                                onChange={e => setLinkValues({...linkValues, url: e.target.value})}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') applyLink()
                                }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                            <button 
                                onClick={() => setShowLinkPopup(false)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={applyLink}
                                className="px-3 py-1.5 text-xs font-medium bg-[#2D4485] text-white rounded-md hover:bg-[#1a2e66] transition-colors shadow-sm"
                            >
                                Apply
                            </button>
                        </div>
                        </div>
                    </div>
                 )}
              </div>
            </div>
          )}
      </section>
      ) : activeTab === "Customers" ? (
        <div className="min-h-screen bg-white">
          <CRMCustomers 
            key={customerRefreshKey}
            deals={stages.flatMap(s => s.deals.map(d => ({ ...d, stageName: s.name, stageCount: s.deals.length }))).sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0))} 
            onDeleteDeals={handleDeleteDeals}
          />
        </div>
      ) : activeTab === "Activities" ? (
        <div className="h-[calc(100vh-140px)] bg-white">
          <CRMActivities 
            deals={stages.flatMap(s => s.deals)} 
            onDeleteActivity={handleDeleteActivityFromTable}
            onActivityUpdate={fetchDeals}
          />
        </div>
      ) : activeTab === "History" ? (
        <div className="p-6 bg-slate-50 min-h-screen">
          <CRMHistory />
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
                <div className="text-sm text-gray-800">
                    {deleteConfirmation.type === 'schedule'
                        ? "Delete this activity schedule?"
                        : deleteConfirmation?.ids?.length > 1 
                        ? `Delete ${deleteConfirmation.ids.length} opportunities?` 
                        : "Delete this opportunity?"}
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setDeleteConfirmation(null)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {validationModal && (
        // Comment: Generic UI popup for validation messages (e.g., missing required fields)
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setValidationModal(null)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">{validationModal.title || "Validation"}</h3>
                {/* Comment: Add close 'X' icon to dismiss validation modal */}
                <button
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setValidationModal(null)}
                  title="Close"
                  aria-label="Close validation dialog"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-700">{validationModal.message}</p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                  onClick={() => setValidationModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium"
                  onClick={() => setValidationModal(null)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {emailSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#323232] text-white px-6 py-3 rounded shadow-lg z-[100] flex items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-sm font-medium">Message sent</span>
        </div>
      )}
      <Toaster />
    </main>
  )
}

export default CRMPage
