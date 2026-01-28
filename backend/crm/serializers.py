from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Deal, ActivitySchedule, Quotation, QuotationItem, Invoice, PurchaseOrder, Project, Task, Customer, SupportTicket, Lead, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EmailLog, EmailAttachment, DealHistory, EIT

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

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = '__all__'

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.first_name if obj.assigned_to else ""

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class SupportTicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        
    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""
        
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.first_name if obj.assigned_to else ""

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
            'po_number',
            'priority',
            'contact',
            'email',
            'phone',
            'address',
            'tax_id',
            'items',
            'notes',
            'created_at',
            'expected_close',
            'stage',
            'activity_schedules',
            'salesperson',
        ]
        read_only_fields = ['created_at', 'customer_name', 'activity_schedules']

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""
    
    def create(self, validated_data):
        write_name = self.initial_data.get('write_customer_name') or self.initial_data.get('customer_name') or None
        if write_name and not validated_data.get('customer'):
            name = write_name.strip()
            if name:
                cust, _ = Customer.objects.get_or_create(
                    company_name=name,
                    defaults={
                        'contact_name': '',
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
    customer_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = Quotation
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        customer_name = validated_data.pop('customer_name', None)
        
        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            validated_data['customer'] = customer
            
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
        
        if customer_name:
            customer, _ = Customer.objects.get_or_create(company_name=customer_name)
            instance.customer = customer
            
        # Update instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle items: Delete old and create new
        # Only if items_data is provided (meaning we want to update items)
        # Since items is required=False, it might be empty list if cleared, or not present.
        # But pop returns [] default. If frontend sends empty list, it means clear items.
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

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_id = serializers.PrimaryKeyRelatedField(source='customer', queryset=Customer.objects.all(), write_only=True, required=False)
    write_customer_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'customer',
            'customer_name',
            'customer_id',
            'write_customer_name',
            'start_date',
            'end_date',
            'status',
            'priority',
            'created_at',
            'updated_at',
            'tasks',
        ]

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""

    def create(self, validated_data):
        # Support creating customer by name if provided
        write_name = self.initial_data.get('write_customer_name') or self.initial_data.get('customer_name') or None
        if write_name and not validated_data.get('customer'):
            name = write_name.strip()
            if name:
                cust, _ = Customer.objects.get_or_create(
                    company_name=name,
                    defaults={
                        'contact_name': '',
                        'email': '',
                        'phone': '',
                        'industry': '',
                        'address': ''
                    }
                )
                validated_data['customer'] = cust
        return super().create(validated_data)

class ManufacturingOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_id = serializers.PrimaryKeyRelatedField(source='customer', queryset=Customer.objects.all(), write_only=True, required=False)
    po_id = serializers.PrimaryKeyRelatedField(source='po', queryset=PurchaseOrder.objects.all(), write_only=True, required=False)

    class Meta:
        model = ManufacturingOrder
        fields = [
            'id',
            'job_order_code',
            'po',
            'po_id',
            'po_number',
            'customer',
            'customer_id',
            'customer_name',
            'product',
            'product_no',
            'quantity',
            'start_date',
            'complete_date',
            'production_time',
            'responsible_sales_person',
            'responsible_production_person',
            'supplier',
            'supplier_date',
            'recipient',
            'recipient_date',
            'component_status',
            'state',
            'items',
            'item_description',
            'item_quantity',
            'item_unit',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'customer_name']

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""

class ComponentEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponentEntry
        fields = '__all__'

    def _normalize_items(self, items):
        result = []
        for x in items or []:
            item = str((x.get('item') or x.get('itemCode') or '')).strip()
            item_description = str((x.get('item_description') or x.get('description') or '')).strip()
            item_quantity = str((x.get('item_quantity') or x.get('qty') or '')).strip()
            item_unit = str((x.get('item_unit') or x.get('unit') or 'Unit')).strip()
            result.append({
                'item': item,
                'item_description': item_description,
                'item_quantity': item_quantity,
                'item_unit': item_unit,
            })
        return result

    def create(self, validated_data):
        # If explicit PO is provided, mirror its number into po_number
        if validated_data.get('po') and not validated_data.get('po_number'):
            validated_data['po_number'] = validated_data['po'].number
        if 'items' in validated_data:
            validated_data['items'] = self._normalize_items(validated_data.get('items') or [])
            if validated_data['items']:
                first = validated_data['items'][0]
                validated_data.setdefault('item_description', first.get('item_description') or '')
                validated_data.setdefault('item_quantity', first.get('item_quantity') or '')
                validated_data.setdefault('item_unit', first.get('item_unit') or '')
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If explicit PO is provided, mirror its number into po_number
        if validated_data.get('po') and not validated_data.get('po_number'):
            validated_data['po_number'] = validated_data['po'].number
        if 'items' in validated_data:
            validated_data['items'] = self._normalize_items(validated_data.get('items') or [])
            if validated_data['items']:
                first = validated_data['items'][0]
                validated_data.setdefault('item_description', first.get('item_description') or '')
                validated_data.setdefault('item_quantity', first.get('item_quantity') or '')
                validated_data.setdefault('item_unit', first.get('item_unit') or '')
        return super().update(instance, validated_data)

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
