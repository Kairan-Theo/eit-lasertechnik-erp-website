from django.conf import settings
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
import base64

# Define BASE_DIR
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRM_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, '..', 'public')

# Font Configuration
FONT_PATH = os.path.join(BASE_DIR, 'Prompt-Regular.ttf')
FONT_BOLD_PATH = os.path.join(BASE_DIR, 'Prompt-Bold.ttf')
TAHOMA_PATH = os.path.join(BASE_DIR, 'tahoma.ttf')
TAHOMA_BOLD_PATH = os.path.join(BASE_DIR, 'tahomabd.ttf')
# System font fallbacks (Windows paths)
SYSTEM_FONT_PATH = r'C:\Windows\Fonts\tahoma.ttf'
SYSTEM_FONT_BOLD_PATH = r'C:\Windows\Fonts\tahomabd.ttf'
# Additional Thai system font fallbacks
# Try multiple common Windows file names to maximize hit rate
SARABUN_CANDIDATES = [
    r'C:\Windows\Fonts\THSarabunNew.ttf',
    r'C:\Windows\Fonts\thsarabunnew.ttf'
]
SARABUN_BOLD_CANDIDATES = [
    r'C:\Windows\Fonts\THSarabunNew Bold.ttf',
    r'C:\Windows\Fonts\THSarabunNew-Bold.ttf',
    r'C:\Windows\Fonts\thsarabunnewbold.ttf'
]
# Arial Unicode MS (broad Unicode coverage, includes Thai on many Windows installs)
ARIAL_UNICODE_PATH = r'C:\Windows\Fonts\arialuni.ttf'
# Linux font fallbacks (commonly present on many distros)
LINUX_SARABUN_CANDIDATES = [
    '/usr/share/fonts/thai/thsarabunnew.ttf',
    '/usr/share/fonts/truetype/thai/THSarabunNew.ttf',
    '/usr/share/fonts/truetype/thsarabunnew/THSarabunNew.ttf',
    '/usr/share/fonts/truetype/thsarabunnew/thsarabunnew.ttf'
]
LINUX_SARABUN_BOLD_CANDIDATES = [
    '/usr/share/fonts/truetype/thai/THSarabunNew-Bold.ttf',
    '/usr/share/fonts/thai/thsarabunnewbold.ttf',
    '/usr/share/fonts/truetype/thsarabunnew/THSarabunNew-Bold.ttf',
    '/usr/share/fonts/truetype/thsarabunnew/thsarabunnewbold.ttf'
]
NOTO_THAI_CANDIDATES = [
    '/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf',
    '/usr/share/fonts/noto/NotoSansThai-Regular.ttf'
]
NOTO_THAI_BOLD_CANDIDATES = [
    '/usr/share/fonts/truetype/noto/NotoSansThai-Bold.ttf',
    '/usr/share/fonts/noto/NotoSansThai-Bold.ttf'
]
# Additional Windows Thai font (Angsana)
ANGSANA_PATH = r'C:\Windows\Fonts\\angsa.ttf'
ANGSANA_BOLD_PATH = r'C:\Windows\Fonts\\angsab.ttf'

# Calisto MT Paths
CALISTO_PATH = r'C:\Windows\Fonts\CALIST.TTF'
CALISTO_BOLD_PATH = r'C:\Windows\Fonts\CALISTB.TTF'
CALISTO_ITALIC_PATH = r'C:\Windows\Fonts\CALISTI.TTF'
CALISTO_BOLD_ITALIC_PATH = r'C:\Windows\Fonts\CALISTBI.TTF'

font_name = "Helvetica"
font_name_bold = "Helvetica-Bold"
font_name_eng = "Helvetica"
font_name_eng_bold = "Helvetica-Bold"
_fonts_initialized = False

