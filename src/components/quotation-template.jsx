import React from "react"
import { API_BASE_URL } from "../config"

export function QuotationTemplate({ data }) {
  const d = data || {}
  const details = d.details || {}
  const customer = d.customer || {}
  const items = Array.isArray(d.items) ? d.items : []
  // Calculate total if not provided
  const total = d.totals?.total || items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  
  // Ensure minimum rows
  const MIN_ROWS = 5
  const emptyRowsCount = Math.max(MIN_ROWS - items.length, 0)

  // Format currency
  const fmt = (n) => n?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  // Date formatter (Thai Year)
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear() + 543 // Thai year
    return `${day}/${month}/${year}`
  }

  return (
    <div className="quotation-container">
       {/* CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
        
        @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; -webkit-print-color-adjust: exact; }
            body * { visibility: hidden; }
            .quotation-container, .quotation-container * { visibility: visible; }
            .quotation-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                box-shadow: none;
                min-height: auto;
                padding: 10mm;
            }
            .no-print { display: none !important; }
        }

        .quotation-container {
          font-family: 'Sarabun', sans-serif;
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: white;
          padding: 10mm 15mm;
          box-sizing: border-box;
          font-size: 11px;
          line-height: 1.4;
          color: #334155;
          position: relative;
          box-shadow: 0 0 20px rgba(0,0,0,0.05);
          border-top: 8px solid #2D4485;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 15px;
        }
        .header-left {
            width: 60%;
        }
        .header-logo {
            height: 50px;
            margin-bottom: 8px;
            object-fit: contain;
        }
        .company-name {
            font-weight: 700;
            font-size: 14px;
            color: #2D4485;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .company-address {
            font-size: 10px;
            color: #64748b;
            line-height: 1.4;
        }
        .header-right {
            position: absolute;
            top: 0;
            right: 0;
            text-align: right;
        }
        .header-right-img {
            height: 70px;
            object-fit: contain;
            opacity: 0.9;
        }

        /* Tax ID */
        .tax-id-row {
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 11px;
            color: #2D4485;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }

        /* Customer Info Grid */
        .info-grid {
            display: flex;
            gap: 30px;
            margin-bottom: 25px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .info-col {
            flex: 1;
        }
        .info-row {
            display: flex;
            margin-bottom: 4px;
            align-items: baseline;
        }
        .label {
            font-weight: 600;
            width: 70px;
            flex-shrink: 0;
            color: #475569;
        }
        .value {
            flex: 1;
            color: #1e293b;
            font-weight: 500;
        }
        .info-title {
            font-weight: 700;
            margin-bottom: 8px;
            color: #2D4485;
            font-size: 12px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2px;
            display: inline-block;
        }

        /* Title */
        .doc-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0 0 15px 0;
        }
        .doc-title {
            font-size: 20px;
            font-weight: 800;
            color: #2D4485;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .page-num {
            font-size: 10px;
            color: #94a3b8;
        }

        /* Table */
        .q-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 20px;
        }
        .q-table th {
            background-color: #2D4485;
            color: white;
            padding: 10px 8px;
            text-align: center;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
        }
        .q-table th:first-child { border-top-left-radius: 6px; }
        .q-table th:last-child { border-top-right-radius: 6px; }
        
        .q-table td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
            vertical-align: top;
            font-size: 11px;
            color: #334155;
        }
        .q-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .q-table tr:last-child td {
            border-bottom: 2px solid #2D4485;
        }
        
        /* Columns */
        .col-item { width: 40px; text-align: center; font-weight: 600; color: #64748b; }
        .col-model { width: 12%; color: #475569; }
        .col-desc { } 
        .col-price { width: 13%; text-align: right; font-weight: 500; }
        .col-qty { width: 8%; text-align: center; font-weight: 600; }
        .col-total { width: 13%; text-align: right; font-weight: 700; color: #2D4485; }

        /* Description Cell Layout */
        .desc-cell-content {
            display: flex;
            justify-content: space-between;
            gap: 15px;
        }
        .desc-text {
            flex: 1;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        .desc-image {
            width: 120px;
            max-width: 40%;
            height: auto;
            object-fit: contain;
            border-radius: 4px;
            border: 1px solid #f1f5f9;
            padding: 2px;
        }

        /* Terms Row Styling */
        .terms-row td {
            border: none !important;
            padding: 20px 0 !important;
            background: transparent !important;
        }
        .terms-content {
            font-size: 10px;
            line-height: 1.5;
            background: #fff;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            color: #475569;
        }
        .terms-content p {
            margin: 0 0 4px 0;
        }
        .red-text { color: #dc2626; font-weight: 700; }

        /* Footer */
        .footer-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: 10px;
            font-weight: 700;
            font-size: 13px;
            color: #1e293b;
        }
        .vat-text {
            margin-right: 20px;
            color: #64748b;
            font-weight: 500;
            font-size: 11px;
        }
        .total-block {
            display: flex;
            justify-content: space-between;
            background: #2D4485;
            color: white;
            padding: 8px 20px;
            border-radius: 4px;
            min-width: 200px;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            text-align: center;
            padding: 0 10px;
        }
        .sig-block {
            width: 30%;
        }
        .sig-line {
            border-bottom: 1px solid #cbd5e1;
            height: 1px;
            margin-bottom: 8px;
            margin-top: 40px;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }
        .sig-text {
            color: #64748b;
            font-size: 11px;
        }
      `}</style>

      {/* Header Content */}
      <div className="header">
        <div className="header-left">
            <img src="/EIT header.png" alt="Logo" className="header-logo" />
            <div className="company-name">EIT LASERTECHNIK CO.,LTD (HEAD OFFICE)</div>
            <div className="company-address">
                1/120 Soi Ramkhamhaeng 184, Minburi, Minburi<br/>
                Bangkok 10510<br/>
                Tel : 02-052-9544 Fax : 02-052-9544 Tax ID : 0105560138141
            </div>
        </div>
        <div className="header-right">
             <img src="/Einstein header.png" alt="" className="header-right-img" onError={(e) => e.target.style.display = 'none'} />
        </div>
      </div>

      <div className="tax-id-row">
        เลขประจำตัวผู้เสียภาษีอากร 0205545007251
      </div>

      {/* Customer Info */}
      <div className="info-grid">
        <div className="info-col">
            <div className="info-title">SOLD TO</div>
            <div className="info-row"><span className="label">Customer :</span><span className="value">{customer.company}</span></div>
            <div className="info-row"><span className="label">Address :</span><span className="value">{customer.address}</span></div>
            <div className="info-row" style={{marginTop: '5px'}}><span className="label">Attn :</span><span className="value">{customer.attn}</span></div>
            <div className="info-row"><span className="label">Div :</span><span className="value">{customer.div}</span></div>
            <div className="info-row"><span className="label">From :</span><span className="value">{details.salesPerson || "Khun Rawiwan"}</span><span className="label" style={{width:'auto', marginLeft:'10px'}}>Mobile :</span><span className="value">{details.eitMobile || "063-936-1542"}</span></div>
        </div>
        <div className="info-col">
            <div className="info-row"><span className="label">DATE :</span><span className="value">{formatDate(details.date)}</span></div>
            <div className="info-row"><span className="label">Tel :</span><span className="value">{customer.telephone}</span></div>
            <div className="info-row"><span className="label">Fax :</span><span className="value">{customer.fax}</span></div>
            <div className="info-row" style={{marginTop: '25px'}}><span className="label">Mobile :</span><span className="value">{customer.mobile}</span></div>
            <div className="info-row"><span className="label">Email :</span><span className="value">{customer.email}</span></div>
            <div className="info-row"><span className="label">Tel :</span><span className="value">{details.eitTelephone || "02-052-9544"} <span style={{marginLeft:'5px', fontWeight:'bold'}}>Fax :</span> {details.eitFax || "02-052-9544"}</span></div>
        </div>
      </div>

      <div className="doc-title-row">
        <div className="doc-title">QUOTATION No. : {details.number}</div>
        <div className="page-num">Page 1/2</div>
      </div>

      {/* Items Table */}
      <table className="q-table">
        <thead>
            <tr>
                <th className="col-item">ITEM</th>
                <th className="col-model">MODEL</th>
                <th className="col-desc">DESCRIPTION</th>
                <th className="col-price">PRICE</th>
                <th className="col-qty">QTY/SET</th>
                <th className="col-total">TOTAL (BAHT)</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, i) => (
                <tr key={i}>
                    <td className="col-item" style={{verticalAlign: 'top'}}>{i + 1}</td>
                    {item.type === 'specific' ? (
                        <td colSpan={5} className="col-desc" style={{padding: '10px 8px'}}>
                           <div style={{whiteSpace: 'pre-wrap', paddingLeft: '8px'}}>{item.description}</div>
                        </td>
                    ) : (
                        <>
                    <td className="col-model">{item.model}</td>
                    <td className="col-desc">
                        <div className="desc-cell-content">
                            <div className="desc-text">
                                <strong style={{display: 'block', marginBottom: '4px'}}>{item.item}</strong>
                                <div style={{whiteSpace: 'pre-wrap'}}>{item.description}</div>
                            </div>
                                {item.image && (
                                <img 
                                    // Comment: Normalize backslashes and ensure /media prefix for server-hosted images
                                    src={(item.image || "").startsWith('http')
                                        ? item.image
                                        : `${API_BASE_URL}/media/${String(item.image || "").replace(/\\/g, '/').replace(/^\/?media\/?/, '')}`
                                    } 
                                    alt="Item" 
                                    className="desc-image" 
                                />
                            )}
                        </div>
                    </td>
                    <td className="col-price">{fmt(Number(item.price))}</td>
                    <td className="col-qty">{item.qty}</td>
                    <td className="col-total">{fmt(Number(item.price) * Number(item.qty))}</td>
                        </>
                    )}
                </tr>
            ))}
            
            {/* Empty Rows */}
            {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`}>
                    <td className="col-item">&nbsp;</td>
                    <td className="col-model"></td>
                    <td className="col-desc"></td>
                    <td className="col-price"></td>
                    <td className="col-qty"></td>
                    <td className="col-total"></td>
                </tr>
            ))}

            {/* Terms as a Row (Item 3 in screenshot style) */}
            <tr className="terms-row">
                <td className="col-item" style={{verticalAlign: 'top'}}></td>
                <td className="col-model"></td>
                <td className="col-desc" colSpan={4}>
                    <div className="terms-content">
                        <strong>เงื่อนไขการรับประกันสินค้า</strong>
                        <p>3.1 บริษัทฯ <span className="red-text">รับประกันสินค้าในระยะเวลา 2 ปี</span> นับจากวันที่ส่งมอบสินค้า</p>
                        <p>3.2 บริษัทฯ จะรับผิดชอบต่อความชำรุดบกพร่อง อันเนื่องมาจากการผลิตของโรงงาน</p>
                        <p>3.3 หากเกินระยะเวลาการรับประกันเครื่องจักร ทางบริษัทฯจะคิดเงินค่าอะไหล่ที่เสียหาย และค่าบริการ</p>
                        <p>3.4 ไม่รับประกัน อาการเสียหายหรือความเสียหายหรือการทำงานที่ผิดปกติอันเนื่องมาจากภัยธรรมชาติ เช่น ไฟไหม้ น้ำท่วม แผ่นดินไหว หรือเนื่องจากการใช้ไฟฟ้าผิดไปจากที่บริษัทฯ กำหนด</p>
                        <p>3.5 ไม่รับประกัน ความเสียหายอันเนื่องมาจากอุบัติเหตุ การใช้งานผิดวิธี การซ่อมบำรุง การติดตั้ง การปรับหรือการดัดแปลงที่ไม่เหมาะสม หรือความประมาทเลินเล่อ</p>
                        <p>3.6 ไม่รับประกัน สินค้าซึ่งถูกถอดชิ้นส่วนหรือได้รับการซ่อมแซมจากพนักงานใดๆที่ไม่ใช่พนักงานจาก บริษัทฯ</p>
                        <p>3.7 ไม่รับประกัน หมายเลขเครื่องถูกลบ ขีดฆ่า แก้ไขหรือทำลายและใบรับประกันเครื่องถูกแก้ไขหรือลบทั้งไม่ว่ากรณีใดๆ</p>
                        <p>3.8 ยกเว้นการรับประกันระบบไฟฟ้า และสาเหตุเนื่องจากไฟฟ้ารัดวงจร</p>
                    </div>
                </td>
            </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="footer-row">
        <div className="vat-text">ราคานี้ยังไม่รวม VAT 7%</div>
        <div className="total-block">
            <span>TOTAL</span>
            <span>{fmt(total)}</span>
        </div>
      </div>

      {/* Signature */}
      <div className="signature-section">
            <div className="sig-block">
                <div className="sig-line"></div>
                <div className="sig-text">ผู้รับของ / Received By</div>
            </div>
            <div className="sig-block">
                <div className="sig-line"></div>
                <div className="sig-text">ผู้จัดทำ / Issued By</div>
            </div>
            <div className="sig-block">
                <div className="sig-line"></div>
                <div className="sig-text">ผู้อนุมัติ / Authorized By</div>
            </div>
      </div>

    </div>
  )
}
