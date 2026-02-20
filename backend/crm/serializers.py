from rest_framework import serializers
# Comment: File handling utilities for copying existing image paths during "Save as New"
from django.conf import settings
from django.core.files.base import File, ContentFile
from django.core.files.storage import default_storage
import urllib.request
import mimetypes
import os, uuid
from django.contrib.auth.models import User
from .models import Deal, ActivitySchedule, Quotation, QuotationItem, Invoice, Receipt, TaxInvoice, PurchaseOrder, Project, Task, Customer, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EmailLog, EmailAttachment, DealHistory, EIT, BillingNote, CustomerPurchaseOrder, Stage, Inventory, Delivery, ProjectManagement, SubProject, PDMachine, PDSystem, PDWire, PDSparepart, PDService, PDSystemChildproduct, PMProject, PMTask

def _next_sequence(model_cls, field_name: str, pad: int = 4, allow_duplicate: bool = False) -> str:
    # Comment: Auto-increment generator — finds the maximum numeric value among existing codes and returns next
    # Supports editable codes: generation occurs only when the client does not provide a value
    try:
        vals = list(model_cls.objects.values_list(field_name, flat=True))
        max_num = 0
        for v in vals:
            if not v:
                continue
            s = str(v)
            # Extract trailing digits; if none, skip
            import re
            m = re.search(r'(\d+)$', s)
            if m:
                try:
                    num = int(m.group(1))
                    if num > max_num:
                        max_num = num
                except Exception:
                    pass
        next_num = max_num + 1
        code = str(next_num).zfill(pad)
        if not allow_duplicate:
            # Ensure uniqueness by incrementing until unused
            while model_cls.objects.filter(**{field_name: code}).exists():
                next_num += 1
                code = str(next_num).zfill(pad)
        return code
    except Exception:
        # Fallback to timestamp-based code when query fails
        return str(int(uuid.uuid4().hex[:pad], 16)).zfill(pad)

def _next_item_code_for_quotation(quotation, pad: int = 4) -> str:
    # Comment: Generate a unique numeric item code within a quotation by scanning existing quo_item values
    try:
        max_num = 0
        for it in quotation.quotation_items.all():
            s = str(it.quo_item or "")
            import re
            m = re.fullmatch(r'\d+', s)
            if m:
                try:
                    num = int(s)
                    if num > max_num:
                        max_num = num
                except Exception:
                    pass
        nxt = max_num + 1
        return str(nxt).zfill(pad)
    except Exception:
        # Comment: Fallback to UUID-derived integer if query fails
        return str(int(uuid.uuid4().hex[:pad], 16)).zfill(pad)

def _next_base_item_number(quotation) -> str:
    # Comment: Generate next base integer code (no padding) for quo_item; ignores dotted spec rows like "1.2"
    try:
        max_num = 0
        for it in quotation.quotation_items.all():
            s = str(it.quo_item or "")
            import re
            m = re.fullmatch(r'\d+', s)
            if m:
                try:
                    num = int(s)
                    if num > max_num:
                        max_num = num
                except Exception:
                    pass
        return str(max_num + 1)
    except Exception:
        # Comment: Safe fallback based on UUID fragment when DB scan fails
        return str(int(uuid.uuid4().hex[:4], 16))

class SubProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubProject
        fields = ['id', 'subproject_name', 'subproject_duration']

class ProjectManagementSerializer(serializers.ModelSerializer):
    subprojects = SubProjectSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectManagement
        fields = ['id', 'project_name', 'duration', 'created_at', 'subprojects']


# PD Serializers
# The following serializer exposes the PD_machine table for API usage.
class PDMachineSerializer(serializers.ModelSerializer):
    # Simple model serializer for PD_machine to enable CRUD operations via API
    class Meta:
        model = PDMachine
        fields = ['id', 'name', 'description', 'specification']

class PDSystemSerializer(serializers.ModelSerializer):
    # Serializer for PD_system including product_total
    class Meta:
        model = PDSystem
        fields = ['id', 'name', 'description', 'specification', 'product_total']

class PDWireSerializer(serializers.ModelSerializer):
    # Serializer for PD_wire
    class Meta:
        model = PDWire
        fields = ['id', 'name', 'description', 'specification']

class PDSparepartSerializer(serializers.ModelSerializer):
    # Serializer for PD_sparepart
    class Meta:
        model = PDSparepart
        fields = ['id', 'name', 'description', 'specification']

class PDServiceSerializer(serializers.ModelSerializer):
    # Serializer for PD_service
    class Meta:
        model = PDService
        fields = ['id', 'name', 'description', 'specification']

class PDSystemChildproductSerializer(serializers.ModelSerializer):
    # Serializer for PD_system_childproduct, exposes system as PK
    class Meta:
        model = PDSystemChildproduct
        fields = ['id', 'name', 'system', 'specification']


