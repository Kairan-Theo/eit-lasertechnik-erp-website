from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Deal, ActivitySchedule, Quotation, Invoice, PurchaseOrder, Project, Task, Customer, SupportTicket, Lead

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

    class Meta:
        model = Deal
        fields = [
            'id',
            'title',
            'customer',
            'customer_name',
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
            'created_at',
            'expected_close',
            'stage',
            'activity_schedules',
        ]

    def get_customer_name(self, obj):
        return obj.customer.company_name if obj.customer else ""

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
                cust, _ = Customer.objects.get_or_create(company_name=name)
                validated_data['customer'] = cust
        return super().create(validated_data)
