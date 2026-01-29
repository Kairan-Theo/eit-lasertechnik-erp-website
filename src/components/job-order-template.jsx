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

  // Fill empty rows to ensure the table looks like the template
  const MIN_ROWS = 14
  const emptyRowsCount = Math.max(MIN_ROWS - items.length, 0)

  React.useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        .job-order-container,
        .job-order-container * {
          visibility: visible !important;
        }
        .job-order-container {
          position: fixed !important;
          left: 0;
          top: 0;
          width: 190mm;
        }
        @page { size: A4; margin: 10mm; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <div className="job-order-container">
      <style>{`
        .job-order-container {
          font-family: "Sarabun", sans-serif;
          width: 190mm;
          margin: 0 auto;
          background: white;
          color: black;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .eit-box {
          width: 50px;
          height: 50px;
          background-color: #3D56A6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        .logo-text {
          font-size: 24px;
        }
        .title-section {
          text-align: right;
        }
        .main-title {
          font-size: 20px;
          font-weight: bold;
          font-family: serif;
        }
        .sub-title {
          font-size: 16px;
          font-weight: bold;
          font-family: serif;
          margin-top: 5px;
        }
        .doc-id-box {
          border: 2px solid black;
          display: flex;
          margin-top: 5px;
        }
        .doc-id-label {
          border-right: 2px solid black;
          padding: 2px 5px;
          font-size: 12px;
          font-weight: bold;
          background: #f0f0f0;
          display: flex;
          align-items: center;
        }
        .doc-id-value {
          padding: 2px 10px;
          font-weight: bold;
          min-width: 120px;
          text-align: center;
        }

        /* Table Styles */
        .info-table, .items-table, .footer-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid black;
        }
        .info-table td, .items-table th, .items-table td, .footer-table td {
          border: 1px solid black;
          padding: 6px;
          vertical-align: top;
        }
        /* Thick borders for outer edges are handled by the table border */
        
        .label-th {
          font-size: 11px;
          font-weight: bold;
        }
        .value-text {
          font-size: 14px;
          min-height: 20px;
        }
        .label-en {
          font-size: 10px;
          color: #333;
        }
        
        .items-table {
          border-top: none; /* Connect with info table */
          border-bottom: none;
        }
        .items-table th {
          border-bottom: 2px solid black;
          background-color: #fff;
          text-align: center;
        }
        .items-table td {
          border-bottom: 1px dashed black;
          border-top: none;
        }
        .items-table tr:last-child td {
          border-bottom: 2px solid black; /* Close the section */
        }
        
        .footer-table {
          border-top: none;
        }
        
        .dotted-line {
          border-bottom: 1px dotted black;
          display: inline-block;
          min-width: 100px;
        }
      `}</style>

      {/* Header */}
      <div className="header-section">
        <div className="logo-box">
          <div className="eit-box">EIT</div>
          <div className="logo-text">Lasertechnik</div>
        </div>
        <div className="title-section">
          <div className="main-title">JOB ORDER</div>
          <div className="sub-title">ใบรับงาน</div>
          <div className="doc-id-box">
            <div className="doc-id-label">เลขที่เอกสาร</div>
            <div className="doc-id-value">{o.jobOrderCode || o.ref || ""}</div>
          </div>
        </div>
      </div>

      {/* Info Section Table */}
      <table className="info-table">
        <tbody>
          <tr>
            <td style={{ width: "45%", borderRight: "2px solid black" }}>
              <div className="label-th">ชื่อลูกค้า :</div>
              <div className="value-text">{o.customer || ""}</div>
              <div className="label-en">Customer Name</div>
            </td>
            <td style={{ width: "30%", borderRight: "2px solid black" }}>
              <div className="label-th">วันที่เริ่มทำชิ้นงาน</div>
              <div className="value-text">{displayStart}</div>
              <div className="label-en">Start Date</div>
            </td>
            <td style={{ width: "25%" }}>
              <div className="label-th">จำนวนที่ส่งทำชิ้นงาน</div>
              <div className="value-text">{String(o.totalQuantity ?? o.quantity ?? "")}</div>
              <div className="label-en">Order Quantity</div>
            </td>
          </tr>
          <tr>
            <td style={{ borderTop: "2px solid black", borderRight: "2px solid black" }}>
              <div className="label-th">สินค้าที่รับงาน</div>
              <div className="value-text">{o.productNo || ""}</div>
              <div className="label-en">Product No.</div>
            </td>
            <td colSpan={2} style={{ borderTop: "2px solid black" }}>
              <div className="label-th">วันที่ทำชิ้นงานเสร็จ</div>
              <div className="value-text">{displayCompleted}</div>
              <div className="label-en">Completed Date</div>
            </td>
          </tr>
          <tr>
            <td style={{ borderTop: "2px solid black", borderRight: "2px solid black" }}>
              <div className="label-th">ผู้รับผิดชอบ</div>
              <div className="label-en" style={{ marginBottom: "5px" }}>Responsible</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div className="label-th">ฝ่ายขาย</div>
                  <div>{o.responsibleSales || ""}</div>
                  <div className="dotted-line" style={{ width: "100%" }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="label-th">ฝ่ายผลิต</div>
                  <div>{o.responsibleProduction || ""}</div>
                  <div className="dotted-line" style={{ width: "100%" }}></div>
                </div>
              </div>
            </td>
            <td colSpan={2} style={{ borderTop: "2px solid black" }}>
              <div className="label-th">ระยะเวลาที่ใช้</div>
              <div className="value-text">{o.productionTime || ""}</div>
              <div className="label-en">Time of Production</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th style={{ width: "15%", borderRight: "2px solid black" }}>
              <div className="label-th">รหัสสินค้า</div>
              <div className="label-en">Item Code</div>
            </th>
            <th style={{ width: "55%", borderRight: "2px solid black" }}>
              <div className="label-th">รายละเอียด</div>
              <div className="label-en">Description</div>
            </th>
            <th style={{ width: "15%", borderRight: "2px solid black" }}>
              <div className="label-th">จำนวน</div>
              <div className="label-en">Quantity</div>
            </th>
            <th style={{ width: "15%" }}>
              <div className="label-th">หน่วยนับ</div>
              <div className="label-en">Unit</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={{ borderRight: "2px solid black" }}>{String(it.itemCode || it.item || "")}</td>
              <td style={{ borderRight: "2px solid black" }}>{String(it.description || it.item_description || "")}</td>
              <td style={{ borderRight: "2px solid black", textAlign: "center" }}>{String(it.qty ?? it.item_quantity ?? "")}</td>
              <td style={{ textAlign: "center" }}>{String(it.unit || it.item_unit || "")}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRowsCount }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td style={{ borderRight: "2px solid black", height: "28px" }}>&nbsp;</td>
              <td style={{ borderRight: "2px solid black" }}>&nbsp;</td>
              <td style={{ borderRight: "2px solid black" }}>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Table */}
      <table className="footer-table">
        <tbody>
          <tr>
            <td style={{ width: "50%", borderRight: "2px solid black", padding: "15px" }}>
              {/* Supplier */}
              <div style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span className="label-th" style={{ width: "60px" }}>ผู้ส่งมอบ</span>
                  <div style={{ flex: 1, borderBottom: "1px dotted black", minHeight: "20px" }}>{supplierName}</div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "5px" }}>
                  <span className="label-th" style={{ width: "60px" }}>วันที่</span>
                  <div style={{ width: "120px", borderBottom: "1px dotted black", minHeight: "20px" }}>{displaySupplierDate}</div>
                </div>
              </div>
              
              {/* Recipient */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span className="label-th" style={{ width: "60px" }}>ผู้รับงาน</span>
                  <div style={{ flex: 1, borderBottom: "1px dotted black", minHeight: "20px" }}>{recipientName}</div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "5px" }}>
                  <span className="label-th" style={{ width: "60px" }}>วันที่</span>
                  <div style={{ width: "120px", borderBottom: "1px dotted black", minHeight: "20px" }}>{displayRecipientDate}</div>
                </div>
              </div>
            </td>
            <td style={{ width: "50%", padding: "15px", verticalAlign: "middle" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div className="label-th">รวมชิ้นงานทั้งหมด</div>
                  <div className="label-en">Total Quantity</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid black", minWidth: "100px", fontSize: "16px", fontWeight: "bold" }}>
                    {displayTotalQty}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="label-th">รายการ</div>
                  <div className="label-en">Unit</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
