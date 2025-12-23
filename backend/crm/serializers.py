from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Deal, ActivitySchedule, Quotation, Invoice, PurchaseOrder

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
    
    class Meta:
        model = Deal
        fields = '__all__'

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