class DeliverySerializer(serializers.ModelSerializer):
    company_name = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)
    inventory_product_name = serializers.PrimaryKeyRelatedField(queryset=Inventory.objects.all(), required=False, allow_null=True)
    company_name_input = serializers.CharField(write_only=True, required=False)
    
    # For display
    company_name_display = serializers.SerializerMethodField()
    inventory_product_name_display = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = [
            'id', 'inventory_product_name', 'order_amount', 'delivery_status', 
            'company_name', 'tracking_number', 'courier', 'created_at', 'updated_at',
            'company_name_input', 'company_name_display', 'inventory_product_name_display'
        ]

    def get_company_name_display(self, obj):
        return obj.company_name.company_name if obj.company_name else ""

    def get_inventory_product_name_display(self, obj):
        return obj.inventory_product_name.inventory_product_name if obj.inventory_product_name else ""

    def create(self, validated_data):
        company_name_input = validated_data.pop('company_name_input', None)
        
        if not validated_data.get('company_name') and company_name_input:
            customer, _ = Customer.objects.get_or_create(company_name=company_name_input)
            validated_data['company_name'] = customer
        
        # If no customer provided at all (and strict mode off), maybe handle error or let it fail if model requires it
        # Model has on_delete=CASCADE, so it is required.
            
        return super().create(validated_data)


class EITSerializer(serializers.ModelSerializer):
    class Meta:
        model = EIT
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    # Expose linked EIT details for read convenience; write uses FK by id
    eit_details = EITSerializer(source='eit', read_only=True)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    # Accept EIT name for legacy/fallback creation; not required when eit FK provided
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Additional EIT fields come from model and are not persisted via serializer
    eit_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Invoice
        fields = '__all__'

    def create(self, validated_data):
        # Comment: Auto-generate invoice number when not provided; keep editable when client sends a value
        num = (validated_data.get('number') or '').strip()
        if not num:
            validated_data['number'] = _next_sequence(Invoice, 'number', pad=4, allow_duplicate=False)
        # Ignore EIT details in payload; they are derived/display-only
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        # If no explicit EIT FK provided, fallback by organization_name
        eit_name = validated_data.pop('eit_name', None)
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            validated_data['eit'] = eit
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Comment: Allow editable number but enforce uniqueness (excluding current instance)
        new_num = (validated_data.get('number') or '').strip()
        if new_num and Invoice.objects.filter(number=new_num).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError({'number': 'Invoice number must be unique'})
        return super().update(instance, validated_data)

    def update(self, instance, validated_data):
        # Ignore EIT details in payload; they are derived/display-only
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        # If no explicit EIT FK provided, fallback by organization_name
        eit_name = validated_data.pop('eit_name', None)
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
        return super().update(instance, validated_data)

class QuotationItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = QuotationItem
        fields = '__all__'
    def get_image_url(self, obj):
        try:
            from django.conf import settings
            import os
            req = self.context.get('request')
            name = str(getattr(obj.image, 'name', '') or '')
            if not name:
                return None
            n1 = name.replace('quotation_items/quotation_items/', 'quotation_items/')
            p1 = os.path.join(settings.MEDIA_ROOT, n1.lstrip('/'))
            if os.path.exists(p1):
                chosen = n1
            else:
                base = os.path.basename(n1)
                n2 = f"quotation_items/quotation_items/{base}"
                p2 = os.path.join(settings.MEDIA_ROOT, n2)
                if os.path.exists(p2):
                    chosen = n2
                else:
                    return None
            url_path = (settings.MEDIA_URL or '/media/') + chosen.lstrip('/')
            if req:
                return req.build_absolute_uri(url_path)
            return url_path
        except Exception:
            return None
    def to_representation(self, obj):
        data = super().to_representation(obj)
        try:
            data['image_url'] = self.get_image_url(obj)
        except Exception:
            data['image_url'] = None
        return data

class EmailAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailAttachment
        fields = ['id', 'file', 'filename', 'created_at']

class EmailLogSerializer(serializers.ModelSerializer):
    attachments = EmailAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = EmailLog
        fields = '__all__'

class DealHistorySerializer(serializers.ModelSerializer):
    deal_title = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = DealHistory
        fields = '__all__'

    def get_deal_title(self, obj):
        return obj.deal.title if obj.deal else ""

    def get_company_name(self, obj):
        if obj.deal and obj.deal.customer:
            return obj.deal.customer.company_name
        return ""

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

# Removed SupportTicketSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', '')
        )
        return user

class ActivityScheduleSerializer(serializers.ModelSerializer):
    linked_task_title = serializers.SerializerMethodField()
    linked_task_due_date = serializers.SerializerMethodField()

    class Meta:
        model = ActivitySchedule
        fields = '__all__'

    def get_linked_task_title(self, obj):
        return obj.linked_task.title if obj.linked_task else None

    def get_linked_task_due_date(self, obj):
        return obj.linked_task.due_date if obj.linked_task else None

