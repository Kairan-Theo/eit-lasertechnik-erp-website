import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from crm.models import Inventory, Delivery, Customer

try:
    # Get first inventory item
    inv_item = Inventory.objects.first()
    if not inv_item:
        print("No inventory items found. Creating one...")
        inv_item = Inventory.objects.create(
            inventory_product_name="Test Product",
            inventory_stock=100
        )

    # Get or create customer
    customer = Customer.objects.first()
    if not customer:
        print("No customers found. Creating one...")
        customer = Customer.objects.create(
            company_name="Test Company"
        )

    print(f"Using Inventory: {inv_item.inventory_product_name} (ID: {inv_item.id})")
    print(f"Using Customer: {customer.company_name} (ID: {customer.id})")

    # Create Delivery
    print("Creating Delivery...")
    delivery = Delivery.objects.create(
        inventory_product_name=inv_item,
        order_amount=5,
        delivery_status='pending',
        company_name=customer,
        tracking_number='TEST-TRACK-001',
        courier='Test Courier'
    )
    
    print(f"Delivery created successfully! ID: {delivery.id}")
    
    # Verify it exists
    count = Delivery.objects.count()
    print(f"Total Deliveries in DB: {count}")
    
except Exception as e:
    print(f"Error: {e}")
