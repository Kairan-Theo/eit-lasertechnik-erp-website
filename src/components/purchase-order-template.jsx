import React from "react"

export function PurchaseOrderTemplate({ q, compact }) {
  // Ensure we have valid numbers for calculations
  const items = Array.isArray(q.items) ? q.items : []
  const subtotal = q.subtotal || items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const taxTotal = q.taxTotal || (subtotal * 0.07)
  const total = q.total || (subtotal + taxTotal)

  // Helper for locale number formatting
  const fmt = (n) => n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  return (
    // Use Thai-capable font family so browser print-to-PDF renders Thai properly
    <div className={`bg-white ${compact ? "p-4" : "p-6"} font-sans text-black`} id="po-template-root" style={{ width: "210mm", margin: "0 auto", fontFamily: 'Tahoma, Prompt, "Times New Roman", Arial, sans-serif' }}>
      {/* Main Layout Table */}
      <table className="w-full border-collapse border border-black" style={{ width: "100%" }}>
        <tbody>
          {/* Header */}
          <tr>
            <td colSpan="2" className="border-b border-r border-black p-4">
              {/* Organization Header Image */}
              <img 
                src={q.details?.eitName?.toLowerCase().includes("einstein") ? "/Einstein header.png" : "/EIT header.png"} 
                alt="Company Header" 
                className="w-full h-auto block"
              />
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="text-center font-bold text-xl py-2 border-b border-r border-black">
              ใบสั่งซื้อ / PURCHASE ORDER.
            </td>
          </tr>

          {/* Vendor & Order Details Section */}
          <tr>
            <td colSpan="2" className="p-0 border-b border-r border-black">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Left Side: Vendor Info */}
                    <td className="w-1/2 align-top border-r border-black p-3" style={{ verticalAlign: "top" }}>
                      <div className="text-sm font-bold mb-2">VENDOR NAME:</div>
                      <div className="pl-4 pt-2 mb-4">
                        <div className="font-bold text-lg text-[#3D56A6]">{q.customer.company || q.customer.name}</div>
                        <div className="text-sm mt-1 whitespace-pre-line">{q.customer.address}</div>
                        <div className="text-sm mt-1">{q.customer.phone} {q.customer.email ? `| ${q.customer.email}` : ""}</div>
                      </div>
                      <div className="text-sm mt-auto">
                        <span className="font-bold">Contact Person :</span> {q.customer.name}
                      </div>
                    </td>
                    
                    {/* Right Side: Order Info Grid */}
                    <td className="w-1/2 align-top p-0" style={{ verticalAlign: "top" }}>
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="w-1/2 border-r border-black p-1 text-center text-[10px] font-bold bg-white">REF. QUOTATION NO.</td>
                            <td className="w-1/2 p-1 text-center text-[10px] font-bold bg-white">PURCHASE ORDER NO.</td>
                          </tr>
                          <tr className="border-b border-black h-8">
                            <td className="w-1/2 border-r border-black p-1 text-center text-sm">{q.extraFields?.refQuotation || "-"}</td>
                            <td className="w-1/2 p-1 text-center text-sm font-bold">{q.details.poNumber}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="w-1/2 border-r border-black p-1 text-center text-[10px] font-bold bg-white">DATE OF ORDER</td>
                            <td className="w-1/2 p-1 text-center text-[10px] font-bold bg-white">DELIVERY DATE</td>
                          </tr>
                          <tr className="border-b border-black h-8">
                            <td className="w-1/2 border-r border-black p-1 text-center text-sm">{q.extraFields?.orderDate || "-"}</td>
                            <td className="w-1/2 p-1 text-center text-sm">{q.extraFields?.deliveryDate || "-"}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="w-[40%] border-r border-black p-1 pl-2 text-xs font-bold bg-white align-middle">PAYMENT TERMS</td>
                            <td className="w-[60%] p-1 pl-2 text-sm align-middle">{q.extraFields?.paymentTerms || "-"}</td>
                          </tr>
                          <tr>
                            <td className="w-[40%] border-r border-black p-1 pl-2 text-xs font-bold bg-white align-middle">DELIVERY TO</td>
                            <td className="w-[60%] p-1 pl-2 text-sm align-middle leading-tight py-2">{q.extraFields?.deliveryTo || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Items Table */}
          <tr>
            <td colSpan="2" className="p-0 border-b border-r border-black">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black p-2 w-12 text-center text-sm font-bold">ITEM</th>
                    <th className="border-r border-black p-2 text-center text-sm font-bold">DESCRIPTION</th>
                    <th className="border-r border-black p-2 w-16 text-center text-sm font-bold">Q'TY</th>
                    <th className="border-r border-black p-2 w-24 text-center text-sm font-bold">UNIT PRICE</th>
                    <th className="p-2 w-28 text-center text-sm font-bold">TOTAL AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => {
                     const amount = Number(it.qty || 0) * Number(it.price || 0)
                     return (
                        <tr key={i}>
                            <td className="border-r border-black p-2 text-center text-sm align-top h-8">{i + 1}</td>
                            <td className="border-r border-black p-2 text-sm align-top">
                                <div className="font-semibold">{it.description}</div>
                                {it.product && <div className="text-xs text-gray-500">{it.product}</div>}
                                {it.note && <div className="text-xs text-gray-400 italic">{it.note}</div>}
                            </td>
                            <td className="border-r border-black p-2 text-right text-sm align-top">{it.qty}</td>
                            <td className="border-r border-black p-2 text-right text-sm align-top">{fmt(Number(it.price))}</td>
                            <td className="p-2 text-right text-sm align-top">{fmt(amount)}</td>
                        </tr>
                     )
                  })}
                  {/* Empty rows filler */}
                  {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
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
            </td>
          </tr>

          {/* Summary Section */}
          <tr>
            <td colSpan="2" className="p-0 border-b border-r border-black">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Remarks */}
                    <td className="w-[65%] border-r border-black p-3 align-top">
                       <div className="font-bold underline mb-1 text-sm">หมายเหตุ</div>
                       <div className="whitespace-pre-wrap text-sm">{q.details?.remark}</div>
                    </td>
                    {/* Totals */}
                    <td className="w-[35%] p-0 align-top">
                       <table className="w-full border-collapse">
                          <tbody>
                            <tr className="border-b border-black">
                               <td className="p-1 pr-2 text-right text-sm font-bold w-[40%]">Sub Total</td>
                               <td className="p-1 pr-2 text-right text-sm w-[60%]">{fmt(subtotal)}</td>
                            </tr>
                            <tr className="border-b border-black">
                               <td className="p-1 pr-2 text-right text-sm font-bold">Vat 7%</td>
                               <td className="p-1 pr-2 text-right text-sm">{fmt(taxTotal)}</td>
                            </tr>
                            <tr>
                               <td className="p-2 pr-2 text-right text-sm font-bold italic underline">Grand Total Amount.</td>
                               <td className="p-2 pr-2 text-right text-sm font-bold underline decoration-double">{fmt(total)}</td>
                            </tr>
                          </tbody>
                       </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Footer Signatures */}
          <tr>
            <td colSpan="2" className="p-0 border-r border-black">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Vendor Confirmation */}
                    <td className="w-1/2 border-r border-black p-0 align-top">
                        <table className="w-full border-collapse h-full">
                            <tbody>
                                <tr>
                                    <td colSpan="2" className="border-b border-black p-1 text-[10px] text-center font-bold bg-gray-50">
                                        VENDOR CONFIRMATION AND FAX TO RETURN
                                    </td>
                                </tr>
                                <tr>
                                    <td className="w-1/2 border-r border-black border-b border-black p-1 text-[10px] text-center">ACCEPT ORDER</td>
                                    <td className="w-1/2 border-b border-black p-1 text-[10px] text-center">ESTIMATE DELIVERY DATE</td>
                                </tr>
                                <tr>
                                    <td className="border-r border-black h-16"></td>
                                    <td className="h-16"></td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="border-t border-black p-1 pl-2 text-xs">BY :</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                    
                    {/* Authorized By */}
                    <td className="w-1/2 p-0 align-top">
                        <table className="w-full border-collapse h-full">
                            <tbody>
                                <tr>
                                    <td className="w-1/2 border-r border-black border-b border-black p-1 text-[10px] text-center font-bold bg-gray-50">AUTHORIZED BY</td>
                                    <td className="w-1/2 border-b border-black p-1 text-[10px] text-center font-bold bg-gray-50">BUYER BY</td>
                                </tr>
                                <tr>
                                    <td className="w-1/2 border-r border-black h-16"></td>
                                    <td className="w-1/2 h-16"></td>
                                </tr>
                                <tr>
                                    <td className="w-1/2 border-r border-black border-t border-black h-8"></td>
                                    <td className="w-1/2 border-t border-black h-8"></td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