class DealSerializer(serializers.ModelSerializer):
    activity_schedules = ActivityScheduleSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_id = serializers.PrimaryKeyRelatedField(source='customer', queryset=Customer.objects.all(), write_only=True, required=False)
    write_customer_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Deal
        fields = [
            'id',
            'title',
            'customer',
            'customer_name',
            'customer_id',
            'write_customer_name',
            'amount',
            'currency',
            'priority',
            'contact',
            'email',
            'phone',
            'address',
            'tax_id',
            'extra_contacts',
            'items',
            'notes',
            'stage',
            'created_at',
            'expected_close',
            'po_number',
            'salesperson',
            'activity_schedules'
        ]

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""

    def to_internal_value(self, data):
        # Handle JSON strings in FormData (e.g. for items / extra_contacts)
        if 'items' in data and isinstance(data['items'], str):
            import json
            try:
                # We need a mutable copy if data is QueryDict
                if hasattr(data, 'dict'):
                    data = data.dict()
                elif hasattr(data, 'copy'):
                    data = data.copy()
                
                data['items'] = json.loads(data['items'])
            except:
                pass
        if 'extra_contacts' in data and isinstance(data['extra_contacts'], str):
            import json
            try:
                if hasattr(data, 'dict'):
                    data = data.dict()
                elif hasattr(data, 'copy'):
                    data = data.copy()
                data['extra_contacts'] = json.loads(data['extra_contacts'])
            except:
                pass
        return super().to_internal_value(data)

    def create(self, validated_data):
        cust_id = validated_data.pop('customer_id', None)
        name = validated_data.pop('write_customer_name', None)
        if cust_id:
            validated_data['customer'] = cust_id
        elif name:
            cust, created = Customer.objects.get_or_create(
                company_name=name,
                defaults={
                    'email': '',
                    'phone': '',
                    'industry': '',
                    'address': ''
                }
            )
            validated_data['customer'] = cust
        validated_data.pop('write_customer_name', None)
        if not validated_data.get('currency'):
            validated_data['currency'] = '฿'
        if not validated_data.get('title'):
            validated_data['title'] = 'Untitled Deal'
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data['branch'] = instance.customer.branch if instance.customer else ""
        except Exception:
            data['branch'] = ""
        return data

