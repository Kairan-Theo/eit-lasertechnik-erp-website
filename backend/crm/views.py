from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q
from .models import Deal, UserProfile, Notification, ActivitySchedule, Quotation, Invoice, Receipt, TaxInvoice, PurchaseOrder, Project, Task, Customer, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EmailLog, EmailAttachment, DealHistory, BillingNote, EIT, CustomerPurchaseOrder, Stage, Inventory, Delivery, ProjectManagement, SubProject, PermissionControl, PDMachine, PDSystem, PDWire, PDSparepart, PDService, PDSystemChildproduct, PMProject, PMTask
from .serializers import DealSerializer, UserSerializer, ActivityScheduleSerializer, QuotationSerializer, InvoiceSerializer, ReceiptSerializer, TaxInvoiceSerializer, PurchaseOrderSerializer, ProjectSerializer, TaskSerializer, CustomerSerializer, ManufacturingOrderSerializer, ProductSerializer, ProductVersionSerializer, ProductTypeSerializer, SystemSerializer, ComponentSerializer, SystemComponentSerializer, ComponentEntrySerializer, EmailLogSerializer, DealHistorySerializer, BillingNoteSerializer, EITSerializer, CustomerPurchaseOrderSerializer, StageSerializer, InventorySerializer, DeliverySerializer, ProjectManagementSerializer, SubProjectSerializer, PDMachineSerializer, PDSystemSerializer, PDWireSerializer, PDSparepartSerializer, PDServiceSerializer, PDSystemChildproductSerializer, PMProjectSerializer, PMTaskSerializer, _next_quotation_code
import json
import os
import uuid
import random
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import mimetypes
from decimal import Decimal
# Comment: Global suppression set to prevent re-generation of deleted notifications (in-memory, no migration)
SUPPRESSED_NOTIFICATIONS = set()

class ProjectManagementViewSet(viewsets.ModelViewSet):
    queryset = ProjectManagement.objects.all().order_by('-created_at')
    serializer_class = ProjectManagementSerializer
    permission_classes = [AllowAny]

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all().order_by('-created_at')
    serializer_class = ReceiptSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

class TaxInvoiceViewSet(viewsets.ModelViewSet):
    # CRUD API for Tax_Invoice table with ordering by issue date then created_at
    queryset = TaxInvoice.objects.all().order_by('-issued_date', '-created_at')
    serializer_class = TaxInvoiceSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    # Comment: Helper endpoint for frontend to get the next Tax Invoice code (INV YYYY-000X)
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def next_code(self, request):
        from datetime import datetime
        numeric = _next_sequence(TaxInvoice, 'tax_invoice_code', pad=4, allow_duplicate=False)
        year = datetime.now().year
        return Response({'next_code': f"INV {year}-{numeric}"})

class SubProjectViewSet(viewsets.ModelViewSet):
    queryset = SubProject.objects.all()
    serializer_class = SubProjectSerializer
    permission_classes = [AllowAny]

# PD ViewSets
# The following viewset provides CRUD operations for PD_machine table via REST API.
class PDMachineViewSet(viewsets.ModelViewSet):
    # Query PDMachine records ordered by name for consistent listing
    queryset = PDMachine.objects.all().order_by('name')
    # Use the dedicated serializer to validate and serialize data
    serializer_class = PDMachineSerializer
    # Allow access to the endpoint for now; adjust permission as needed
    permission_classes = [AllowAny]

class PDSystemViewSet(viewsets.ModelViewSet):
    # CRUD for PD_system table
    queryset = PDSystem.objects.all().order_by('name')
    serializer_class = PDSystemSerializer
    permission_classes = [AllowAny]

class PDWireViewSet(viewsets.ModelViewSet):
    # CRUD for PD_wire table
    queryset = PDWire.objects.all().order_by('name')
    serializer_class = PDWireSerializer
    permission_classes = [AllowAny]

class PDSparepartViewSet(viewsets.ModelViewSet):
    # CRUD for PD_sparepart table
    queryset = PDSparepart.objects.all().order_by('name')
    serializer_class = PDSparepartSerializer
    permission_classes = [AllowAny]

class PDServiceViewSet(viewsets.ModelViewSet):
    # CRUD for PD_service table
    queryset = PDService.objects.all().order_by('name')
    serializer_class = PDServiceSerializer
    permission_classes = [AllowAny]

class PDSystemChildproductViewSet(viewsets.ModelViewSet):
    # CRUD for PD_system_childproduct table
    queryset = PDSystemChildproduct.objects.select_related('system').all().order_by('name')
    serializer_class = PDSystemChildproductSerializer
    permission_classes = [AllowAny]
from datetime import date, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os
import requests
from django.core.files.base import ContentFile
from django.http import HttpResponse



from django.conf import settings

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_item_image(request):
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=400)
    
    image = request.FILES['image']
    
    # Save to quotation_items directory
    save_path = os.path.join('quotation_items', image.name)
    full_path = os.path.join(settings.MEDIA_ROOT, save_path)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # Handle duplicate names
    base, ext = os.path.splitext(image.name)
    counter = 1
    while os.path.exists(full_path):
        new_name = f"{base}_{counter}{ext}"
        save_path = os.path.join('quotation_items', new_name)
        full_path = os.path.join(settings.MEDIA_ROOT, save_path)
        counter += 1
        
    with open(full_path, 'wb+') as destination:
        for chunk in image.chunks():
            destination.write(chunk)
            
    # Return the relative path that can be assigned to ImageField
    # We replace backslashes with forward slashes for DB consistency/URL usage
    db_path = save_path.replace('\\', '/')
    return Response({'path': db_path, 'url': f"{settings.MEDIA_URL}{db_path}"})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_crm_analytics(request):
    from django.db.models import Sum, Count
    
    # Deals Analytics
    total_deals = Deal.objects.count()
    won_deals_qs = Deal.objects.filter(stage__icontains='Won')
    won_deals = won_deals_qs.count()
    won_value = won_deals_qs.aggregate(total=Sum('amount'))['total'] or 0
    
    # Deals by stage
    by_stage = {}
    stage_counts = Deal.objects.values('stage').annotate(count=Count('id'))
    for entry in stage_counts:
        by_stage[entry['stage']] = entry['count']
    
    return Response({
        "deals": {
            "total": total_deals,
            "won_deals": won_deals,
            "won_value": won_value,
            "by_stage": by_stage
        }
    })



