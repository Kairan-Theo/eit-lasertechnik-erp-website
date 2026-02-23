import React, { useState } from "react"
import { API_BASE_URL } from "./config"
const apiRequest = async (path, options = {}) => {
  const proto = window.location.protocol === "https:" ? "https" : "http"
  const host = window.location.hostname || "127.0.0.1"
  const candidates = Array.from(new Set([
    API_BASE_URL,
    `${proto}://${host}:8000`,
    `${proto}://${host}:8001`,
    `${proto}://${host}:8002`,
  ]))
  let lastErr
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}${path}`, options)
      return res
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error("All API endpoints unreachable")
}
import { Trash } from "lucide-react"

export default function CRMCustomers({ deals = [], onDeleteDeals }) {
  const [searchTerm, setSearchTerm] = useState("")
  // Comment: Removed column fold/expand modes per request
  const [selectedRows, setSelectedRows] = useState([])
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newDeal, setNewDeal] = useState({
    company: "",
    branch: "",
    contact: "",
    division: "",
    // Comment: Track primary contact position for attn_position
    position: "",
    // Comment: Company-level email/phone kept separate from primary contact email/phone
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
  })
  const [extraContacts, setExtraContacts] = useState([])
  const [stages, setStages] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingDealInfo, setEditingDealInfo] = useState(null)
  const [standaloneCustomers, setStandaloneCustomers] = useState([])
  // Comment: Keep a fast lookup map for latest customer fields by ID
  const [customerIndex, setCustomerIndex] = useState({})
  // Comment: Delete confirmation modal visibility state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const filteredDeals = React.useMemo(() => {
    const allRows = [...deals, ...standaloneCustomers]
    return allRows.filter(deal => {
    const term = searchTerm.toLowerCase()
    const company = (deal.customer || deal.company || "").toLowerCase()
    const salesperson = (deal.salesperson || deal.salespersonName || "").toLowerCase()
    return company.includes(term) || salesperson.includes(term)
    })
  }, [deals, standaloneCustomers, searchTerm])

  // Clear selection when search changes (optional, but safer to avoid deleting hidden items)
  // React.useEffect(() => setSelectedRows([]), [searchTerm]) 
  // User might want to search and select, search and select... so keeping selection is better.

  // Clean up selection when deals are removed
  React.useEffect(() => {
      const currentIds = new Set(deals.map(d => d.id))
      setSelectedRows(prev => prev.filter(id => currentIds.has(id)))
  }, [deals])

  // Comment: Shared reload function so we can fetch latest after saving edits
  const reloadCustomers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = token ? { Authorization: `Token ${token}` } : {}
      const res = await apiRequest(`/api/customers/`, { headers })
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return
      // Comment: Build index of all customers (including those linked to deals)
      const index = {}
      data.forEach(c => {
        index[c.id] = {
          id: c.id,
          company: c.company_name || "",
          branch: c.branch || "",
          email: c.email || "",
          phone: c.phone || "",
          address: c.address || "",
          taxId: c.tax_id || "",
          // Comment: Primary contact (attn*) and cc* kept for display in table list
          attn: c.attn || "",
          attnEmail: c.attn_email || "",
          attnMobile: c.attn_mobile || "",
          attnDivision: c.attn_division || "",
          attnPosition: c.attn_position || "",
          cc: c.cc || "",
          cc_division: c.cc_division || "",
          cc_email: c.cc_email || "",
          cc_mobile: c.cc_mobile || "",
          cc_position: c.cc_position || "",
        }
      })
      setCustomerIndex(index)
      const dealCustomerIds = new Set(
        deals
          .map(d => d.customerId || d.customer)
          .filter(id => id !== null && id !== undefined)
      )
      const transformed = data
        .filter(c => !dealCustomerIds.has(c.id))
        .map(c => ({
          id: `customer-${c.id}`,
          customer: c.company_name || "",
          company: c.company_name || "",
          customerId: c.id,
          branch: c.branch || "",
          // Comment: Company-level email/phone displayed in table columns
          email: c.email || "",
          phone: c.phone || "",
          address: c.address || "",
          // Comment: Primary contact (attn*) kept separate from additional contacts
          contact: c.attn || "",
          attnEmail: c.attn_email || "",
          attnMobile: c.attn_mobile || "",
          attnDivision: c.attn_division || "",
          attnPosition: c.attn_position || "",
          taxId: c.tax_id || "",
          poNumber: "",
          amount: 0,
          currency: "฿",
          priority: "none",
          stageName: "",
          stageCount: "",
          // Comment: Build additional contacts list from Customer cc* CSV columns
            extraContacts: (() => {
            const splitCsv = (s) => String(s || "").split(",").map(v => v.trim()).filter(Boolean)
            const names = splitCsv(c.cc)
            const divs = splitCsv(c.cc_division)
            const emails = splitCsv(c.cc_email)
            const mobiles = splitCsv(c.cc_mobile)
            const positions = splitCsv(c.cc_position)
            const maxLen = Math.max(names.length, divs.length, emails.length, mobiles.length, positions.length)
            const persons = []
            for (let i = 0; i < maxLen; i++) {
                const p = {
                  name: names[i] || "",
                  position: positions[i] || "",
                  division: divs[i] || "",
                  email: emails[i] || "",
                  mobile: mobiles[i] || "",
                }
                // Comment: Skip empty rows (all fields blank) to avoid ghost contacts like "-, -, -, -"
                if (p.name || p.email || p.mobile || p.division || p.position) {
                  // Comment: Normalize missing position to "-" only when row is meaningful
                  if (!p.position) p.position = "-"
                  persons.push(p)
                }
            }
            return persons
          })(),
          isCustomerOnly: true,
        }))
      setStandaloneCustomers(transformed)
    } catch {}
  }, [deals])

  React.useEffect(() => {
    reloadCustomers()
  }, [reloadCustomers])

  React.useEffect(() => {
    if (!showNewCustomerForm || stages.length > 0) return
    const loadStages = async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { Authorization: `Token ${token}` } : {}
        const res = await apiRequest(`/api/stages/`, { headers })
        if (!res.ok) return
        const data = await res.json()
        setStages(Array.isArray(data) ? data : [])
      } catch {}
    }
    loadStages()
  }, [showNewCustomerForm, stages.length])

  const handleCreateCustomer = async () => {
    const isEditing = !!editingDealInfo
    if (!newDeal.company || !newDeal.company.trim()) {
      alert("Please enter a company name")
      return
    }

    let url = ""
    let method = "POST"
    let payload = {}

    // Comment: Build CSV from additional contacts for Customer cc* fields; exclude duplicates of primary attn
    const normalize = (s) => String(s || "").trim().toLowerCase()
    const primary = {
      name: normalize(newDeal.contact),
      email: normalize(newDeal.email),
      mobile: normalize(newDeal.phone),
      division: normalize(newDeal.division),
      position: normalize(newDeal.position),
    }
    const nonEmptyExtras = extraContacts.filter(c => {
      const n = normalize(c?.name)
      const e = normalize(c?.email)
      const m = normalize(c?.mobile)
      return !!(n || e || m)
    })
    const ccNames = nonEmptyExtras.map(c => (c?.name || "").trim()).filter(Boolean).join(",")
    const ccDivs = nonEmptyExtras.map(c => (c?.division || "").trim()).filter(Boolean).join(",")
    const ccEmails = nonEmptyExtras.map(c => (c?.email || "").trim()).filter(Boolean).join(",")
    const ccMobiles = nonEmptyExtras.map(c => (c?.mobile || "").trim()).filter(Boolean).join(",")
    const ccPositions = nonEmptyExtras.map(c => (c?.position || "").trim()).filter(Boolean).join(",")

    if (isEditing && editingDealInfo && editingDealInfo.customerId) {
      url = `/api/customers/${editingDealInfo.customerId}/`
      method = "PATCH"
      payload = {
        company_name: newDeal.company || "",
        branch: newDeal.branch || "",
        address: newDeal.address || "",
        // Comment: Store company-level contact info to Customer.email/phone
        email: newDeal.companyEmail || "",
        phone: newDeal.companyPhone || "",
        tax_id: newDeal.taxId || "",
        // Comment: Map Contact Person inputs into Customer attn* fields
        attn: newDeal.contact || "",
        attn_mobile: newDeal.phone || "",
        attn_division: newDeal.division || "",
        attn_email: newDeal.email || "",
        attn_position: newDeal.position || "",
        // Comment: Aggregate additional contacts into Customer cc* CSV fields
        cc: ccNames,
        cc_division: ccDivs,
        cc_mobile: ccMobiles,
        cc_email: ccEmails,
        cc_position: ccPositions,
        // Comment: Send structured extra contacts for backend fallback derivation
        extra_contacts: nonEmptyExtras,
      }
    } else if (!isEditing) {
      url = `/api/customers/`
      method = "POST"
      payload = {
        company_name: newDeal.company || "",
        branch: newDeal.branch || "",
        address: newDeal.address || "",
        // Comment: Store company-level contact info to Customer.email/phone
        email: newDeal.companyEmail || "",
        phone: newDeal.companyPhone || "",
        tax_id: newDeal.taxId || "",
        // Comment: Map Contact Person inputs into Customer attn* fields
        attn: newDeal.contact || "",
        attn_mobile: newDeal.phone || "",
        attn_division: newDeal.division || "",
        attn_email: newDeal.email || "",
        attn_position: newDeal.position || "",
        // Comment: Aggregate additional contacts into Customer cc* CSV fields
        cc: ccNames,
        cc_division: ccDivs,
        cc_mobile: ccMobiles,
        cc_email: ccEmails,
        cc_position: ccPositions,
        // Comment: Send structured extra contacts for backend fallback derivation
        extra_contacts: nonEmptyExtras,
      }
    } else if (isEditing && editingDealInfo) {
      // Fallback for legacy deals without linked customer id: keep old behaviour
      let stageName = "New"
      try {
        stageName = stages[newDeal.stageIndex]?.name || stages[0]?.name || "New"
      } catch {}
      const baseData = {
        title: newDeal.opportunity || newDeal.company || "Untitled",
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
        salesperson: newDeal.salesperson || "",
        branch: newDeal.branch || "",
      }
      url = `/api/deals/${editingDealInfo.id}/`
      method = "PATCH"
      payload = {
        ...baseData,
        customer_name: newDeal.company || "",
      }
      if (editingDealInfo.stageName) {
        payload.stage = editingDealInfo.stageName
      } else {
        payload.stage = stageName
      }
    }
    setIsSaving(true)
    try {
      const token = localStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      }
      const res = await apiRequest(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        // Comment: Close form, reset state, and immediately refresh customers to show updated values
        setShowNewCustomerForm(false)
        setNewDeal({
          company: "",
          branch: "",
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
        })
        setExtraContacts([])
        setEditingDealInfo(null)
        await reloadCustomers()
      } else {
        const errorText = await res.text()
        console.error("Failed to create customer:", errorText)
        alert("Failed to create customer: " + errorText)
      }
    } catch (err) {
      console.error("Error creating customer", err)
      alert("Error creating customer: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredDeals.map(d => d.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (id) => {
      setSelectedRows(prev => {
          if (prev.includes(id)) {
              return prev.filter(rowId => rowId !== id)
          } else {
              return [...prev, id]
          }
      })
  }

  const handleDelete = async () => {
    // Comment: Delete pipeline deals via parent handler, and standalone customers via API DELETE
    const toDeleteDeals = filteredDeals
      .filter(d => selectedRows.includes(d.id) && !d.isCustomerOnly)
      .map(d => d.id)
    if (onDeleteDeals && toDeleteDeals.length > 0) {
      onDeleteDeals(toDeleteDeals)
    }
    // Comment: Delete standalone customers (isCustomerOnly) by calling backend /api/customers/<id>/ DELETE
    const toDeleteCustomers = filteredDeals
      .filter(d => selectedRows.includes(d.id) && d.isCustomerOnly && d.customerId)
      .map(d => d.customerId)
    if (toDeleteCustomers.length > 0) {
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { Authorization: `Token ${token}` } : {}
        for (const cid of toDeleteCustomers) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/customers/${cid}/`, {
              method: "DELETE",
              headers,
            })
            // Comment: Remove deleted customer rows from local state to reflect removal in the UI
            if (res.ok) {
              setStandaloneCustomers(prev => prev.filter(c => c.customerId !== cid))
              setSelectedRows(prev => prev.filter(rid => rid !== `customer-${cid}`))
            } else {
              const txt = await res.text()
              console.error("Failed to delete customer:", txt)
              alert("Failed to delete customer: " + txt)
            }
          } catch (err) {
            console.error("Error deleting customer", err)
            alert("Error deleting customer: " + err.message)
          }
        }
      } catch (err) {
        console.error("Delete customers batch error", err)
      }
    }
  }

  const handleEditRow = async (deal) => {
    // Comment: Determine linked Customer ID from row (pipeline deal or standalone)
    const cid = deal.customerId || deal.customer
    // Comment: Prefer latest fields from customerIndex (kept in sync with backend)
    const latest = cid ? customerIndex[cid] : null
    // Comment: Build base form state using latest values when available, fallback to row snapshot
    const baseForm = {
      company: (latest?.company ?? (deal.customer || deal.company)) || "",
      branch: (latest?.branch ?? deal.branch) || "",
      // Comment: Contact Person fields map to attn* columns
      contact: (latest?.attn ?? deal.contact) || "",
      email: (latest?.attnEmail ?? deal.attnEmail) || "",
      phone: (latest?.attnMobile ?? deal.attnMobile) || "",
      division: (latest?.attnDivision ?? deal.attnDivision) || "",
      position: (latest?.attnPosition ?? deal.attnPosition) || "",
      // Comment: Company-level email/phone stored separately for clarity
      companyEmail: (latest?.email ?? deal.email) || "",
      companyPhone: (latest?.phone ?? deal.phone) || "",
      address: (latest?.address ?? deal.address) || "",
      taxId: (latest?.taxId ?? deal.taxId ?? deal.tax_id) || "",
    }
    // Comment: Initialize form immediately for fast UX
    setNewDeal(baseForm)
    // Comment: Build additional contacts (CC) — use latest from index if present
    let extras = []
    const csvToPersons = (c) => {
      const splitCsv = (s) => String(s || "").split(",").map(v => v.trim()).filter(Boolean)
      const names = splitCsv(c.cc)
      const divs = splitCsv(c.cc_division)
      const emails = splitCsv(c.cc_email)
      const mobiles = splitCsv(c.cc_mobile)
      const positions = splitCsv(c.cc_position)
      const maxLen = Math.max(names.length, divs.length, emails.length, mobiles.length, positions.length)
      const persons = []
      for (let i = 0; i < maxLen; i++) {
        const p = {
          name: names[i] || "",
          position: positions[i] || "",
          division: divs[i] || "",
          email: emails[i] || "",
          mobile: mobiles[i] || "",
        }
        // Comment: Skip empty rows to prevent showing deleted/blank contacts
        if (p.name || p.email || p.mobile || p.division || p.position) {
          if (!p.position) p.position = "-"
          persons.push(p)
        }
      }
      return persons
    }
    if (latest) {
      // Comment: Use already-fetched latest values
      extras = csvToPersons({
        cc: latest.cc,
        cc_division: latest.cc_division,
        cc_email: latest.cc_email,
        cc_mobile: latest.cc_mobile,
        cc_position: latest.cc_position,
      })
    } else if (cid) {
      // Comment: Fallback fetch when latest not in index
      try {
        const token = localStorage.getItem("authToken")
        const headers = token ? { Authorization: `Token ${token}` } : {}
        const res = await apiRequest(`/api/customers/${cid}/`, { headers })
        if (res.ok) {
          const c = await res.json()
          // Comment: Replace base form with fetched values to avoid stale deal snapshot
          setNewDeal({
            company: c.company_name || "",
            branch: c.branch || "",
            contact: c.attn || "",
            email: c.attn_email || "",
            phone: c.attn_mobile || "",
            division: c.attn_division || "",
            position: c.attn_position || "",
            companyEmail: c.email || "",
            companyPhone: c.phone || "",
            address: c.address || "",
            taxId: c.tax_id || "",
          })
          extras = csvToPersons(c)
        } else {
          extras = deal.extraContacts || deal.extra_contacts || []
        }
      } catch {
        extras = deal.extraContacts || deal.extra_contacts || []
      }
    } else {
      // Comment: No customer id case — fallback to any existing extras present on row
      extras = deal.extraContacts || deal.extra_contacts || []
    }
    setExtraContacts(extras)
    setEditingDealInfo({ 
      id: deal.id, 
      stageName: deal.stageName, 
      customerId: cid || null,
    })
    setShowNewCustomerForm(true)
  }

  // Comment: Define table columns per request; widths adapt to content using ch units
  const columns = [
    { id: 'index', label: 'Index' },
    { id: 'company', label: 'Company Name' },
    { id: 'branch', label: 'Branch' },
    { id: 'taxId', label: 'Tax ID' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'address', label: 'Address' },
    { id: 'contactPersons', label: 'Contact Person' },
  ]

  // Comment: Compute width style based on content length with min/max bounds (in ch units)
  const widthFor = (text, min = 8, max = 60) => {
    const len = String(text || '').length
    const ch = Math.max(min, Math.min(max, len + 2))
    return { width: `${ch}ch` }
  }

  // Comment: Removed toggleMode; no column folding/expanding

  const renderCellContent = (col, deal, index) => {

    switch (col.id) {
      case 'index': return <span className="font-medium text-gray-800">{index + 1}</span>;
      case 'company': {
        const text = deal.customer || deal.company || "-"
        // Comment: Make company name clickable to edit; remove row click
        return (
          <button
            type="button"
            className="font-medium text-[#2D4485] hover:underline"
            onClick={() => handleEditRow(deal)}
            title="Edit customer"
          >
            {text}
          </button>
        )
      }
      case 'branch': {
        // Comment: Prefer latest from customerIndex when available (covers admin edits)
        const cid = deal.customerId || deal.customerId || null
        const latest = cid && customerIndex[cid]
        return (latest?.branch ?? deal.branch) || "-"
      }
      case 'address': {
        const cid = deal.customerId || deal.customerId || null
        const latest = cid && customerIndex[cid]
        return (latest?.address ?? deal.address) || "-"
      }
      case 'email': {
        const cid = deal.customerId || deal.customerId || null
        const latest = cid && customerIndex[cid]
        return (latest?.email ?? deal.email) || "-"
      }
      case 'phone': {
        const cid = deal.customerId || deal.customerId || null
        const latest = cid && customerIndex[cid]
        return (latest?.phone ?? deal.phone) || "-"
      }
      case 'taxId': {
        const cid = deal.customerId || deal.customerId || null
        const latest = cid && customerIndex[cid]
        return (latest?.taxId ?? deal.taxId) || "-"
      }
      case 'contactPersons': {
        // Comment: Render numbered list: "1. Name, Position, Division, Email, Phone", then 2., 3., etc.
        const cid = deal.customerId || deal.customerId || null
        const latest = cid && customerIndex[cid]
        // Comment: Prefer latest attn and cc from index for deal rows
        const extrasRaw = deal.extraContacts || deal.extra_contacts || (() => {
          if (!latest) return []
          const splitCsv = (s) => String(s || "").split(",").map(v => v.trim()).filter(Boolean)
          const names = splitCsv(latest.cc)
          const divs = splitCsv(latest.cc_division)
          const emails = splitCsv(latest.cc_email)
          const mobiles = splitCsv(latest.cc_mobile)
          const positions = splitCsv(latest.cc_position)
          const maxLen = Math.max(names.length, divs.length, emails.length, mobiles.length, positions.length)
          const persons = []
          for (let i = 0; i < maxLen; i++) {
            const p = {
              name: names[i] || "",
              position: positions[i] || "",
              division: divs[i] || "",
              email: emails[i] || "",
              mobile: mobiles[i] || "",
            }
            if (p.name || p.email || p.mobile || p.division || p.position) {
              if (!p.position) p.position = "-"
              persons.push(p)
            }
          }
          return persons
        })()
        const extras = Array.isArray(extrasRaw) ? extrasRaw.filter((e) => e && (e.name || e.email || e.mobile || e.division || (e.position && e.position !== "-"))) : []
        const people = []
        const primary = {
          name: (latest?.attn ?? deal.contact) || "",
          position: (latest?.attnPosition ?? deal.attnPosition) || "-",
          division: (latest?.attnDivision ?? deal.attnDivision) || "",
          email: (latest?.attnEmail ?? deal.attnEmail) || "",
          mobile: (latest?.attnMobile ?? deal.attnMobile) || "",
        }
        if (primary.name || primary.email || primary.mobile || primary.division || primary.position) {
          people.push({
            name: primary.name || "",
            position: primary.position || "-",
            division: primary.division || "",
            email: primary.email || "",
            mobile: primary.mobile || "",
          })
        }
        extras.forEach(c => {
          people.push({
            name: c?.name || "",
            position: c?.position || "-",
            division: c?.division || "",
            email: c?.email || "",
            mobile: c?.mobile || "",
          })
        })
        if (people.length === 0) return "-"
        return (
          <div className="space-y-1">
            {people.map((p, i) => (
              <div key={i} className="text-gray-700">
                <span className="font-mono text-xs text-slate-500">{i + 1}.</span>{" "}
                <span className="font-medium">{p.name || "-"}</span>
                {", "}{p.position || "-"}
                {", "}{p.division || "-"}
                {", "}{p.email || "-"}
                {", "}{p.mobile || "-"}
              </div>
            ))}
          </div>
        )
      }
      default: return "-";
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers (Pipeline Data)</h2>
        <div className="flex items-center gap-6">
          {selectedRows.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Delete ({selectedRows.length})</span>
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-sm text-sm font-medium"
            onClick={() => setShowNewCustomerForm(true)}
          >
            + Add Customer
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Company or Salesperson..."
              className="pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] transition-all"
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
          </div>
          <div className="text-slate-500 font-medium text-sm">
            {searchTerm ? (
              <span>Showing <span className="text-slate-900 font-bold">{filteredDeals.length}</span> customers</span>
            ) : (
              <span>Total: <span className="text-slate-900 font-bold">{filteredDeals.length}</span> customers</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                  onChange={handleSelectAll}
                  checked={filteredDeals.length > 0 && selectedRows.length === filteredDeals.length}
                  ref={input => {
                    if (input) {
                      input.indeterminate = selectedRows.length > 0 && selectedRows.length < filteredDeals.length
                    }
                  }}
                />
              </th>
              {columns.map(col => (
                <th 
                  key={col.id} 
                  className="p-4 border-b whitespace-nowrap align-top"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{col.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDeals.map((deal, index) => (
              <tr 
                key={deal.id || index} 
                className={`transition border-b border-gray-100 ${selectedRows.includes(deal.id) ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-gray-50'}`}
                // Comment: Row click no longer opens editor; use Company Name link only
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#2D4485] focus:ring-[#2D4485]/20 h-4 w-4"
                    onChange={() => handleSelectRow(deal.id)}
                    checked={selectedRows.includes(deal.id)}
                  />
                </td>
                {columns.map(col => (
                  <td 
                    key={col.id} 
                    className={`p-4 align-top whitespace-nowrap text-gray-600 ${col.defaultClass || ''}`}
                    style={{
                      ...(col.id === 'index' ? widthFor(index + 1, 6, 10)
                        : col.id === 'company' ? widthFor(deal.customer || deal.company || "", 12, 40)
                        : col.id === 'branch' ? widthFor(deal.branch || "-", 8, 24)
                        : col.id === 'taxId' ? widthFor(deal.taxId || "-", 10, 24)
                        : col.id === 'email' ? widthFor(deal.email || "-", 12, 34)
                        : col.id === 'phone' ? widthFor(deal.phone || "-", 10, 24)
                        : col.id === 'address' ? widthFor(deal.address || "-", 16, 60)
                        : col.id === 'contactPersons' ? widthFor((deal.contact || (deal.extraContacts || [])[0]?.name || "-"), 20, 60)
                        : {})
                    }}
                  >
                    {renderCellContent(col, deal, index)}
                  </td>
                ))}
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">
                  {searchTerm ? "No matching customers found." : "No data found in Sales Pipeline."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Comment: Delete confirmation modal for Customer tab */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[92vw] rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Delete customers</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="px-6 py-5 text-slate-700">
              {/* Comment: Show counts of selected items by type */}
              <p className="mb-2">Are you sure you want to delete the selected rows?</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col mt-16">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-lg font-bold text-slate-800">{editingDealInfo ? "Edit Customer" : "Add Customer"}</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setShowNewCustomerForm(false)
                  setEditingDealInfo(null)
                }}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Company Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                    <input
                      value={newDeal.company}
                      onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
                    <input
                      value={newDeal.branch}
                      onChange={(e) => setNewDeal({ ...newDeal, branch: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Branch name"
                    />
                  </div>
                  {/* Comment: Move Tax ID up to Company Details per request */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tax ID</label>
                    <input
                      value={newDeal.taxId}
                      onChange={(e) => setNewDeal({ ...newDeal, taxId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Tax ID"
                    />
                  </div>
                  {/* Comment: Add Company Email and Company Phone side-by-side above Address */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Company Email</label>
                    <input
                      value={newDeal.companyEmail}
                      onChange={(e) => setNewDeal({ ...newDeal, companyEmail: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Company email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Company Phone</label>
                    <input
                      value={newDeal.companyPhone}
                      onChange={(e) => setNewDeal({ ...newDeal, companyPhone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                      placeholder="Company phone"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                    <input
                      value={newDeal.address}
                      onChange={(e) => setNewDeal({ ...newDeal, address: e.target.value })}
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
                        onChange={(e) => setNewDeal({ ...newDeal, contact: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <input
                        value={newDeal.email}
                        onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                      <input
                        value={newDeal.phone}
                        onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                      <input
                        value={newDeal.position}
                        onChange={(e) => setNewDeal({ ...newDeal, position: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none transition-all"
                        placeholder="Position"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
                      <input
                        value={newDeal.division}
                        onChange={(e) => setNewDeal({ ...newDeal, division: e.target.value })}
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

              {/* Comment: Removed Opportunity, Salesperson, PO Number, Amount, Currency, Priority, Stage inputs per request */}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium text-sm"
                onClick={() => {
                  setShowNewCustomerForm(false)
                  setEditingDealInfo(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-[#2D4485] text-white hover:bg-[#3D56A6] shadow-md transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleCreateCustomer}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editingDealInfo ? "Save Changes" : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
