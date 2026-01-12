from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Deal, ActivitySchedule, Quotation, Invoice, PurchaseOrder, Project, Task, Customer, SupportTicket, Lead, ManufacturingOrder

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
    class Meta:
        model = ActivitySchedule
        fields = '__all__'

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
    class Meta:
        model = Quotation
        fields = '__all__'

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
