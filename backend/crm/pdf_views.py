from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io
import os
from datetime import datetime

# Define BASE_DIR
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, '..', 'public')

# Font Configuration
FONT_PATH = os.path.join(BASE_DIR, 'Prompt-Regular.ttf')
FONT_BOLD_PATH = os.path.join(BASE_DIR, 'Prompt-Bold.ttf')
TAHOMA_PATH = os.path.join(BASE_DIR, 'tahoma.ttf')
TAHOMA_BOLD_PATH = os.path.join(BASE_DIR, 'tahomabd.ttf')
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
    elif os.path.exists(TAHOMA_PATH) and os.path.exists(TAHOMA_BOLD_PATH):
        pdfmetrics.registerFont(TTFont('Tahoma', TAHOMA_PATH))
        pdfmetrics.registerFont(TTFont('Tahoma-Bold', TAHOMA_BOLD_PATH))
        registerFontFamily('Tahoma', normal='Tahoma', bold='Tahoma-Bold', italic='Tahoma', boldItalic='Tahoma-Bold')
        font_name = "Tahoma"
        font_name_bold = "Tahoma-Bold"
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

# Try to register Calisto MT (for English headers/labels) - DISABLED IN FAVOR OF TIMES NEW ROMAN
# try:
#     if os.path.exists(CALISTO_PATH):
#         pdfmetrics.registerFont(TTFont('CalistoMT', CALISTO_PATH))
#         pdfmetrics.registerFont(TTFont('CalistoMT-Bold', CALISTO_BOLD_PATH))
#         pdfmetrics.registerFont(TTFont('CalistoMT-Italic', CALISTO_ITALIC_PATH))
#         pdfmetrics.registerFont(TTFont('CalistoMT-BoldItalic', CALISTO_BOLD_ITALIC_PATH))
#         registerFontFamily('CalistoMT', normal='CalistoMT', bold='CalistoMT-Bold', italic='CalistoMT-Italic', boldItalic='CalistoMT-BoldItalic')
#         font_name_eng = "CalistoMT"
#         font_name_eng_bold = "CalistoMT-Bold"
#     else:
#         # Fallback to Thai font if Calisto not found, or Helvetica
#         font_name_eng = font_name
#         font_name_eng_bold = font_name_bold
# except Exception as e:
#     print(f"Could not register Calisto MT: {e}")

