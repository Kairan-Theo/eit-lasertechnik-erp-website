from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io
import os
from datetime import datetime

# Define BASE_DIR
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Font Configuration
FONT_PATH = os.path.join(BASE_DIR, 'Prompt-Regular.ttf')
FONT_BOLD_PATH = os.path.join(BASE_DIR, 'Prompt-Bold.ttf')
SYSTEM_FONT_PATH = r'C:\Windows\Fonts\tahoma.ttf'
SYSTEM_FONT_BOLD_PATH = r'C:\Windows\Fonts\tahomabd.ttf'

# Calisto MT Paths
CALISTO_PATH = r'C:\Windows\Fonts\CALIST.TTF'
CALISTO_BOLD_PATH = r'C:\Windows\Fonts\CALISTB.TTF'
CALISTO_ITALIC_PATH = r'C:\Windows\Fonts\CALISTI.TTF'
CALISTO_BOLD_ITALIC_PATH = r'C:\Windows\Fonts\CALISTBI.TTF'

font_name = "Helvetica"
font_name_bold = "Helvetica-Bold"
font_name_eng = "Helvetica"
font_name_eng_bold = "Helvetica-Bold"

# Try to register Thai font (Prompt or Tahoma)
try:
    if os.path.exists(FONT_PATH) and os.path.exists(FONT_BOLD_PATH):
        pdfmetrics.registerFont(TTFont('Prompt', FONT_PATH))
        pdfmetrics.registerFont(TTFont('Prompt-Bold', FONT_BOLD_PATH))
        registerFontFamily('Prompt', normal='Prompt', bold='Prompt-Bold', italic='Prompt', boldItalic='Prompt-Bold')
        font_name = "Prompt"
        font_name_bold = "Prompt-Bold"
    elif os.path.exists(SYSTEM_FONT_PATH) and os.path.exists(SYSTEM_FONT_BOLD_PATH):
        # Fallback to System Tahoma
        pdfmetrics.registerFont(TTFont('Tahoma', SYSTEM_FONT_PATH))
        pdfmetrics.registerFont(TTFont('Tahoma-Bold', SYSTEM_FONT_BOLD_PATH))
        registerFontFamily('Tahoma', normal='Tahoma', bold='Tahoma-Bold', italic='Tahoma', boldItalic='Tahoma-Bold')
        font_name = "Tahoma"
        font_name_bold = "Tahoma-Bold"
    else:
        print("No Thai compatible fonts found. Using Helvetica.")
except Exception as e:
    print(f"Could not register Thai font: {e}")

# Try to register Calisto MT (for English headers/labels)
try:
    if os.path.exists(CALISTO_PATH):
        pdfmetrics.registerFont(TTFont('CalistoMT', CALISTO_PATH))
        pdfmetrics.registerFont(TTFont('CalistoMT-Bold', CALISTO_BOLD_PATH))
        pdfmetrics.registerFont(TTFont('CalistoMT-Italic', CALISTO_ITALIC_PATH))
        pdfmetrics.registerFont(TTFont('CalistoMT-BoldItalic', CALISTO_BOLD_ITALIC_PATH))
        registerFontFamily('CalistoMT', normal='CalistoMT', bold='CalistoMT-Bold', italic='CalistoMT-Italic', boldItalic='CalistoMT-BoldItalic')
        font_name_eng = "CalistoMT"
        font_name_eng_bold = "CalistoMT-Bold"
    else:
        # Fallback to Thai font if Calisto not found, or Helvetica
        font_name_eng = font_name
        font_name_eng_bold = font_name_bold
