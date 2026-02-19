from rest_framework import serializers
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
    
    # Write-only fields for backward compatibility/payload handling
    cus_respon_attn = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_respon_div = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_respon_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # CC fields (mapped into Customer.cc* columns). These are write-only to avoid schema noise in the Quotation response.
    cus_respon_cc = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_respon_cc_div = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_respon_cc_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cus_respon_cc_email = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Customer extra fields
    customer_tax_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    customer_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    customer_email = serializers.CharField(write_only=True, required=False, allow_blank=True)
    customer_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    customer_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # EIT extra fields (legacy support, but ignored for update)
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

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
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Extract customer details (CSV supported: "user1,user2")
        attn = validated_data.pop('cus_respon_attn', '')
        div = validated_data.pop('cus_respon_div', '')
        mobile = validated_data.pop('cus_respon_mobile', '')
        # Extract CC details to persist into Customer (CSV supported)
        cc = validated_data.pop('cus_respon_cc', '')
        cc_div = validated_data.pop('cus_respon_cc_div', '')
        cc_mobile = validated_data.pop('cus_respon_cc_mobile', '')
        cc_email = validated_data.pop('cus_respon_cc_email', '')
        
        tax_id = validated_data.pop('customer_tax_id', '')
        address = validated_data.pop('customer_address', '')
        email = validated_data.pop('customer_email', '')
        phone = validated_data.pop('customer_phone', '')
        fax = validated_data.pop('customer_fax', '')

        # Extract EIT details (and ignore them to prevent overwriting)
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')
        
        if customer_name:
            customer, created = Customer.objects.get_or_create(company_name=customer_name)
            # Update customer details if provided
            if attn: customer.attn = attn  # CSV string
            if div: customer.attn_division = div  # CSV string
            if mobile: customer.attn_mobile = mobile  # CSV string
            if cc: customer.cc = cc  # CSV string
            if cc_div: customer.cc_division = cc_div  # CSV string
            if cc_mobile: customer.cc_mobile = cc_mobile  # CSV string
            if cc_email: customer.cc_email = cc_email  # CSV string
            
            if tax_id: customer.tax_id = tax_id
            if address: customer.address = address
            if email: customer.email = email
            if phone: customer.phone = phone
            if fax: customer.cus_fax = fax
            
            customer.save()
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
            # Merge uploaded images from nested map into existing items_data if present
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

        # Auto-generate unique qo_code when missing or duplicate to prevent accidental overwrite of original quotation
        from datetime import datetime
        import re
        year = datetime.now().year
        code = validated_data.get('qo_code') or ''
        if not code or Quotation.objects.filter(qo_code=code).exists():
            pattern = re.compile(rf'^EIT QUO {year}-(\d{{4}})$')
            existing = Quotation.objects.filter(qo_code__startswith=f'EIT QUO {year}-').values_list('qo_code', flat=True)
            max_n = 0
            for s in existing:
                try:
                    m = pattern.match(str(s or ''))
                    if m:
                        n = int(m.group(1))
                        if n > max_n:
                            max_n = n
                except Exception:
                    pass
            validated_data['qo_code'] = f"EIT QUO {year}-{str(max_n + 1).zfill(4)}"
        quotation = Quotation.objects.create(**validated_data)
        
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
            
            QuotationItem.objects.create(
                quotation=quotation,
                quo_item=item_title,
                quo_model=model,
                quo_description=desc,
                specification=spec,
                quantity=int(qty),
                quo_total=total,
                image=item.get('image')  # UploadedFile handled by ImageField
            )
            
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Extract customer details (CSV supported)
        attn = validated_data.pop('cus_respon_attn', '')
        div = validated_data.pop('cus_respon_div', '')
        mobile = validated_data.pop('cus_respon_mobile', '')
        # Extract CC details to persist into Customer (CSV supported)
        cc = validated_data.pop('cus_respon_cc', '')
        cc_div = validated_data.pop('cus_respon_cc_div', '')
        cc_mobile = validated_data.pop('cus_respon_cc_mobile', '')
        cc_email = validated_data.pop('cus_respon_cc_email', '')
        
        tax_id = validated_data.pop('customer_tax_id', '')
        address = validated_data.pop('customer_address', '')
        email = validated_data.pop('customer_email', '')
        phone = validated_data.pop('customer_phone', '')
        fax = validated_data.pop('customer_fax', '')
        
        # Extract EIT details (and ignore them to prevent overwriting)
        validated_data.pop('eit_address', '')
        validated_data.pop('eit_mobile', '')
        validated_data.pop('eit_phone', '')
        validated_data.pop('eit_fax', '')

        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            if attn: customer.attn = attn
            if div: customer.attn_division = div
            if mobile: customer.attn_mobile = mobile
            if cc: customer.cc = cc
            if cc_div: customer.cc_division = cc_div
            if cc_mobile: customer.cc_mobile = cc_mobile
            if cc_email: customer.cc_email = cc_email
            
            if tax_id: customer.tax_id = tax_id
            if address: customer.address = address
            if email: customer.email = email
            if phone: customer.phone = phone
            if fax: customer.cus_fax = fax
            
            customer.save()
            instance.customer = customer

        if not validated_data.get('eit') and eit_name:
            eit = EIT.objects.filter(organization_name=eit_name).first()
            if not eit:
                eit = EIT.objects.create(organization_name=eit_name)
            instance.eit = eit
            
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
                
                QuotationItem.objects.create(
                    quotation=instance,
                    quo_item=item_title,
                    quo_model=model,
                    quo_description=desc,
                    specification=spec,
                    quantity=int(qty),
                    quo_total=total,
                    image=item.get('image')  # UploadedFile handled by ImageField
                )
        
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