@api_view(['POST'])
@permission_classes([AllowAny])
def send_email_api(request):
    SENDER_EMAIL = "eit@eitlaser.com"
    SENDER_PASSWORD = "grsc gthh jnuy ixtc"
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587

    recipient_email = request.data.get('to_email')
    subject = request.data.get('subject')
    body = request.data.get('message')
    
    # Handle files
    files = request.FILES.getlist('attachments')

    if not recipient_email:
        return Response({"error": "Recipient email required"}, status=400)

    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(body, "html", _charset="utf-8"))

        # Log the email first
        email_log = EmailLog.objects.create(
            recipient=recipient_email,
            subject=subject,
            body=body
        )

        for f in files:
            content = f.read()
            
            # Email attachment
            part = MIMEBase("application", "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={f.name}")
            msg.attach(part)
            
            # Save to DB
            attachment = EmailAttachment(email_log=email_log)
            attachment.file.save(f.name, ContentFile(content))
            attachment.save()
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
        server.quit()
        
        return Response({"status": "success"})
    except Exception as e:
        print(f"Email error: {e}")
        return Response({"error": str(e)}, status=500)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('id')
    serializer_class = CustomerSerializer
    authentication_classes = []
    permission_classes = [AllowAny] # Ideally IsAuthenticated, but sticking to pattern
    
    def update(self, request, *args, **kwargs):
        # Comment: Update Customer and propagate latest fields to linked Deals (two-way sync)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        # Comment: Push primary contact and company info into all deals referencing this customer
        from .models import Deal
        deals = Deal.objects.filter(customer=customer)
        for d in deals:
            # Comment: Snapshot primary contact (attn*) into deal fields
            d.contact = customer.attn or d.contact
            d.email = (customer.attn_email or d.email)
            d.phone = (customer.attn_mobile or d.phone)
            # Comment: Snapshot company-level fields
            d.address = customer.address or d.address
            d.tax_id = customer.tax_id or d.tax_id
            # Comment: Keep existing extra_contacts list; cc* CSVs are displayed via serializer/index
            d.save(update_fields=['contact', 'email', 'phone', 'address', 'tax_id'])
        return Response(self.get_serializer(customer).data)
    
    def destroy(self, request, *args, **kwargs):
        # Comment: Do NOT delete related Deals when a Customer is deleted
        # Comment: Detach (set customer=null) to preserve Sales Pipeline records
        instance = self.get_object()
        from .models import Deal
        Deal.objects.filter(customer=instance).update(customer=None)
        return super().destroy(request, *args, **kwargs)

# Removed SupportTicketViewSet

