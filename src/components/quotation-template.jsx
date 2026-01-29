import React from "react"

export function QuotationTemplate({ data }) {
  const d = data || {}
  const details = d.details || {}
  const customer = d.customer || {}
  const items = Array.isArray(d.items) ? d.items : []
  const total = d.totals?.total || items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)

  // Ensure minimum rows for layout consistency
  const MIN_ROWS = 10
  const emptyRowsCount = Math.max(MIN_ROWS - items.length, 0)

  React.useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        .quotation-container,
        .quotation-container * {
          visibility: visible !important;
        }
        .quotation-container {
          position: fixed !important;
          left: 0;
          top: 0;
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 10mm; 
        }
        @page { size: A4; margin: 0; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <div className="quotation-container">
      <style>{`
        .quotation-container {
          font-family: "Sarabun", sans-serif;
          width: 210mm;
          margin: 0 auto;
          background: white;
          color: black;
          padding: 15mm;
          box-sizing: border-box;
          font-size: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .logo-section {
          width: 60%;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .eit-box {
          width: 40px;
          height: 40px;
          background-color: #3D56A6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        .logo-text {
          font-size: 20px;
          font-weight: bold;
          color: #3D56A6;
        }
        .company-info {
          font-size: 11px;
          line-height: 1.4;
        }
        .doc-title-section {
          text-align: right;
          width: 40%;
        }
        .doc-title {
          font-size: 24px;
          font-weight: bold;
          color: #3D56A6;
          margin-bottom: 10px;
        }
        .doc-details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .doc-details-table td {
          padding: 2px 5px;
        }
        .doc-label {
          font-weight: bold;
          text-align: right;
        }
        
        .customer-section {
          border: 1px solid #ccc;
          padding: 10px;
          margin-bottom: 20px;
          display: flex;
          gap: 20px;
        }
        .customer-col {
          flex: 1;
        }
        .customer-row {
          display: flex;
          margin-bottom: 4px;
        }
        .cust-label {
          font-weight: bold;
          width: 80px;
          flex-shrink: 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background-color: #3D56A6;
          color: white;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #3D56A6;
        }
        .items-table td {
          border: 1px solid #ccc;
          padding: 6px;
          vertical-align: top;
        }
        .col-no { width: 40px; text-align: center; }
        .col-item { width: 100px; }
        .col-desc { }
        .col-qty { width: 60px; text-align: center; }
        .col-price { width: 80px; text-align: right; }
        .col-total { width: 90px; text-align: right; }
        
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        .total-table {
          width: 300px;
          border-collapse: collapse;
        }
        .total-table td {
          padding: 5px;
          border: 1px solid #ccc;
        }
        .total-label {
          font-weight: bold;
          background-color: #f0f0f0;
        }
        .total-value {
          text-align: right;
          font-weight: bold;
        }
        
        .terms-section {
          display: flex;
          gap: 20px;
          font-size: 11px;
          margin-top: 20px;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }
        .terms-col {
          flex: 1;
        }
        .term-row {
          display: flex;
          margin-bottom: 4px;
        }
        .term-label {
          font-weight: bold;
          width: 100px;
          flex-shrink: 0;
        }
        
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-box {
          width: 45%;
          text-align: center;
          border-top: 1px solid black;
          padding-top: 10px;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="logo-section">
          <div className="logo-box">
            <div className="eit-box">EIT</div>
            <div className="logo-text">EIT Lasertechnik Co., Ltd.</div>
          </div>
          <div className="company-info">
            {details.eitAddress || "1/120 Soi Ramkhamhaeng 184, Minburi, Bangkok 10510"}<br />
            Tel: {details.eitTelephone || "02-052-9544"} Fax: {details.eitFax || "02-052 9544"}<br />
            Mobile: {details.eitMobile || "000-000-0000"}<br />
            Email: sales@eit-laser.com
          </div>
        </div>
        <div className="doc-title-section">
          <div className="doc-title">QUOTATION</div>
          <table className="doc-details-table">
            <tbody>
              <tr>
                <td className="doc-label">No.:</td>
                <td>{details.number}</td>
              </tr>
              <tr>
                <td className="doc-label">Date:</td>
                <td>{details.date}</td>
              </tr>
              <tr>
                <td className="doc-label">Validity:</td>
                <td>{details.validity}</td>
              </tr>
              <tr>
                <td className="doc-label">Sales Person:</td>
                <td>{details.salesPerson}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Info */}
      <div className="customer-section">
        <div className="customer-col">
          <div className="customer-row">
            <div className="cust-label">To:</div>
            <div>{customer.company}</div>
          </div>
          <div className="customer-row">
            <div className="cust-label">Attn:</div>
            <div>{customer.attn}</div>
          </div>
          <div className="customer-row">
            <div className="cust-label">Address:</div>
            <div>{customer.address}</div>
          </div>
        </div>
        <div className="customer-col">
          <div className="customer-row">
            <div className="cust-label">Tel:</div>
            <div>{customer.telephone}</div>
          </div>
          <div className="customer-row">
            <div className="cust-label">Fax:</div>
            <div>{customer.fax}</div>
          </div>
          <div className="customer-row">
            <div className="cust-label">Email:</div>
            <div>{customer.email}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th className="col-no">No.</th>
            <th className="col-item">Item</th>
            <th className="col-desc">Description / Model</th>
            <th className="col-qty">Qty</th>
            <th className="col-price">Unit Price</th>
            <th className="col-total">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td className="col-no">{idx + 1}</td>
              <td className="col-item">{it.item}</td>
              <td className="col-desc">
                <div style={{ fontWeight: "bold" }}>{it.model}</div>
                <div>{it.description}</div>
              </td>
              <td className="col-qty">{it.qty}</td>
              <td className="col-price">
                {(Number(it.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="col-total">
                {((Number(it.qty) || 0) * (Number(it.price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
          {/* Empty rows filler */}
          {Array.from({ length: emptyRowsCount }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="col-no">&nbsp;</td>
              <td className="col-item">&nbsp;</td>
              <td className="col-desc">&nbsp;</td>
              <td className="col-qty">&nbsp;</td>
              <td className="col-price">&nbsp;</td>
              <td className="col-total">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="total-section">
        <table className="total-table">
          <tbody>
            <tr>
              <td className="total-label">Subtotal</td>
              <td className="total-value">
                {Number(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {details.currency}
              </td>
            </tr>
            {/* Can add VAT calculation if needed, for now just Total */}
            <tr>
              <td className="total-label" style={{ fontSize: "14px" }}>Grand Total</td>
              <td className="total-value" style={{ fontSize: "14px" }}>
                {Number(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {details.currency}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms */}
      <div className="terms-section">
        <div className="terms-col">
          <div className="term-row">
            <div className="term-label">Payment Terms:</div>
            <div>{details.paymentTerms}</div>
          </div>
          <div className="term-row">
            <div className="term-label">Delivery Terms:</div>
            <div>{details.deliveryTerms}</div>
          </div>
          <div className="term-row">
            <div className="term-label">Delivery:</div>
            <div>{details.delivery}</div>
          </div>
        </div>
        <div className="terms-col">
          <div className="term-row">
            <div className="term-label">Remark:</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{details.remark}</div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="sig-box">
          Confirmed by Customer<br /><br /><br /><br />
          __________________________<br />
          Date: ______/______/______
        </div>
        <div className="sig-box">
          Authorized Signature<br /><br /><br /><br />
          __________________________<br />
          {details.salesPerson || "Sales Person"}
        </div>
      </div>
    </div>
  )
}