# Use Times New Roman for English Headers/Design
font_name_eng = "Times-Roman"
font_name_eng_bold = "Times-Bold"

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
    
    # Styles using Calisto MT (English Design) - Now Times New Roman
    # Reduced Header Title size from 16 to 14 to be less "bold"
    styles.add(ParagraphStyle(name='Header_Title', parent=styles['Heading1'], fontName=font_name_eng_bold, fontSize=14, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Table_Header', parent=styles['Normal'], fontName=font_name_eng_bold, fontSize=9, alignment=TA_CENTER))
    
    # Data styles (Keep Thai font for safety)
    styles.add(ParagraphStyle(name='Table_Data', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Table_Data_Right', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='Table_Data_Center', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_CENTER))

    # --- Header ---
    # Try to load logo - Updated to use robust path discovery like Billing Note
    organization = details.get('salesPerson', '')

    # Define potential roots to search for public/dist folders
    # 1. Windows Host Sibling: .../backend/../public
    # 2. Docker Mounted Child: /app/public
    # 3. Hardcoded Windows Fallback
    potential_roots = [
        os.path.dirname(BASE_DIR),
        BASE_DIR,
        r'd:\EIT_ERT_s\eit-lasertechnik-erp-website'
    ]

    PUBLIC_DIR = None
    DIST_DIR = None
    PROJECT_ROOT = "Unknown"

    for root in potential_roots:
        p_dir = os.path.join(root, 'public')
        d_dir = os.path.join(root, 'dist')
        if os.path.exists(p_dir) and os.path.exists(d_dir):
            PUBLIC_DIR = p_dir
            DIST_DIR = d_dir
            PROJECT_ROOT = root
            break
    
    # Fallback if discovery fails
    if not PUBLIC_DIR:
         PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
         DIST_DIR = os.path.join(BASE_DIR, 'dist')

    # Logic:
    # 1. If "EINSTEIN" is in organization -> Prefer Einstein header
    # 2. Else -> Prefer EIT header
    is_einstein = "EINSTEIN" in str(organization).upper()
    
    # Define candidates based on organization
    if is_einstein:
        candidates = [
            (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80),
            (os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80)
        ]
    else:
        # Default/EIT
        candidates = [
            (os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80)
        ]

    # Try to find first existing candidate
    found_image = None
    tried_paths = []
    for path, w, h in candidates:
        # Normalize path to handle mixed slashes
        path = os.path.normpath(path)
        tried_paths.append(path)
        if os.path.exists(path):
            found_image = (path, w, h)
            break
            
    if found_image:
        path, w, h = found_image
        try:
            # Adjust width/height as needed. A4 width is ~595 points.
            im = Image(path, width=w, height=h) 
            im.hAlign = 'CENTER'
            elements.append(im)
        except Exception as e:
            msg = f"Error loading image: {str(e)}. Path: {path}"
            print(msg)
            elements.append(Paragraph(msg, styles['Normal']))
    else:
        # Debug info in PDF if image missing
        msg = f"Image not found. Org: '{organization}'. Root: {PROJECT_ROOT}. Tried: {tried_paths}"
        print(msg) 
        elements.append(Paragraph(msg, styles['Normal']))
    
    elements.append(Spacer(1, 10))

    # --- Customer & Info Section ---
    # Helper to clean text
    def txt(val): 
        if not val: return "-"
        return str(val).replace('\n', '<br/>')

    # Helper to format label with Calisto font -> Now Times New Roman
    # Updated: Enforce size='9' to reduce visual weight of bold labels
    def label(text):
        return f"<font name='{font_name_eng_bold}' size='9'>{text}</font>"

    # Tax ID at top left (Tax ID label has Thai, so we use mixed font approach or keep Thai font for Thai part)
    # "เลขประจำตัวผู้เสียภาษี (Tax ID):" - We should use Thai font for Thai part, Calisto for English? 
    # Simpler to keep base font (Thai) and only bold it.
    # Updated: Reduced size of Tax ID label part to match other labels (simulated via explicit size)
    elements.append(Paragraph(f"<font size='9'><b>เลขประจำตัวผู้เสียภาษี :</b></font> {txt(customer.get('taxId'))}", styles['Normal_Content']))
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
    # Fix: qt_number already contains "QUO", so just add "EIT" prefix to avoid "EIT QUO QUO"
    elements.append(Paragraph(f"QUOTATION No. : EIT {qt_number}", styles['Header_Title']))
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
    # Reduced min_rows from 10 to 8 to allow space for signature on same page
    min_rows = 8
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
    # Reduced spacer height from 60 to 40 to save space
    sig_table = Table(sig_data, colWidths=[170, 170, 170], rowHeights=[None, 40, None])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    
    # Use KeepTogether to ensure signature block doesn't split
    # If it still pushes to new page, we might need to reduce margins or spacing above
    elements.append(KeepTogether(sig_table))

    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_billing_note_pdf(request):
    data = request.data
    details = data.get('details', {})
    customer = data.get('customer', {})
    items = data.get('items', [])
    totals = data.get('totals', {})
    
    # Create a file-like buffer to receive PDF data.
    buffer = io.BytesIO()
    
    # Create the PDF object
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=20, 
        bottomMargin=20
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Reuse Styles
    styles.add(ParagraphStyle(name='Normal_Small', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Normal_Content', parent=styles['Normal'], fontName=font_name, fontSize=10))
    # Removed Bold for Billing Note
    styles.add(ParagraphStyle(name='Normal_Bold', parent=styles['Normal'], fontName=font_name, fontSize=10))
    
    # Header Styles
    styles.add(ParagraphStyle(name='Header_Company', parent=styles['Normal'], fontName=font_name, fontSize=12))
    styles.add(ParagraphStyle(name='Header_Address', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Header_Title_Right', parent=styles['Heading1'], fontName=font_name, fontSize=16, alignment=TA_RIGHT))
    
    # Table Styles
    styles.add(ParagraphStyle(name='Table_Header', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Table_Data', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Table_Data_Right', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='Table_Data_Center', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_CENTER))

    # Helper functions
    def txt(val): 
        if not val: return "-"
        return str(val).replace('\n', '<br/>')

    def label(text):
        # Removed Bold
        return f"<font name='{font_name_eng}'>{text}</font>"

    # --- Header Section ---
    header_logo_content = []  # Initialize list
    
    # Top: Logo/Header Image
    organization = details.get('salesPerson', '')
    
    # Define potential roots to search for public/dist folders
    # 1. Windows Host Sibling: .../backend/../public
    # 2. Docker Mounted Child: /app/public
    # 3. Hardcoded Windows Fallback
    potential_roots = [
        os.path.dirname(BASE_DIR),
        BASE_DIR,
        r'd:\EIT_ERT_s\eit-lasertechnik-erp-website'
    ]

    PUBLIC_DIR = None
    DIST_DIR = None
    PROJECT_ROOT = "Unknown"

    for root in potential_roots:
        p_dir = os.path.join(root, 'public')
        d_dir = os.path.join(root, 'dist')
        if os.path.exists(p_dir) and os.path.exists(d_dir):
            PUBLIC_DIR = p_dir
            DIST_DIR = d_dir
            PROJECT_ROOT = root
            break
    
    # Fallback if discovery fails (shouldn't happen with updated setup)
    if not PUBLIC_DIR:
         PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
         DIST_DIR = os.path.join(BASE_DIR, 'dist')

    # Logic:
    # 1. If "EINSTEIN" is in organization -> Prefer Einstein header
    # 2. Else -> Prefer EIT header
    
    is_einstein = "EINSTEIN" in str(organization).upper()
    
    # Define candidates based on organization
    # User requested: Einstein header.png and EIT header.png, NOT eit-icon.png
    if is_einstein:
        candidates = [
            (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80),
            (os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80)
        ]
    else:
        # Default/EIT
        # Prioritize EIT header.png as requested
        candidates = [
            (os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80)
        ]

    # Try to find first existing candidate
    found_image = None
    tried_paths = []
    for path, w, h in candidates:
        # Normalize path to handle mixed slashes
        path = os.path.normpath(path)
        tried_paths.append(path)
        if os.path.exists(path):
            found_image = (path, w, h)
            break
            
    if found_image:
        path, w, h = found_image
        try:
            im = Image(path, width=w, height=h)
            im.hAlign = 'CENTER'
            header_logo_content.append(im)
            header_logo_content.append(Spacer(1, 5))
        except Exception as e:
            msg = f"Error loading image: {str(e)}. Path: {path}"
            print(msg)
            header_logo_content.append(Paragraph(msg, styles['Normal']))
    else:
        # Debug info in PDF if image missing
        # Also print to console for server logs
        msg = f"Image not found. Org: '{organization}'. Root: {PROJECT_ROOT}. Tried: {tried_paths}"
        print(msg) 
        header_logo_content.append(Paragraph(msg, styles['Normal']))
 

    # --- Content Box (Big Table) ---
    # We will wrap the Header Text, Items Table, and Signature in a single Table to get the outer border.
    
    # 1. Header Text & Info
    # Left: Company Info (Thai/Eng)
    # Right: Title + No/Date Box
    
    # Company Info (Left)
    if is_einstein:
        company_name_th = "บริษัท ไอน์ชไตน์ อินดัสเตรียล เทคนิค คอร์ปอเรชั่น จำกัด"
    else:
        company_name_th = "บริษัท อีไอที เลเซอร์ เทคนิค จํากัด"

    company_info_text = [
        Paragraph(company_name_th, styles['Normal_Content']),
        Paragraph("1/120 ซอย รามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กทม 10510", styles['Header_Address']),
        Paragraph("โทร: 02-052-9544 แฟกซ์: 02-052-9544", styles['Header_Address']),
        Paragraph("ลูกค้า", styles['Normal_Bold']), # Customer Label below address
        Paragraph(txt(customer.get('company')), styles['Normal_Content']),
        Paragraph(txt(customer.get('address')), styles['Normal_Content'])
        #Paragraph(f"เลขประจำตัวผู้เสียภาษี : {txt(customer.get('taxId'))}", styles['Normal_Content'])
    ]
    
    # Title (Right)
    # "ใบวางบิล/BILLING NOTE"
    # Using mixed font: Thai in Tahoma Bold, English in Calisto Bold (if available) or Tahoma Bold
    title_text = f"ใบวางบิล/<font name='{font_name_eng}'>BILLING NOTE</font>"
    
    # No/Date Box (Right)
    bn_number = details.get('number', '')
    bn_date = details.get('date', '')
    # Convert date to Thai format if needed? Reference shows 2569.
    # Let's keep it simple for now, use provided date.
    
    no_date_data = [
        [Paragraph(f"เลขที่/<font name='{font_name_eng}'>No.</font>", styles['Normal_Content']), Paragraph(bn_number, styles['Normal_Content'])],
        [Paragraph(f"วันที่/<font name='{font_name_eng}'>DATE</font>", styles['Normal_Content']), Paragraph(bn_date, styles['Normal_Content'])]
    ]
    
    no_date_table = Table(no_date_data, colWidths=[60, 100])
    no_date_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('INNERGRID', (0,0), (-1,-1), 1, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    
    # Terms (Right, below box)
    payment_terms = details.get('paymentTerms') or "30 วัน"
    terms_para = Paragraph(f"เงื่อนไขการชำระ: {payment_terms}", styles['Normal_Content'])
    
    # Right Column Content
    right_col_content = [
        Paragraph(title_text, styles['Header_Title_Right']),
        Spacer(1, 5),
        no_date_table,
        Spacer(1, 20),
        terms_para
    ]
    
    # Main Header Layout Table
    # Col 1: Company/Customer Info (Left)
    # Col 2: Title/No-Date/Terms (Right)
    header_layout_data = [
        [company_info_text, right_col_content]
    ]
    
    header_table = Table(header_layout_data, colWidths=[330, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'), # Align right column content to right
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    
    # elements.append(header_table)
    # elements.append(Spacer(1, 10))

    # --- Items Table ---
    # Headers: No., Invoice No, Date, Due Date, Amount, Paid, Outstanding
    headers = ["No.", "เลขที่ใบกำกับ", "วันที่", "ครบกำหนด", "จำนวนเงิน", "ชำระแล้ว", "เงินคงค้าง"]
    
    table_data = [[Paragraph(h, styles['Table_Header']) for h in headers]]
    
    total_amount = 0
    total_outstanding = 0
    
    for i, item in enumerate(items):
        try:
            amount = float(str(item.get('amount', 0)).replace(',', ''))
            paid = float(str(item.get('paid', 0)).replace(',', ''))
            outstanding = amount - paid
        except:
            amount = 0
            paid = 0
            outstanding = 0
            
        total_amount += amount
        total_outstanding += outstanding # Sum of outstanding balances
        
        row = [
            Paragraph(str(i + 1), styles['Table_Data_Center']),
            Paragraph(txt(item.get('invoiceNo')), styles['Table_Data_Center']),
            Paragraph(txt(item.get('date')), styles['Table_Data_Center']),
            Paragraph(txt(item.get('dueDate')), styles['Table_Data_Center']),
            Paragraph(f"{amount:,.2f}", styles['Table_Data_Right']),
            Paragraph(f"{paid:,.2f}", styles['Table_Data_Right']),
            Paragraph(f"{outstanding:,.2f}", styles['Table_Data_Right']),
        ]
        table_data.append(row)
        
    # Minimum rows
    min_rows = 10
    current_rows = len(items)
    if current_rows < min_rows:
        for _ in range(min_rows - current_rows):
            table_data.append(["", "", "", "", "", "", ""])

    # Footer Row
    # Col 0-3: Text Amount
    # Col 4: Empty? Or Text Amount spans 0-4?
    # Col 5: Label "รวมทั้งสิ้น"
    # Col 6: Value (Total Outstanding)
    
    thai_text_total = totals.get('thaiText', '-')
    
    footer_row = [
        Paragraph(thai_text_total, styles['Normal_Content']), # Spans
        "", "", "", "",
        Paragraph("รวมทั้งสิ้น", styles['Table_Data_Right']),
        Paragraph(f"{total_outstanding:,.2f}", styles['Table_Data_Right'])
    ]
    table_data.append(footer_row)
    
    # Table Styling
    # Col widths: No(30), Inv(90), Date(70), Due(70), Amt(90), Paid(90), Out(90) -> Total 530
    item_table = Table(table_data, colWidths=[30, 90, 70, 70, 90, 90, 90])
    item_table.setStyle(TableStyle([
        # Header
        ('GRID', (0,0), (-1,0), 1, colors.black),
        # Body
        ('BOX', (0,1), (-1,-2), 1, colors.black),
        ('LINEBEFORE', (1,1), (-1,-2), 1, colors.black),
        # Footer
        ('BOX', (0,-1), (-1,-1), 1, colors.black),
        ('LINEBEFORE', (5,-1), (-1,-1), 1, colors.black),
        
        # Header Style
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
        
        # Content Style
        ('VALIGN', (0,1), (-1,-1), 'TOP'),
        
        # Footer Row Spanning
        ('SPAN', (0,-1), (4,-1)), # Span first 5 cols for text amount
        ('ALIGN', (0,-1), (4,-1), 'LEFT'), # Text amount left aligned
        
        # Footer Value
        ('ALIGN', (5,-1), (6,-1), 'RIGHT'),
        
        # Padding
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    
    # elements.append(item_table)
    # elements.append(Spacer(1, 5))
    
    # Note
    note_para = Paragraph("หมายเหตุ : แจ้งการชำระเงินได้ที่ sales@eitlaser.com", styles['Normal_Content'])
    # elements.append(note_para)
    # elements.append(Spacer(1, 20))
    
    # --- Signature Section ---
    # Left: Receiver
    # Right: Biller
    
    sig_data = [
        [
            Paragraph("ชื่อผู้รับวางบิล ......................................................", styles['Normal_Content']),
            Paragraph("ในนาม EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD.", styles['Normal_Content'])
        ],
        [
            Paragraph("วันที่รับ ................................./................./.................", styles['Normal_Content']),
            ""
        ],
        [
            Paragraph("วันที่นัดรับเช็ค ......................../................./.................", styles['Normal_Content']),
            Paragraph("ชื่อผู้วางบิล ......................................................", styles['Normal_Content'])
        ]
    ]
    
    sig_table = Table(sig_data, colWidths=[265, 265])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'LEFT'), # Right col content aligned left within cell? Reference shows "ในนาม..." aligned left of right section?
        # Actually reference shows Right section text starts aligned left.
        # "ในนาม..."
        # "ชื่อผู้วางบิล..."
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10), # Spacing between lines
    ]))
    
    # elements.append(sig_table)
    
    # --- Assemble Main Box ---
    # Move header logo outside of the main box
    if header_logo_content:
        # header_logo_content is a list [Image, Spacer] or [Paragraph]
        elements.extend(header_logo_content)
    
    main_table_data = [
        # [header_logo_content], # Removed from inside box
        [[header_table, Spacer(1, 10)]],
        [[item_table, Spacer(1, 5)]],
        [[note_para, Spacer(1, 20)]],
        [[sig_table]]
    ]
    
    main_table = Table(main_table_data, colWidths=[535])
    main_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    
    elements.append(main_table)
    
    try:
        doc.build(elements)
    except Exception as e:
        # Fallback if build fails (e.g. layout error)
        raise e
    
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_invoice_pdf(request):
    data = request.data
    details = data.get('details', {})
    customer = data.get('customer', {})
    items = data.get('items', [])
    totals = data.get('totals', {})
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=20, bottomMargin=20)
    
    elements = []
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Normal_Small', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Normal_Content', parent=styles['Normal'], fontName=font_name, fontSize=10))
    styles.add(ParagraphStyle(name='Normal_Bold', parent=styles['Normal'], fontName=font_name_bold, fontSize=10))
    # Header styles for Invoice/Original
    styles.add(ParagraphStyle(name='Header_Title_Bold', parent=styles['Heading1'], fontName=font_name_bold, fontSize=14, alignment=TA_CENTER, leading=16))
    styles.add(ParagraphStyle(name='Header_Subtitle_Bold', parent=styles['Heading1'], fontName=font_name_bold, fontSize=12, alignment=TA_CENTER))
    
    styles.add(ParagraphStyle(name='Table_Header', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Table_Data', parent=styles['Normal'], fontName=font_name, fontSize=9))
    styles.add(ParagraphStyle(name='Table_Data_Right', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='Table_Data_Center', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_CENTER))

    def txt(val): return str(val).replace('\n', '<br/>') if val else "-"
    def label(text): return f"<font name='{font_name_eng}'>{text}</font>"

    # --- Header Image ---
    # Prioritize checking 'eit' ID for reliable organization lookup
    eit_id = details.get('eit')
    organization = None
    
    if eit_id:
        try:
            from .models import EIT
            eit_obj = EIT.objects.get(pk=eit_id)
            organization = eit_obj.organization_name
        except Exception:
            pass

    # Fallback to text fields if ID lookup failed or wasn't provided
    if not organization:
        organization = details.get('onBehalfOf') or details.get('salesPerson') or 'EIT LASERTECHNIK CO.,LTD'

    is_einstein = "EINSTEIN" in str(organization).upper()
    
    potential_roots = [os.path.dirname(BASE_DIR), BASE_DIR, r'd:\EIT_ERT_s\eit-lasertechnik-erp-website']
    PUBLIC_DIR, DIST_DIR = None, None
    for root in potential_roots:
        p_dir, d_dir = os.path.join(root, 'public'), os.path.join(root, 'dist')
        if os.path.exists(p_dir) and os.path.exists(d_dir):
            PUBLIC_DIR, DIST_DIR = p_dir, d_dir
            break
    if not PUBLIC_DIR: PUBLIC_DIR, DIST_DIR = os.path.join(BASE_DIR, 'public'), os.path.join(BASE_DIR, 'dist')

    candidates = [(os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80), (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80)] if is_einstein else [(os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80), (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80)]
    
    found_image = None
    for path, w, h in candidates:
        if os.path.exists(os.path.normpath(path)):
            found_image = (os.path.normpath(path), w, h)
            break
    
    if found_image:
        try:
            im = Image(found_image[0], width=found_image[1], height=found_image[2])
            im.hAlign = 'CENTER'
            elements.append(im)
            elements.append(Spacer(1, 5))
        except: pass

    # --- Row 1: Org Info & Doc Info ---
    org_name_th = "บริษัท ไอน์สไตน์ อินดัสเตรียล เทคนิค คอร์ปอเรชั่น จำกัด" if is_einstein else "บริษัท อีไอที เลเซอร์เทคนิค จำกัด"
    org_name_en = "EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD." if is_einstein else "EIT LASERTECHNIK CO.,LTD."
    org_addr = "1/120 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510" if is_einstein else "118/20 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510"
    org_contact = "TEL : 02-052-9544    Fax : 02-052-9544" if is_einstein else "TEL : 02-xxx-xxxx    Fax : 02-xxx-xxxx"
    org_tax = "0105547001928" if is_einstein else "010555xxxxxxx"

    # Left Info: Tax ID and Head Office on the same line, separated
    tax_row_data = [
        [Paragraph(f"<b>เลขประจำตัวผู้เสียภาษีอากร :</b> {org_tax}", styles['Normal_Content']), 
         Paragraph("<b>สำนักงานใหญ่</b>", styles['Normal_Content'])]
    ]
    tax_table = Table(tax_row_data, colWidths=[230, 90])
    tax_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'), # Align bottom
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))

    left_info_content = [
        [Paragraph(org_name_th, styles['Normal_Content'])],
        [Paragraph(org_name_en, styles['Normal_Content'])],
        [Paragraph(org_addr, styles['Normal_Content'])],
        [Paragraph(org_contact, styles['Normal_Content'])],
        [Spacer(1, 15)], # Push tax info down
        [tax_table]
    ]
    
    # Use a table for left info to control height/spacing better if needed, 
    # but list of flowables in a cell is also fine. 
    # Let's stick to list of flowables for the main cell, but added spacer.
    
    # Right Info (Redesigned to match reference 3rd image)
    # 2 Columns: Left (Thai/Invoice/NotTax), Right (Original)
    # Then Line
    # Then Details
    
    # Header Title Table
    header_table_data = [
        [Paragraph("ใบแจ้งหนี้", styles['Header_Title_Bold']), Paragraph("ต้นฉบับ", styles['Header_Title_Bold'])],
        [Paragraph("INVOICE", styles['Header_Title_Bold']), Paragraph("Original", styles['Header_Title_Bold'])],
        [Paragraph("ไม่ใชใบกำกับภาษี", styles['Table_Data_Center']), ""]
    ]
    header_table = Table(header_table_data, colWidths=[100, 100])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'CENTER'), # Left Col Center
        ('ALIGN', (1,0), (1,-1), 'CENTER'), # Right Col Center
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))

    # Details Table (No / Date)
    inv_num = details.get('number', '')
    if inv_num and not inv_num.startswith('EIT'):
        inv_num = f"EIT {inv_num}"

    details_table_data = [
        [Paragraph("<b>เลขที่</b> (No.)", styles['Normal_Small']), Paragraph(inv_num, styles['Normal_Content'])],
        [Paragraph("<b>วันที่</b> (Issue Date)", styles['Normal_Small']), Paragraph(details.get('date', ''), styles['Normal_Content'])]
    ]
    details_table = Table(details_table_data, colWidths=[80, 120])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'), 
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    
    # Combined Right Info Table
    right_info_content = [
        [header_table],
        [Spacer(1, 5)],
        [details_table] # We need a line above this
    ]
    
    right_info = Table(right_info_content, colWidths=[200])
    right_info.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,2), (0,2), 'LEFT'), # Details left
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,2), (0,2), 10),
        # Line above details (row 2)
        ('LINEABOVE', (0,2), (0,2), 1, colors.black),
    ]))

    # Left Info as a Table to enforce height and bottom alignment of Tax ID?
    # Actually, simpler to just put elements in the cell.
    left_info_elements = []
    left_info_elements.append(Paragraph(org_name_th, styles['Normal_Content']))
    left_info_elements.append(Paragraph(org_name_en, styles['Normal_Content']))
    left_info_elements.append(Paragraph(org_addr, styles['Normal_Content']))
    left_info_elements.append(Paragraph(org_contact, styles['Normal_Content']))
    left_info_elements.append(Spacer(1, 25)) # Explicit spacer to push bottom content
    left_info_elements.append(tax_table)

    row1 = Table([[left_info_elements, right_info]], colWidths=[330, 205])
    row1.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('LINEBEFORE', (1,0), (1,0), 1, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (0,0), 5),
    ]))
    elements.append(row1)

    # --- Row 2: Customer & Payment ---
    cust_tax = customer.get('taxId', '')
    cust_name = customer.get('name', '') or customer.get('company', '')
    cust_addr = customer.get('address', '') or customer.get('billingAddress1', '')
    
    cust_col = [
        Paragraph(f"<b>สำนักงานใหญ่</b>   <b>เลขประจำตัวผู้เสียภาษี</b> {cust_tax}", styles['Normal_Content']),
        Paragraph("<b>ลูกค้า (customer)</b>", styles['Normal_Bold']),
        Paragraph(f"<b>ชื่อ</b> {cust_name}", styles['Normal_Content']),
        Paragraph(f"<b>ที่อยู่</b> {cust_addr}", styles['Normal_Content'])
    ]

    pay_col = [
        Paragraph("ประเภทการจ่ายเงิน (Payment Type)", styles['Normal_Small']),
        Paragraph(details.get('paymentType', '-'), styles['Normal_Content']),
        Spacer(1, 5),
        Paragraph("วันครบกำหนดชำระเงิน( Due date)", styles['Normal_Small']),
        Paragraph(details.get('dueDate', ''), styles['Normal_Content']),
        Spacer(1, 5),
        Paragraph("เลขที่ใบสั่งซื้อ (PO.NO)", styles['Normal_Small']),
        Paragraph(details.get('poNo', '-'), styles['Normal_Content'])
    ]

    row2 = Table([[cust_col, pay_col]], colWidths=[350, 185])
    row2.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(row2)

    # --- Row 3: Items Table ---
    # Cols: No, Description, Qty, Unit, Unit Price, Amount
    table_data = [[
        Paragraph("ลำดับ<br/>No.", styles['Table_Header']),
        Paragraph("รายการ<br/>Description", styles['Table_Header']),
        Paragraph("จำนวน<br/>Qty", styles['Table_Header']),
        Paragraph("หน่วยนับ<br/>Unit", styles['Table_Header']),
        Paragraph("ราคาต่อหน่วย<br/>Unit Price", styles['Table_Header']),
        Paragraph("จำนวนเงิน<br/>Amount", styles['Table_Header'])
    ]]

    for i, item in enumerate(items):
        try:
            qty = float(str(item.get('qty', 0)).replace(',', ''))
            price = float(str(item.get('price', 0)).replace(',', ''))
        except: qty, price = 0, 0
        total = qty * price
        
        desc = item.get('description', '')
        unit = item.get('unit', 'Pc.')
        
        table_data.append([
            Paragraph(str(i+1), styles['Table_Data_Center']),
            Paragraph(desc, styles['Table_Data']),
            Paragraph(f"{qty:,.0f}", styles['Table_Data_Center']),
            Paragraph(unit, styles['Table_Data_Center']),
            Paragraph(f"{price:,.2f}", styles['Table_Data_Right']),
            Paragraph(f"{total:,.2f}", styles['Table_Data_Right'])
        ])

    min_rows = 10
    if len(items) < min_rows:
        for _ in range(min_rows - len(items)):
            table_data.append(["", "", "", "", "", ""])

    # Widths: No(30), Desc(220), Qty(40), Unit(50), Price(90), Amount(105) -> Total 535
    item_table = Table(table_data, colWidths=[30, 220, 40, 50, 90, 105])
    item_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('GRID', (0,0), (-1,0), 1, colors.black), # Header grid
        ('LINEBEFORE', (1,0), (-1,-1), 1, colors.black), # Vert lines
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
        ('VALIGN', (0,1), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    elements.append(item_table)

    # --- Row 4: Totals ---
    subtotal = totals.get('subtotal', 0)
    vat = totals.get('taxTotal', 0)
    grand_total = totals.get('total', 0)
    
    total_data = [
        ["", "จำนวนเงินสุทธิ\nNet Amount", f"{subtotal:,.2f}"],
        ["", "ภาษีมูลค่าเพิ่ม\nVAT 7%", f"{vat:,.2f}"],
        ["", "รวมเป็นมูลค่า\nTotal of sales", f"{grand_total:,.2f}"]
    ]
    # Adjust widths to match item table: 
    # Total Width 535. Amount col is 105. Label col ~150. Rest empty.
    total_table = Table(total_data, colWidths=[280, 150, 105])
    total_table.setStyle(TableStyle([
        ('BOX', (1,0), (-1,-1), 1, colors.black),
        ('INNERGRID', (1,0), (-1,-1), 1, colors.black),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,0), (-1,-1), font_name),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    elements.append(total_table)

    # --- Row 5: Text Amount ---
    text_amt = totals.get('thaiText', '-')
    # text_amt = "ศูนย์บาทถ้วน" # Hardcoded to match reference as requested
    text_row = Table([[
        Paragraph("จำนวนเงินรวมทั้งสิ้น<br/>(The sum of baht)", styles['Table_Data_Center']),
        Paragraph(text_amt, styles['Table_Data_Center'])
    ]], colWidths=[150, 385])
    text_row.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('LINEBEFORE', (1,0), (1,0), 1, colors.black),
        ('BACKGROUND', (1,0), (1,0), colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(text_row)

    # --- Row 6: Payment By ---
    pay_row = Table([[Paragraph("ชำระเงินโดย", styles['Normal_Content']), ""]], colWidths=[150, 385])
    pay_row.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('LINEBEFORE', (1,0), (1,0), 1, colors.black),
    ]))
    elements.append(pay_row)

    # --- Row 7: Signatures ---
    # Combined into single row to avoid horizontal lines between text/signature/date
    # Using <br/> for spacing
    
    # Define cell content for each column
    def sig_cell(role_th, role_en):
        return [
            Paragraph(f"{role_th} {role_en}", styles['Table_Data_Center']),
            Spacer(1, 35), # Space for signature
            Paragraph("(.......................................)", styles['Table_Data_Center']),
            Spacer(1, 2),
            Paragraph("วันที่ .......................................", styles['Table_Data_Center'])
        ]

    sig_data = [[
        sig_cell("ผู้รับสินค้า", "Reciever"),
        sig_cell("ผู้ส่งสินค้า", "Deliverer"),
        sig_cell("ผู้มีอำนาจลงนาม", "Authorized Signature")
    ]]
    
    # Use Table of Tables or just content in cells? 
    # ReportLab Table cells can contain lists of Flowables (like Paragraphs/Spacers)
    
    sig_table = Table(sig_data, colWidths=[178, 178, 179])
    sig_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('GRID', (0,0), (-1,-1), 1, colors.black), # Vertical lines between columns (since only 1 row)
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(KeepTogether(sig_table))

    try:
        doc.build(elements)
    except Exception as e:
        print(f"PDF Build Error: {e}")
        raise e
    
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')
