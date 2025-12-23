import React from "react"

export function JobOrderTemplate({ order }) {
  // Ensure we have valid data
  const o = order || {}

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 print:shadow-none print:border-0 text-black font-sans min-h-[29.7cm] relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="w-2/3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-[#3D56A6] text-white flex items-center justify-center font-bold text-lg rounded-sm">EIT</div>
                    <div className="text-[#3D56A6] text-xl font-bold">Lasertechnik</div>
                </div>
                {/* Optional Company Info if needed, similar to PO */}
            </div>
            <div className="w-1/3 flex flex-col items-end">
                <div className="text-right font-bold text-xl">JOB ORDER</div>
                <div className="text-right font-bold text-lg mb-2">ใบรับงาน</div>
                <div className="border border-black flex">
                    <div className="bg-gray-100 border-r border-black px-2 py-1 text-xs font-bold flex items-center">เลขที่เอกสาร</div>
                    <div className="px-4 py-1 font-bold text-lg min-w-[100px] text-center">{o.jobOrderCode || o.ref || "-"}</div>
                </div>
            </div>
        </div>

        {/* Info Grid */}
        <div className="border border-black mb-4">
            {/* Row 1 */}
            <div className="flex border-b border-black">
                <div className="w-1/2 border-r border-black p-2">
                    <div className="text-[10px] font-bold">ชื่อลูกค้า :</div>
                    <div className="text-xs text-gray-500 mb-1">Customer Name</div>
                    <div className="font-semibold pl-2">{o.customer || "-"}</div>
                </div>
                <div className="w-1/4 border-r border-black p-2">
                    <div className="text-[10px] font-bold">วันที่เริ่มทำงาน :</div>
                    <div className="text-xs text-gray-500 mb-1">Start Date</div>
                    <div className="font-semibold pl-2">{o.start ? new Date(o.start).toLocaleDateString() : "-"}</div>
                </div>
                <div className="w-1/4 p-2">
                    <div className="text-[10px] font-bold">จำนวนที่ส่งทำชิ้นงาน :</div>
                    <div className="text-xs text-gray-500 mb-1">Order Quantity</div>
                    <div className="font-semibold pl-2">{o.totalQuantity || "-"}</div>
                </div>
            </div>

            {/* Row 2 */}
            <div className="flex border-b border-black">
                <div className="w-1/2 border-r border-black p-2">
                    <div className="text-[10px] font-bold">ชื่อสินค้า/ชิ้นงาน :</div>
                    <div className="text-xs text-gray-500 mb-1">Product No.</div>
                    <div className="font-semibold pl-2">{o.productNo || "-"}</div>
                </div>
                <div className="w-1/2 p-2">
                    <div className="text-[10px] font-bold">วันที่ทำชิ้นงานเสร็จ :</div>
                    <div className="text-xs text-gray-500 mb-1">Completed Date</div>
                    <div className="font-semibold pl-2">{o.completedDate ? new Date(o.completedDate).toLocaleDateString() : "-"}</div>
                </div>
            </div>

            {/* Row 3 */}
            <div className="flex">
                <div className="w-1/2 border-r border-black p-2">
                    <div className="text-[10px] font-bold">ผู้รับผิดชอบ :</div>
                    <div className="text-xs text-gray-500 mb-1">Responsible</div>
                    <div className="font-semibold pl-2">{o.responsible || "-"}</div>
                </div>
                <div className="w-1/2 p-2">
                    <div className="text-[10px] font-bold">ระยะเวลาที่ใช้ :</div>
                    <div className="text-xs text-gray-500 mb-1">Time of Production</div>
                    <div className="font-semibold pl-2">{o.productionTime || "-"}</div>
                </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="border border-black border-t-0 mb-4">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-black bg-gray-50">
                        <th className="border-r border-black p-2 text-center w-1/4">
                            <div className="font-bold">รหัสสินค้า</div>
                            <div className="text-xs font-normal">Item Code</div>
                        </th>
                        <th className="border-r border-black p-2 text-center w-1/2">
                            <div className="font-bold">รายละเอียด</div>
                            <div className="text-xs font-normal">Description</div>
                        </th>
                        <th className="border-r border-black p-2 text-center w-1/8">
                            <div className="font-bold">จำนวน</div>
                            <div className="text-xs font-normal">Quantity</div>
                        </th>
                        <th className="p-2 text-center w-1/8">
                            <div className="font-bold">หน่วยนับ</div>
                            <div className="text-xs font-normal">Unit</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* Main Item */}
                    <tr className="border-b border-dashed border-gray-300">
                        <td className="border-r border-black p-3 align-top">{o.productNo || "-"}</td>
                        <td className="border-r border-black p-3 align-top">{o.product || "-"}</td>
                        <td className="border-r border-black p-3 text-right align-top">{o.quantity || "-"}</td>
                        <td className="p-3 text-center align-top">{o.unit || "-"}</td>
                    </tr>
                    {/* Empty rows to fill space */}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b border-dashed border-gray-300 last:border-b-0">
                            <td className="border-r border-black p-3 h-8"></td>
                            <td className="border-r border-black p-3"></td>
                            <td className="border-r border-black p-3"></td>
                            <td className="p-3"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  )
}
