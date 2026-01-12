import React from "react"

export function JobOrderTemplate({ order }) {
  // Ensure we have valid data
  const o = order || {}
  const items = Array.isArray(o.items) ? o.items : []
  const supplierName = String(o.supplier ?? o.supplier_name ?? o.supplierName ?? "")
  const recipientName = String(o.recipient ?? o.recipient_name ?? o.recipientName ?? "")
  const supplierDateRaw = o.supplierDate ?? o.supplier_date ?? ""
  const recipientDateRaw = o.recipientDate ?? o.recipient_date ?? ""
  const totalQtyFromItems = items.reduce((sum, it) => {
    const v = Number(it?.qty ?? it?.item_quantity ?? 0)
    return sum + (Number.isFinite(v) ? v : 0)
  }, 0)
  const displayTotalQty = (() => {
    if (items.length) {
      return totalQtyFromItems ? String(totalQtyFromItems) : ""
    }
    const fallback = Number(o.totalQuantity ?? o.quantity ?? 0)
    return fallback ? String(fallback) : ""
  })()
  const displayStart = o.start ? new Date(o.start).toLocaleDateString() : ""
  const displayCompleted = o.completedDate ? new Date(o.completedDate).toLocaleDateString() : ""
  const displaySupplierDate = supplierDateRaw ? new Date(supplierDateRaw).toLocaleDateString() : ""
  const displayRecipientDate = recipientDateRaw ? new Date(recipientDateRaw).toLocaleDateString() : ""

  return (
    <div className="bg-white p-8 print:p-0 text-black font-sans min-h-[29.7cm] w-[21cm] mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#3D56A6] text-white flex items-center justify-center font-bold text-lg">EIT</div>
          <div className="text-3xl font-normal leading-none">Lasertechnik</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right font-bold text-lg leading-none">JOB ORDER</div>
          <div className="text-right font-bold text-base leading-none">ใบรับงาน</div>
          <div className="flex border-2 border-black">
            <div className="px-2 py-1 text-xs font-bold border-r-2 border-black flex items-center">เลขที่เอกสาร</div>
            <div className="px-5 py-1 min-w-[130px] text-center font-bold">{o.jobOrderCode || o.ref || ""}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-2 border-black">
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border-r-2 border-black p-2 w-[45%]">
                <div className="grid grid-cols-[auto_1fr] items-center min-h-[60px] gap-x-2">
                  <div className="text-[11px] font-bold">ชื่อลูกค้า :</div>
                  <div className="text-sm">{o.customer || ""}</div>
                  <div className="col-span-2 text-[10px]">Customer Name</div>
                </div>
              </td>
              <td className="border-r-2 border-black p-2 w-[30%]">
                <div className="grid grid-cols-[auto_1fr] items-center min-h-[60px] gap-x-2">
                  <div className="text-[11px] font-bold">วันที่เริ่มทำชิ้นงาน</div>
                  <div className="text-sm">{displayStart}</div>
                  <div className="col-span-2 text-[10px]">Start Date</div>
                </div>
              </td>
              <td className="p-2 w-[25%]">
                <div className="grid grid-cols-[auto_1fr] items-center min-h-[60px] gap-x-2">
                  <div className="text-[11px] font-bold">จำนวนที่ส่งทำชิ้นงาน</div>
                  <div className="text-sm">{String(o.totalQuantity ?? o.quantity ?? "")}</div>
                  <div className="col-span-2 text-[10px]">Order Quantity</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-t-2 border-black border-r-2 border-black p-2">
                <div className="grid grid-cols-[auto_1fr] items-center min-h-[60px] gap-x-2">
                  <div className="text-[11px] font-bold">สินค้าที่รับงาน</div>
                  <div className="text-sm">{o.productNo || ""}</div>
                  <div className="col-span-2 text-[10px]">Product No.</div>
                </div>
              </td>
              <td className="border-t-2 border-black p-2" colSpan={2}>
                <div className="grid grid-cols-[auto_1fr] items-center min-h-[60px] gap-x-2">
                  <div className="text-[11px] font-bold">วันที่ทำชิ้นงานเสร็จ</div>
                  <div className="text-sm">{displayCompleted}</div>
                  <div className="col-span-2 text-[10px]">Completed Date</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-t-2 border-black border-r-2 border-black p-2 align-top">
                <div className="text-[11px] font-bold">ผู้รับผิดชอบ</div>
                <div className="text-[10px] mb-2">Responsible</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <div className="text-[11px]">ฝ่ายขาย</div>
                    <div className="flex flex-col">
                      <div className="text-sm">{o.responsibleSales || "\u00A0"}</div>
                      <div className="border-b border-dotted border-black w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-[11px]">ฝ่ายผลิต</div>
                    <div className="flex flex-col">
                      <div className="text-sm">{o.responsibleProduction || "\u00A0"}</div>
                      <div className="border-b border-dotted border-black w-24"></div>
                    </div>
                  </div>
                </div>
              </td>
              <td className="border-t-2 border-black p-2 align-top" colSpan={2}>
                <div className="grid grid-cols-[auto_1fr] items-center min-h-[60px] gap-x-2">
                  <div className="text-[11px] font-bold">ระยะเวลาที่ใช้</div>
                  <div className="text-sm">{o.productionTime || ""}</div>
                  <div className="col-span-2 text-[10px]">Time of Production</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 border-2 border-black">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b-2 border-black border-r-2 border-black p-2 text-center w-[15%]">
                <div className="font-bold">รหัสสินค้า</div>
                <div className="text-[10px] font-normal">Item Code</div>
              </th>
              <th className="border-b-2 border-black border-r-2 border-black p-2 text-center w-[55%]">
                <div className="font-bold">รายละเอียด</div>
                <div className="text-[10px] font-normal">Description</div>
              </th>
              <th className="border-b-2 border-black border-r-2 border-black p-2 text-center w-[15%]">
                <div className="font-bold">จำนวน</div>
                <div className="text-[10px] font-normal">Quantity</div>
              </th>
              <th className="border-b-2 border-black p-2 text-center w-[15%]">
                <div className="font-bold">หน่วยนับ</div>
                <div className="text-[10px] font-normal">Unit</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="border-b border-dashed border-black">
                <td className="border-r-2 border-black p-2 align-top">{String(it.itemCode || it.item || "")}</td>
                <td className="border-r-2 border-black p-2 align-top">{String(it.description || it.item_description || "")}</td>
                <td className="border-r-2 border-black p-2 text-left align-top">{String(it.qty ?? it.item_quantity ?? "")}</td>
                <td className="p-2 text-center align-top">{String(it.unit || it.item_unit || "")}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(14 - items.length, 0) }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-dashed border-black last:border-b-0">
                <td className="border-r-2 border-black p-2 h-7"></td>
                <td className="border-r-2 border-black p-2"></td>
                <td className="border-r-2 border-black p-2"></td>
                <td className="p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-2 border-t-0 border-black">
        <div className="grid grid-cols-2">
          <div className="border-r-2 border-black p-3">
            <div className="mb-6">
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <div className="text-[11px] font-bold">ผู้ส่งมอบ</div>
                  <div className="flex flex-col">
                    <div className="text-sm">{supplierName}</div>
                    <div className="border-b border-dotted border-black w-40"></div>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <div className="text-[11px] font-bold">วันที่</div>
                  <div className="flex flex-col">
                    <div className="text-sm">{displaySupplierDate}</div>
                    <div className="border-b border-dotted border-black w-28"></div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <div className="text-[11px] font-bold">ผู้รับงาน</div>
                  <div className="flex flex-col">
                    <div className="text-sm">{recipientName}</div>
                    <div className="border-b border-dotted border-black w-40"></div>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <div className="text-[11px] font-bold">วันที่</div>
                  <div className="flex flex-col">
                    <div className="text-sm">{displayRecipientDate}</div>
                    <div className="border-b border-dotted border-black w-28"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[11px] font-bold">รวมชิ้นงานทั้งหมด</div>
                  <div className="text-[10px]">Total Quantity</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm leading-none">{displayTotalQty}</div>
                  <div className="mt-[2px] border-b border-black w-20"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold">รายการ</div>
                <div className="text-[10px]">Unit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
