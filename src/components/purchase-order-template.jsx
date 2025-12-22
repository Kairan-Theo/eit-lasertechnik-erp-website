import React from "react"

export function PurchaseOrderTemplate({ q, compact }) {
  // Ensure we have valid numbers for calculations even if data is missing/incomplete
  const items = Array.isArray(q.items) ? q.items : []
  const subtotal = q.subtotal || items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const taxTotal = q.taxTotal || (subtotal * 0.07)
  const total = q.total || (subtotal + taxTotal)

  return (
    <div className={`bg-white rounded-xl shadow-sm ${compact ? "p-4" : "p-8"} print:shadow-none print:border-0 text-black font-sans`} id="po-template-root">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <div className="w-2/3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-[#3D56A6] text-white flex items-center justify-center font-bold text-lg rounded-sm">EIT</div>
                    <div className="text-[#3D56A6] text-xl font-bold">Lasertechnik</div>
                    <div className="text-[10px] text-gray-500 pt-1">บริษัท อีไอที เลเซอร์เทคนิค จำกัด</div>
                </div>
                <div className="text-[10px] text-gray-600 leading-tight">
                    <div className="font-bold">EIT LASERTECHNIK CO.,LTD (HEAD OFFICE)</div>
                    <div>1/120 Soi Ramkhamhaeng 184, Minburi, Minburi</div>
                    <div>Bangkok 10510</div>
                    <div>Tel : 02-052-9544 Fax : 02-052-9544 Tax ID : 0105560138141</div>
                </div>
            </div>
            <div className="w-1/3 flex flex-col items-end">
                <div className="w-full h-0.5 bg-blue-800 mb-2"></div>
                {/* Image placeholder - mimicking the collage from the screenshot */}
                <div className="flex gap-1">
                   <div className="w-8 h-8 bg-gray-200"></div>
                   <div className="w-8 h-8 bg-gray-300"></div>
                   <div className="w-8 h-8 bg-gray-400"></div>
                </div>
            </div>
        </div>

        <div className="text-center font-bold text-xl mb-6">ใบสั่งซื้อ / PURCHASE ORDER.</div>

        {/* Info Grid */}
        <div className="flex border border-black mb-px">
            {/* Left: Vendor Info */}
            <div className="w-1/2 border-r border-black p-2 flex flex-col">
                <div className="text-xs font-bold mb-1">VENDOR NAME:</div>
                <div className="flex-grow font-semibold text-lg text-[#3D56A6] pl-4 pt-2">
                    {q.customer.company || q.customer.name}
                </div>
                <div className="mt-4 text-xs">
                    <span className="font-bold">Contact Person :</span> {q.customer.name}
                </div>
            </div>

            {/* Right: Order Details Table */}
            <div className="w-1/2">
                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-1 text-center text-[10px] font-bold">REF. QUOTATION NO.</div>
                    <div className="w-1/2 p-1 text-center text-[10px] font-bold">PURCHASE ORDER NO.</div>
                </div>
                <div className="flex border-b border-black h-8">
                    <div className="w-1/2 border-r border-black p-1 text-center text-xs flex items-center justify-center">{q.extraFields?.refQuotation || "-"}</div>
                    <div className="w-1/2 p-1 text-center text-xs font-bold flex items-center justify-center">{q.details.number}</div>
                </div>
                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-1 text-center text-[10px] font-bold">DATE OF ORDER</div>
                    <div className="w-1/2 p-1 text-center text-[10px] font-bold">DELIVERY DATE</div>
                </div>
                <div className="flex border-b border-black h-8">
                    <div className="w-1/2 border-r border-black p-1 text-center text-xs flex items-center justify-center">{q.extraFields?.orderDate || "-"}</div>
                    <div className="w-1/2 p-1 text-center text-xs flex items-center justify-center">{q.extraFields?.deliveryDate || "-"}</div>
                </div>
                <div className="flex border-b border-black">
                    <div className="w-1/3 border-r border-black p-1 text-[10px] font-bold flex items-center">PAYMENT TERMS</div>
                    <div className="w-2/3 p-1 text-xs px-2 flex items-center">{q.extraFields?.paymentTerms || "-"}</div>
                </div>
                <div className="flex">
                    <div className="w-1/3 border-r border-black p-1 text-[10px] font-bold flex items-center">DELIVERY TO</div>
                    <div className="w-2/3 p-1 text-xs px-2 whitespace-pre-line leading-tight">{q.extraFields?.deliveryTo || "-"}</div>
                </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="border border-black border-t-0 mb-px">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black p-1 w-12 text-center font-bold">ITEM</th>
                        <th className="border-r border-black p-1 text-center font-bold">DESCRIPTION</th>
                        <th className="border-r border-black p-1 w-16 text-center font-bold">Q'TY</th>
                        <th className="border-r border-black p-1 w-24 text-center font-bold">UNIT PRICE</th>
                        <th className="p-1 w-24 text-center font-bold">TOTAL AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((it, i) => {
                         const amount = Number(it.qty || 0) * Number(it.price || 0)
                         return (
                            <tr key={i} className="">
                                <td className="border-r border-black p-2 text-center align-top h-8">{i + 1}</td>
                                <td className="border-r border-black p-2 align-top">
                                    <div className="font-semibold">{it.description}</div>
                                    {it.product && <div className="text-[10px] text-gray-500">{it.product}</div>}
                                </td>
                                <td className="border-r border-black p-2 text-right align-top">{it.qty}</td>
                                <td className="border-r border-black p-2 text-right align-top">{Number(it.price).toFixed(2)}</td>
                                <td className="p-2 text-right align-top">{amount.toFixed(2)}</td>
                            </tr>
                         )
                    })}
                    {/* Fill empty rows to maintain height */}
                    {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                            <td className="border-r border-black p-2 h-8"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="p-2"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Summary */}
        <div className="flex border border-black border-t-0 mb-4">
             <div className="w-2/3 border-r border-black p-2 align-top text-xs font-bold underline">
                หมายเหตุ
             </div>
             <div className="w-1/3">
                <div className="flex border-b border-black">
                    <div className="w-1/2 p-1 text-right text-xs font-bold">Sub Total</div>
                    <div className="w-1/2 p-1 text-right text-xs">{subtotal.toFixed(2)}</div>
                </div>
                <div className="flex border-b border-black">
                    <div className="w-1/2 p-1 text-right text-xs font-bold">Vat 7%</div>
                    <div className="w-1/2 p-1 text-right text-xs">{taxTotal.toFixed(2)}</div>
                </div>
                <div className="flex">
                    <div className="w-1/2 p-1 text-right text-xs font-bold italic underline">Grand Total Amount.</div>
                    <div className="w-1/2 p-1 text-right text-xs font-bold underline decoration-double">{total.toFixed(2)}</div>
                </div>
             </div>
        </div>

        {/* Footer */}
        <div className="flex border border-black h-32">
            <div className="w-1/2 border-r border-black flex flex-col">
                <div className="border-b border-black p-1 text-[10px] text-center font-bold">VENDOR CONFIRMATION AND FAX TO RETURN</div>
                <div className="flex border-b border-black">
                     <div className="w-1/2 border-r border-black p-1 text-[10px] text-center">ACCEPT ORDER</div>
                     <div className="w-1/2 p-1 text-[10px] text-center">ESTIMATE DELIVERY DATE</div>
                </div>
                <div className="flex-grow flex">
                     <div className="w-1/2 border-r border-black"></div>
                     <div className="w-1/2"></div>
                </div>
                <div className="border-t border-black p-1 text-xs">BY :</div>
            </div>
            <div className="w-1/2 flex flex-col">
                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-1 text-[10px] text-center font-bold">AUTHORIZED BY</div>
                    <div className="w-1/2 p-1 text-[10px] text-center font-bold">BUYER BY</div>
                </div>
                <div className="flex-grow flex">
                    <div className="w-1/2 border-r border-black"></div>
                    <div className="w-1/2"></div>
                </div>
                <div className="border-t border-black h-8 flex">
                     <div className="w-1/2 border-r border-black"></div>
                     <div className="w-1/2"></div>
                </div>
            </div>
        </div>
    </div>
  )
}