class QuotationSerializer(serializers.ModelSerializer):
    quotation_items = QuotationItemSerializer(many=True, read_only=True)
    customer_details = CustomerSerializer(source='customer', read_only=True)
    eit_details = EITSerializer(source='eit', read_only=True)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    
    customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    
    # Snapshot responsible persons (CSV strings) — expose for READ and WRITE so frontend can fetch edited values
    cus_respon_attn = serializers.CharField(required=False, allow_blank=True)
    cus_respon_div = serializers.CharField(required=False, allow_blank=True)
    cus_respon_mobile = serializers.CharField(required=False, allow_blank=True)
    # CC fields (mapped into Customer.cc* columns). Expose for READ and WRITE for per-quotation snapshots.
    cus_respon_cc = serializers.CharField(required=False, allow_blank=True)
    cus_respon_cc_div = serializers.CharField(required=False, allow_blank=True)
    cus_respon_cc_mobile = serializers.CharField(required=False, allow_blank=True)
    cus_respon_cc_email = serializers.CharField(required=False, allow_blank=True)
    
    # Snapshot customer fields — expose for READ and WRITE so the UI always fetches from the quotation row
    customer_tax_id = serializers.CharField(required=False, allow_blank=True)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    customer_email = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    customer_fax = serializers.CharField(required=False, allow_blank=True)

    # Snapshot EIT fields — expose for READ and WRITE for per-quotation snapshots
    eit_name = serializers.CharField(required=False, allow_blank=True)
    eit_address = serializers.CharField(required=False, allow_blank=True)
    eit_mobile = serializers.CharField(required=False, allow_blank=True)
    eit_phone = serializers.CharField(required=False, allow_blank=True)
    eit_fax = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Quotation
        fields = '__all__'

    def to_internal_value(self, data):
        # Accept JSON string for 'items' when sent as FormData fallback
        if 'items' in data and isinstance(data.get('items'), str):
            import json
            try:
                # Make a mutable copy when data is QueryDict
                if hasattr(data, 'dict'):
                    data = data.dict()
                elif hasattr(data, 'copy'):
                    data = data.copy()
                parsed = json.loads(data.get('items') or '[]')
                if isinstance(parsed, list):
                    data['items'] = parsed
            except:
                # Ignore parse errors and let normal validation handle missing items
                pass
        return super().to_internal_value(data)
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        # Comment: If the frontend provides a source_quotation_id, copy QuotationItem rows from that parent
        source_quotation_id = validated_data.pop('source_quotation_id', None)
        # Comment: DRF drops unknown fields; fallback to raw request payload for source_quotation_id
        if not source_quotation_id and 'request' in self.context:
            try:
                raw_id = self.context['request'].data.get('source_quotation_id')
                if raw_id:
                    source_quotation_id = int(str(raw_id))
            except Exception:
                source_quotation_id = None
        # Comment: Auto-generate qo_code when not provided; duplicates allowed for quotations
        qo = (validated_data.get('qo_code') or '').strip()
        if not qo:
            validated_data['qo_code'] = _next_sequence(Quotation, 'qo_code', pad=4, allow_duplicate=True)
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Comment: Keep snapshot fields in validated_data so they are stored on the Quotation row
        
        if customer_name:
            # Comment: Link to Customer but DO NOT mutate shared Customer fields to keep quotations independent
            customer, created = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = customer
        
        # If eit (ID) is not provided but eit_name is, try to find it
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            validated_data['eit'] = eit
            
        # Reconstruct items from multipart FormData keys like items[0][field]
        # Comment: Always attempt nested reconstruction and use it if explicit items list was not provided.
        if 'request' in self.context:
            import re
            req = self.context['request']
            qd = req.data
            files = getattr(req, 'FILES', None)
            index_map = {}
            pattern = re.compile(r'^items\[(\d+)\]\[(\w+)\]$')
            for key in qd.keys():
                m = pattern.match(key)
                if not m:
                    continue
                idx = int(m.group(1))
                field = m.group(2)
                index_map.setdefault(idx, {})
                index_map[idx][field] = qd.get(key)
            if files:
                for fkey in files.keys():
                    m = pattern.match(fkey)
                    if not m:
                        continue
                    idx = int(m.group(1))
                    field = m.group(2)
                    index_map.setdefault(idx, {})
                    index_map[idx][field] = files.get(fkey)
            nested_items = [index_map[i] for i in sorted(index_map.keys())]
            if not items_data and nested_items:
                items_data = nested_items
            # Merge uploaded images and image_path hints from nested map into existing items_data if present
            if items_data and index_map:
                for idx, nested in index_map.items():
                    if 'image' in nested and nested['image']:
                        try:
                            items_data[idx]['image'] = nested['image']
                        except Exception:
                            # If list shorter, append placeholders up to idx
                            while len(items_data) <= idx:
                                items_data.append({})
                            items_data[idx]['image'] = nested['image']
                    if 'image_path' in nested and nested['image_path']:
                        try:
                            items_data[idx]['image_path'] = nested['image_path']
                        except Exception:
                            while len(items_data) <= idx:
                                items_data.append({})
                            items_data[idx]['image_path'] = nested['image_path']

        # Comment: Allow duplicate qo_code; enforce unique file_name instead
        fname = validated_data.get('file_name')
        if fname and Quotation.objects.filter(file_name=fname).exists():
            raise serializers.ValidationError({'file_name': 'File name must be unique'})
        quotation = Quotation.objects.create(**validated_data)
        
        # Comment: If a parent quotation ID is provided, copy its QuotationItem rows and images
        if source_quotation_id:
            try:
                parent = Quotation.objects.filter(pk=source_quotation_id).first()
            except Exception:
                parent = None
            if parent:
                # Comment: Preserve original ordering to keep row alignment consistent
                for qi in parent.quotation_items.all().order_by('id'):
                    item_obj = QuotationItem(
                        quotation=quotation,
                        quo_item=qi.quo_item,
                        quo_model=qi.quo_model,
                        quo_description=qi.quo_description,
                        specification=qi.specification,
                        quantity=qi.quantity,
                        quo_total=qi.quo_total,
                    )
                    # Comment: Copy physical image file when present by reading from MEDIA_ROOT path
                    try:
                        if qi.image and hasattr(qi.image, 'path'):
                            src_path = qi.image.path
                            if os.path.exists(src_path) and os.path.getsize(src_path) > 0:
                                ext = os.path.splitext(src_path)[1] or '.png'
                                # Comment: ImageField already prefixes upload_to; use filename only
                                new_name = f"{uuid.uuid4().hex}{ext}"
                                with open(src_path, 'rb') as fsrc:
                                    data = fsrc.read()
                                    if data:
                                        item_obj.image.save(new_name, ContentFile(data), save=False)
                    except Exception:
                        pass
                    item_obj.save()
            # Comment: When copying from parent, skip processing items_data to avoid duplicate rows
            return quotation
        
        # Comment: Assign hierarchical quo_item codes: base rows get "1","2",... and spec-only rows get "1.1","1.2",...
        parent_code = None
        spec_seq = 1
        for item in items_data:
            try:
                qty = float(item.get('qty', 1))
                price = float(str(item.get('price', 0)).replace(',', ''))
                total = qty * price
            except:
                qty = 1
                total = 0
            # Comment: Create QuotationItem object first; attach image using ImageField.save for correct storage
            # Normalize fields to avoid blank rows when some keys are missing
            desc = str(item.get('description', '') or '').strip()
            spec = str(item.get('specification', '') or '').strip()
            model = str(item.get('model', '') or '').strip()
            item_title = str(item.get('item', '') or '').strip()
            # Comment: Determine if this is a base item row (has item/model or qty>0) or a spec-only row
            base_row = (item_title or model or qty > 0)
            # Comment: Generate hierarchical code
            if base_row:
                # Comment: New parent row — assign next base number without padding (e.g., "1","2")
                item_title = _next_base_item_number(quotation)
                parent_code = item_title
                spec_seq = 1
            else:
                # Comment: Spec-only row — attach under current parent using dotted sequence (e.g., "1.1","1.2")
                if not parent_code:
                    parent_code = _next_base_item_number(quotation)
                    spec_seq = 1
                item_title = f"{parent_code}.{spec_seq}"
                spec_seq += 1
            # Do not merge specification into description; keep them separate
            # For specification-only rows (qty=0 and blank item/model), store text in 'specification' field only
            if not base_row:
                if not spec and desc:
                    spec = desc
                desc = ""
            # Comment: Instantiate without image; attach image via ImageField.save to avoid path mismatches
            item_obj = QuotationItem(
                quotation=quotation,
                quo_item=item_title,
                quo_model=model,
                quo_description=desc,
                specification=spec,
                quantity=int(qty),
                quo_total=total,
            )
            # Comment: Handle image input minimally — store uploaded files or copy from image_path
            img_input = item.get('image')
            img_path_hint = (item.get('image_path') or '').strip()
            try:
                if hasattr(img_input, 'read'):
                    # Save uploaded file directly with a unique name (filename only)
                    name_hint = getattr(img_input, 'name', '') or 'upload.png'
                    ext = os.path.splitext(name_hint)[1] or '.png'
                    new_name = f"{uuid.uuid4().hex}{ext}"
                    try:
                        img_input.seek(0)
                    except Exception:
                        pass
                    item_obj.image.save(new_name, img_input, save=False)
                elif img_path_hint:
                    # Copy from MEDIA_ROOT when image_path is provided; avoid overwriting if unchanged
                    src = img_path_hint.replace('\\', '/').strip()
                    if src.startswith('/'):
                        src = src[1:]
                    if src.startswith('media/'):
                        src = src.split('media/', 1)[1]
                    src = src.replace('quotation_items/quotation_items/', 'quotation_items/')
                    current_name = str(getattr(item_obj.image, 'name', '') or '')
                    normalized_current = current_name.replace('\\', '/').lstrip('/')
                    normalized_src = src.replace('\\', '/').lstrip('/')
                    if normalized_src and normalized_current and normalized_src == normalized_current:
                        pass
                    else:
                        abs_path = os.path.join(settings.MEDIA_ROOT, normalized_src)
                        abs_path = os.path.normpath(abs_path)
                        if os.path.exists(abs_path) and os.path.isfile(abs_path):
                            ext = os.path.splitext(abs_path)[1] or '.png'
                            new_name = f"{uuid.uuid4().hex}{ext}"
                            with open(abs_path, 'rb') as fsrc:
                                data = fsrc.read()
                                if data:
                                    item_obj.image.save(new_name, ContentFile(data), save=False)
            except Exception:
                pass
            item_obj.save()
            
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Comment: Keep snapshot fields in validated_data so they are stored on the Quotation row

        if customer_name:
            # Comment: Only re-link Customer; do NOT update shared Customer fields to avoid cross-updates
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            instance.customer = customer

        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
            
        # Comment: Validate file_name uniqueness on update (excluding current instance)
        new_fname = validated_data.get('file_name')
        if new_fname and Quotation.objects.filter(file_name=new_fname).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError({'file_name': 'File name must be unique'})
        # Comment: Allow editable qo_code; duplicates are allowed, so no uniqueness validation here
        # Update instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Reconstruct items from multipart FormData for updates (always attempt; use if explicit items absent)
        if 'request' in self.context:
            import re
            req = self.context['request']
            qd = req.data
            files = getattr(req, 'FILES', None)
            index_map = {}
            pattern = re.compile(r'^items\[(\d+)\]\[(\w+)\]$')
            for key in qd.keys():
                m = pattern.match(key)
                if not m:
                    continue
                idx = int(m.group(1))
                field = m.group(2)
                index_map.setdefault(idx, {})
                index_map[idx][field] = qd.get(key)
            if files:
                for fkey in files.keys():
                    m = pattern.match(fkey)
                    if not m:
                        continue
                    idx = int(m.group(1))
                    field = m.group(2)
                    index_map.setdefault(idx, {})
                    index_map[idx][field] = files.get(fkey)
            nested_items = [index_map[i] for i in sorted(index_map.keys())]
            if not items_data and nested_items:
                items_data = nested_items
            # Merge uploaded images from nested map into existing items_data if present
            if items_data and index_map:
                for idx, nested in index_map.items():
                    if 'image' in nested and nested['image']:
                        try:
                            items_data[idx]['image'] = nested['image']
                        except Exception:
                            while len(items_data) <= idx:
                                items_data.append({})
                            items_data[idx]['image'] = nested['image']

        # Handle items: upsert rows and preserve existing images when not provided
        if items_data:
            # Comment: Fetch existing items ordered by ID to align updates by index when row_id is not provided
            existing_items = list(instance.quotation_items.all().order_by('id'))
            existing_by_id = {qi.id: qi for qi in existing_items}
            updated_items = []
            # Comment: Track current parent base code and spec sequence for dotted numbering on new spec rows
            parent_code = None
            spec_seq = 1
            for idx, item in enumerate(items_data):
                try:
                    qty = float(item.get('qty', 1))
                    price = float(str(item.get('price', 0)).replace(',', ''))
                    total = qty * price
                except:
                    qty = 1
                    total = 0
                
                # Normalize fields to avoid blank rows when some keys are missing
                desc = str(item.get('description', '') or '').strip()
                spec = str(item.get('specification', '') or '').strip()
                model = str(item.get('model', '') or '').strip()
                item_title = str(item.get('item', '') or '').strip()
                base_row = (item_title or model or qty > 0)
                if base_row and not item_title and desc:
                    item_title = (desc.split('\n', 1)[0])[:255]
                # Comment: For spec-only rows, store text in 'specification' only
                if not base_row:
                    if not spec and desc:
                        spec = desc
                    desc = ""
                
                # Comment: Determine target row — prefer matching by explicit id/row_id sent from UI
                target = None
                try:
                    rid = item.get('row_id')
                    if rid is not None:
                        rid_int = int(str(rid))
                        target = existing_by_id.get(rid_int)
                except Exception:
                    target = None
                if not target:
                    try:
                        iid = item.get('id')
                        if iid is not None:
                            iid_int = int(str(iid))
                            target = existing_by_id.get(iid_int)
                    except Exception:
                        target = None
                # Comment: Fallback by index only when no explicit id/row_id is provided
                if not target:
                    target = existing_items[idx] if idx < len(existing_items) else None
                # Comment: Create a new row only when this payload represents a new item (no id/row_id and index beyond existing)
                if not target:
                    target = QuotationItem(quotation=instance)
                
                # Comment: Assign non-image fields
                # Comment: Assign hierarchical quo_item:
                # - Preserve existing code if present
                # - Otherwise set base rows to next base number and spec-only rows to dotted sequence under current parent
                existing_code = str(target.quo_item or '').strip()
                if existing_code:
                    target.quo_item = existing_code
                    # Comment: Update parent_code context when we encounter a base code (pure integer)
                    try:
                        import re
                        if re.fullmatch(r'\d+', existing_code):
                            parent_code = existing_code
                            spec_seq = 1
                        elif re.fullmatch(r'(\d+)\.(\d+)', existing_code):
                            parent_code = existing_code.split('.')[0]
                    except Exception:
                        pass
                else:
                    # Comment: Decide base vs spec-only
                    is_base = bool(item_title or model or qty > 0)
                    if is_base:
                        target.quo_item = _next_base_item_number(instance)
                        parent_code = target.quo_item
                        spec_seq = 1
                    else:
                        if not parent_code:
                            parent_code = _next_base_item_number(instance)
                            spec_seq = 1
                        target.quo_item = f"{parent_code}.{spec_seq}"
                        spec_seq += 1
                target.quo_model = model
                target.quo_description = desc
                target.specification = spec
                target.quantity = int(qty)
                target.quo_total = total
                
                # Comment: Handle image minimally — only save uploaded files or copy via image_path; otherwise leave existing image
                img_input = item.get('image')
                img_path_hint = (item.get('image_path') or '').strip()
                try:
                    if hasattr(img_input, 'read'):
                        name_hint = getattr(img_input, 'name', '') or 'upload.png'
                        ext = os.path.splitext(name_hint)[1] or '.png'
                        # Comment: Use filename only
                        new_name = f"{uuid.uuid4().hex}{ext}"
                        try:
                            img_input.seek(0)
                        except Exception:
                            pass
                        target.image.save(new_name, img_input, save=False)
                    elif img_path_hint:
                        src = img_path_hint.replace('\\', '/').strip()
                        if src.startswith('/'):
                            src = src[1:]
                        if src.startswith('media/'):
                            src = src.split('media/', 1)[1]
                        src = src.replace('quotation_items/quotation_items/', 'quotation_items/')
                        current_name = str(getattr(target.image, 'name', '') or '')
                        normalized_current = current_name.replace('\\', '/').lstrip('/')
                        normalized_src = src.replace('\\', '/').lstrip('/')
                        if normalized_src and normalized_current and normalized_src == normalized_current:
                            pass
                        else:
                            abs_path = os.path.join(settings.MEDIA_ROOT, normalized_src)
                            abs_path = os.path.normpath(abs_path)
                            if os.path.exists(abs_path) and os.path.isfile(abs_path):
                                ext = os.path.splitext(abs_path)[1] or '.png'
                                new_name = f"{uuid.uuid4().hex}{ext}"
                                with open(abs_path, 'rb') as fsrc:
                                    data = fsrc.read()
                                    if data:
                                        target.image.save(new_name, ContentFile(data), save=False)
                except Exception:
                    pass
                
                target.save()
                updated_items.append(target)
            # Comment: Do NOT delete trailing rows implicitly. Only remove rows when client explicitly sends a delete flag.
        
        return instance

class BillingNoteSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    eit_details = EITSerializer(source='eit', read_only=True)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    
    # Write-only fields for creation
    customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Customer extra fields
    cus_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_attn = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_div = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # EIT extra fields
    eit_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = BillingNote
        fields = '__all__'

    def create(self, validated_data):
        # Comment: Auto-generate Billing Note code when not provided; must remain unique
        bn = (validated_data.get('bn_code') or '').strip()
        if not bn:
            validated_data['bn_code'] = _next_sequence(BillingNote, 'bn_code', pad=4, allow_duplicate=False)
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Extract customer details
        cus_address = validated_data.pop('cus_address', '')
        cus_phone = validated_data.pop('cus_phone', '')
        cus_fax = validated_data.pop('cus_fax', '')
        cus_attn = validated_data.pop('cus_attn', '')
        cus_div = validated_data.pop('cus_div', '')
        cus_mobile = validated_data.pop('cus_mobile', '')
        
        # Extract EIT details (ignore to prevent overwrite)
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            if cus_address: customer.address = cus_address
            if cus_phone: customer.phone = cus_phone
            if cus_fax: customer.cus_fax = cus_fax
            if cus_attn: customer.attn = cus_attn
            if cus_div: customer.division = cus_div
            if cus_mobile: customer.mobile = cus_mobile
            customer.save()
            validated_data['customer'] = customer

        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            validated_data['eit'] = eit
            
        return super().create(validated_data)

        # Comment: Allow editable BN code but enforce uniqueness (excluding current instance)
        new_bn = (validated_data.get('bn_code') or '').strip()
        if new_bn and BillingNote.objects.filter(bn_code=new_bn).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError({'bn_code': 'Billing Note code must be unique'})
    def update(self, instance, validated_data):
        customer_name = validated_data.pop('customer_name', None)
        
        # Extract customer details
        cus_address = validated_data.pop('cus_address', '')
        cus_phone = validated_data.pop('cus_phone', '')
        cus_fax = validated_data.pop('cus_fax', '')
        cus_attn = validated_data.pop('cus_attn', '')
        cus_div = validated_data.pop('cus_div', '')
        cus_mobile = validated_data.pop('cus_mobile', '')
        
        # Extract EIT details (ignore)
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            if cus_address: customer.address = cus_address
            if cus_phone: customer.phone = cus_phone
            if cus_fax: customer.cus_fax = cus_fax
            if cus_attn: customer.attn = cus_attn
            if cus_div: customer.division = cus_div
            if cus_mobile: customer.mobile = cus_mobile
            customer.save()
            instance.customer = customer

        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
            
        return super().update(instance, validated_data)


