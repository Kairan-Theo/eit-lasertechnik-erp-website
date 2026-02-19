from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import HttpResponse, FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io
import os
from datetime import datetime
import base64
import json
# Prefer module-level safe imports for PDF merging
# First try modern 'pypdf', then fallback to 'PyPDF2'
try:
    from pypdf import PdfMerger, PdfReader, PdfWriter
    MERGE_LIB = "pypdf"
except Exception:
    try:
        from PyPDF2 import PdfMerger, PdfReader, PdfWriter
        MERGE_LIB = "PyPDF2"
    except Exception:
        PdfMerger = None
        PdfReader = None
        PdfWriter = None
        MERGE_LIB = None

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
    # Helper to split CSV strings into trimmed list
    # Added to support multi-value Attn/CC fields coming from Customer table
    def split_csv(s):
        try:
            return [t.strip() for t in str(s or "").split(",") if t.strip()]
        except Exception:
            return []

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

    # Build Attn/CC block:
    # The requested format is:
    #   attn1: <name>, <division>, <email>, <mobile>
    #   attn2: <name>, <division>, <email>, <mobile>
    #   cc1:   <name>, <division>, <email>, <mobile>
    # Data sources:
    # - Prefer customer['responsibles'] array from frontend UI
    # - Fallback to CSV strings in customer fields: attn, attn_division, attn_mobile, email, cc, cc_division, cc_email, cc_mobile
    responsibles = customer.get('responsibles') or []
    attn_lines = []
    cc_lines = []
    if isinstance(responsibles, list) and len(responsibles) > 0:
        # Iterate over responsibles[] and format lines
        for i, r in enumerate(responsibles, start=1):
            # Build Attn line if any Attn info present
            attn_name = r.get('attn') or ""
            attn_div = r.get('attnDiv') or ""
            attn_email = r.get('attnEmail') or ""
            attn_mobile = r.get('attnMobile') or ""
            if any([attn_name, attn_div, attn_email, attn_mobile]):
                attn_parts = []
                if attn_name: attn_parts.append(txt(attn_name))
                if attn_div: attn_parts.append(txt(attn_div))
                if attn_email: attn_parts.append(txt(attn_email))
                if attn_mobile: attn_parts.append(txt(attn_mobile))
                attn_lines.append(f"Attn{i}: " + ", ".join(attn_parts))
            # Build CC line if any CC info present
            cc_name = r.get('cc') or ""
            cc_div = r.get('ccDiv') or ""
            cc_email = r.get('ccEmail') or ""
            cc_mobile = r.get('ccMobile') or ""
            if any([cc_name, cc_div, cc_email, cc_mobile]):
                cc_parts = []
                if cc_name: cc_parts.append(txt(cc_name))
                if cc_div: cc_parts.append(txt(cc_div))
                if cc_email: cc_parts.append(txt(cc_email))
                if cc_mobile: cc_parts.append(txt(cc_mobile))
                cc_lines.append(f"CC{i}: " + ", ".join(cc_parts))
    else:
        # Fallback: parse CSV fields from Customer
        attn_csv = split_csv(customer.get('attn'))
        attn_div_csv = split_csv(customer.get('div')) or split_csv(customer.get('attn_division'))
        attn_email_csv = split_csv(customer.get('email'))
        attn_mobile_csv = split_csv(customer.get('mobile')) or split_csv(customer.get('attn_mobile'))
        cc_csv = split_csv(customer.get('cc'))
        cc_div_csv = split_csv(customer.get('cc_division'))
        cc_email_csv = split_csv(customer.get('cc_email'))
        cc_mobile_csv = split_csv(customer.get('cc_mobile'))
        max_len = max(
            len(attn_csv), len(attn_div_csv), len(attn_email_csv), len(attn_mobile_csv),
            len(cc_csv), len(cc_div_csv), len(cc_email_csv), len(cc_mobile_csv)
        ) if any([
            attn_csv, attn_div_csv, attn_email_csv, attn_mobile_csv,
            cc_csv, cc_div_csv, cc_email_csv, cc_mobile_csv
        ]) else 0
        for i in range(max(1, max_len)):
            # Attn lines
            attn_parts = []
            name = attn_csv[i] if i < len(attn_csv) else (customer.get('attn') or "")
            divv = attn_div_csv[i] if i < len(attn_div_csv) else (customer.get('attn_division') or customer.get('div') or "")
            emailv = attn_email_csv[i] if i < len(attn_email_csv) else (customer.get('email') or "")
            mobilev = attn_mobile_csv[i] if i < len(attn_mobile_csv) else (customer.get('attn_mobile') or customer.get('mobile') or "")
            if any([name, divv, emailv, mobilev]):
                if name: attn_parts.append(txt(name))
                if divv: attn_parts.append(txt(divv))
                if emailv: attn_parts.append(txt(emailv))
                if mobilev: attn_parts.append(txt(mobilev))
                attn_lines.append(f"Attn{i+1}: " + ", ".join(attn_parts))
            # CC lines
            cc_parts = []
            ccname = cc_csv[i] if i < len(cc_csv) else ""
            ccdiv = cc_div_csv[i] if i < len(cc_div_csv) else ""
            ccemail = cc_email_csv[i] if i < len(cc_email_csv) else ""
            ccmobile = cc_mobile_csv[i] if i < len(cc_mobile_csv) else ""
            if any([ccname, ccdiv, ccemail, ccmobile]):
                if ccname: cc_parts.append(txt(ccname))
                if ccdiv: cc_parts.append(txt(ccdiv))
                if ccemail: cc_parts.append(txt(ccemail))
                if ccmobile: cc_parts.append(txt(ccmobile))
                cc_lines.append(f"CC{i+1}: " + ", ".join(cc_parts))
    # Join Attn/CC lines with line breaks to render stacked entries
    attn_cc_text = "<br/>".join(attn_lines + cc_lines) if (attn_lines or cc_lines) else "-"

    cust_info = [
        [Paragraph(label("SOLD TO"), styles['Normal_Content']), "", Paragraph(f"{label('DATE :')} {txt(details.get('date'))}", styles['Normal_Content'])],
        [Paragraph(f"{label('Company:')} {txt(customer.get('company'))}", styles['Normal_Content']), "", Paragraph(f"{label('Tel :')} {txt(customer.get('telephone'))}", styles['Normal_Content'])],
        [Paragraph(f"{label('Address :')} {txt(customer.get('address'))}", styles['Normal_Content']), "", Paragraph(f"{label('Fax :')} {txt(customer.get('fax'))}", styles['Normal_Content'])],
        # Replace single Attn/Div/Mobile rows with multi-line Attn/CC block per request
        [Paragraph(f"{label('Attn/CC:')} {attn_cc_text}", styles['Normal_Content']), "", ""]
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
                    img_src = r.get('image') or item.get('image')
                    # Support base64 DataURL sent from UI
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
                    # Also support images saved in DB (ImageField) referenced by URL or relative path
                    elif img_src:
                        try:
                            w = int(r.get('image_width') or item.get('spec_image_width') or 64)
                            h = int(r.get('image_height') or item.get('spec_image_height') or 64)
                            src = str(img_src)
                            bio = None
                            path_candidate = None
                            if src.startswith('http'):
                                try:
                                    import requests
                                    resp = requests.get(src, timeout=5)
                                    if resp.status_code == 200:
                                        bio = io.BytesIO(resp.content)
                                except Exception as e:
                                    print(f"Error fetching image via HTTP: {e}")
                            # If not loaded via HTTP, resolve local media path
                            if bio is None:
                                # Normalize to MEDIA_ROOT
                                try:
                                    if '/media/' in src:
                                        sub = src.split('/media/', 1)[1]
                                        path_candidate = os.path.join(settings.MEDIA_ROOT, sub)
                                    elif src.startswith('media/'):
                                        path_candidate = os.path.join(settings.MEDIA_ROOT, src.split('media/', 1)[1])
                                    else:
                                        path_candidate = os.path.join(settings.MEDIA_ROOT, src)
                                except Exception:
                                    path_candidate = None
                            if bio is not None:
                                # Comment: Using in-memory bytes
                                img_obj_spec = Image(bio, width=w, height=h)
                                img_obj_spec.hAlign = 'CENTER'
                            elif path_candidate:
                                full = os.path.normpath(path_candidate)
                                if os.path.exists(full) and os.path.isfile(full):
                                    try:
                                        # Comment: Verify image bytes via Pillow before passing to reportlab
                                        from PIL import Image as PILImage
                                        with open(full, 'rb') as f:
                                            data = f.read()
                                        b = io.BytesIO(data)
                                        try:
                                            pil = PILImage.open(b)
                                            pil.verify()  # Raises if corrupted/unsupported
                                        except Exception as e_verify:
                                            print(f"Spec image verify failed: {e_verify} ({full})")
                                            b = None
                                        if b is not None:
                                            b.seek(0)
                                            img_obj_spec = Image(b, width=w, height=h)
                                            img_obj_spec.hAlign = 'CENTER'
                                    except Exception as e_load:
                                        print(f"Spec image load failed: {e_load} ({full})")
                        except Exception as e:
                            print(f"Error loading spec image from path/url: {e}")
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
        
    # Remove automatic filler rows — end the table at the last populated row
    # per request, especially when there is only one specification row.

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

    # Build PDF with safety fallback to avoid 500 errors
    try:
        doc.build(elements)
    except Exception as e:
        print(f"[PDF BUILD ERROR] {e}")
        # Comment: Build a valid single-page PDF using canvas to avoid invalid minimal header-only bytes
        try:
            from reportlab.pdfgen import canvas
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=A4)
            c.setFont(font_name or "Helvetica", 12)
            c.drawString(72, 800, "Quotation PDF could not be generated due to an internal error.")
            c.drawString(72, 780, f"Error: {str(e)[:120]}")
            c.showPage()
            c.save()
        except Exception as e2:
            # Comment: Last resort minimal valid bytes if canvas fails unexpectedly
            buffer = io.BytesIO(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")
    
    buffer.seek(0)
    # Comment: Use user-provided file name from details.fileName if present
    try:
        desired_name = details.get('fileName')
        # Sanitize: ensure .pdf extension and strip problematic characters
        if isinstance(desired_name, str) and desired_name.strip():
            name = desired_name.strip()
            if not name.lower().endswith('.pdf'):
                name = f"{name}.pdf"
        else:
            name = "quotation.pdf"
    except Exception:
        name = "quotation.pdf"
    resp = HttpResponse(buffer, content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="{name}"'
    return resp

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def generate_quotation_pdf_with_cover(request):
    # Ensure fonts and environment are ready
    ensure_fonts_registered()
    # Early debug path: if ?cover_only=1 is set, serve the cover directly.
    # This avoids calling generate_quotation_pdf when the request method is GET.
    try:
        cover_only_flag = request.query_params.get('cover_only') if hasattr(request, 'query_params') else request.GET.get('cover_only')
    except Exception:
        cover_only_flag = None
    # Resolve cover PDF, allowing client-provided URL or base64 data first
    cover_bytes = None
    try:
        incoming = request.data if hasattr(request, "data") else {}
    except Exception:
        incoming = {}
    try:
        cover_pdf_data = incoming.get("cover_pdf_data")
        cover_pdf_url = incoming.get("cover_pdf_url")
        if isinstance(cover_pdf_data, str) and cover_pdf_data.startswith("data:application/pdf;base64,"):
            try:
                cover_bytes = base64.b64decode(cover_pdf_data.split(",", 1)[1])
            except Exception as e:
                print(f"[COVER DATA DECODE ERROR] {e}")
        if cover_bytes is None and isinstance(cover_pdf_url, str) and cover_pdf_url.startswith("http"):
            try:
                import requests
                r = requests.get(cover_pdf_url, timeout=10)
                if r.status_code == 200 and r.content:
                    cover_bytes = r.content
            except Exception as e:
                print(f"[COVER URL FETCH ERROR] {e}")
    except Exception as e:
        print(f"[COVER READ ERROR] {e}")
    # Resolve cover PDF path under MEDIA_ROOT if not provided by client
    # Support multiple historical locations and filenames for the cover PDF
    cover_candidates = [
        os.path.join(settings.MEDIA_ROOT, "template.pdf"),
        os.path.join(settings.MEDIA_ROOT, "ใบปะหน้า.pdf"),
        os.path.join(settings.MEDIA_ROOT, "cover.pdf"),
        os.path.join(BASE_DIR, 'media', "ใบปะหน้า.pdf"),
        os.path.join(BASE_DIR, 'media', "cover.pdf"),
        os.path.join(BASE_DIR, 'media', "template.pdf"),
        os.path.join(CRM_DIR, 'media', "ใบปะหน้า.pdf"),
        os.path.join(CRM_DIR, 'media', "cover.pdf"),
        os.path.join(CRM_DIR, 'media', "template.pdf"),
        os.path.join(os.path.dirname(BASE_DIR), 'backend', 'media', "ใบปะหน้า.pdf"),
        os.path.join(os.path.dirname(BASE_DIR), 'backend', 'media', "cover.pdf"),
        os.path.join(os.path.dirname(BASE_DIR), 'backend', 'media', "template.pdf"),
        r'd:\EIT_ERT_s\eit-lasertechnik-erp-website\backend\media\template.pdf',
        r'd:\EIT_ERT_s\eit-lasertechnik-erp-website\backend\media\ใบปะหน้า.pdf',
        r'd:\EIT_ERT_s\eit-lasertechnik-erp-website\backend\media\cover.pdf',
    ]
    cover_path = None
    if cover_bytes is None:
        for p in cover_candidates:
            try:
                norm = os.path.normpath(p)
                if os.path.exists(norm):
                    cover_path = norm
                    break
            except Exception:
                continue
    print("MEDIA_ROOT:", settings.MEDIA_ROOT)
    print("Found cover path:", cover_path)
    # Comment: Determine desired output filename from request details.fileName
    try:
        incoming = request.data if hasattr(request, "data") else {}
    except Exception:
        incoming = {}
    try:
        details = incoming.get("details", {}) or {}
        desired_name = details.get("fileName")
        if isinstance(desired_name, str) and desired_name.strip():
            file_name_cover = desired_name.strip()
            if not file_name_cover.lower().endswith(".pdf"):
                file_name_cover += ".pdf"
        else:
            file_name_cover = "quotation_with_cover.pdf"
    except Exception:
        file_name_cover = "quotation_with_cover.pdf"
    if cover_only_flag:
        try:
            bytes_cover = None
            if cover_bytes:
                bytes_cover = cover_bytes
            elif cover_path:
                with open(cover_path, "rb") as f:
                    bytes_cover = f.read()
            if bytes_cover:
                resp = HttpResponse(bytes_cover, content_type='application/pdf')
                resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
                return resp
        except Exception as e:
            print(f"[COVER_ONLY ERROR] {e}")
        # Comment: Fallback — serve a valid single-page PDF generated via canvas to avoid viewer errors
        try:
            from reportlab.pdfgen import canvas
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=A4)
            c.setFont(font_name or "Helvetica", 12)
            c.drawString(72, 800, "Cover PDF not available.")
            c.showPage()
            c.save()
            buf.seek(0)
            resp = HttpResponse(buf, content_type='application/pdf')
        except Exception as e2:
            resp = HttpResponse(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF", content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
        return resp
    # Prefer receiving base PDF via request (base64) to avoid any internal HTTP calls.
    main_bytes = None
    try:
        incoming = request.data if hasattr(request, "data") else {}
        b64 = incoming.get("base_pdf")
        if b64:
            if isinstance(b64, str) and b64.startswith("data:application/pdf;base64,"):
                b64 = b64.split(",", 1)[1]
            try:
                main_bytes = base64.b64decode(b64)
                print(f"[RECEIVED BASE_PDF] len={len(main_bytes)}")
            except Exception as e:
                print(f"[BASE_PDF DECODE ERROR] {e}")
    except Exception as e:
        print(f"[BASE_PDF READ ERROR] {e}")
    # If not provided, try local HTTP as a fallback (may fail in some environments)
    if not main_bytes:
        try:
            import requests
            payload = request.data if hasattr(request, "data") else {}
            url = "http://127.0.0.1:8002/api/generate-quotation-pdf/"
            r = requests.post(url, data=json.dumps(payload), headers={"Content-Type": "application/json"}, timeout=15)
            if r.status_code == 200 and r.content:
                main_bytes = r.content
                print(f"[FETCHED MAIN BYTES VIA HTTP] len={len(main_bytes)}")
            else:
                print(f"[HTTP FETCH FAILED] status={r.status_code} len={len(r.content) if r.content else 0}")
        except Exception as e:
            print(f"[HTTP FETCH ERROR] {e}")
    # Debug: verify we got bytes from the main PDF generator
    print("Merge lib:", MERGE_LIB)
    print("Main bytes length:", len(main_bytes) if main_bytes else "None")
    if not main_bytes:
        # Comment: If base PDF could not be obtained, reply with a valid single-page PDF to avoid viewer errors
        try:
            from reportlab.pdfgen import canvas
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=A4)
            c.setFont(font_name or "Helvetica", 12)
            c.drawString(72, 800, "Quotation PDF not available.")
            c.showPage()
            c.save()
            buf.seek(0)
            resp = HttpResponse(buf, content_type='application/pdf')
        except Exception as e2:
            resp = HttpResponse(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF", content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
        return resp
    # If cover file missing, return the base quotation PDF
    if not cover_path and not cover_bytes:
        resp = HttpResponse(main_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
        return resp
    # If no merge library available, return the base quotation to avoid corrupt output
    if PdfMerger is None and (PdfReader is None or PdfWriter is None):
        resp = HttpResponse(main_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
        return resp
    try:
        # Prefer PdfMerger when available (handles page order cleanly)
        if cover_bytes is None and cover_path:
            with open(cover_path, "rb") as cf:
                cover_bytes = cf.read()
        if PdfMerger:
            merger = PdfMerger()
            merger.append(io.BytesIO(cover_bytes))   # Cover first
            merger.append(io.BytesIO(main_bytes))    # Then quotation
            out = io.BytesIO()
            merger.write(out)
            merger.close()
            out.seek(0)
            merged_bytes = out.getvalue()
        else:
            # In-memory merge using Reader/Writer
            try:
                cover_reader = PdfReader(io.BytesIO(cover_bytes))
                main_reader = PdfReader(io.BytesIO(main_bytes))
            except Exception:
                # Retry with strict=False if supported by library
                try:
                    cover_reader = PdfReader(io.BytesIO(cover_bytes), strict=False)
                    main_reader = PdfReader(io.BytesIO(main_bytes), strict=False)
                except Exception as e2:
                    print(f"[READER INIT ERROR] {e2}")
                    raise
            writer = PdfWriter()
            for pg in getattr(cover_reader, "pages", []):
                writer.add_page(pg)
            for pg in getattr(main_reader, "pages", []):
                writer.add_page(pg)
            out = io.BytesIO()
            writer.write(out)
            out.seek(0)
            merged_bytes = out.getvalue()
        print(f"[MERGED BYTES LENGTH] {len(merged_bytes)}")
        # Write to a file and serve via FileResponse for maximum reliability
        merged_path = os.path.join(settings.MEDIA_ROOT, "quotation_with_cover_latest.pdf")
        try:
            with open(merged_path, "wb") as f:
                f.write(merged_bytes)
            fh = open(merged_path, "rb")
            resp = FileResponse(fh, content_type='application/pdf')
            resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
            resp['Content-Length'] = str(len(merged_bytes))
            return resp
        except Exception as e:
            print(f"[FILE RESPONSE FALLBACK ERROR] {e}")
            resp = HttpResponse(merged_bytes, content_type='application/pdf')
            resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
            resp['Content-Length'] = str(len(merged_bytes))
            return resp
    except Exception as e:
        # Comment: Fallback — try a simpler merge route and guard when cover_path is missing
        print(f"[MERGE IN-MEMORY FAILED] {e}")
        cover_file = None
        try:
            # Comment: If we have no cover bytes and no cover path, return base PDF to avoid 500
            if cover_bytes is None and not cover_path:
                resp = HttpResponse(main_bytes, content_type='application/pdf')
                resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
                return resp
            # Comment: Initialize readers using available sources
            if cover_bytes:
                cover_reader = PdfReader(io.BytesIO(cover_bytes))
            else:
                cover_file = open(cover_path, 'rb')
                cover_reader = PdfReader(cover_file)
            main_reader = PdfReader(io.BytesIO(main_bytes))
            writer = PdfWriter()
            for pg in getattr(cover_reader, "pages", []):
                writer.add_page(pg)
            for pg in getattr(main_reader, "pages", []):
                writer.add_page(pg)
            out = io.BytesIO()
            writer.write(out)
            out.seek(0)
            merged_bytes = out.getvalue()
            print(f"[MERGED BYTES LENGTH (FALLBACK)] {len(merged_bytes)}")
            resp = HttpResponse(merged_bytes, content_type='application/pdf')
            resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
            resp['Content-Length'] = str(len(merged_bytes))
            return resp
        except Exception as e2:
            print(f"[FALLBACK MERGE ERROR] {e2}")
            # Final fallback: return the base quotation PDF bytes
            resp = HttpResponse(main_bytes, content_type='application/pdf')
            resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
            return resp
        finally:
            try:
                if cover_file:
                    cover_file.close()
            except Exception:
                pass
    except Exception as e:
        # Fallback to main PDF if merge fails
        print(f"[PDF MERGE ERROR] {e}")
        # Comment: Ensure we do not attempt to close undefined cover_file in this scope
        # Final fallback: return the base quotation PDF bytes
        resp = HttpResponse(main_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{file_name_cover}"'
        return resp
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
    # Headers: No., Invoice No, Date, Due Date, Amount, Tax Paid Date, Outstanding
    headers = ["No.", "เลขที่ใบกำกับ", "วันที่", "ครบกำหนด", "จำนวนเงิน", "ช ำระแล้วภาษี", "เงินคงค้าง"]
    
    table_data = [[Paragraph(h, styles['Table_Header']) for h in headers]]
    
    total_amount = 0
    total_outstanding = 0
    
    for i, item in enumerate(items):
        amount_raw = str(item.get('amount', 0)).replace(',', '')
        paid_raw = item.get('paid', 0)

        try:
            amount = float(amount_raw)
        except:
            amount = 0

        try:
            paid = float(str(paid_raw).replace(',', ''))
        except:
            paid = 0

        outstanding = amount - paid
            
        total_amount += amount
        total_outstanding += outstanding # Sum of outstanding balances
        
        paid_display = ""
        if paid_raw:
            try:
                paid_display = datetime.strptime(str(paid_raw), '%Y-%m-%d').strftime('%d/%m/%Y')
            except:
                paid_display = str(paid_raw)

        row = [
            Paragraph(str(i + 1), styles['Table_Data_Center']),
            Paragraph(txt(item.get('invoiceNo')), styles['Table_Data_Center']),
            Paragraph(txt(item.get('date')), styles['Table_Data_Center']),
            Paragraph(txt(item.get('dueDate')), styles['Table_Data_Center']),
            Paragraph(f"{amount:,.2f}", styles['Table_Data_Right']),
            Paragraph(paid_display, styles['Table_Data_Center']),
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
    # Separate margins for Tax Invoice vs regular Invoice to keep original Invoice design
    is_tax_invoice_flag = bool(details.get('isTaxInvoice'))
    if is_tax_invoice_flag:
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=35, leftMargin=35, topMargin=25, bottomMargin=25)
    else:
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
    # Step 1: Try to resolve EIT record by FK 'eit' (primary key id) and use its header_image from DB.
    # Step 2: If unavailable, fall back to static header images based on organization name text.
    eit_id = details.get('eit')
    organization = None
    header_image_path = None
    
    if eit_id:
        try:
            # Load EIT model and fetch the selected organization by its primary key.
            from .models import EIT
            eit_obj = EIT.objects.get(pk=eit_id)
            organization = eit_obj.organization_name
            # If the EIT record has an uploaded header image, prefer that for the PDF header.
            if getattr(eit_obj, "header_image", None):
                header_image_path = eit_obj.header_image.path
        except Exception:
            # Silently ignore lookup errors; we will fall back to static images below.
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

    # Build candidate header image list:
    # - Highest priority: header image file from EIT table (if present)
    # - Next: static image for Einstein when organization indicates Einstein
    # - Next: static image for EIT (default)
    candidates = []
    if header_image_path:
        # Place DB image first so it is selected if the file exists
        candidates.append((os.path.normpath(header_image_path), 530, 80))
    if is_tax_invoice_flag:
        candidates.extend([
            (os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80),
        ])
    elif is_einstein:
        candidates.extend([
            (os.path.join(PUBLIC_DIR, 'Einstein header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'Einstein header.png'), 530, 80),
        ])
    else:
        candidates.extend([
            (os.path.join(PUBLIC_DIR, 'EIT header.png'), 530, 80),
            (os.path.join(DIST_DIR, 'EIT header.png'), 530, 80),
        ])
    
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
    
    # Decide layout by flag
    is_tax = is_tax_invoice_flag

    # Header Title Table
    header_table_data = (
        [
            [Paragraph("ต้นฉบับ", styles['Header_Title_Bold']) , ""],
            [Paragraph("Original", styles['Header_Title_Bold']), ""],
            [Paragraph("ใบกำกับภาษี/ใบส่งของ", styles['Header_Title_Bold']), ""],
            [Paragraph("TAX INVOICE/DELIVERY ORDER", styles['Header_Title_Bold']), ""]
        ]
        if is_tax else
        [
            [Paragraph("ใบแจ้งหนี้", styles['Header_Title_Bold']), Paragraph("ต้นฉบับ", styles['Header_Title_Bold'])],
            [Paragraph("INVOICE", styles['Header_Title_Bold']), Paragraph("Original", styles['Header_Title_Bold'])],
            [Paragraph("ไม่ใชใบกำกับภาษี", styles['Table_Data_Center']), ""]
        ]
    )
    header_table = Table(header_table_data, colWidths=[140, 60])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))

    # Details Table (No / Date)
    inv_num = details.get('number', '')

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
    # Build Customer info block (used on Tax Invoice left column)
    # Move customer to the left column and remove EIT text block when generating Tax Invoice
    cust_tax = customer.get('taxId', '')
    cust_branch = customer.get('branch', '')
    cust_name = customer.get('name', '') or customer.get('company', '')
    cust_addr = customer.get('address', '') or customer.get('billingAddress1', '')
    cust_tel = customer.get('telephone', '')
    cust_fax = customer.get('fax', '')
    cust_left_elements = [
        Paragraph(f"<b>{cust_branch or 'สำนักงานใหญ่'}</b>   <b>เลขประจำตัวผู้เสียภาษี</b> {cust_tax}", styles['Normal_Content']),
        Paragraph("<b>ลูกค้า (customer)</b>", styles['Normal_Bold']),
        Paragraph(f"<b>ชื่อ</b> {cust_name}", styles['Normal_Content']),
        Paragraph(f"<b>ที่อยู่</b> {cust_addr}", styles['Normal_Content']),
    ]
    if cust_tel or cust_fax:
        cust_left_elements.append(
            Paragraph(f"<b>Tel</b> {cust_tel or '-'}    <b>Fax</b> {cust_fax or '-'}", styles['Normal_Content'])
        )

    # Default left block (company org) for non-tax documents
    left_info_elements = []
    left_info_elements.append(Paragraph(org_name_th, styles['Normal_Content']))
    left_info_elements.append(Paragraph(org_name_en, styles['Normal_Content']))
    left_info_elements.append(Paragraph(org_addr, styles['Normal_Content']))
    left_info_elements.append(Paragraph(org_contact, styles['Normal_Content']))
    left_info_elements.append(Spacer(1, 25)) # Explicit spacer to push bottom content
    left_info_elements.append(tax_table)

    if is_tax and not is_einstein:
        # Comment: For Tax Invoice, generate 5 pages with distinct header text per page.
        # Page 1: Tax Invoice Original
        # Page 2–3: Tax Invoice Copy (with extra note "ไม่ใช่ใบกำกับภาษี")
        # Page 4: Receipt Original (thai+english) with "เอกสารออกเป็นชุด" and "ไม่ใช่ใบกำกับภาษี"
        # Page 5: Receipt Copy (thai+english) with "เอกสารออกเป็นชุด" and "ไม่ใช่ใบกำกับภาษี"
        first_lines = ["ต้นฉบับ/ Original", "ใบกำกับภาษี/ใบส่งสินค้า", "TAX INVOICE/DELIVERY ORDER", "เอกสารออกเป็นชุด"]
        copy_lines = ["สำเนา / Copy", "ใบกำกับภาษี/ใบส่งสินค้า", "TAX INVOICE/DELIVERY ORDER", "เอกสารออกเป็นชุด"]
        # Comment: Append non-tax note only to 2nd and 3rd pages
        copy_lines_with_note = copy_lines + ["ไม่ใช่ใบกำกับภาษี"]
        # Comment: Define Receipt (Original/Copy) header lines for pages 4 and 5 respectively
        receipt_original_lines = ["ต้นฉบับ ใบเสร็จรับเงิน", "Receipt (Original)", "เอกสารออกเป็นชุด", "ไม่ใช่ใบกำกับภาษี"]
        receipt_copy_lines = ["สำเนา ใบเสร็จรับเงิน", "Receipt (Copy)", "เอกสารออกเป็นชุด", "ไม่ใช่ใบกำกับภาษี"]
        variants = [first_lines, copy_lines_with_note, copy_lines_with_note, receipt_original_lines, receipt_copy_lines]
        all_elements = []
        for idx, header_lines in enumerate(variants):
            local_elements = []
            # Place EIT header image at the top of each page if available
            if 'found_image' in locals() and found_image:
                try:
                    im = Image(found_image[0], width=found_image[1], height=found_image[2])
                    im.hAlign = 'CENTER'
                    local_elements.append(im)
                    local_elements.append(Spacer(1, 5))
                except Exception:
                    pass
            header_style = ParagraphStyle(name='Header_Title_Small', parent=styles['Header_Title_Bold'], fontSize=12, leading=14)
            header_table_data = [[Paragraph(t, header_style)] for t in header_lines]
            header_table = Table(header_table_data, colWidths=[190])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            # Wrap header in a framed box and center it within the right panel
            header_frame = Table([[header_table]], colWidths=[200], rowHeights=[120])
            header_frame.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('LEFTPADDING', (0,0), (-1,-1), 4),
                ('RIGHTPADDING', (0,0), (-1,-1), 4),
            ]))
            right_info = [
                header_frame,
                Spacer(1, 6),
                Table([
                    [Paragraph("เลขที่ (No.)", styles['Table_Data_Center']), Paragraph(inv_num, styles['Table_Data_Center'])],
                    [Paragraph("วันที่ (Issue Date)", styles['Table_Data_Center']), Paragraph(details.get('date',''), styles['Table_Data_Center'])]
                ], colWidths=[100, 100], style=TableStyle([
                    ('BOX', (0,0), (-1,-1), 1, colors.black),
                    ('INNERGRID', (0,0), (-1,-1), 1, colors.black),
                    ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
                ]))
            ]
            # For Tax Invoice, place Customer info in the left column (remove EIT text block)
            left_block = cust_left_elements if is_tax else [
                Paragraph(org_name_th, styles['Normal_Content']),
                Paragraph(org_name_en, styles['Normal_Content']),
                Paragraph(org_addr, styles['Normal_Content']),
                Paragraph(org_contact, styles['Normal_Content']),
                Spacer(1, 15),
                tax_table
            ]
            row1 = Table([[left_block, right_info]], colWidths=[330, 205])
            row1.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('LINEBEFORE', (1,0), (1,0), 1, colors.black),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('VALIGN', (1,0), (1,0), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (0,0), 5),
            ]))
            local_elements.append(row1)
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
            # Row 2: show payment-only for Tax Invoice since customer moved to Row 1 left column
            if is_tax:
                row2 = Table([[pay_col]], colWidths=[535])
                row2.setStyle(TableStyle([
                    ('BOX', (0,0), (-1,-1), 1, colors.black),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ]))
            else:
                row2 = Table([[cust_left_elements, pay_col]], colWidths=[350, 185])
                row2.setStyle(TableStyle([
                    ('BOX', (0,0), (-1,-1), 1, colors.black),
                    ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ]))
            local_elements.append(row2)
            table_data = [[
                Paragraph("รายการ<br/>Description", styles['Table_Header']),
                Paragraph("ราคาขายไม่รวมภาษี<br/>Sales ex. Vat", styles['Table_Header']),
                Paragraph("จำนวน<br/>Qty", styles['Table_Header']),
                Paragraph("หน่วยนับ<br/>Unit", styles['Table_Header']),
                Paragraph("จำนวนเงิน<br/>Amount", styles['Table_Header'])
            ]]
            for i, item in enumerate(items):
                try:
                    qty = float(str(item.get('qty', 0)).replace(',', ''))
                    price = float(str(item.get('price', 0)).replace(',', ''))
                except:
                    qty, price = 0, 0
                total = qty * price
                base_desc = txt(item.get('description', ''))
                desc_text = base_desc
                spec_rows = item.get('spec_rows') or []
                spec_lines_legacy = item.get('spec_lines') or []
                unit = item.get('unit', 'Pc.')
                table_data.append([
                    Paragraph(desc_text, styles['Table_Data']),
                    Paragraph(f"{price:,.2f}", styles['Table_Data_Right']),
                    Paragraph(f"{qty:,.0f}", styles['Table_Data_Center']),
                    Paragraph(unit, styles['Table_Data_Center']),
                    Paragraph(f"{total:,.2f}", styles['Table_Data_Right'])
                ])
                if spec_rows and isinstance(spec_rows, list):
                    try:
                        for idx2, r in enumerate(spec_rows):
                            lines = r.get('lines') or []
                            bullets = "<br/>".join([f"• {txt(line)}" for line in lines if str(line).strip() != ""])
                            table_data.append([
                                Paragraph(bullets, styles['Table_Data']),
                                "", "", "", ""
                            ])
                    except Exception:
                        pass
                elif spec_lines_legacy:
                    bullets = "<br/>" + "<br/>".join([f"• {txt(line)}" for line in spec_lines_legacy])
                    table_data.append([
                        Paragraph(bullets, styles['Table_Data']),
                        "", "", "", ""
                    ])
            min_rows = 8
            if len(items) < min_rows:
                for _ in range(min_rows - len(items)):
                    table_data.append(["", "", "", "", ""])
            item_table = Table(table_data, colWidths=[240, 100, 40, 50, 105])
            item_table.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
                ('ALIGN', (0,0), (-1,0), 'CENTER'),
                ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
                ('VALIGN', (0,1), (-1,-1), 'TOP'),
                ('FONTNAME', (0,0), (-1,-1), font_name),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                # Keep vertical separators only, remove horizontal grid lines
                ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
                ('LINEBEFORE', (2,0), (2,-1), 1, colors.black),
                ('LINEBEFORE', (3,0), (3,-1), 1, colors.black),
                ('LINEBEFORE', (4,0), (4,-1), 1, colors.black),
            ]))
            local_elements.append(item_table)
            subtotal = totals.get('subtotal', 0)
            vat = totals.get('taxTotal', 0)
            grand_total = totals.get('total', 0)
            discount = totals.get('discount', 0)
            net_amount = max(subtotal - discount, 0)
            total_data = [
                ["", "ส่วนลด\nDiscount", f"{discount:,.2f}"],
                ["", "จำนวนเงินสุทธิ\nNet Amount", f"{net_amount:,.2f}"],
                ["", "ภาษีมูลค่าเพิ่ม\nVAT 7%", f"{vat:,.2f}"],
                ["", "รวมเป็นมูลค่า\nTotal of sales", f"{grand_total:,.2f}"]
            ]
            total_table = Table(total_data, colWidths=[280, 150, 105])
            total_table.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('INNERGRID', (1,0), (-1,-1), 1, colors.black),
                ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
                ('ALIGN', (2,0), (2,-1), 'RIGHT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('FONTNAME', (0,0), (-1,-1), font_name),
                ('FONTSIZE', (0,0), (-1,-1), 9),
            ]))
            text_amt = totals.get('thaiText', '-')
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
            pay_row = Table([[Paragraph("ชำระเงินโดย", styles['Normal_Content']), ""]], colWidths=[150, 385])
            pay_row.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('LINEBEFORE', (1,0), (1,0), 1, colors.black),
            ]))
            def sig_cell(role_th, role_en):
                title = Paragraph(f"{role_th} {role_en}", styles['Table_Data_Center'])
                sub_data = [
                    ["(", "", ")"],
                    ["วันที่", "", ""]
                ]
                sub_table = Table(sub_data, colWidths=[25, 100, 25], rowHeights=[35, 25])
                sub_table.setStyle(TableStyle([
                    ('FONTNAME', (0,0), (-1,-1), font_name),
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
                    ('LINEBELOW', (1,0), (1,0), 0.5, colors.black),
                    ('LINEBELOW', (1,1), (1,1), 0.5, colors.black),
                    ('ALIGN', (0,1), (0,1), 'RIGHT'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ]))
                return [title, Spacer(1, 5), sub_table]
            sig_data = [[
                sig_cell("ผู้รับสินค้า", "Receiver"),
                sig_cell("ผู้ส่งสินค้า", "Deliverer"),
                sig_cell("ผู้มีอำนาจลงนาม", "Authorized Signature")
            ]]
            sig_table = Table(sig_data, colWidths=[178, 178, 179])
            sig_table.setStyle(TableStyle([
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('GRID', (0,0), (-1,-1), 1, colors.black),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            local_elements.append(KeepTogether([total_table, text_row, pay_row, sig_table]))
            all_elements.extend(local_elements)
            if idx < len(variants) - 1:
                all_elements.append(PageBreak())
        try:
            doc.build(all_elements)
        except Exception as e:
            print(f"PDF Build Error: {e}")
            raise e
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')
    # For Tax Invoice, replace left_info with customer block; otherwise keep org info
    row1_left = cust_left_elements if is_tax else left_info_elements
    row1 = Table([[row1_left, right_info]], colWidths=[330, 205])
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

    # Row 2: payment-only for Tax Invoice since customer moved to Row 1
    if is_tax:
        row2 = Table([[pay_col]], colWidths=[535])
        row2.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
    else:
        row2 = Table([[cust_left_elements, pay_col]], colWidths=[350, 185])
        row2.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.black),
            ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
    elements.append(row2)

    # --- Row 3: Items Table ---
    # Columns differ for tax vs non-tax
    if is_tax:
        table_data = [[
            Paragraph("รายการ<br/>Description", styles['Table_Header']),
            Paragraph("ราคาขายไม่รวมภาษี<br/>Sales ex. Vat", styles['Table_Header']),
            Paragraph("จำนวน<br/>Qty", styles['Table_Header']),
            Paragraph("หน่วยนับ<br/>Unit", styles['Table_Header']),
            Paragraph("ส่วนลด<br/>Discount", styles['Table_Header']),
            Paragraph("จำนวนเงิน<br/>Amount", styles['Table_Header'])
        ]]
    else:
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
        except:
            qty, price = 0, 0
        try:
            discount_val = float(str(item.get('discount', 0)).replace(',', ''))
        except:
            discount_val = 0
        total = max(qty * price - discount_val, 0)
        # Base description without running number prefix
        base_desc = txt(item.get('description', ''))
        desc_text = base_desc
        spec_rows = item.get('spec_rows') or []
        spec_lines_legacy = item.get('spec_lines') or []
        unit = item.get('unit', 'Pc.')
        
        if is_tax:
            table_data.append([
                Paragraph(desc_text, styles['Table_Data']),
                Paragraph(f"{price:,.2f}", styles['Table_Data_Right']),
                Paragraph(f"{qty:,.0f}", styles['Table_Data_Center']),
                Paragraph(unit, styles['Table_Data_Center']),
                Paragraph(f"{discount_val:,.2f}", styles['Table_Data_Right']),
                Paragraph(f"{total:,.2f}", styles['Table_Data_Right'])
            ])
        else:
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
                        Paragraph(bullets, styles['Table_Data']),
                        "", "", "", ""
                    ])
                # Legacy single spec block -> number as i.1
            except Exception:
                pass
        elif spec_lines_legacy:
            bullets = "<br/>" + "<br/>".join([f"• {txt(line)}" for line in spec_lines_legacy])
            if is_tax:
                table_data.append([
                    Paragraph(bullets, styles['Table_Data']),
                    "", "", "", ""
                ])
            else:
                table_data.append([
                    "", Paragraph(bullets, styles['Table_Data']),
                    "", "", "", ""
                ])


    min_rows = 8 if is_tax else 10
    if len(items) < min_rows:
        for _ in range(min_rows - len(items)):
            table_data.append(["", "", "", "", "", ""] if is_tax else ["", "", "", "", "", ""])

    # Widths
    if is_tax:
        # Desc(210), Sales(85), Qty(40), Unit(50), Discount(50), Amount(100) -> Total 535
        item_table = Table(table_data, colWidths=[210, 85, 40, 50, 50, 100])
    else:
        # No(30), Desc(220), Qty(40), Unit(50), Price(90), Amount(105)
        item_table = Table(table_data, colWidths=[30, 220, 40, 50, 90, 105])
    if is_tax:
        # Remove vertical grid lines; keep outer box and horizontal lines
        item_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.black),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
            ('VALIGN', (0,1), (-1,-1), 'TOP'),
            ('FONTNAME', (0,0), (-1,-1), font_name),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LINEBELOW', (0,0), (-1,0), 1, colors.black),   # header underline
            ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.black) # horizontal row lines
        ]))
    else:
        item_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.black),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('VALIGN', (0,0), (-1,0), 'MIDDLE'),
            ('VALIGN', (0,1), (-1,-1), 'TOP'),
            ('FONTNAME', (0,0), (-1,-1), font_name),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            # Keep only vertical separators; remove horizontal lines
            ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
            ('LINEBEFORE', (2,0), (2,-1), 1, colors.black),
            ('LINEBEFORE', (3,0), (3,-1), 1, colors.black),
            ('LINEBEFORE', (4,0), (4,-1), 1, colors.black),
            ('LINEBEFORE', (5,0), (5,-1), 1, colors.black),
        ]))
    elements.append(item_table)

    # --- Row 4: Totals ---
    subtotal = totals.get('subtotal', 0)
    vat = totals.get('taxTotal', 0)
    grand_total = totals.get('total', 0)
    discount = totals.get('discount', 0)
    net_amount = max(subtotal - discount, 0)
    
    total_data = [
        ["", "ส่วนลด\nDiscount", f"{discount:,.2f}"],
        ["", "จำนวนเงินสุทธิ\nNet Amount", f"{net_amount:,.2f}"],
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
    # Defer appending totals; we will KeepTogether with following blocks for Tax Invoice only

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

    # --- Row 6: Payment By ---
    pay_row = Table([[Paragraph("ชำระเงินโดย", styles['Normal_Content']), ""]], colWidths=[150, 385])
    pay_row.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('LINEBEFORE', (1,0), (1,0), 1, colors.black),
    ]))
    # Group totals, text amount and payment rows together with signatures to keep on same page (Tax Invoice only)

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
    if is_tax:
        elements.append(KeepTogether([total_table, text_row, pay_row, sig_table]))
    else:
        elements.append(total_table)
        elements.append(text_row)
        elements.append(pay_row)
        elements.append(KeepTogether(sig_table))

    try:
        doc.build(elements)
    except Exception as e:
        print(f"PDF Build Error: {e}")
        raise e
    
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')