# Project-local font locations (preferred to avoid OS dependency)
# Place TTF files here to guarantee Thai rendering:
#   backend/crm/fonts/Prompt-Regular.ttf
#   backend/crm/fonts/Prompt-Bold.ttf
#   backend/crm/fonts/NotoSansThai-Regular.ttf
#   backend/crm/fonts/NotoSansThai-Bold.ttf
# We search both backend/crm/fonts and backend/fonts (and repo-root/fonts)
PROJECT_FONT_DIRS = [
    os.path.join(CRM_DIR, 'fonts'),
    os.path.join(BASE_DIR, 'fonts'),
    os.path.join(os.path.dirname(BASE_DIR), 'fonts'),
]

def ensure_fonts_registered():
    global _fonts_initialized, font_name, font_name_bold, font_name_eng, font_name_eng_bold
    if _fonts_initialized:
        return
    try:
        # Helper: pick first existing path from candidates
        def pick_first(paths):
            for p in paths:
                if os.path.exists(p):
                    return p
            return None

        # Prefer bundled Prompt (if present in backend folder) or project-local fonts
        prompt_local = None
        prompt_bold_local = None
        for _dir in PROJECT_FONT_DIRS:
            try:
                p_reg = os.path.join(_dir, 'Prompt-Regular.ttf')
                p_bold = os.path.join(_dir, 'Prompt-Bold.ttf')
                if (not prompt_local) and os.path.exists(p_reg):
                    prompt_local = p_reg
                if (not prompt_bold_local) and os.path.exists(p_bold):
                    prompt_bold_local = p_bold
            except Exception:
                pass
        if (os.path.exists(FONT_PATH) and os.path.exists(FONT_BOLD_PATH)) or (prompt_local and prompt_bold_local):
            pdfmetrics.registerFont(TTFont('Prompt', FONT_PATH if os.path.exists(FONT_PATH) else prompt_local))
            pdfmetrics.registerFont(TTFont('Prompt-Bold', FONT_BOLD_PATH if os.path.exists(FONT_BOLD_PATH) else prompt_bold_local))
            registerFontFamily('Prompt', normal='Prompt', bold='Prompt-Bold', italic='Prompt', boldItalic='Prompt-Bold')
            font_name = "Prompt"
            font_name_bold = "Prompt-Bold"
        # Fallback to local Tahoma copies (if placed alongside backend)
        elif os.path.exists(TAHOMA_PATH) and os.path.exists(TAHOMA_BOLD_PATH):
            pdfmetrics.registerFont(TTFont('Tahoma', TAHOMA_PATH))
            pdfmetrics.registerFont(TTFont('Tahoma-Bold', TAHOMA_BOLD_PATH))
            registerFontFamily('Tahoma', normal='Tahoma', bold='Tahoma-Bold', italic='Tahoma', boldItalic='Tahoma-Bold')
            font_name = "Tahoma"
            font_name_bold = "Tahoma-Bold"
        # Try Windows system Tahoma (broad coverage for Thai)
        elif os.path.exists(SYSTEM_FONT_PATH) and os.path.exists(SYSTEM_FONT_BOLD_PATH):
            pdfmetrics.registerFont(TTFont('Tahoma', SYSTEM_FONT_PATH))
            pdfmetrics.registerFont(TTFont('Tahoma-Bold', SYSTEM_FONT_BOLD_PATH))
            registerFontFamily('Tahoma', normal='Tahoma', bold='Tahoma-Bold', italic='Tahoma', boldItalic='Tahoma-Bold')
            font_name = "Tahoma"
            font_name_bold = "Tahoma-Bold"
        # Try Windows system TH Sarabun New (popular Thai UI/document font)
        else:
            sarabun = pick_first(SARABUN_CANDIDATES)
            sarabun_bold = pick_first(SARABUN_BOLD_CANDIDATES)
            if sarabun and sarabun_bold:
                pdfmetrics.registerFont(TTFont('THSarabunNew', sarabun))
                pdfmetrics.registerFont(TTFont('THSarabunNew-Bold', sarabun_bold))
                registerFontFamily('THSarabunNew', normal='THSarabunNew', bold='THSarabunNew-Bold', italic='THSarabunNew', boldItalic='THSarabunNew-Bold')
                font_name = "THSarabunNew"
                font_name_bold = "THSarabunNew-Bold"
            else:
                # Try Linux Sarabun
                sarabun = pick_first(LINUX_SARABUN_CANDIDATES)
                sarabun_bold = pick_first(LINUX_SARABUN_BOLD_CANDIDATES)
                if sarabun and sarabun_bold:
                    pdfmetrics.registerFont(TTFont('THSarabunNew', sarabun))
                    pdfmetrics.registerFont(TTFont('THSarabunNew-Bold', sarabun_bold))
                    registerFontFamily('THSarabunNew', normal='THSarabunNew', bold='THSarabunNew-Bold', italic='THSarabunNew', boldItalic='THSarabunNew-Bold')
                    font_name = "THSarabunNew"
                    font_name_bold = "THSarabunNew-Bold"
                else:
                    # Try Noto Sans Thai on Linux
                    noto = pick_first(NOTO_THAI_CANDIDATES)
                    noto_bold = pick_first(NOTO_THAI_BOLD_CANDIDATES)
                    if noto and noto_bold:
                        pdfmetrics.registerFont(TTFont('NotoSansThai', noto))
                        pdfmetrics.registerFont(TTFont('NotoSansThai-Bold', noto_bold))
                        registerFontFamily('NotoSansThai', normal='NotoSansThai', bold='NotoSansThai-Bold', italic='NotoSansThai', boldItalic='NotoSansThai-Bold')
                        font_name = "NotoSansThai"
                        font_name_bold = "NotoSansThai-Bold"
                    # Try Windows Angsana
                    elif os.path.exists(ANGSANA_PATH) and os.path.exists(ANGSANA_BOLD_PATH):
                        pdfmetrics.registerFont(TTFont('AngsanaUPC', ANGSANA_PATH))
                        pdfmetrics.registerFont(TTFont('AngsanaUPC-Bold', ANGSANA_BOLD_PATH))
                        registerFontFamily('AngsanaUPC', normal='AngsanaUPC', bold='AngsanaUPC-Bold', italic='AngsanaUPC', boldItalic='AngsanaUPC-Bold')
                        font_name = "AngsanaUPC"
                        font_name_bold = "AngsanaUPC-Bold"
                    # Last resort: Arial Unicode MS
                    elif os.path.exists(ARIAL_UNICODE_PATH):
                        pdfmetrics.registerFont(TTFont('ArialUnicodeMS', ARIAL_UNICODE_PATH))
                        registerFontFamily('ArialUnicodeMS', normal='ArialUnicodeMS', bold='ArialUnicodeMS', italic='ArialUnicodeMS', boldItalic='ArialUnicodeMS')
                        font_name = "ArialUnicodeMS"
                        font_name_bold = "ArialUnicodeMS"
                    else:
                        # Keep Helvetica defaults
                        pass
    except Exception as e:
        # Keep Helvetica defaults on error
        pass
    # Use Thai-capable base font for all mixed content (labels/headers) to ensure Thai glyphs render.
    # If Tahoma/Prompt were registered above, reuse them here so Thai text never falls back to Helvetica.
    font_name_eng = font_name
    font_name_eng_bold = font_name_bold
    # Debug: print selected font family to server logs for diagnostics
    try:
        print(f"PDF fonts initialized. Base: {font_name}, Bold: {font_name_bold}")
        if font_name in ("Helvetica", "Times-Roman"):
            print("WARNING: Thai-capable font not found. Place Prompt-Regular.ttf and Prompt-Bold.ttf in backend/crm or install TH Sarabun New / Noto Sans Thai / Tahoma / Arial Unicode MS on the host.")
    except Exception:
        pass
    _fonts_initialized = True

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