class ReceiptSerializer(serializers.ModelSerializer):
    # Expose linked EIT details for read convenience; write uses FK by id
    eit_details = EITSerializer(source='eit', read_only=True)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    # Accept EIT name for legacy/fallback creation; not required when eit FK provided
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Additional EIT fields come from model and are not persisted via serializer
    eit_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Receipt
        fields = '__all__'

    def create(self, validated_data):
        # Ignore EIT details in payload; they are derived/display-only
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')
        # If no explicit EIT FK provided, fallback by organization_name
        eit_name = validated_data.pop('eit_name', None)
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            validated_data['eit'] = eit
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Ignore EIT details in payload; they are derived/display-only
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')
        # If no explicit EIT FK provided, fallback by organization_name
        eit_name = validated_data.pop('eit_name', None)
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
        return super().update(instance, validated_data)

class TaxInvoiceSerializer(serializers.ModelSerializer):
    # Read-only nested details for convenience
    customer_details = CustomerSerializer(source='customer', read_only=True)
    eit_details = EITSerializer(source='eit', read_only=True)
    # Write using primary keys
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), write_only=True, required=False)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    # Fallback write-only names (like Quotation)
    customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = TaxInvoice
        fields = '__all__'

    def create(self, validated_data):
        # Comment: Auto-generate Tax Invoice code when not provided; must remain unique
        tic = (validated_data.get('tax_invoice_code') or '').strip()
        if not tic:
            validated_data['tax_invoice_code'] = _next_sequence(TaxInvoice, 'tax_invoice_code', pad=4, allow_duplicate=False)
        # Resolve customer by name if FK not provided
        customer_name = validated_data.pop('customer_name', None)
        if not validated_data.get('customer') and customer_name:
            cust, _ = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = cust
        # Resolve EIT by name if FK not provided
        eit_name = validated_data.pop('eit_name', None)
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            validated_data['eit'] = eit
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Comment: Allow editable Tax Invoice code but enforce uniqueness (excluding current instance)
        new_code = (validated_data.get('tax_invoice_code') or '').strip()
        if new_code and TaxInvoice.objects.filter(tax_invoice_code=new_code).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError({'tax_invoice_code': 'Tax Invoice code must be unique'})
        return super().update(instance, validated_data)

    def update(self, instance, validated_data):
        # Resolve customer by name if FK not provided
        customer_name = validated_data.pop('customer_name', None)
        if not validated_data.get('customer') and customer_name:
            cust, _ = Customer.objects.get_or_create(company_name=customer_name)
            instance.customer = cust
        # Resolve EIT by name if FK not provided
        eit_name = validated_data.pop('eit_name', None)
        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
        return super().update(instance, validated_data)