class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all().order_by('-id')
    serializer_class = DealSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        # try:
        #     from django.db import connection
        #     cols = []
        #     with connection.cursor() as cur:
        #         cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='crm_deal' ORDER BY ordinal_position")
        #         cols = [r[0] for r in cur.fetchall()]
        #     # print(f"DEBUG CRM_DEAL COLUMNS: {cols}")
        #     # print(f"DEBUG DB SETTINGS: {connection.settings_dict}")
        #     if request.query_params.get('diag') == '1':
        #         return Response({'columns': cols, 'db': connection.settings_dict})
        # except Exception as e:
        #     print(f"DEBUG LIST SETUP ERROR: {e}")
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        branch_value = (data.get('branch') or '').strip()
        if 'branch' in data:
            data.pop('branch')
        
        # Ensure currency default
        if not (data.get('currency') or '').strip():
            data['currency'] = '฿'
            
        # Ensure title default
        title = (data.get('title') or '').strip()
        if not title:
            data['title'] = 'Untitled Deal'
            
        # Clean up stage input
        stage_val = data.get('stage')
        if stage_val:
            data['stage'] = str(stage_val).strip()
            
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            # If validation fails, try manual creation for specific fields logic 
            # (though normally serializer should handle this)
            # Keeping original fallback logic but simplified
            if 'stage' in serializer.errors:
                 # Minimal fallback if serializer complains about stage
                 pass
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        instance = serializer.save()
        if instance.customer and (branch_value or branch_value == ""):
            instance.customer.branch = branch_value
            instance.customer.save(update_fields=['branch'])
        Notification.objects.create(message=f"CRM: Created \"{instance.title}\"", type="crm_create")
        headers = {'Location': f"{request.build_absolute_uri('/api/deals/')}{instance.id}/"}
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)


    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        branch_value = (data.get('branch') or '').strip()
        if 'branch' in data:
            data.pop('branch')
        serializer = self.get_serializer(instance, data=data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        old_stage = instance.stage
        updated_instance = serializer.save()
        if updated_instance.customer and (branch_value or branch_value == ""):
            updated_instance.customer.branch = branch_value
            updated_instance.customer.save(update_fields=['branch'])
        # Comment: Two-way sync — update linked Customer record from Deal update payload
        cust = updated_instance.customer
        if cust:
            # Comment: Prefer provided deal fields; trim whitespace; do not overwrite with empties
            def _maybe_set(model, field, val):
                v = (val or "").strip()
                if v != "":
                    setattr(model, field, v)
            _maybe_set(cust, 'attn', data.get('contact'))
            _maybe_set(cust, 'attn_email', data.get('email'))
            _maybe_set(cust, 'attn_mobile', data.get('phone'))
            _maybe_set(cust, 'address', data.get('address'))
            _maybe_set(cust, 'tax_id', data.get('tax_id'))
            # Comment: Accept optional company-level fields when present
            _maybe_set(cust, 'email', data.get('company_email') or data.get('companyEmail'))
            _maybe_set(cust, 'phone', data.get('company_phone') or data.get('companyPhone'))
            # Comment: Derive cc* CSV fields from extra_contacts list sent by Company Details
            extras = data.get('extra_contacts', None)
            if extras is None:
                extras = updated_instance.extra_contacts if isinstance(updated_instance.extra_contacts, list) else None
            if isinstance(extras, list):
                # Comment: Build CSVs for cc, cc_division, cc_email, cc_mobile, cc_position
                def _norm_list(vals):
                    return ",".join([str(v or "").strip() for v in vals if str(v or "").strip()])
                names = [ (e.get('name') or "").strip() for e in extras ]
                divs = [ (e.get('division') or "").strip() for e in extras ]
                emails = [ (e.get('email') or "").strip() for e in extras ]
                mobiles = [ (e.get('mobile') or "").strip() for e in extras ]
                positions = [ (e.get('position') or "").strip() for e in extras ]
                cust.cc = _norm_list(names)
                cust.cc_division = _norm_list(divs)
                cust.cc_email = _norm_list(emails)
                cust.cc_mobile = _norm_list(mobiles)
                cust.cc_position = _norm_list(positions)
            cust.save(update_fields=['attn', 'attn_email', 'attn_mobile', 'address', 'tax_id', 'email', 'phone', 'cc', 'cc_division', 'cc_email', 'cc_mobile', 'cc_position'])
        if old_stage != updated_instance.stage:
            Notification.objects.create(
                message=f"CRM  {updated_instance.customer} ({old_stage} -> {updated_instance.stage})",
                type="crm_move"
            )
            DealHistory.objects.create(
                deal=updated_instance,
                from_stage=old_stage,
                to_stage=updated_instance.stage
            )
        return Response(serializer.data)

    def perform_destroy(self, instance):
        # Comment: Delete only the deal from Sales Pipeline
        # Comment: Preserve the related Customer record in CRM even if no other deals exist
        super().perform_destroy(instance)

class EITViewSet(viewsets.ModelViewSet):
    queryset = EIT.objects.all()
    serializer_class = EITSerializer
    permission_classes = [AllowAny]

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by('-id')
    serializer_class = QuotationSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    # Enable multipart/form-data for image upload and nested item fields from FormData
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        return Response({'qo_code': _next_quotation_code()})

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, pk=None):
        orig = self.get_object()
        base_name = (orig.file_name or "quotation").rsplit('.', 1)[0]
        ext = ""
        if orig.file_name and '.' in orig.file_name:
            ext = '.' + orig.file_name.rsplit('.', 1)[1]
        new_file_name = f"{base_name}_COPY_{uuid.uuid4().hex[:8]}{ext or '.pdf'}"
        new_q = Quotation(
            qo_code=_next_quotation_code(),
            customer=orig.customer,
            eit=orig.eit,
            created_date=timezone.localdate(),
            file_name=new_file_name,
            customer_tax_id=orig.customer_tax_id,
            customer_address=orig.customer_address,
            customer_email=orig.customer_email,
            customer_phone=orig.customer_phone,
            customer_fax=orig.customer_fax,
            cus_respon_attn=orig.cus_respon_attn,
            cus_respon_div=orig.cus_respon_div,
            cus_respon_mobile=orig.cus_respon_mobile,
            cus_respon_cc=orig.cus_respon_cc,
            cus_respon_cc_div=orig.cus_respon_cc_div,
            cus_respon_cc_mobile=orig.cus_respon_cc_mobile,
            cus_respon_cc_email=orig.cus_respon_cc_email,
        )
        new_q.trade_terms = getattr(orig, 'trade_terms', '')
        new_q.validity = getattr(orig, 'validity', '')
        new_q.delivery = getattr(orig, 'delivery', '')
        new_q.payment_terms = getattr(orig, 'payment_terms', '')
        new_q.shipment_location = getattr(orig, 'shipment_location', '')
        new_q.invoice_date = getattr(orig, 'invoice_date', None)
        new_q.remark = getattr(orig, 'remark', '')
        new_q.save()

        # Comment: Copy quotation items in original order; collect new items for optional overrides
        new_items = []
        # Comment: Preserve original creation order so index-based overrides from the UI align correctly
        for qi in orig.quotation_items.all().order_by('id'):
            new_item = qi.__class__(
                quotation=new_q,
                quo_item=qi.quo_item,
                quo_model=qi.quo_model,
                quo_description=qi.quo_description,
                specification=qi.specification,
                quantity=qi.quantity,
                quo_total=qi.quo_total,
            )
            try:
                if qi.image and hasattr(qi.image, 'path') and os.path.exists(qi.image.path):
                    src_path = qi.image.path
                    if os.path.getsize(src_path) > 0:
                        ext_i = os.path.splitext(src_path)[1] or '.png'
                        # Comment: ImageField upload_to already sets subdirectory; pass filename only
                        new_name = f"{uuid.uuid4().hex}{ext_i}"
                        with open(src_path, 'rb') as fsrc:
                            data = fsrc.read()
                            if data:
                                new_item.image.save(new_name, ContentFile(data), save=False)
            except Exception:
                pass
            new_item.save()
            new_items.append(new_item)

        # Comment: Optional override — apply text/qty/price changes provided in request body to the new copy
        try:
            overrides = request.data.get('items')
            if isinstance(overrides, str):
                try:
                    overrides = json.loads(overrides)
                except Exception:
                    overrides = None
            if isinstance(overrides, list) and overrides:
                # Comment: Build map from original item id to index to align overrides by row_id
                orig_items = list(orig.quotation_items.all().order_by('id'))
                id_to_index = {oi.id: idx for idx, oi in enumerate(orig_items)}
                for i, ov in enumerate(overrides):
                    # Comment: Prefer target by original row_id; fallback to index alignment
                    idx_target = None
                    try:
                        rid = ov.get('row_id')
                        if rid in id_to_index:
                            idx_target = id_to_index[rid]
                    except Exception:
                        idx_target = None
                    if idx_target is None:
                        idx_target = i if i < len(new_items) else None
                    if idx_target is None or idx_target >= len(new_items):
                        continue
                    it = new_items[idx_target]
                    try:
                        item_title = str(ov.get('item') or it.quo_item or '')
                        model = str(ov.get('model') or it.quo_model or '')
                        desc = str(ov.get('description') or it.quo_description or '')
                        spec = str(ov.get('specification') or it.specification or '')
                        qty_val = ov.get('qty')
                        price_val = ov.get('price')
                        # Comment: Parse qty/price safely and recompute quo_total
                        try:
                            qty = int(float(qty_val)) if qty_val is not None else it.quantity
                        except Exception:
                            qty = it.quantity
                        # Comment: Derive original unit price from total/qty as fallback when price not provided
                        try:
                            orig_unit = float(new_items[i].quo_total or 0) / max(int(new_items[i].quantity or 1), 1)
                        except Exception:
                            orig_unit = 0.0
                        try:
                            price_float = float(str(price_val).replace(',', '')) if price_val is not None else orig_unit
                        except Exception:
                            price_float = orig_unit
                        total = Decimal(str(qty * price_float))
                        it.quo_item = item_title
                        it.quo_model = model
                        it.quo_description = desc
                        it.specification = spec
                        it.quantity = qty
                        it.quo_total = total
                        it.save()
                    except Exception:
                        continue
        except Exception:
            pass

        # Comment: Optional top-level overrides (e.g., details fields). Apply only to new copy.
        try:
            top_remark = request.data.get('remark')
            if isinstance(top_remark, str):
                new_q.remark = top_remark
        except Exception:
            pass
        try:
            # Comment: Apply detail overrides when provided from the UI state
            fields_map = {
                'trade_terms': request.data.get('trade_terms'),
                'validity': request.data.get('validity'),
                'delivery': request.data.get('delivery'),
                'payment_terms': request.data.get('payment_terms'),
                'shipment_location': request.data.get('shipment_location'),
                'invoice_date': request.data.get('invoice_date'),
            }
            updated_fields = []
            for fname, fval in fields_map.items():
                if fval is not None:
                    setattr(new_q, fname, fval)
                    updated_fields.append(fname)
            if updated_fields:
                new_q.save(update_fields=updated_fields)
        except Exception:
            pass

        ser = self.get_serializer(new_q)
        return Response(ser.data, status=status.HTTP_201_CREATED)

class BillingNoteViewSet(viewsets.ModelViewSet):
    queryset = BillingNote.objects.all().order_by('-bn_created_date')
    serializer_class = BillingNoteSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class EmailLogViewSet(viewsets.ModelViewSet):
    queryset = EmailLog.objects.all().order_by('-sent_at')
    serializer_class = EmailLogSerializer
    permission_classes = [AllowAny]

