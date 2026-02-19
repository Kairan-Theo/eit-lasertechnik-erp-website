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

class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = '__all__'

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
                                new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                                with open(src_path, 'rb') as fsrc:
                                    data = fsrc.read()
                                    if data:
                                        item_obj.image.save(new_name, ContentFile(data), save=False)
                    except Exception:
                        pass
                    item_obj.save()
            # Comment: When copying from parent, skip processing items_data to avoid duplicate rows
            return quotation
        
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
            # If this is a base row (has qty>0 or item/model provided), derive title from description
            base_row = (item_title or model or qty > 0)
            if base_row and not item_title and desc:
                item_title = (desc.split('\n', 1)[0])[:255]
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
            # Comment: Handle image input: Uploaded file or existing path to copy
            img_input = item.get('image')
            img_path_hint = (item.get('image_path') or '').strip()
            assigned_image = False
            try:
                if hasattr(img_input, 'read'):
                    # Comment: UploadedFile provided — save via ImageField.save to ensure a physical file is written
                    try:
                        name_hint = getattr(img_input, 'name', '') or 'upload.png'
                        ext = os.path.splitext(name_hint)[1] or '.png'
                        new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                        # Ensure file pointer at start before saving
                        try:
                            img_input.seek(0)
                        except Exception:
                            pass
                        item_obj.image.save(new_name, img_input, save=False)
                        assigned_image = True
                    except Exception:
                        pass
                else:
                    # Comment: Prefer local media copy via image_path hint to avoid unreliable HTTP self-fetch
                    if (not assigned_image) and img_path_hint:
                        src = img_path_hint.replace('\\', '/')
                        if src.startswith('/'):
                            src = src[1:]
                        abs_path = os.path.join(settings.MEDIA_ROOT, src)
                        abs_path = os.path.normpath(abs_path)
                        if os.path.exists(abs_path) and os.path.isfile(abs_path):
                            try:
                                if os.path.getsize(abs_path) > 0:
                                    ext = os.path.splitext(abs_path)[1] or '.png'
                                    new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                                    with open(abs_path, 'rb') as fsrc:
                                        data = fsrc.read()
                                        if data:
                                            item_obj.image.save(new_name, ContentFile(data), save=False)
                                            assigned_image = True
                            except Exception:
                                pass
                    # Comment: If image_path not provided, handle string 'image' input (HTTP or media path)
                    if (not assigned_image) and isinstance(img_input, str) and img_input.strip():
                        src = img_input.strip().replace('\\', '/')
                        # Comment: If HTTP URL points to our /media/, prefer local filesystem copy to avoid unreliable self-fetch
                        if (src.startswith('http://') or src.startswith('https://')) and ('/media/' in src):
                            try:
                                sub = src.split('/media/', 1)[1]
                                abs_path = os.path.join(settings.MEDIA_ROOT, sub)
                                abs_path = os.path.normpath(abs_path)
                                if os.path.exists(abs_path) and os.path.isfile(abs_path) and os.path.getsize(abs_path) > 0:
                                    ext = os.path.splitext(abs_path)[1] or '.png'
                                    new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                                    with open(abs_path, 'rb') as fsrc:
                                        data = fsrc.read()
                                        if data:
                                            item_obj.image.save(new_name, ContentFile(data), save=False)
                                            assigned_image = True
                            except Exception:
                                pass
                        elif src.startswith('http://') or src.startswith('https://'):
                            # Comment: Download remote image only when not under /media/
                            try:
                                with urllib.request.urlopen(src) as resp:
                                    data = resp.read()
                                    if data:
                                        ct = resp.headers.get('Content-Type', '') or 'image/png'
                                        ext = mimetypes.guess_extension(ct.split(';')[0].strip()) or '.png'
                                        new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                                        item_obj.image.save(new_name, ContentFile(data), save=False)
                                        assigned_image = True
                            except Exception:
                                pass
                        else:
                            # Comment: Copy from MEDIA_ROOT using string path contained in 'image'
                            if '/media/' in src:
                                sub = src.split('/media/', 1)[1]
                                abs_path = os.path.join(settings.MEDIA_ROOT, sub)
                            elif src.startswith('media/'):
                                abs_path = os.path.join(settings.MEDIA_ROOT, src.split('media/', 1)[1])
                            else:
                                abs_path = os.path.join(settings.MEDIA_ROOT, src)
                            abs_path = os.path.normpath(abs_path)
                            if os.path.exists(abs_path) and os.path.isfile(abs_path):
                                try:
                                    if os.path.getsize(abs_path) > 0:
                                        ext = os.path.splitext(abs_path)[1] or '.png'
                                        new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                                        with open(abs_path, 'rb') as fsrc:
                                            data = fsrc.read()
                                            if data:
                                                item_obj.image.save(new_name, ContentFile(data), save=False)
                                                assigned_image = True
                                except Exception:
                                    pass
            except Exception:
                pass
            item_obj.save()
            # Comment: Final guard — if image field was set but the physical file is missing or empty, clear it to avoid broken previews
            try:
                if item_obj.image and hasattr(item_obj.image, 'path'):
                    ipath = item_obj.image.path
                    if (not os.path.exists(ipath)) or (os.path.getsize(ipath) == 0):
                        item_obj.image.delete(save=True)
            except Exception:
                pass
            
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

        # Handle items: only replace when payload contains items; otherwise keep existing
        if items_data:
            instance.quotation_items.all().delete()
            for item in items_data:
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
                # Do not merge specification into description; keep them separate
                if not base_row:
                    if not spec and desc:
                        spec = desc
                    desc = ""
                
                # Comment: Handle image field for update — support UploadedFile and string path copy
                img_input = item.get('image')
                img_file = None
                try:
                    if hasattr(img_input, 'read'):
                        img_file = img_input
                    elif isinstance(img_input, str) and img_input.strip():
                        src = img_input.strip().replace('\\', '/')
                        if '/media/' in src:
                            sub = src.split('/media/', 1)[1]
                            abs_path = os.path.join(settings.MEDIA_ROOT, sub)
                        elif src.startswith('media/'):
                            abs_path = os.path.join(settings.MEDIA_ROOT, src.split('media/', 1)[1])
                        else:
                            abs_path = os.path.join(settings.MEDIA_ROOT, src)
                        abs_path = os.path.normpath(abs_path)
                        if os.path.exists(abs_path) and os.path.isfile(abs_path):
                            base, ext = os.path.splitext(os.path.basename(abs_path))
                            new_name = f"quotation_items/{base}_COPY_{uuid.uuid4().hex}{ext or '.png'}"
                            with open(abs_path, 'rb') as fsrc:
                                saved_path = default_storage.save(new_name, File(fsrc))
                                abs_saved = os.path.join(settings.MEDIA_ROOT, saved_path.replace('media/', '').replace('\\', '/'))
                                if os.path.exists(abs_saved):
                                    img_file = File(open(abs_saved, 'rb'))
                except Exception:
                    img_file = None
                
                # Comment: Instantiate update row without image; attach image via ImageField.save
                item_obj = QuotationItem(
                    quotation=instance,
                    quo_item=item_title,
                    quo_model=model,
                    quo_description=desc,
                    specification=spec,
                    quantity=int(qty),
                    quo_total=total,
                )
                img_input = item.get('image')
                img_path_hint = (item.get('image_path') or '').strip()
                assigned_image = False
                try:
                    if hasattr(img_input, 'read'):
                        # Comment: UploadedFile — save via ImageField.save with a generated unique name
                        try:
                            name_hint = getattr(img_input, 'name', '') or 'upload.png'
                            ext = os.path.splitext(name_hint)[1] or '.png'
                            new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                            try:
                                img_input.seek(0)
                            except Exception:
                                pass
                            item_obj.image.save(new_name, img_input, save=False)
                            assigned_image = True
                        except Exception:
                            pass
                    elif isinstance(img_input, str) and img_input.strip():
                        src = img_input.strip().replace('\\', '/')
                        if '/media/' in src:
                            sub = src.split('/media/', 1)[1]
                            abs_path = os.path.join(settings.MEDIA_ROOT, sub)
                        elif src.startswith('media/'):
                            abs_path = os.path.join(settings.MEDIA_ROOT, src.split('media/', 1)[1])
                        else:
                            abs_path = os.path.join(settings.MEDIA_ROOT, src)
                        abs_path = os.path.normpath(abs_path)
                        if os.path.exists(abs_path) and os.path.isfile(abs_path):
                            ext = os.path.splitext(abs_path)[1] or '.png'
                            new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                            with open(abs_path, 'rb') as fsrc:
                                data = fsrc.read()
                                if data:
                                    item_obj.image.save(new_name, ContentFile(data), save=False)
                                    assigned_image = True
                    # Comment: Final fallback — copy using explicit image_path when previous steps did not assign
                    if (not assigned_image) and img_path_hint:
                        src = img_path_hint.replace('\\', '/')
                        if src.startswith('/'):
                            src = src[1:]
                        abs_path = os.path.join(settings.MEDIA_ROOT, src)
                        abs_path = os.path.normpath(abs_path)
                        if os.path.exists(abs_path) and os.path.isfile(abs_path):
                            try:
                                if os.path.getsize(abs_path) > 0:
                                    ext = os.path.splitext(abs_path)[1] or '.png'
                                    new_name = f"quotation_items/{uuid.uuid4().hex}{ext}"
                                    with open(abs_path, 'rb') as fsrc:
                                        data = fsrc.read()
                                        if data:
                                            item_obj.image.save(new_name, ContentFile(data), save=False)
                                            assigned_image = True
                            except Exception:
                                pass
                except Exception:
                    pass
                item_obj.save()
                # Comment: Final guard on update as well — clear broken references
                try:
                    if item_obj.image and hasattr(item_obj.image, 'path'):
                        ipath = item_obj.image.path
                        if (not os.path.exists(ipath)) or (os.path.getsize(ipath) == 0):
                            item_obj.image.delete(save=True)
                except Exception:
                    pass
        
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

    def update(self, instance, validated_data):
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
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
