import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../lib/utils"

export function Combobox({ value, onChange, onSelect, options = [], placeholder = "Select or type...", placement = "bottom" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0 })
  // Unique id used to mark the portal dropdown so outside-click logic can allow selection from it.
  const [uid] = useState(() => `cbx-${Math.random().toString(36).slice(2)}`)

  // Sync query with value when value changes externally
  useEffect(() => {
    setQuery(value || "")
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking inside the portal-rendered dropdown, do not close; allow item selection.
      const insideDropdown = !!(event.target.closest?.(`[data-combobox-dropdown="${uid}"]`))
      if (insideDropdown) return
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Normalize options: accept strings or objects with common label fields.
  const safeOptions = Array.isArray(options)
    ? options.map((opt) => {
        if (typeof opt === "string") return opt
        const label = opt?.label ?? opt?.text ?? opt?.name ?? ""
        return String(label || "")
      })
    : []

  // Filter with graceful fallback when no matches; still show a subset
  const filteredOptions = query === ""
    ? safeOptions
    : safeOptions.filter((option) =>
        option && option.toLowerCase().includes(query.toLowerCase())
      )

  const computeRect = () => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width })
  }

  useEffect(() => {
    if (!isOpen) return
    computeRect()
    const onScroll = () => computeRect()
    const onResize = () => computeRect()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [isOpen])

  const handleInputChange = (e) => {
    const newVal = e.target.value
    setQuery(newVal)
    onChange(newVal)
    setIsOpen(true)
    computeRect()
  }

  const handleSelect = (option) => {
    setQuery(option)
    onChange(option)
    // Notify consumer when a real option was selected from the dropdown
    if (typeof onSelect === "function") {
      onSelect(option)
    }
    setIsOpen(false)
  }

  const toggleOpen = () => {
    if (!isOpen) {
        setIsOpen(true)
        inputRef.current?.focus()
        computeRect()
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
          placeholder={placeholder}
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

      {isOpen && filteredOptions.length > 0 && createPortal(
        <ul
          // Mark dropdown element for outside-click allowance
          data-combobox-dropdown={uid}
          style={{
            position: "absolute",
            top: (placement === "top" ? dropdownRect.top - 8 : dropdownRect.top) + "px",
            left: dropdownRect.left + "px",
            width: dropdownRect.width + "px",
            maxHeight: "320px",
          }}
          className={cn(
            "z-[9999] overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm"
          )}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              className={cn(
                "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-slate-100 text-slate-900",
                value === option ? "bg-blue-50 text-blue-900" : ""
              )}
              onClick={() => handleSelect(option)}
            >
              <span className="block truncate">{option}</span>
              {value === option && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ul>,
        document.body
      )}
      {isOpen && filteredOptions.length === 0 && query !== "" && createPortal(
        <ul
          data-combobox-dropdown={uid}
          style={{
            position: "absolute",
            top: (placement === "top" ? dropdownRect.top - 8 : dropdownRect.top) + "px",
            left: dropdownRect.left + "px",
            width: dropdownRect.width + "px",
          }}
          className="z-[9999] rounded-md border border-slate-200 bg-white py-2 shadow-lg text-sm text-center text-slate-500"
        >
          <li>No matching options found</li>
        </ul>,
        document.body
      )}
    </div>
  )
}