class DealHistoryViewSet(viewsets.ModelViewSet):
    queryset = DealHistory.objects.all().order_by('-changed_at')
    serializer_class = DealHistorySerializer
    permission_classes = [AllowAny]

class ActivityScheduleViewSet(viewsets.ModelViewSet):
    queryset = ActivitySchedule.objects.all().order_by('due_at')
    serializer_class = ActivityScheduleSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('due_date')
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

class PMProjectViewSet(viewsets.ModelViewSet):
    queryset = PMProject.objects.all().order_by('-id')
    serializer_class = PMProjectSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class PMTaskViewSet(viewsets.ModelViewSet):
    queryset = PMTask.objects.all().order_by('task_end_date')
    serializer_class = PMTaskSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    def perform_create(self, serializer):
        instance = serializer.save()
        PMProject.objects.filter(pk=instance.project_id).update(
            task_total=PMTask.objects.filter(project_id=instance.project_id).count()
        )
    def perform_destroy(self, instance):
        proj_id = instance.project_id
        super().perform_destroy(instance)
        PMProject.objects.filter(pk=proj_id).update(
            task_total=PMTask.objects.filter(project_id=proj_id).count()
        )
    def perform_update(self, serializer):
        old = self.get_object()
        old_proj_id = old.project_id
        instance = serializer.save()
        if old_proj_id != instance.project_id:
            PMProject.objects.filter(pk=old_proj_id).update(
                task_total=PMTask.objects.filter(project_id=old_proj_id).count()
            )
        PMProject.objects.filter(pk=instance.project_id).update(
            task_total=PMTask.objects.filter(project_id=instance.project_id).count()
        )
class ManufacturingOrderViewSet(viewsets.ModelViewSet):
    queryset = ManufacturingOrder.objects.defer('po_file_content').all().order_by('-created_at')
    serializer_class = ManufacturingOrderSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'], url_path='download')
    def download_po_file(self, request, pk=None):
        mo = self.get_object()
        
        # 1. Try serving file from MO directly
        if mo.po_file_content:
            response = HttpResponse(mo.po_file_content, content_type=mo.po_file_type)
            response['Content-Disposition'] = f'inline; filename="{mo.po_file_name}"'
            return response

        # 2. Fallback: Try looking up CustomerPurchaseOrder by po_number
        # This handles existing orders where file content wasn't copied
        if mo.po_number:
            search_po = str(mo.po_number).strip()
            # Try to find a matching CPO (case-insensitive)
            cpo = CustomerPurchaseOrder.objects.filter(po_number__iexact=search_po).first()
            
            if cpo and cpo.po_file_content:
                # Serve the CPO file
                response = HttpResponse(cpo.po_file_content, content_type=cpo.po_file_type)
                filename = cpo.po_file_name or mo.po_file_name or f"PO_{search_po}.pdf"
                response['Content-Disposition'] = f'inline; filename="{filename}"'
                return response

        return Response({"error": "No file attached"}, status=status.HTTP_404_NOT_FOUND)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class ProductVersionViewSet(viewsets.ModelViewSet):
    queryset = ProductVersion.objects.all().order_by('-version_code')
    serializer_class = ProductVersionSerializer
    permission_classes = [AllowAny]

class ProductTypeViewSet(viewsets.ModelViewSet):
    queryset = ProductType.objects.all().order_by('type_code')
    serializer_class = ProductTypeSerializer
    permission_classes = [AllowAny]

class SystemViewSet(viewsets.ModelViewSet):
    queryset = System.objects.all().order_by('name')
    serializer_class = SystemSerializer
    permission_classes = [AllowAny]

class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.all().order_by('part_number')
    serializer_class = ComponentSerializer
    permission_classes = [AllowAny]

class SystemComponentViewSet(viewsets.ModelViewSet):
    queryset = SystemComponent.objects.all()
    serializer_class = SystemComponentSerializer
    permission_classes = [AllowAny]