except Exception as e:
    print(f"Could not register Calisto MT: {e}")

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_quotation_pdf(request):
    data = request.data
    details = data.get('details', {})
    customer = data.get('customer', {})
    items = data.get('items', [])
    totals = data.get('totals', {})
    
    # Create a file-like buffer to receive PDF data.
    buffer = io.BytesIO()
    
    # Create the PDF object, using the buffer as its "file."
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    # Normal_Content: Used for mixed content (Thai + English). Base font should be Thai-compatible.
    styles.add(ParagraphStyle(name='Normal_Small', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Normal_Content', parent=styles['Normal'], fontName=font_name, fontSize=10))
    styles.add(ParagraphStyle(name='Normal_Bold', parent=styles['Normal'], fontName=font_name_bold, fontSize=10))
    
    # Styles using Calisto MT (English Design)
    styles.add(ParagraphStyle(name='Header_Title', parent=styles['Heading1'], fontName=font_name_eng_bold, fontSize=16, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Table_Header', parent=styles['Normal'], fontName=font_name_eng_bold, fontSize=9, alignment=TA_CENTER))
    
    # Data styles (Keep Thai font for safety)
    styles.add(ParagraphStyle(name='Table_Data', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Table_Data_Right', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='Table_Data_Center', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_CENTER))

    # --- Header ---
    # Try to load logo
    organization = details.get('salesPerson', '')
    if "EINSTEIN" in str(organization).upper():
        logo_path = r'd:\EIT_ERT_s\eit-lasertechnik-erp-website\public\Einstein header.png'
    else:
        logo_path = r'd:\EIT_ERT_s\eit-lasertechnik-erp-website\public\EIT header.png'

    if os.path.exists(logo_path):
        # Adjust width/height as needed. A4 width is ~595 points.
        im = Image(logo_path, width=530, height=80) 
        im.hAlign = 'CENTER'
        elements.append(im)
    else:
        # Fallback text header
        header_text = organization if organization else "EIT LASERTECHNIK CO.,LTD"
        elements.append(Paragraph(header_text, styles['Header_Title']))
    
    elements.append(Spacer(1, 10))

    # --- Customer & Info Section ---
    # Helper to clean text
    def txt(val): 
        if not val: return "-"
        return str(val).replace('\n', '<br/>')

    # Helper to format label with Calisto font
    def label(text):
        return f"<font name='{font_name_eng_bold}'>{text}</font>"

    # Tax ID at top left (Tax ID label has Thai, so we use mixed font approach or keep Thai font for Thai part)
    # "เลขประจำตัวผู้เสียภาษี (Tax ID):" - We should use Thai font for Thai part, Calisto for English? 
    # Simpler to keep base font (Thai) and only bold it.
    elements.append(Paragraph(f"<b>เลขประจำตัวผู้เสียภาษี :</b> {txt(customer.get('taxId'))}", styles['Normal_Content']))
    elements.append(Spacer(1, 5))

    cust_info = [
        [Paragraph(label("SOLD TO"), styles['Normal_Content']), "", Paragraph(f"{label('DATE :')} {txt(details.get('date'))}", styles['Normal_Content'])],
        [Paragraph(f"{label('Company:')} {txt(customer.get('company'))}", styles['Normal_Content']), "", Paragraph(f"{label('Tel :')} {txt(customer.get('telephone'))}", styles['Normal_Content'])],
        [Paragraph(f"{label('Address :')} {txt(customer.get('address'))}", styles['Normal_Content']), "", Paragraph(f"{label('Fax :')} {txt(customer.get('fax'))}", styles['Normal_Content'])],
        [Paragraph(f"{label('Attn:')} {txt(customer.get('attn'))}", styles['Normal_Content']), "", Paragraph(f"{label('Mobile :')} {txt(customer.get('mobile'))}", styles['Normal_Content'])],
        [Paragraph(f"{label('Div:')} {txt(customer.get('div'))}", styles['Normal_Content']), "", ""]
    ]
    
    info_table = Table(cust_info, colWidths=[300, 10, 220])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(info_table)
    
    # From Section Table (Separate to match layout)
    from_data = [[
        Paragraph(f"{label('From :')} {txt(details.get('salesPerson'))}", styles['Normal_Content']),
        Paragraph(f"{label('Mobile:')} {txt(details.get('eitMobile'))}", styles['Normal_Content']),
        Paragraph(f"{label('Tel :')} {txt(details.get('eitTelephone'))}   {label('Fax:')} {txt(details.get('eitFax'))}", styles['Normal_Content'])
    ]]
    
    from_table = Table(from_data, colWidths=[200, 130, 200])
    from_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'LEFT'), # Mobile aligns left/center
        ('ALIGN', (2,0), (2,0), 'RIGHT'), # Tel/Fax aligns right
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(from_table)
    elements.append(Spacer(1, 10))

    # Quotation Title (Centered above table)
    # Changed: Added "EIT QUO" prefix and using Calisto MT Bold (Header_Title)
    qt_number = details.get('number', '')
    elements.append(Paragraph(f"QUOTATION No. : EIT QUO {qt_number}", styles['Header_Title']))
    elements.append(Spacer(1, 5))

    # --- Items Table ---
    # Headers - Using Table_Header which uses Calisto MT Bold
    table_data = [[
        Paragraph("ITEM", styles['Table_Header']),
        Paragraph("MODEL", styles['Table_Header']),
        Paragraph("DESCRIPTION", styles['Table_Header']),
        Paragraph("PRICE", styles['Table_Header']),
        Paragraph("QTY", styles['Table_Header']),
        Paragraph("TOTAL (BAHT)", styles['Table_Header'])
    ]]
    
    # Rows
    total_amount = 0
    for i, item in enumerate(items):
        try:
            qty = float(str(item.get('qty', 0)).replace(',', ''))
            price = float(str(item.get('price', 0)).replace(',', ''))
        except:
            qty = 0
            price = 0
            
        line_total = qty * price
        total_amount += line_total
        
        row = [
            Paragraph(str(i + 1), styles['Table_Data_Center']),
            Paragraph(txt(item.get('model')), styles['Table_Data']),
            Paragraph(txt(item.get('description')), styles['Table_Data']),
            Paragraph(f"{price:,.2f}", styles['Table_Data_Right']),
            Paragraph(f"{qty:,.0f}", styles['Table_Data_Center']),
            Paragraph(f"{line_total:,.2f}", styles['Table_Data_Right']),
        ]
        table_data.append(row)
        
    # Minimum rows to fill the page
    min_rows = 10 
    current_rows = len(items)
    if current_rows < min_rows:
        for _ in range(min_rows - current_rows):
            table_data.append(["", "", "", "", "", ""])

    # Table Style
    item_table = Table(table_data, colWidths=[35, 90, 205, 75, 40, 90])
    item_table.setStyle(TableStyle([
        # Header Style
        ('BACKGROUND', (0,0), (-1,0), colors.lavender),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        # Font for header is handled by Paragraph style, but we can set default for safety
        ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
        
        # Borders
        ('BOX', (0,0), (-1,-1), 1, colors.black), # Outer border for whole table
        
        # Vertical lines (between columns)
        ('LINEBEFORE', (1,0), (-1,-1), 1, colors.black),
        
        # Horizontal line below header only
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
        
        # Content Style
        ('VALIGN', (0,1), (-1,-1), 'TOP'), # Data rows top aligned
        ('ALIGN', (0,1), (-1,-1), 'CENTER'), # Default center (Item, Model, Qty)
        ('ALIGN', (2,1), (2,-1), 'LEFT'), # Description left
        ('ALIGN', (3,1), (3,-1), 'RIGHT'), # Price right
        ('ALIGN', (5,1), (5,-1), 'RIGHT'), # Total right
        
        # Padding
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    elements.append(item_table)
    
    # --- Totals ---
    # Total, VAT, Grand Total
    vat_amount = total_amount * 0.07
    grand_total = total_amount + vat_amount
    
    # Revised Total Data using Paragraphs to support Thai and Font Mixing
    # "ราคานี้ยังไม่รวม VAT 7%" needs Thai font (Normal_Small/Normal_Content)
    # "TOTAL", "VAT 7%" needs Calisto (English)
    # Values need Calisto or Thai (Numbers are fine in both)
    
    # Style for Total Labels (Calisto)
    total_label_style = ParagraphStyle(name='Total_Label', parent=styles['Normal'], fontName=font_name_eng, fontSize=10, alignment=TA_RIGHT)
    # Style for Values (Thai safe or Calisto if numbers only, but let's use Table_Data_Right for consistency)
    
    total_data = [
        [Paragraph("ราคานี้ยังไม่รวม VAT 7%", styles['Normal_Small']), Paragraph("TOTAL", total_label_style), Paragraph(f"{total_amount:,.2f}", styles['Table_Data_Right'])],
        ["", Paragraph("VAT 7%", total_label_style), Paragraph(f"{vat_amount:,.2f}", styles['Table_Data_Right'])],
        [Paragraph(f"<font name='{font_name_eng_bold}'>GRAND TOTAL</font>              (ศูนย์บาทถ้วน)", styles['Normal_Bold']), "", Paragraph(f"{grand_total:,.2f}", styles['Table_Data_Right'])] 
    ]
    
    total_table = Table(total_data, colWidths=[250, 130, 150])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'), # Note left
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        
        # Grand Total Row
        ('SPAN', (0,-1), (1,-1)), # Span first two cols for "GRAND TOTAL (Text)"
        # Background
        ('BACKGROUND', (0,-1), (-1,-1), colors.lavender), 
        
        # Lines
        # Line above Grand Total Value (below VAT)
        ('LINEABOVE', (2,-1), (2,-1), 1, colors.black),
        # Double underline under Grand Total Value
        ('LINEBELOW', (2,-1), (2,-1), 1, colors.black, None, None, None, 2, 2),
        
        # Padding
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))

    elements.append(total_table)

    elements.append(Spacer(1, 10))

    # --- Terms & Conditions ---
    # Labels in Calisto, Values in Thai-safe
    # Reduced font size to 9 (Normal_Small) for consistency and space
    # Added underline to "TERM & CONDITIONS"
    
    # Helper for Term Labels (Calisto Bold, Small)
    def term_label(text):
        return f"<font name='{font_name_eng_bold}' size='9'>{text}</font>"

    terms_data = [
        [Paragraph(f"<u><b>{label('TERM & CONDITIONS')}</b></u>", styles['Normal_Content']), ""],
        [Paragraph(term_label("TRADE TERMS"), styles['Normal_Small']), Paragraph(f": {txt(details.get('tradeTerms'))}", styles['Normal_Small'])],
        [Paragraph(term_label("VALIDITY"), styles['Normal_Small']), Paragraph(f": {txt(details.get('validity'))}", styles['Normal_Small'])],
        [Paragraph(term_label("DELIVERY"), styles['Normal_Small']), Paragraph(f": {txt(details.get('delivery'))}", styles['Normal_Small'])],
        [Paragraph(term_label("PAYMENT TERM"), styles['Normal_Small']), Paragraph(f": {txt(details.get('paymentTerms'))}", styles['Normal_Small'])],
        [Paragraph(term_label("SHIPMENT"), styles['Normal_Small']), Paragraph(f": {txt(details.get('shipmentLocation'))}", styles['Normal_Small'])],
        [Paragraph(term_label("INVOICE DATE"), styles['Normal_Small']), Paragraph(f": {txt(details.get('invoiceDate'))}", styles['Normal_Small'])],
        [Paragraph(term_label("REMARK"), styles['Normal_Small']), Paragraph(f": {txt(details.get('remark'))}", styles['Normal_Small'])],
    ]
    
    terms_table = Table(terms_data, colWidths=[130, 400])
    terms_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3), 
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    elements.append(terms_table)
    elements.append(Spacer(1, 10))

    # --- Signatures ---
    # Headers in Calisto Bold
    sig_data = [
        [Paragraph("RECEIVED", styles['Table_Header']), Paragraph("ISSUED BY", styles['Table_Header']), Paragraph("AUTHORIZED BY", styles['Table_Header'])],
        ["", "", ""],
        ["(......................................................)", "(......................................................)", "(......................................................)"]
    ]
    
    # rowHeights should match number of rows: [Header, Space, DottedLine]
    sig_table = Table(sig_data, colWidths=[170, 170, 170], rowHeights=[None, 60, None])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    elements.append(sig_table)

    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')
