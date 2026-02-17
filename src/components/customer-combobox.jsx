import React, { useState, useEffect, useRef } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../lib/utils"

export function CustomerCombobox({ value, onChange, onSelect, options = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Sync query with value when value changes externally
  useEffect(() => {
    setQuery(value || "")
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Normalize/display helpers:
  // - label: shown string (supports new {label,value} shape or legacy customer_name/company_name)
  // - val: returned value (prefer explicit 'value' or fallback to 'id' for ID-based selection)
  const safeOptions = Array.isArray(options) ? options : []
  const getLabel = (opt) => String(opt?.label ?? opt?.customer_name ?? opt?.company_name ?? "").trim()
  const getVal = (opt) => opt?.value ?? opt?.id ?? getLabel(opt)

  const filteredOptions = query === "" 
    ? safeOptions 
    : safeOptions.filter((opt) => getLabel(opt).toLowerCase().includes(query.toLowerCase()))

  const handleInputChange = (e) => {
    const newVal = e.target.value
    setQuery(newVal)
    onChange(newVal)
    setIsOpen(true)
  }

  const handleSelectOption = (opt) => {
    const lbl = getLabel(opt)
    const val = getVal(opt)
    setQuery(lbl)
    // Update visible input text with the label
    onChange(lbl)
    // Notify consumer with the actual value (ID preferred)
    if (typeof onSelect === "function") onSelect({ label: lbl, value: val })
    setIsOpen(false)
  }

  const toggleOpen = () => {
    if (!isOpen) {
        setIsOpen(true)
        inputRef.current?.focus()
    } else {
        setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-[#2D4485]/20 focus:border-[#2D4485] outline-none placeholder:text-slate-500"
          placeholder="Select or type company name..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          onClick={toggleOpen}
          className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:text-slate-700 focus:outline-none"
          tabIndex={-1}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
          {/* Optional: Add "Select Customer" as a disabled header or placeholder if needed */}
          {/* <li className="px-3 py-2 text-slate-400 cursor-default">Select Customer</li> */}
          
          {filteredOptions.map((opt, i) => (
            <li
              // Prefer id/value if present; fallback to label
              key={getVal(opt) ?? getLabel(opt) ?? i}
              className={cn(
                "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-slate-100 text-slate-900",
                value === getLabel(opt) ? "bg-blue-50 text-blue-900" : ""
              )}
              onClick={() => handleSelectOption(opt)}
            >
              <span className="block truncate">
                {getLabel(opt)}
              </span>
              {value === getLabel(opt) && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && filteredOptions.length === 0 && query !== "" && (
         <ul className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white py-2 shadow-lg text-sm text-center text-slate-500">
            <li>No matching customers found</li>
         </ul>
      )}
    </div>
  )
}