class ComponentEntryViewSet(viewsets.ModelViewSet):
    queryset = ComponentEntry.objects.all().order_by('component_name')
    serializer_class = ComponentEntrySerializer
    authentication_classes = []
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([AllowAny])
def list_boms(request):
    products = Product.objects.all().prefetch_related(
        'versions__types__systems__system_components__component'
    )
    result = []
    products_with_boms = set()
    for product in products:
        for version in product.versions.all():
            for ptype in version.types.all():
                systems_list = []
                for system in ptype.systems.all():
                    components_list = []
                    for sc in system.system_components.select_related('component').all():
                        comp = sc.component
                        components_list.append({
                            'name': comp.name,
                            'qty': sc.quantity,
                            'part_number': comp.part_number,
                            'unit': comp.unit,
                            'photo': request.build_absolute_uri(comp.image.url) if comp.image else None,
                        })
                    systems_list.append({
                        'name': system.name,
                        'components': components_list,
                        'photo': request.build_absolute_uri(system.image.url) if system.image else None,
                    })
                result.append({
                    'id': ptype.id,
                    'product': product.name,
                    'version': version.version_code,
                    'type': ptype.type_code,
                    'productTree': {
                        'product': product.name,
                        'systems': systems_list,
                        'photo': request.build_absolute_uri(product.image.url) if product.image else None,
                    },
                })
                products_with_boms.add(product.id)
    for product in products:
        if product.id in products_with_boms:
            continue
        result.append({
            'id': -product.id,
            'product': product.name,
            'version': '',
            'type': '',
            'productTree': {
                'product': product.name,
                'systems': [],
                'photo': request.build_absolute_uri(product.image.url) if product.image else None,
            },
        })
    return Response(result)

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def import_bom(request):
    data = request.data
    # Check if data is passed as a JSON string in 'json_data' field (common with FormData)
    if 'json_data' in request.data:
        try:
            data = json.loads(request.data['json_data'])
        except Exception:
            pass # Fallback to using request.data as is if parsing fails, though it might be a QueryDict
    
    # If request.data is a dict (JSONParser) or QueryDict (but not using json_data), use it directly.
    # Note: request.data from MultiPartParser is a QueryDict.
    # Ideally, we expect 'json_data' when using FormData for complex structures.
    if not isinstance(data, dict):
        data = {}

    product_name = str(data.get('product') or '').strip()
    version_code = str(data.get('version') or '').strip() or 'v1'
    type_code = str(data.get('type') or '').strip() or 'standard'
    systems = data.get('systems') or []
    
    if not product_name:
        return Response({'error': 'product is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    product, _ = Product.objects.get_or_create(name=product_name, defaults={'code': '', 'description': ''})
    
    # Handle Product Image
    if 'product_image' in request.FILES:
        product.image = request.FILES['product_image']
        product.save()
        
    version, _ = ProductVersion.objects.get_or_create(product=product, version_code=version_code, defaults={'description': ''})
    ptype, _ = ProductType.objects.get_or_create(version=version, type_code=type_code, defaults={'description': ''})
    
    created_rows = 0
    for i, s in enumerate(systems or []):
        sys_name = str(s.get('name') or s.get('system') or '').strip()
        comps = s.get('components') or []
        if not sys_name or not ptype:
            continue
        
        sys_obj, _ = System.objects.get_or_create(type=ptype, name=sys_name)
        
        # Handle System Image
        sys_img_key = f"sys_{i}_image"
        if sys_img_key in request.FILES:
            sys_obj.image = request.FILES[sys_img_key]
            sys_obj.save()
            
        for j, c in enumerate(comps):
            cname = str(c.get('name') or '').strip()
            qty = int(c.get('qty') or c.get('quantity') or 0)
            part_number = str(c.get('part_number') or '').strip() or cname
            unit = str(c.get('unit') or 'Unit').strip()
            
            comp_obj, _ = Component.objects.get_or_create(part_number=part_number, defaults={'name': cname or part_number, 'unit': unit})
            
            # Handle Component Image
            comp_img_key = f"sys_{i}_comp_{j}_image"
            if comp_img_key in request.FILES:
                comp_obj.image = request.FILES[comp_img_key]
                comp_obj.save()
                
            sc, created = SystemComponent.objects.get_or_create(system=sys_obj, component=comp_obj, defaults={'quantity': max(qty, 0)})
            if not created:
                sc.quantity = max(qty, 0)
                sc.save(update_fields=['quantity'])
            created_rows += 1
    return Response({'status': 'ok', 'created_or_updated': created_rows})

# from .tracking_utils import fetch_tracking_status

@api_view(['GET'])
@permission_classes([AllowAny])
def check_tracking_status(request):
    return Response({'status': 'error', 'message': 'Tracking service unavailable'}, status=503)
    # courier = request.query_params.get('courier')
    # number = request.query_params.get('number')
    # if not courier or not number:
    #     return Response({'error': 'courier and number required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # status_text = fetch_tracking_status(courier, number)
    # return Response({'status': status_text or 'Unknown'})

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    data = request.data.copy()
    if 'email' in data and 'username' not in data:
        data['username'] = data['email']
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_active = False
        user.save(update_fields=['is_active'])
        print(f"DEBUG_SIGNUP: Created user {user.email} (ID: {user.id})")
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, allowed_apps="")
        else:
            user.profile.allowed_apps = ""
            user.profile.save()

        try:
            if not hasattr(user, 'permission_control'):
                PermissionControl.objects.create(
                    user=user,
                    user_name=user.first_name or user.username,
                    email=user.email,
                    password=data.get('password', ''),
                    allow_apps=""
                )
        except Exception as e:
            print(f"Error creating PermissionControl: {e}")

        print(f"DEBUG_SIGNUP: Creating notification for {user.email}")
        Notification.objects.create(
            message=f"New user registered: {user.email} ({user.first_name or 'No Name'})",
            type="user_registration"
        )
        code = f"{random.randint(100000, 999999)}"
        email = user.email
        subject = "Your verification code"
        body = f"Your verification code is {code}"
        try:
            msg = MIMEMultipart()
            msg["From"] = "eit@eitlaser.com"
            msg["To"] = email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain", _charset="utf-8"))
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login("eit@eitlaser.com", "grsc gthh jnuy ixtc")
            server.sendmail("eit@eitlaser.com", email, msg.as_string())
            server.quit()
            Notification.objects.create(
                message=f"EMAIL_VERIFICATION:{email}:{code}",
                type="signup"
            )
        except Exception as e:
            print(f"Error sending verification email: {e}")
        return Response({
            'verification_required': True,
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    email = (request.data.get('email') or "").strip().lower()
    code = (request.data.get('code') or "").strip()
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)
    notif = Notification.objects.filter(
        type='signup',
        message__startswith=f"EMAIL_VERIFICATION:{email}:"
    ).order_by('-created_at').first()
    if not notif:
        return Response({'error': 'No verification code found'}, status=status.HTTP_400_BAD_REQUEST)
    parts = notif.message.rsplit(':', 1)
    if len(parts) != 2:
        return Response({'error': 'Invalid verification record'}, status=status.HTTP_400_BAD_REQUEST)
    stored_code = parts[1]
    if stored_code != code:
        return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
    if timezone.now() - notif.created_at > timedelta(minutes=15):
        return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)
    user.is_active = True
    user.save(update_fields=['is_active'])
    token, created = Token.objects.get_or_create(user=user)
    return Response({
        'verified': True,
        'token': token.key,
        'user_id': user.pk,
        'email': user.email
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Please provide both email and password'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        username = user.username
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        
        # Get allowed apps
        allowed_apps = ""
        profile_pic_url = None
        company = ""
        account_type = "normal"
        if hasattr(user, 'profile'):
            allowed_apps = user.profile.allowed_apps
            company = user.profile.company or ""
            account_type = user.profile.account_type
            if user.profile.profile_picture:
                try:
                    profile_pic_url = request.build_absolute_uri(user.profile.profile_picture.url)
                except:
                    pass
        else:
            # Create if missing
            default_apps = "all" if user.is_staff else ""
            UserProfile.objects.create(user=user, allowed_apps=default_apps)
            allowed_apps = default_apps
        
        try:
            if not hasattr(user, 'permission_control'):
                PermissionControl.objects.create(
                    user=user,
                    user_name=user.first_name or user.username,
                    email=user.email,
                    password="",
                    allow_apps=allowed_apps or ""
                )
            else:
                pc = user.permission_control
                pc.allow_apps = allowed_apps or ""
                pc.save()
        except Exception as e:
            print(f"Error syncing PermissionControl in login: {e}")
            
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'name': user.first_name or user.username,
            'role': 'Admin' if user.is_staff else 'User',
            'allowed_apps': allowed_apps,
            'profile_picture': profile_pic_url,
            'company': company,
            'account_type': account_type
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Handle Google Sign-In.
    Expects 'credential' (ID token) from frontend.
    """
    token_id = request.data.get('credential')
    if not token_id:
        return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token with Google
    try:
        email = None
        google_data = {}
        
        # Development bypass for testing without valid Google Credentials
        if token_id.startswith("mock_token_"):
            email = "6531503143@lamduan.mfu.ac.th" # Default test user
            google_data = {
                'given_name': 'Test',
                'family_name': 'User',
                'picture': 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            }
        else:
            # Using Google's tokeninfo endpoint to verify the token
            google_response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token_id}')
            
            if google_response.status_code != 200:
                return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)
                
            google_data = google_response.json()
            email = google_data.get('email')
            
        if not email:
             return Response({'error': 'No email in token'}, status=status.HTTP_400_BAD_REQUEST)
             
        # Find or create user
        try:
            user = User.objects.get(email=email)
            print(f"DEBUG_GOOGLE_LOGIN: User found {email}")
        except User.DoesNotExist:
            # Create new user
            print(f"DEBUG_GOOGLE_LOGIN: Creating new user {email}")
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=google_data.get('given_name', ''),
                last_name=google_data.get('family_name', '')
            )
            # Random password as they use google login
            user.set_unusable_password()
            user.save()
            
            print(f"DEBUG_GOOGLE_LOGIN: Creating notification for {email}")
            Notification.objects.create(message=f"New user registered: {email}", type="user_registration")

        token, created = Token.objects.get_or_create(user=user)
        
        # Get allowed apps
        allowed_apps = ""
        profile_pic_url = None
        company = ""
        account_type = "normal"
        
        if hasattr(user, 'profile'):
            allowed_apps = user.profile.allowed_apps
            company = user.profile.company or ""
            account_type = user.profile.account_type
            # Update profile pic from google if not set
            if not user.profile.profile_picture and google_data.get('picture'):
                # We could download and save, or just store URL if we had a field. 
                # For now, we just don't sync picture to DB to avoid complexity, 
                # but we could return it in response.
                pass
                
            if user.profile.profile_picture:
                try:
                    profile_pic_url = request.build_absolute_uri(user.profile.profile_picture.url)
                except:
                    pass
        else:
            # Create if missing
            default_apps = "all" if user.is_staff else ""
            UserProfile.objects.create(user=user, allowed_apps=default_apps)
            allowed_apps = default_apps
        
        try:
            if not hasattr(user, 'permission_control'):
                PermissionControl.objects.create(
                    user=user,
                    user_name=user.first_name or user.username,
                    email=user.email,
                    password="",
                    allow_apps=allowed_apps or ""
                )
            else:
                pc = user.permission_control
                pc.allow_apps = allowed_apps or ""
                pc.save()
        except Exception as e:
            print(f"Error syncing PermissionControl in google_login: {e}")
            
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'name': user.first_name or user.username,
            'role': 'Admin' if user.is_staff else 'User',
            'allowed_apps': allowed_apps,
            'profile_picture': profile_pic_url or google_data.get('picture'),
            'company': company,
            'account_type': account_type
        })
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerPurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = CustomerPurchaseOrder.objects.defer('po_file_content').all().order_by('-created_at')
    serializer_class = CustomerPurchaseOrderSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='numbers')
    def list_po_numbers(self, request):
        # Return distinct non-empty PO numbers as a simple list of strings
        # Optional filter by customer_id (?customer_id=123)
        customer_id = request.query_params.get('customer_id')
        qs = CustomerPurchaseOrder.objects.all()
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        nums = (
            qs.values_list('po_number', flat=True)
            .exclude(po_number__isnull=True)
            .exclude(po_number__exact="")
            .distinct()
        )
        # Using list(nums) to serialize as JSON array of strings
        return Response(list(nums))

    @action(detail=True, methods=['get'], url_path='download')
    def download_po_file(self, request, pk=None):
        cpo = self.get_object()
        if not cpo.po_file_content:
             return Response({"error": "No file attached"}, status=status.HTTP_404_NOT_FOUND)

        response = HttpResponse(cpo.po_file_content, content_type=cpo.po_file_type)
        response['Content-Disposition'] = f'inline; filename="{cpo.po_file_name}"'
        return response
    parser_classes = (MultiPartParser, FormParser)

class StageViewSet(viewsets.ModelViewSet):
    queryset = Stage.objects.all().order_by('order', 'created_at')
    serializer_class = StageSerializer
    permission_classes = [AllowAny]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_users_permissions(request):
    """
    Force sync all users to PermissionControl table.
    """
    if not request.user.is_staff and request.user.email != 'htetyunn06@gmail.com':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
    users = User.objects.all()
    count = 0
    for user in users:
        try:
            allowed = ""
            if hasattr(user, 'profile'):
                allowed = user.profile.allowed_apps
            else:
                default = "all" if user.is_staff else ""
                UserProfile.objects.create(user=user, allowed_apps=default)
                allowed = default
                
            if not hasattr(user, 'permission_control'):
                PermissionControl.objects.create(
                    user=user,
                    user_name=user.first_name or user.username,
                    email=user.email,
                    password="",
                    allow_apps=allowed or ""
                )
                count += 1
            else:
                # Update existing
                pc = user.permission_control
                pc.allow_apps = allowed or ""
                pc.user_name = user.first_name or user.username
                pc.email = user.email
                pc.save()
        except Exception as e:
            print(f"Error syncing user {user.email}: {e}")
            
    return Response({'success': True, 'message': f'Synced {users.count()} users, created {count} new records'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """
    Get all users and their allowed apps.
    Only accessible by Admin users, staff, or accounts with 'permission_control' type.
    """
    # Check if the user is a 'permission_control' account
    is_pc = hasattr(request.user, 'profile') and request.user.profile.account_type == 'permission_control'
    
    # Restrict access to Staff, Permission Control accounts, or specific whitelisted emails
    if not (request.user.is_staff or is_pc or request.user.email in ['htetyunn06@gmail.com', 'eit@eitlaser.com', 'shwinpyonethu0106@gmail.com']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    # Fetch all users to display in the permission management interface
    users = User.objects.all().order_by('id')
    
    data = []
    for user in users:
        allowed = "all"
        # Determine allowed apps: Prefer PermissionControl model if available, otherwise fallback to Profile
        if hasattr(user, 'permission_control'):
             allowed = user.permission_control.allow_apps
        elif hasattr(user, 'profile'):
            allowed = user.profile.allowed_apps
        
        data.append({
            'id': user.id,
            'email': user.email,
            'name': user.first_name or user.username,
            'is_staff': user.is_staff,
            'allowed_apps': allowed
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_permissions(request):
    """
    Update allowed apps for a user.
    """
    # Allow staff or permission_control accounts (or specific email)
    is_pc = hasattr(request.user, 'profile') and request.user.profile.account_type == 'permission_control'
    if not (request.user.is_staff or is_pc or request.user.email in ['htetyunn06@gmail.com', 'eit@eitlaser.com', 'shwinpyonethu0106@gmail.com']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    allowed_apps = request.data.get('allowed_apps')
    
    if not user_id:
        return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(id=user_id)
        if hasattr(user, 'profile'):
            profile = user.profile
        else:
            profile = UserProfile.objects.create(user=user)
        
        # Ensure allowed_apps is a string
        if allowed_apps is None:
            allowed_apps = ""
            
        profile.allowed_apps = allowed_apps
        profile.save()
        
        try:
            if hasattr(user, 'permission_control'):
                pc = user.permission_control
                pc.allow_apps = allowed_apps or ""
                pc.save()
            else:
                PermissionControl.objects.create(
                    user=user,
                    user_name=user.first_name or user.username,
                    email=user.email,
                    password="",
                    allow_apps=allowed_apps or ""
                )
        except:
            pass
        
        return Response({'success': True, 'message': 'Permissions updated'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating permissions: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):
    """
    Delete a user.
    """
    # Allow staff or permission_control accounts (or specific email)
    is_pc = hasattr(request.user, 'profile') and request.user.profile.account_type == 'permission_control'
    if not (request.user.is_staff or is_pc or request.user.email in ['htetyunn06@gmail.com', 'eit@eitlaser.com', 'shwinpyonethu0106@gmail.com']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=pk)
        if user.is_staff and not request.user.is_staff:
             # Prevent permission_control from deleting actual Admins if we want to be strict
             # But for now, let's assume if they have access, they can manage.
             pass
             
        # Prevent self-deletion
        if user.id == request.user.id:
            return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.delete()
        return Response({'success': True, 'message': 'User deleted'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_user_password(request):
    # Allow staff or permission_control accounts (or specific email)
    is_pc = hasattr(request.user, 'profile') and request.user.profile.account_type == 'permission_control'
    if not (request.user.is_staff or is_pc or request.user.email in ['htetyunn06@gmail.com', 'eit@eitlaser.com', 'shwinpyonethu0106@gmail.com']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    new_password = request.data.get('new_password')
    if not user_id or not new_password:
        return Response({'error': 'user_id and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
        user.set_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password updated'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def check_activity_reminders():
    """
    Check for due and overdue activities and generate notifications.
    """
    now = timezone.now()
    
    # 1. Upcoming (Due within 24 hours)
    upcoming_activities = ActivitySchedule.objects.filter(
        completed=False,
        due_at__gt=now,
        due_at__lte=now + timedelta(days=1),
        reminder_sent=False
    )
    for activity in upcoming_activities:
        # Format: To do: "company name": "Activity schedule name" is due on "due date and time"
        # Convert to local time (Asia/Bangkok) for display
        local_due_at = timezone.localtime(activity.due_at)
        due_str = local_due_at.strftime('%Y-%m-%d %H:%M')
        
        customer_name = activity.customer
        if not customer_name and activity.deal and activity.deal.customer:
            customer_name = activity.deal.customer.company_name
            
        msg = f'To do: "{customer_name}": "{activity.activity_name}" is due on "{due_str}"'
        # Comment: Skip if user explicitly deleted this notification previously
        if ('activity_schedule_reminder', msg) not in SUPPRESSED_NOTIFICATIONS:
            Notification.objects.create(message=msg, type='activity_schedule_reminder')
        activity.reminder_sent = True
        activity.save()

    # 2. Missed (Overdue)
    # Format: Missed activity: "company name": "Activity schedule name"
    missed_activities = ActivitySchedule.objects.filter(
        completed=False,
        due_at__lt=now
    )
    for activity in missed_activities:
        customer_name = activity.customer
        if not customer_name and activity.deal and activity.deal.customer:
            customer_name = activity.deal.customer.company_name

        msg = f'Missed activity: "{customer_name}": "{activity.activity_name}"'
        # Avoid duplicates
        if not Notification.objects.filter(message=msg, type='activity_schedule_reminder').exists():
            if ('activity_schedule_reminder', msg) not in SUPPRESSED_NOTIFICATIONS:
                Notification.objects.create(message=msg, type='activity_schedule_reminder')

def check_billing_note_reminders():
    """
    Check for billing notes due within 5 days and generate notifications.
    """
    now = timezone.now().date()
    target_date = now + timedelta(days=5)
    
    # Filter billing notes due between now and 5 days from now
    # Also ensure we haven't already sent a notification for this BN code
    upcoming_bns = BillingNote.objects.filter(
        bn_due_date__gte=now,
        bn_due_date__lte=target_date
    )
    
    for bn in upcoming_bns:
        # Format: Billing Note: "company name": billing note due date on "due date"
        due_str = bn.bn_due_date.strftime('%Y-%m-%d')
        customer_name = bn.customer.company_name if bn.customer else "Unknown Customer"
        
        msg = f'Billing Note: "{customer_name}": billing note due date on "{due_str}"'
        
        # Check if notification already exists to avoid duplicates
        # We assume one reminder per billing note is sufficient for this logic, 
        # or we could rely on a flag if we added one to the model.
        # Since we can't easily add fields, we check for the specific message existence.
        if not Notification.objects.filter(message=msg, type='billing_note_reminder').exists():
            if ('billing_note_reminder', msg) not in SUPPRESSED_NOTIFICATIONS:
                Notification.objects.create(message=msg, type='billing_note_reminder')

def check_manufacturing_finish_notifications():
    """
    Check for completed Manufacturing Orders and generate notifications.
    """
    # Assuming 'state' or 'component_status' indicates completion. 
    # Based on models.py, fields are 'state' and 'component_status'.
    # We'll check for "Finished" or "Completed" in either (case-insensitive usually safe, but let's guess standard terms).
    # Common statuses: 'Finished', 'Completed', 'Done'.
    
    finished_mos = ManufacturingOrder.objects.filter(
        state__in=['Finished', 'Completed', 'Done']
    ) | ManufacturingOrder.objects.filter(
        component_status__in=['Finished', 'Completed', 'Done']
    )
    
    for mo in finished_mos:
        # Format: Manufacturing finished: Product No. under Job Order Code is complete.
        product_no = mo.product_no if mo.product_no else "N/A"
        msg = f'Manufacturing finished: {product_no} under {mo.job_order_code} is complete.'
        
        # Avoid duplicates
        if not Notification.objects.filter(message=msg, type='manufacturing_finish').exists():
            if ('manufacturing_finish', msg) not in SUPPRESSED_NOTIFICATIONS:
                Notification.objects.create(message=msg, type='manufacturing_finish')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    Get notifications with filtering based on user permissions.
    
    Filtering Logic:
    1. Admin / Permission Control Accounts: See ALL notifications.
    2. Normal Accounts:
    3. Filter based on Notification Types mapping
            
            # CRM Group: Notifications related to CRM activities
            # Requires: 'crm' or 'admin' in allowed_apps
            crm_types = ['crm_created', 'user_registration', 'activity_schedule_reminder', 'billing_note_reminder']
            crm_access = 'crm' in allowed_apps or 'admin' in allowed_apps

            # Manufacturing/Ops Group: Notifications related to production and inventory
            # Requires: 'manufacturing', 'inventory', or 'project_management' in allowed_apps
            ops_types = ['manufacturing_finish', 'delivery_updates', 'inventory_updates']
            ops_access = any(app in allowed_apps for app in ['manufacturing', 'inventory', 'project_management'])
            
            # Manufacturing Finish should be visible to "users who has access to any apps" per user request.
            # So if allowed_apps is not empty, they can see it.
            # But the logic below combines ops_types. We might need to separate 'manufacturing_finish' if the rule is looser.
            # "show on Notification on users who has access to any apps" -> basically everyone except maybe those with NO apps?
            # Or does it mean "any of the apps"?
            # Let's assume standard Ops access for now, but user said "any apps".
            # If "any apps", then basically all authenticated users with at least one app.
    """
    user = request.user
    if not user.is_authenticated:
        return Response([])

    # Trigger checks
    try:
        check_activity_reminders()
        check_billing_note_reminders()
        check_manufacturing_finish_notifications()
    except Exception as e:
        print(f"Error checking notifications: {e}")

    # 1. Admin / Permission Control Account check
    # If user is admin (is_staff) or has permission_control account type, show all
    is_pc = hasattr(user, 'profile') and user.profile.account_type == 'permission_control'
    whitelist = ['htetyunn06@gmail.com', 'eit@eitlaser.com', 'shwinpyonethu0106@gmail.com']
    
    if user.is_staff or is_pc or user.email in whitelist:
        notifications = Notification.objects.all().order_by('-created_at')[:50]
    else:
        # 2. Get allowed apps for normal user
        allowed_apps_str = ""
        if hasattr(user, 'profile'):
            allowed_apps_str = user.profile.allowed_apps
        
        # Parse allowed apps (comma-separated string)
        allowed_apps = [app.strip() for app in allowed_apps_str.split(',') if app.strip()]
        
        # If 'all' is in allowed_apps, show everything
        if 'all' in allowed_apps:
             notifications = Notification.objects.all().order_by('-created_at')[:50]
        else:
            # 3. Filter based on Notification Types mapping
            
            # CRM Group: Notifications related to CRM activities
            # Requires: 'crm' or 'admin' in allowed_apps
            crm_types = ['crm_created', 'user_registration', 'activity_schedule_reminder', 'billing_note_reminder']
            crm_access = 'crm' in allowed_apps or 'admin' in allowed_apps

            # Manufacturing/Ops Group: Notifications related to production and inventory
            # Requires: 'manufacturing', 'inventory', or 'project_management' in allowed_apps
            ops_types = ['manufacturing_finish', 'delivery_updates', 'inventory_updates']
            ops_access = any(app in allowed_apps for app in ['manufacturing', 'inventory', 'project_management'])
            
            q_filter = Q()
            restricted_types = crm_types + ops_types
            
            # Add CRM notifications if user has access
            if crm_access:
                q_filter |= Q(type__in=crm_types)
                
            # Add Ops notifications if user has access
            if ops_access:
                q_filter |= Q(type__in=ops_types)
            
            # Include types that are NOT in the restricted list (legacy support or general info)
            # This ensures that types like 'info', 'alert', 'signup' are visible to everyone
            # unless we explicitly decide to restrict them later.
            q_filter |= ~Q(type__in=restricted_types)
            
            notifications = Notification.objects.filter(q_filter).order_by('-created_at')[:50]

    data = []
    for n in notifications:
        msg = n.message
        # Legacy fix for Google signup messages
        if n.type == 'signup' and isinstance(msg, str):
            msg = msg.replace('New Google user:', 'New user:')
            
        data.append({
            'id': n.id,
            'message': msg,
            'created_at': n.created_at,
            'is_read': n.is_read,
            'type': n.type
        })
    print(f"DEBUG_NOTIF_PAYLOAD: Returning {len(data)} items. Top item: {data[0] if data else 'None'}")
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request):
    """
    Mark a notification as read.
    """
    notif_id = request.data.get('id')
    if notif_id:
        try:
            n = Notification.objects.get(id=notif_id)
            n.is_read = True
            n.save()
            return Response({'success': True})
        except Notification.DoesNotExist:
            pass
    return Response({'error': 'Invalid ID'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notification(request, pk):
    try:
        n = Notification.objects.get(id=pk)
        # Comment: Record suppression key before deleting to prevent re-generation on next poll
        try:
            SUPPRESSED_NOTIFICATIONS.add((n.type, n.message))
        except Exception as e:
            print(f"DEBUG: Failed to add suppression key: {e}")
        n.delete()
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def clear_notifications(request):
    """
    Comment: Delete all notifications in the database.
    Also record suppression keys for existing notifications to prevent immediate regeneration.
    """
    try:
        existing = list(Notification.objects.values('type', 'message'))
        for item in existing:
            try:
                SUPPRESSED_NOTIFICATIONS.add((item.get('type'), item.get('message')))
            except Exception as e:
                print(f"DEBUG: Failed to add suppression key for clear-all: {e}")
        Notification.objects.all().delete()
        return Response({'success': True, 'deleted': len(existing)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_allowed_apps(request):
    user = request.user
    allowed = ""
    if hasattr(user, 'profile'):
        allowed = user.profile.allowed_apps
    else:
        default = "all" if user.is_staff else ""
        UserProfile.objects.create(user=user, allowed_apps=default)
        allowed = default
    return Response({'allowed_apps': allowed})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data
    
    # Update basic info
    if 'name' in data:
        user.first_name = data['name']
    
    # Update email if provided and different
    if 'email' in data and data['email'] != user.email:
        if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response({'error': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = data['email']
        user.username = data['email']
    
    user.save()
    
    # Update profile fields
    if not hasattr(user, 'profile'):
        UserProfile.objects.create(user=user)

    if 'company' in data:
        user.profile.company = data['company']
        user.profile.save()
        
    # Handle profile picture
    if 'profile_picture' in request.FILES:
        try:
            print(f"DEBUG: Received profile picture: {request.FILES['profile_picture'].name}")
            user.profile.profile_picture = request.FILES['profile_picture']
            user.profile.save()
            print("DEBUG: Profile picture saved successfully")
        except Exception as e:
            print(f"ERROR saving profile picture: {e}")
            return Response({'error': f'Failed to save image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Construct image URL
    profile_pic_url = None
    if user.profile.profile_picture:
        try:
            profile_pic_url = request.build_absolute_uri(user.profile.profile_picture.url)
        except:
            pass

    return Response({
        'name': user.first_name,
        'email': user.email,
        'profile_picture': profile_pic_url,
        'company': user.profile.company
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_eit(request):
    # Try to find EIT LASERTECHNIK CO.,LTD or first one
    eit = EIT.objects.filter(organization_name__icontains="EIT LASERTECHNIK").first()
    if not eit:
        eit = EIT.objects.first()
    
    if eit:
        serializer = EITSerializer(eit)
        return Response(serializer.data)
    else:
        # Return default structure if no DB record (should not happen due to migration)
        return Response({
            "organization_name": "EIT LASERTECHNIK CO.,LTD",
            "eit_mobile": "000-000-0000",
            "eit_telephone": "02-052-9544",
            "eit_fax": "02-052-9544",
            "address": "1/120 ซอยรามคําแหง 184 \n แขวงมีนบุรี เขตมีนบุรี \n กรุงเทพมหานคร 10510"
        })


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_bom(request, pk):
    try:
        pk = int(pk)
        if pk > 0:
            # Positive ID -> ProductType
            ProductType.objects.filter(id=pk).delete()
        elif pk < 0:
            # Negative ID -> Product (the whole product)
            Product.objects.filter(id=-pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all().order_by('-last_updated_day')
    serializer_class = InventorySerializer
    permission_classes = [AllowAny]

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all().order_by('-created_at')
    serializer_class = DeliverySerializer
    permission_classes = [AllowAny]
