
function getComponentInventory(mockLocalStorage) {
  try {
    const raw = mockLocalStorage["mfgProducts"] || "[]"
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return {}
    const map = {}
    for (const p of list) {
      const key = String(p.name || "").trim().toLowerCase()
      if (!key) continue
      const qty = Number(p.qty)
      if (!Number.isFinite(qty)) continue
      map[key] = (map[key] || 0) + qty
    }
    return map
  } catch {
    return {}
  }
}

function computeComponentStatusFromItems(items, mockLocalStorage) {
  if (!Array.isArray(items) || !items.length) return ""
  const inventory = getComponentInventory(mockLocalStorage)
  const requiredTotals = {}
  for (const it of items) {
    const key = String(it.description || "").trim().toLowerCase()
    if (!key) continue
    const qty = Number(it.qty)
    if (!Number.isFinite(qty) || qty <= 0) continue
    requiredTotals[key] = (requiredTotals[key] || 0) + qty
  }
  const keys = Object.keys(requiredTotals)
  if (!keys.length) return ""
  for (const key of keys) {
    const available = Number(inventory[key] || 0)
    const required = Number(requiredTotals[key] || 0)
    // The logic I implemented previously:
    if (!Number.isFinite(available) || required >= available) return "Not Available"
  }
  return "Available"
}

// Test Data
const mockStore = {
  "mfgProducts": JSON.stringify([
    { name: "Wheel", qty: 10 },
    { name: "Engine", qty: 5 }
  ])
}

// Case 1: All items available and strictly less than inventory
const items1 = [
  { description: "Wheel", qty: 5 }, // 5 < 10
  { description: "Engine", qty: 2 } // 2 < 5
]
console.log("Case 1 (Expect Available):", computeComponentStatusFromItems(items1, mockStore))

// Case 2: One item available, one item missing (Screw)
const items2 = [
  { description: "Wheel", qty: 5 },
  { description: "Screw", qty: 1 } // 0 available. 1 >= 0 -> Not Available
]
console.log("Case 2 (Expect Not Available):", computeComponentStatusFromItems(items2, mockStore))

// Case 3: Item equals inventory
const items3 = [
  { description: "Wheel", qty: 10 } // 10 >= 10 -> Not Available
]
console.log("Case 3 (Expect Not Available):", computeComponentStatusFromItems(items3, mockStore))

// Case 4: Empty description item
const items4 = [
  { description: "Wheel", qty: 5 },
  { description: "", qty: 100 } // Should be ignored
]
console.log("Case 4 (Expect Available):", computeComponentStatusFromItems(items4, mockStore))
