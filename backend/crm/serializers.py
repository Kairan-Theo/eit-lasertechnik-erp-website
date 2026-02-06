from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Deal, ActivitySchedule, Quotation, QuotationItem, Invoice, PurchaseOrder, Project, Task, Customer, SupportTicket, Lead, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EmailLog, EmailAttachment, DealHistory, EIT, BillingNote, CustomerPurchaseOrder, Stage, Inventory, Delivery, ProjectManagement, SubProject

class SubProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubProject
        fields = ['id', 'subproject_name', 'subproject_duration']

class ProjectManagementSerializer(serializers.ModelSerializer):
    subprojects = SubProjectSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectManagement
        fields = ['id', 'project_name', 'duration', 'created_at', 'subprojects']


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

    class Meta:
        model = DealHistory
        fields = '__all__'

    def get_deal_title(self, obj):
        return obj.deal.title if obj.deal else ""

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

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Extract customer details
        attn = validated_data.pop('cus_respon_attn', '')
        div = validated_data.pop('cus_respon_div', '')
        mobile = validated_data.pop('cus_respon_mobile', '')
        
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
            if attn: customer.attn = attn
            if div: customer.division = div
            if mobile: customer.mobile = mobile
            
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
            
        quotation = Quotation.objects.create(**validated_data)
        
        for item in items_data:
            try:
                qty = float(item.get('qty', 1))
                price = float(str(item.get('price', 0)).replace(',', ''))
                total = qty * price
            except:
                qty = 1
                total = 0
            
            QuotationItem.objects.create(
                quotation=quotation,
                quo_item=str(item.get('item', '')),
                quo_model=str(item.get('model', '')),
                quo_description=str(item.get('description', '')),
                quantity=int(qty),
                quo_total=total
            )
            
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        customer_name = validated_data.pop('customer_name', None)
        eit_name = validated_data.pop('eit_name', None)
        
        # Extract customer details
        attn = validated_data.pop('cus_respon_attn', '')
        div = validated_data.pop('cus_respon_div', '')
        mobile = validated_data.pop('cus_respon_mobile', '')
        
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
            if div: customer.division = div
            if mobile: customer.mobile = mobile
            
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
        
        # Handle items: Delete old and create new
        if items_data is not None:
            instance.quotation_items.all().delete()
            for item in items_data:
                try:
                    qty = float(item.get('qty', 1))
                    price = float(str(item.get('price', 0)).replace(',', ''))
                    total = qty * price
                except:
                    qty = 1
                    total = 0
                
                QuotationItem.objects.create(
                    quotation=instance,
                    quo_item=str(item.get('item', '')),
                    quo_model=str(item.get('model', '')),
                    quo_description=str(item.get('description', '')),
                    quantity=int(qty),
                    quo_total=total
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

class InvoiceSerializer(serializers.ModelSerializer):
    eit_details = EITSerializer(source='eit', read_only=True)
    eit = serializers.PrimaryKeyRelatedField(queryset=EIT.objects.all(), write_only=True, required=False)
    
    eit_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_mobile = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    eit_fax = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Invoice
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

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
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