class PurchaseOrderSerializer(serializers.ModelSerializer):
    eit_details = EITSerializer(source='eit', read_only=True)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'

    def create(self, validated_data):
        eit_name = validated_data.pop('eit_name', None)
        # Ignore EIT details
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            validated_data['eit'] = eit
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        eit_name = validated_data.pop('eit_name', None)
        # Ignore EIT details
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
            
        return super().update(instance, validated_data)

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class PMTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = PMTask
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    class Meta:
        model = Project
        fields = '__all__'

class PMProjectSerializer(serializers.ModelSerializer):
    tasks = PMTaskSerializer(many=True, read_only=True)
    class Meta:
        model = PMProject
        fields = '__all__'

class ManufacturingOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    write_customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    po_file = serializers.FileField(write_only=True, required=False)
    linked_cpo_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ManufacturingOrder
        exclude = ['po_file_content']

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""

    def to_internal_value(self, data):
        # Handle JSON strings in FormData (e.g. for items)
        if 'items' in data and isinstance(data['items'], str):
            import json
            try:
                # We need a mutable copy if data is QueryDict
                if hasattr(data, 'dict'):
                    data = data.dict()
                elif hasattr(data, 'copy'):
                    data = data.copy()
                
                data['items'] = json.loads(data['items'])
            except:
                pass
        return super().to_internal_value(data)

    def create(self, validated_data):
        customer_name = validated_data.pop('write_customer_name', None)
        po_file = validated_data.pop('po_file', None)
        linked_cpo_id = validated_data.pop('linked_cpo_id', None)
        
        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = customer
            
        instance = super().create(validated_data)

        if po_file:
            instance.po_file_name = po_file.name
            instance.po_file_type = po_file.content_type
            instance.po_file_content = po_file.read()
            instance.save()
        elif linked_cpo_id:
            try:
                cpo = CustomerPurchaseOrder.objects.get(id=linked_cpo_id)
                if cpo.po_file_content:
                    instance.po_file_name = cpo.po_file_name
                    instance.po_file_type = cpo.po_file_type
                    instance.po_file_content = cpo.po_file_content
                    instance.save()
            except CustomerPurchaseOrder.DoesNotExist:
                pass
            
        return instance

    def update(self, instance, validated_data):
        customer_name = validated_data.pop('write_customer_name', None)
        po_file = validated_data.pop('po_file', None)
        linked_cpo_id = validated_data.pop('linked_cpo_id', None)
        
        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = customer
            
        # Update other fields first
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if po_file:
            instance.po_file_name = po_file.name
            instance.po_file_type = po_file.content_type
            instance.po_file_content = po_file.read()
        elif linked_cpo_id:
            try:
                cpo = CustomerPurchaseOrder.objects.get(id=linked_cpo_id)
                if cpo.po_file_content:
                    instance.po_file_name = cpo.po_file_name
                    instance.po_file_type = cpo.po_file_type
                    instance.po_file_content = cpo.po_file_content
            except CustomerPurchaseOrder.DoesNotExist:
                pass
            
        # If po_file_name is explicitly cleared (empty string) and no new file is uploaded, clear the file content
        if 'po_file_name' in validated_data and not validated_data.get('po_file_name') and not po_file and not linked_cpo_id:
            instance.po_file_content = None
            instance.po_file_type = ''
            
        instance.save()
        return instance

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class ProductVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVersion
        fields = '__all__'

class ProductTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductType
        fields = '__all__'

class SystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = System
        fields = '__all__'

class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = '__all__'

class SystemComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemComponent
        fields = '__all__'

class ComponentEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponentEntry
        fields = '__all__'

class CustomerPurchaseOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    write_customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    po_file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = CustomerPurchaseOrder
        exclude = ['po_file_content']

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""

    def create(self, validated_data):
        customer_name = validated_data.pop('write_customer_name', None)
        po_file = validated_data.pop('po_file', None)
        
        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = customer
            
        if po_file:
            validated_data['po_file_name'] = po_file.name
            validated_data['po_file_type'] = po_file.content_type
            validated_data['po_file_content'] = po_file.read()
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        customer_name = validated_data.pop('write_customer_name', None)
        po_file = validated_data.pop('po_file', None)
        
        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = customer
            
        if po_file:
            validated_data['po_file_name'] = po_file.name
            validated_data['po_file_type'] = po_file.content_type
            validated_data['po_file_content'] = po_file.read()
            
        # If po_file_name is explicitly cleared (empty string) and no new file is uploaded, clear the file content
        if 'po_file_name' in validated_data and not validated_data.get('po_file_name') and not po_file:
            validated_data['po_file_content'] = None
            validated_data['po_file_type'] = ''
            
        return super().update(instance, validated_data)

class StageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'
