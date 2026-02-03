import{a as y,j as e}from"./index-BHXMZ0-J.js";function N({order:o}){const t=o||{},s=Array.isArray(t.items)?t.items:[],c=String(t.supplier??t.supplier_name??t.supplierName??""),x=String(t.recipient??t.recipient_name??t.recipientName??""),d=t.supplierDate??t.supplier_date??"",a=t.recipientDate??t.recipient_date??"",n=s.reduce((l,i)=>{const r=Number((i==null?void 0:i.qty)??(i==null?void 0:i.item_quantity)??0);return l+(Number.isFinite(r)?r:0)},0),h=(()=>{if(s.length)return n?String(n):"";const l=Number(t.totalQuantity??t.quantity??0);return l?String(l):""})(),b=t.start?new Date(t.start).toLocaleDateString():"",p=t.completedDate?new Date(t.completedDate).toLocaleDateString():"",m=d?new Date(d).toLocaleDateString():"",j=a?new Date(a).toLocaleDateString():"",g=Math.max(14-s.length,0);return y.useEffect(()=>{const l=document.createElement("style");return l.innerHTML=`
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
    `,document.head.appendChild(l),()=>document.head.removeChild(l)},[]),e.jsxs("div",{className:"job-order-container",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"header-section",children:[e.jsxs("div",{className:"logo-box",children:[e.jsx("div",{className:"eit-box",children:"EIT"}),e.jsx("div",{className:"logo-text",children:"Lasertechnik"})]}),e.jsxs("div",{className:"title-section",children:[e.jsx("div",{className:"main-title",children:"JOB ORDER"}),e.jsx("div",{className:"sub-title",children:"ใบรับงาน"}),e.jsxs("div",{className:"doc-id-box",children:[e.jsx("div",{className:"doc-id-label",children:"เลขที่เอกสาร"}),e.jsx("div",{className:"doc-id-value",children:t.jobOrderCode||t.ref||""})]})]})]}),e.jsx("table",{className:"info-table",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsxs("td",{style:{width:"45%",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"ชื่อลูกค้า :"}),e.jsx("div",{className:"value-text",children:t.customer||""}),e.jsx("div",{className:"label-en",children:"Customer Name"})]}),e.jsxs("td",{style:{width:"30%",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"วันที่เริ่มทำชิ้นงาน"}),e.jsx("div",{className:"value-text",children:b}),e.jsx("div",{className:"label-en",children:"Start Date"})]}),e.jsxs("td",{style:{width:"25%"},children:[e.jsx("div",{className:"label-th",children:"จำนวนที่ส่งทำชิ้นงาน"}),e.jsx("div",{className:"value-text",children:String(t.totalQuantity??t.quantity??"")}),e.jsx("div",{className:"label-en",children:"Order Quantity"})]})]}),e.jsxs("tr",{children:[e.jsxs("td",{style:{borderTop:"2px solid black",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"สินค้าที่รับงาน"}),e.jsx("div",{className:"value-text",children:t.productNo||""}),e.jsx("div",{className:"label-en",children:"Product No."})]}),e.jsxs("td",{colSpan:2,style:{borderTop:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"วันที่ทำชิ้นงานเสร็จ"}),e.jsx("div",{className:"value-text",children:p}),e.jsx("div",{className:"label-en",children:"Completed Date"})]})]}),e.jsxs("tr",{children:[e.jsxs("td",{style:{borderTop:"2px solid black",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"ผู้รับผิดชอบ"}),e.jsx("div",{className:"label-en",style:{marginBottom:"5px"},children:"Responsible"}),e.jsxs("div",{style:{display:"flex",gap:"10px"},children:[e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"label-th",children:"ฝ่ายขาย"}),e.jsx("div",{children:t.responsibleSales||""}),e.jsx("div",{className:"dotted-line",style:{width:"100%"}})]}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"label-th",children:"ฝ่ายผลิต"}),e.jsx("div",{children:t.responsibleProduction||""}),e.jsx("div",{className:"dotted-line",style:{width:"100%"}})]})]})]}),e.jsxs("td",{colSpan:2,style:{borderTop:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"ระยะเวลาที่ใช้"}),e.jsx("div",{className:"value-text",children:t.productionTime||""}),e.jsx("div",{className:"label-en",children:"Time of Production"})]})]})]})}),e.jsxs("table",{className:"items-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsxs("th",{style:{width:"15%",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"รหัสสินค้า"}),e.jsx("div",{className:"label-en",children:"Item Code"})]}),e.jsxs("th",{style:{width:"55%",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"รายละเอียด"}),e.jsx("div",{className:"label-en",children:"Description"})]}),e.jsxs("th",{style:{width:"15%",borderRight:"2px solid black"},children:[e.jsx("div",{className:"label-th",children:"จำนวน"}),e.jsx("div",{className:"label-en",children:"Quantity"})]}),e.jsxs("th",{style:{width:"15%"},children:[e.jsx("div",{className:"label-th",children:"หน่วยนับ"}),e.jsx("div",{className:"label-en",children:"Unit"})]})]})}),e.jsxs("tbody",{children:[s.map((l,i)=>e.jsxs("tr",{children:[e.jsx("td",{style:{borderRight:"2px solid black"},children:String(l.itemCode||l.item||"")}),e.jsx("td",{style:{borderRight:"2px solid black"},children:String(l.description||l.item_description||"")}),e.jsx("td",{style:{borderRight:"2px solid black",textAlign:"center"},children:String(l.qty??l.item_quantity??"")}),e.jsx("td",{style:{textAlign:"center"},children:String(l.unit||l.item_unit||"")})]},i)),Array.from({length:g}).map((l,i)=>e.jsxs("tr",{children:[e.jsx("td",{style:{borderRight:"2px solid black",height:"28px"},children:" "}),e.jsx("td",{style:{borderRight:"2px solid black"},children:" "}),e.jsx("td",{style:{borderRight:"2px solid black"},children:" "}),e.jsx("td",{children:" "})]},`empty-${i}`))]})]}),e.jsx("table",{className:"footer-table",children:e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsxs("td",{style:{width:"50%",borderRight:"2px solid black",padding:"15px"},children:[e.jsxs("div",{style:{marginBottom:"15px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:"10px"},children:[e.jsx("span",{className:"label-th",style:{width:"60px"},children:"ผู้ส่งมอบ"}),e.jsx("div",{style:{flex:1,borderBottom:"1px dotted black",minHeight:"20px"},children:c})]}),e.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:"10px",marginTop:"5px"},children:[e.jsx("span",{className:"label-th",style:{width:"60px"},children:"วันที่"}),e.jsx("div",{style:{width:"120px",borderBottom:"1px dotted black",minHeight:"20px"},children:m})]})]}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:"10px"},children:[e.jsx("span",{className:"label-th",style:{width:"60px"},children:"ผู้รับงาน"}),e.jsx("div",{style:{flex:1,borderBottom:"1px dotted black",minHeight:"20px"},children:x})]}),e.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:"10px",marginTop:"5px"},children:[e.jsx("span",{className:"label-th",style:{width:"60px"},children:"วันที่"}),e.jsx("div",{style:{width:"120px",borderBottom:"1px dotted black",minHeight:"20px"},children:j})]})]})]}),e.jsx("td",{style:{width:"50%",padding:"15px",verticalAlign:"middle"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{className:"label-th",children:"รวมชิ้นงานทั้งหมด"}),e.jsx("div",{className:"label-en",children:"Total Quantity"})]}),e.jsx("div",{style:{textAlign:"center"},children:e.jsx("div",{style:{borderBottom:"1px solid black",minWidth:"100px",fontSize:"16px",fontWeight:"bold"},children:h})}),e.jsxs("div",{style:{textAlign:"right"},children:[e.jsx("div",{className:"label-th",children:"รายการ"}),e.jsx("div",{className:"label-en",children:"Unit"})]})]})})]})})})]})}export{N as J};