# Use Times New Roman for English Headers/Design (set in ensure_fonts_registered)

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_quotation_pdf(request):
    ensure_fonts_registered()
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
    
    # Check for EIT object and image from DB
    eit_id = details.get('eit')
    header_image_path = None
    if eit_id:
        try:
            from .models import EIT
            eit_obj = EIT.objects.get(pk=eit_id)
            if eit_obj.header_image:
                header_image_path = eit_obj.header_image.path
        except Exception:
            pass

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
    # 1. DB Image (Highest Priority)
    # 2. If "EINSTEIN" is in organization -> Prefer Einstein header
    # 3. Else -> Prefer EIT header
    is_einstein = "EINSTEIN" in str(organization).upper()
    
    candidates = []
    
    # Add DB image as first candidate if available
    if header_image_path:
         candidates.append((header_image_path, 530, 80))

    # Define candidates based on organization (Fallback)
    if is_einstein:
        candidates.extend([
            (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80),
            (os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80)
        ])
    else:
        # Default/EIT
        candidates.extend([
            (os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80)
        ])

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
    # Headers: Remove IMAGE column per request. Images appear only in spec rows across numeric columns.
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
    # Track main item rows (1, 2, 3, ...) to draw separators above and below
    item_row_indices = []
    # Track spec rows to selectively remove vertical separator lines on those rows
    spec_row_indices = []
    # Track the last row index of each specification block to draw a horizontal line after the spec
    spec_block_end_indices = []
    # Track spec rows that contain images so we can span the image across Price, Qty, and Total columns
    spec_row_span_indices = []
    for i, item in enumerate(items):
        try:
            qty = float(str(item.get('qty', 0)).replace(',', ''))
            price = float(str(item.get('price', 0)).replace(',', ''))
        except:
            qty = 0
            price = 0
            
        line_total = qty * price
        total_amount += line_total
        
        # Specification rows (added below) will carry images across Price/Qty/Total columns if present.
        spec_rows = item.get('spec_rows') or []
        spec_image_data = item.get('spec_image_data')

        # Base description only; specification numbering will appear in ITEM column on separate rows
        desc_text = txt(item.get('description'))
        spec_lines_legacy = item.get('spec_lines') or []

        # Main item row: ITEM, MODEL, DESCRIPTION, PRICE, QTY, TOTAL
        row = [
            Paragraph(str(i + 1), styles['Table_Data_Center']),
            Paragraph(txt(item.get('model')), styles['Table_Data']),
            Paragraph(desc_text, styles['Table_Data']),
            Paragraph(f"{price:,.2f}", styles['Table_Data_Right']),
            Paragraph(f"{qty:,.0f}", styles['Table_Data_Center']),
            Paragraph(f"{line_total:,.2f}", styles['Table_Data_Right']),
        ]
        table_data.append(row)
        # Record index of the main item row; used to draw lines above/below per request
        item_row_indices.append(len(table_data) - 1)
        # Append numbered specification rows under the main item row (numbers in ITEM column)
        if spec_rows and isinstance(spec_rows, list):
            try:
                # Remember where the spec block starts to know if we added any rows
                spec_block_start_count = len(table_data)
                for idx, r in enumerate(spec_rows):
                    lines = r.get('lines') or []
                    bullets = "<br/>".join([f"• {txt(line)}" for line in lines if str(line).strip() != ""])
                    # If this spec row has an uploaded image, decode it and place it in Price column.
                    # We'll span across Price, Qty, and Total (columns 4..6) after the table is created.
                    img_obj_spec = ""
                    img_data = r.get('image_data') or item.get('spec_image_data')
                    if img_data and str(img_data).startswith('data:image'):
                        try:
                            header, b64 = str(img_data).split(',', 1)
                            raw = base64.b64decode(b64)
                            bio = io.BytesIO(raw)
                            # Use adjustable size from payload; default to 64x64 if missing
                            w = int(r.get('image_width') or item.get('spec_image_width') or 64)
                            h = int(r.get('image_height') or item.get('spec_image_height') or 64)
                            img_obj_spec = Image(bio, width=w, height=h)
                            img_obj_spec.hAlign = 'CENTER'
                        except Exception as e:
                            print(f"Error decoding spec row image: {e}")
                    # Spec row: show subnumber in ITEM, bullets in DESCRIPTION, and image across PRICE/QTY/TOTAL if present
                    table_data.append([
                        Paragraph(f"{i+1}.{idx+1}", styles['Table_Data_Center']),
                        "",  # MODEL
                        Paragraph(bullets, styles['Table_Data']),
                        img_obj_spec or "",  # PRICE (will be spanned across 3 cols)
                        "",  # QTY
                        "",  # TOTAL
                    ])
                    # Record the spec row to remove vertical lines (cleaner look for spec sections)
                    spec_row_indices.append(len(table_data) - 1)
                    # Always span PRICE..QTY..TOTAL for spec rows to eliminate vertical boundaries across QTY
                    # (Even if no image is present, we still merge these cells for a clean spec block.)
                    spec_row_span_indices.append(len(table_data) - 1)
            except Exception:
                pass
            # If at least one spec row was added, record the last row index for a horizontal line after the block
            if len(table_data) > spec_block_start_count:
                spec_block_end_indices.append(len(table_data) - 1)
        elif spec_lines_legacy:
            # Legacy single spec block without per-row objects -> number as 1.1
            bullets = "<br/>" + "<br/>".join([f"• {txt(line)}" for line in spec_lines_legacy])
            table_data.append([
                Paragraph(f"{i+1}.1", styles['Table_Data_Center']),
                "",  # MODEL
                Paragraph(bullets, styles['Table_Data']),
                "", "", ""  # PRICE, QTY, TOTAL
            ])
            # Record the legacy spec row for vertical-line removal
            spec_row_indices.append(len(table_data) - 1)
            # Also span PRICE..QTY..TOTAL for legacy spec block to remove QTY boundary entirely
            spec_row_span_indices.append(len(table_data) - 1)
            # Single legacy spec row -> horizontal line should be drawn after it
            spec_block_end_indices.append(len(table_data) - 1)
        
    # Minimum rows to fill the page
    # Reduced min_rows from 10 to 8 to allow space for signature on same page
    min_rows = 8
    current_rows = len(items)
    if current_rows < min_rows:
        for _ in range(min_rows - current_rows):
            table_data.append(["", "", "", "", "", "", ""])

    # Table Style
    # Updated widths after removing IMAGE column:
    # ITEM(30), MODEL(80), DESC(215), PRICE(70), QTY(35), TOTAL(85) -> Total 515
    item_table = Table(table_data, colWidths=[30, 80, 215, 70, 35, 85])
    # Base table styles
    table_styles = [
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
        ('ALIGN', (2,1), (2,-1), 'LEFT'),  # Description left (Index 2 now)
        ('ALIGN', (3,1), (3,-1), 'RIGHT'), # Price right (Index 3 now)
        ('ALIGN', (5,1), (5,-1), 'RIGHT'), # Total right (Index 5 now)
        # Ensure Thai-capable font applies to any non-Paragraph text
        ('FONTNAME', (0,0), (-1,-1), font_name),
        
        # Padding
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]
    # Draw separator lines above and below each main item row (numbers without decimal).
    # Skip LINEABOVE for the first item to avoid double line under the table header.
    for idx, r in enumerate(item_row_indices):
        table_styles.append(('LINEBELOW', (0, r), (-1, r), 1, colors.black))  # Line after item
        if idx > 0:
            table_styles.append(('LINEABOVE', (0, r), (-1, r), 1, colors.black))  # Line before item
    # Remove vertical separator lines in the QTY column for specification rows only
    # Left border of QTY is LINEBEFORE at column 4; right border is LINEBEFORE at column 5 (TOTAL).
    for r in spec_row_indices:
        table_styles.append(('LINEBEFORE', (4, r), (4, r), 0, colors.white))  # hide left border of QTY
        table_styles.append(('LINEBEFORE', (5, r), (5, r), 0, colors.white))  # hide border between QTY and TOTAL
        # Also remove potential LINEAFTER on the cells adjacent to QTY to ensure no vertical line remains
        table_styles.append(('LINEAFTER', (3, r), (3, r), 0, colors.white))   # remove line after PRICE (left of QTY)
        table_styles.append(('LINEAFTER', (4, r), (4, r), 0, colors.white))   # remove line after QTY (right of QTY)
    # Draw a horizontal line after each specification block to visually separate it from the next content
    for r in spec_block_end_indices:
        table_styles.append(('LINEBELOW', (0, r), (-1, r), 1, colors.black))
    # Span spec row images across Price, Qty, Total columns and center them
    for r in spec_row_span_indices:
        table_styles.append(('SPAN', (3, r), (5, r)))  # span PRICE..TOTAL (columns 3..5)
        table_styles.append(('ALIGN', (3, r), (5, r), 'CENTER'))
        table_styles.append(('VALIGN', (3, r), (5, r), 'MIDDLE'))
    item_table.setStyle(TableStyle(table_styles))
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
    # Ensure Thai-capable fonts are registered so Thai text renders correctly
    ensure_fonts_registered()
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
    # Prioritize checking 'eit' ID for reliable organization lookup
    eit_id = details.get('eit')
    organization = None
    header_image_path = None
    
    if eit_id:
        try:
            from .models import EIT
            eit_obj = EIT.objects.get(pk=eit_id)
            organization = eit_obj.organization_name
            if eit_obj.header_image:
                header_image_path = eit_obj.header_image.path
        except Exception:
            pass

    # Fallback to text fields if ID lookup failed or wasn't provided
    if not organization:
        organization = details.get('salesPerson') or 'EIT LASERTECHNIK CO.,LTD'
    
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
    
    candidates = []
    if header_image_path:
         candidates.append((header_image_path, 530, 80))

    # Define candidates based on organization
    # User requested: Einstein header.png and EIT header.png, NOT eit-icon.png
    if is_einstein:
        candidates.extend([
            (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80),
            (os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80)
        ])
    else:
        # Default/EIT
        # Prioritize EIT header.png as requested
        candidates.extend([
            (os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80)
        ])

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
        # Enforce Thai-capable font for table text
        ('FONTNAME', (0,0), (-1,-1), font_name),
        
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
    # Layout based on user screenshot:
    # Row 1: Note (spanning or separate)
    # Row 2: Left: Recipient, Right: On Behalf Of
    # Row 3: Left: Received Date, Right: Empty
    # Row 4: Left: Cheque Date, Right: Biller

    recipient = details.get('recipient')
    received_date = details.get('receivedDate')
    cheque_date = details.get('chequeDate')
    depositor = details.get('depositor')
    on_behalf_of = details.get('onBehalfOf')

    def format_date_th(date_str):
        if not date_str:
            return None
        try:
            # Assuming YYYY-MM-DD from frontend
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            return dt.strftime('%d/%m/%Y')
        except:
            return date_str

    # Helper for dotted underlined fields: Label | Value (Dotted Underline)
    def create_dotted_underlined_field(label, value, label_width=100, total_width=260):
        val_str = str(value) if value else ""
        
        # If value is empty, provide space for writing
        if not val_str:
            val_str = " " * 10 
            
        # Create a small table: [Label, Value]
        # Label cell
        lbl = Paragraph(f"<b>{label}</b>", styles['Normal_Content'])
        
        # Value cell with Drawing for dotted line
        # ReportLab's LINEBELOW is solid. For dotted, we need a custom approach or just use dots text if acceptable?
        # User explicitly asked for "dotted line" and "under of the value".
        # The best way to do "dotted underline" in a table cell is drawing on canvas or using a custom Flowable.
        # Simpler approach: Use a Paragraph with underline? No, standard underline is solid.
        # Alternative: Use a graphic line.
        
        # Let's try using a Drawing with a dotted line.
        from reportlab.graphics.shapes import Drawing, Line
        
        # Calculate approximate width of value or use fixed width
        # The column width is fixed (val_width). 
        val_width = total_width - label_width
        
        # Create a drawing that is just a dotted line
        d = Drawing(val_width, 1)
        d.add(Line(0, 0, val_width, 0, strokeWidth=1, strokeDashArray=[1, 3]))
        
        # If we put the text in one cell and the line in the cell below?
        # Or text and line in same cell?
        # Let's try: Text Paragraph, then Drawing
        
        val_para = Paragraph(val_str, styles['Normal_Content'])
        
        # Table with 2 rows for the value column: Text, then Line
        # But we need Label to align with Text.
        # So: Outer Table 2 cols. Col 2 is a nested table of [Text, Line].
        
        inner_data = [
            [val_para],
            [d]
        ]
        inner_table = Table(inner_data, colWidths=[val_width], rowHeights=[None, 2]) # Auto height for text, 2 for line
        inner_table.setStyle(TableStyle([
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ]))
        
        t = Table([[lbl, inner_table]], colWidths=[label_width, val_width])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'), # Align Label with bottom of inner table (which is the line)
            # Actually we want Label to align with the Text part of inner table.
            # VALIGN BOTTOM aligns with the bottom of the cell (the line). 
            # This might make label sit too low.
            # Let's try VALIGN TOP? No.
            # Let's just use VALIGN TOP and add top padding to line?
            
            # Better approach:
            # Row 1: Label, Value
            # Row 2: Empty, DottedLine
            
            # Let's use this structure:
            # [Label] [Value]
            # [Empty] [DottedLine]
            
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        
        # Re-implementation with simple 2x2 grid for alignment
        # But label shouldn't have a line under it.
        # [Label, Value]
        # [  "",  Line ]
        
        # The line drawing
        line_drawing = Drawing(val_width, 5) # Height 5 to give space
        line_drawing.add(Line(0, 3, val_width, 3, strokeWidth=0.5, strokeDashArray=[2, 2]))
        
        final_data = [
            [lbl, val_para],
            ["", line_drawing]
        ]
        
        final_table = Table(final_data, colWidths=[label_width, val_width])
        final_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            # Reduce vertical gap between text and line
            ('BOTTOMPADDING', (1,0), (1,0), 1), 
            ('TOPPADDING', (1,1), (1,1), 0),
            ('SPAN', (0,0), (0,1)), # Span label across 2 rows? No, label is just in top row.
            # If label is multiline, this might break. Assuming single line label.
        ]))
        
        return final_table

    # Helper for plain fields: Label | Value (No Line)
    def create_plain_field(label, value, label_width=100, total_width=260):
        val_str = str(value) if value else ""
        
        lbl = Paragraph(f"<b>{label}</b>", styles['Normal_Content'])
        val = Paragraph(val_str, styles['Normal_Content'])
        
        val_width = total_width - label_width
        
        # Simple 1-row table
        t = Table([[lbl, val]], colWidths=[label_width, val_width])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        return t

    # Note Paragraph
    note_text = "หมายเหตุ : แจ้งการชำระเงินได้ที่ sales@eitlaser.com"
    note_p = Paragraph(f"<b>{note_text}</b>", styles['Normal_Content'])

    # Signature Rows
    # Row 1
    # Reduced label widths to make lines shorter and fit better
    row1_left = create_dotted_underlined_field("ชื่อผู้รับวางบิล", recipient, label_width=75, total_width=240)
    row1_right = create_plain_field("ในนาม", on_behalf_of, label_width=35, total_width=240)
    
    # Row 2
    row2_left = create_dotted_underlined_field("วันที่รับ", format_date_th(received_date), label_width=75, total_width=240)
    row2_right = Paragraph("", styles['Normal_Content'])

    # Row 3
    row3_left = create_dotted_underlined_field("วันที่นัดรับเช็ค", format_date_th(cheque_date), label_width=75, total_width=240)
    row3_right = create_dotted_underlined_field("ชื่อผู้วางบิล", depositor, label_width=60, total_width=240)

    sig_data = [
        [note_p, ""],
        [row1_left, row1_right],
        [row2_left, row2_right],
        [row3_left, row3_right]
    ]
    
    sig_table = Table(sig_data, colWidths=[265, 265])
    sig_table.setStyle(TableStyle([
        ('SPAN', (0,0), (1,0)), # Note spans across
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        
        # Padding
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        
        # Spacing for Note
        ('BOTTOMPADDING', (0,0), (1,0), 15), 
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
    ensure_fonts_registered()
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
    header_image_path = None
    
    if eit_id:
        try:
            from .models import EIT
            eit_obj = EIT.objects.get(pk=eit_id)
            organization = eit_obj.organization_name
            if eit_obj.header_image:
                header_image_path = eit_obj.header_image.path
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

    candidates = []
    if header_image_path:
        candidates.append((header_image_path, 530, 80))
        
    if is_einstein:
        candidates.extend([(os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80), (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80)])
    else:
        candidates.extend([(os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80), (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80)])
    
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
    org_name_en = ("EINSTEIN INDUSTRIETECHNIK CORPORATION CO.,LTD." if is_einstein else "EIT LASERTECHNIK CO.,LTD.")
    # Allow overrides from form details
    org_name_en = details.get('onBehalfOf', org_name_en) or org_name_en
    org_addr = details.get('eitAddress') or ("1/120 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510" if is_einstein else "118/20 ซอยรามคำแหง 184 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510")
    tel = details.get('eitTelephone')
    fax = details.get('eitFax')
    if tel or fax:
        org_contact = f"TEL : {tel or '-'}    Fax : {fax or '-'}"
    else:
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
        # Base description only; specification numbering will be added as separate rows (numbers in ITEM column)
        desc_text = txt(item.get('description', ''))
        spec_rows = item.get('spec_rows') or []
        spec_lines_legacy = item.get('spec_lines') or []
        unit = item.get('unit', 'Pc.')
        
        table_data.append([
            Paragraph(str(i+1), styles['Table_Data_Center']),
            Paragraph(desc_text, styles['Table_Data']),
            Paragraph(f"{qty:,.0f}", styles['Table_Data_Center']),
            Paragraph(unit, styles['Table_Data_Center']),
            Paragraph(f"{price:,.2f}", styles['Table_Data_Right']),
            Paragraph(f"{total:,.2f}", styles['Table_Data_Right'])
        ])
        # Append numbered specification rows: itemnumber in ITEM column, bullets in Description, other cols empty
        if spec_rows and isinstance(spec_rows, list):
            try:
                for idx, r in enumerate(spec_rows):
                    lines = r.get('lines') or []
                    bullets = "<br/>".join([f"• {txt(line)}" for line in lines if str(line).strip() != ""])
                    table_data.append([
                        Paragraph(f"{i+1}.{idx+1}", styles['Table_Data_Center']),
                        Paragraph(bullets, styles['Table_Data']),
                        "", "", "", ""
                    ])
                # Legacy single spec block -> number as i.1
            except Exception:
                pass
        elif spec_lines_legacy:
            bullets = "<br/>" + "<br/>".join([f"• {txt(line)}" for line in spec_lines_legacy])
            table_data.append([
                Paragraph(f"{i+1}.1", styles['Table_Data_Center']),
                Paragraph(bullets, styles['Table_Data']),
                "", "", "", ""
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
        ('FONTNAME', (0,0), (-1,-1), font_name),
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
        title = Paragraph(f"{role_th} {role_en}", styles['Table_Data_Center'])
        
        # Nested table for signature lines with real underlines (LINEBELOW)
        sub_data = [
            ["(", "", ")"],
            ["วันที่", "", ""]
        ]
        
        # Widths: 25, 100, 25 = 150 total
        # Row Heights: 30 for signature space, 20 for date space
        sub_table = Table(sub_data, colWidths=[25, 100, 25], rowHeights=[35, 25])
        sub_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), font_name), # Ensure Thai font is used
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            
            # Signature Line (Row 0, Col 1)
            ('LINEBELOW', (1,0), (1,0), 0.5, colors.black),
            
            # Date Line (Row 1, Col 1)
            ('LINEBELOW', (1,1), (1,1), 0.5, colors.black),
            
            # Align "วันที่" to right so it sits close to the line
            ('ALIGN', (0,1), (0,1), 'RIGHT'),
            
            # Adjust padding
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        
        return [
            title,
            Spacer(1, 5),
            sub_table
        ]

    sig_data = [[
        sig_cell("ผู้รับสินค้า", "Receiver"),
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
