from django.db import models, connection
from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone


def ensure_customer_branch_column():
    try:
        if connection.vendor != 'sqlite':
            return
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA table_info(crm_customer)")
            cols = [row[1] for row in cursor.fetchall()]
            if 'branch' not in cols:
                cursor.execute("ALTER TABLE crm_customer ADD COLUMN branch varchar(255)")
    except Exception:
        pass


ensure_customer_branch_column()

class Customer(models.Model):
    company_name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    email = models.EmailField(blank=True)

    phone = models.CharField(max_length=50, blank=True)
    cus_fax = models.CharField(max_length=50, blank=True)
    branch = models.CharField(max_length=255, blank=True)
    attn = models.TextField(blank=True)
    attn_mobile = models.TextField(blank=True)
    attn_division = models.TextField(blank=True)
    attn_email = models.TextField(blank=True)
    attn_position = models.TextField(blank=True)
    cc = models.TextField(blank=True, default="")
    cc_division = models.TextField(blank=True, default="")
    # Comment: Store CSV list of mobiles for additional contacts
    cc_mobile = models.TextField(blank=True, default="")
    # Comment: Store CSV list of emails for additional contacts
    cc_email = models.TextField(blank=True, default="")
    cc_position = models.TextField(blank=True, default="")
    industry = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name


class Branch(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class EIT(models.Model):
    organization_name = models.CharField(max_length=255)
    eit_mobile = models.CharField(max_length=50, blank=True, default="000-000-0000")
    eit_telephone = models.CharField(max_length=50, blank=True, default="02-052-9544")
    eit_fax = models.CharField(max_length=50, blank=True, default="02-052-9544")
    address = models.TextField(blank=True, default="1/120 ซอยรามคําแหง 184 \n แขวงมีนบุรี เขตมีนบุรี \n กรุงเทพมหานคร 10510")
    header_image = models.ImageField(upload_to='eit_headers/', null=True, blank=True)
    # External/system organization identifier (optional).
    # Using PositiveIntegerField to capture numeric IDs when integrating with external systems.
    # unique=True ensures no duplicate organization_id values exist across records.
    organization_id = models.PositiveIntegerField(null=True, blank=True, unique=True)
    # Tax number/Tax ID for the organization (optional). Stored as string to handle formats with leading zeros.
    tax_number = models.CharField(max_length=50, blank=True, default="")

    def __str__(self):
        return self.organization_name

# Removed SupportTicket Model

# Removed Lead Model

class Quotation(models.Model):
    # Comment: Allow duplicate quotation numbers; uniqueness is enforced on file_name instead
    qo_code = models.CharField(max_length=100, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    eit = models.ForeignKey(EIT, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    created_date = models.DateField(default=timezone.localdate)
    # File name to use when downloading/merging PDFs (must be unique across quotations)
    file_name = models.CharField(max_length=255, blank=True, unique=True)
    # Comment: Snapshot customer details per quotation to keep copies independent from master Customer
    customer_tax_id = models.CharField(max_length=255, blank=True)
    customer_address = models.CharField(max_length=500, blank=True)
    customer_email = models.CharField(max_length=255, blank=True)
    customer_phone = models.CharField(max_length=255, blank=True)
    customer_fax = models.CharField(max_length=255, blank=True)
    # Comment: Snapshot customer branch per quotation to keep copies independent from master Customer
    customer_branch = models.CharField(max_length=255, blank=True)
    # Comment: Snapshot responsible persons (CSV strings)
    cus_respon_attn = models.CharField(max_length=1000, blank=True)
    cus_respon_div = models.CharField(max_length=1000, blank=True)
    cus_respon_mobile = models.CharField(max_length=1000, blank=True)
    cus_respon_cc = models.CharField(max_length=1000, blank=True)
    cus_respon_cc_div = models.CharField(max_length=1000, blank=True)
    cus_respon_cc_mobile = models.CharField(max_length=1000, blank=True)
    cus_respon_cc_email = models.CharField(max_length=1000, blank=True)
    # Comment: Snapshot EIT details per quotation (optional)
    eit_name = models.CharField(max_length=255, blank=True)
    eit_address = models.CharField(max_length=500, blank=True)
    eit_mobile = models.CharField(max_length=255, blank=True)
    eit_phone = models.CharField(max_length=255, blank=True)
    eit_fax = models.CharField(max_length=255, blank=True)
    
    trade_terms = models.CharField(max_length=255, blank=True)
    validity = models.CharField(max_length=255, blank=True)
    delivery = models.CharField(max_length=255, blank=True)
    payment_terms = models.CharField(max_length=255, blank=True)
    shipment_location = models.CharField(max_length=255, blank=True)
    invoice_date = models.DateField(null=True, blank=True)
    remark = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    
    # Legacy/System fields
    doc_type = models.CharField(max_length=50, default="Quotation")
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="quotations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quotation {self.qo_code}"

class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, related_name='quotation_items', on_delete=models.CASCADE)
    quo_item = models.CharField(max_length=255, blank=True)
    quo_model = models.CharField(max_length=255, blank=True)
    quo_description = models.TextField(blank=True)
    # Store detailed technical specification text separately from description
    specification = models.TextField(blank=True)
    quantity = models.IntegerField(default=1)
    quo_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    image = models.ImageField(upload_to='quotation_items/', null=True, blank=True)

    def __str__(self):
        return f"{self.quo_item} ({self.quotation.qo_code})"

class BillingNote(models.Model):
    bn_code = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='billing_notes')
    eit = models.ForeignKey(EIT, on_delete=models.SET_NULL, null=True, blank=True, related_name='billing_notes')
    
    bn_created_date = models.DateField(default=timezone.now)
    bn_due_date = models.DateField(null=True, blank=True)
    
    bn_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bn_paid_amount = models.DateField("Bn paid date", null=True, blank=True)
    bn_outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bn_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    bn_remark = models.TextField(blank=True)
    bn_recipient = models.CharField(max_length=255, blank=True)
    bn_recipient_receive_date = models.DateField(null=True, blank=True)
    bn_payee_date = models.DateField(null=True, blank=True)
    bn_behalf_of = models.CharField(max_length=255, blank=True)
    bn_name_biller = models.CharField(max_length=255, blank=True)
    # Comment: Store branch text per Billing Note row (document-specific)
    bn_branch = models.CharField(max_length=255, blank=True)
    
    items = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Billing Note {self.bn_code}"

class Invoice(models.Model):
    number = models.CharField(max_length=100, unique=True)
    customer = models.JSONField(default=dict, blank=True)
    eit = models.ForeignKey(EIT, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    items = models.JSONField(default=list, blank=True)
    details = models.JSONField(default=dict, blank=True)
    totals = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.number}"

class Receipt(models.Model):
    number = models.CharField(max_length=100, unique=True)
    customer = models.JSONField(default=dict, blank=True)
    eit = models.ForeignKey(EIT, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipts')
    items = models.JSONField(default=list, blank=True)
    details = models.JSONField(default=dict, blank=True)
    totals = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="receipts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Receipt {self.number}"

class TaxInvoice(models.Model):
    # Primary key for Tax_Invoice table
    tax_invoice_id = models.AutoField(primary_key=True)
    # Human-readable/sequence code for the tax invoice (e.g., TI 2026-0001)
    tax_invoice_code = models.CharField(max_length=100, unique=True)
    # Date the tax invoice is issued (defaults to current local date)
    issued_date = models.DateField(default=timezone.localdate)
    # Foreign keys: fetch from Customer and EIT tables, same pattern as Quotation
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='tax_invoices')
    eit = models.ForeignKey(EIT, on_delete=models.SET_NULL, null=True, blank=True, related_name='tax_invoices')
    # Line items for this tax invoice.
    # Store an array of item dicts, each with keys like:
    #   product, description, qty, price (Sales ex. VAT), tax, unit
    # Example:
    #   [{"product": "", "description": "D1", "qty": 1, "price": 500, "tax": 0, "unit": "set"},
    #    {"product": "", "description": "D2", "qty": 2, "price": 1000, "tax": 0, "unit": "box"}]
    items = models.JSONField(default=list, blank=True)
    # Extra fields requested
    customer_branch = models.CharField(max_length=255, blank=True)
    payment_type = models.CharField(max_length=255, blank=True)
    due_date = models.DateField(null=True, blank=True)
    # Timestamps for auditing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TaxInvoice {self.tax_invoice_code}"

class PurchaseOrder(models.Model):
    number = models.CharField(max_length=100, unique=True)
    customer = models.JSONField(default=dict, blank=True)
    eit = models.ForeignKey(EIT, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders')
    extra_fields = models.JSONField(default=dict, blank=True)
    items = models.JSONField(default=list, blank=True)
    totals = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="purchase_orders")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PO {self.number}"

class Deal(models.Model):
    title = models.CharField(max_length=200, default="Untitled Deal")
    customer = models.ForeignKey('Customer', null=True, blank=True, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="฿")
    priority = models.CharField(max_length=20, default="medium")
    contact = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    extra_contacts = models.JSONField(default=list, blank=True)
    items = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    stage = models.CharField(max_length=50, default="New")
    created_at = models.DateTimeField(default=timezone.now)
    expected_close = models.DateField(null=True, blank=True)
    po_number = models.CharField(max_length=50, blank=True)
    salesperson = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return f"{self.title} - {self.amount}"

class Stage(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name

class ActivitySchedule(models.Model):
    deal = models.ForeignKey(Deal, related_name='activity_schedules', on_delete=models.CASCADE)
    start_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    activity_name = models.TextField(blank=True)
    salesperson = models.CharField(max_length=100, blank=True)
    customer = models.CharField(max_length=200, blank=True)
    linked_task = models.ForeignKey('Task', null=True, blank=True, on_delete=models.SET_NULL, related_name='activities')
    completed = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    reminder_day_sent = models.BooleanField(default=False)
    reminder_week_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.customer} - {self.activity_name}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Comma-separated list of app names: "Manufacturing,Inventory,CRM,Project Management,Admin"
    # "all" means access to everything.
    allowed_apps = models.TextField(default="all", blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    ACCOUNT_TYPE_CHOICES = [
        ('normal', 'Normal Account'),
        ('permission_control', 'Permission Control Account'),
    ]
    account_type = models.CharField(max_length=32, choices=ACCOUNT_TYPE_CHOICES, default="normal")

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Notification(models.Model):
    # Define notification types as controlled values
    NOTIFICATION_TYPES = [
        ('info', 'Info'),  # Default type
        ('crm_created', 'CRM Created'),
        ('user_registration', 'User Registration'),
        ('activity_schedule_reminder', 'Activity Schedule Reminder'),
        ('billing_note_reminder', 'Billing Note Reminder'),
        ('manufacturing_finish', 'Manufacturing Finish'),
        ('delivery_updates', 'Delivery Updates'),
        ('inventory_updates', 'Inventory Updates'),
        ('signup', 'Signup'), # For legacy compatibility if needed
        ('alert', 'Alert'),   # For legacy compatibility if needed
    ]
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    # Type field controls visibility based on user permissions
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='info') 

    def __str__(self):
        return self.message

class Contact(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

class Project(models.Model):
    PRIORITY_CHOICES = [
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
     
    ]
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    ]
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='projects')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='none')
    color = models.CharField(max_length=20, default='#6366f1') # Default Indigo
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
     
    ]
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('blocked', 'Blocked'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignee = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True) # Used as End Date
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='none')
    color = models.CharField(max_length=20, default='#64748b') # Default Slate
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.title
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Default to no apps for new users, "all" for superusers
        default_apps = "all" if instance.is_staff else ""
        UserProfile.objects.create(user=instance, allowed_apps=default_apps)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        # Fallback if profile doesn't exist for some reason
        default_apps = "all" if instance.is_staff else ""
        UserProfile.objects.create(user=instance, allowed_apps=default_apps)


class ManufacturingOrder(models.Model):
    job_order_code = models.CharField(max_length=50)
    product = models.CharField(max_length=255, blank=True)
    product_no = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    complete_date = models.DateField(null=True, blank=True)
    production_time = models.CharField(max_length=100, blank=True)
    supplier = models.CharField(max_length=255, blank=True)
    supplier_date = models.DateField(null=True, blank=True)
    recipient = models.CharField(max_length=255, blank=True)
    recipient_date = models.DateField(null=True, blank=True)
    component_status = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    items = models.JSONField(default=list, blank=True)
    item_description = models.CharField(max_length=255, blank=True)
    item_quantity = models.CharField(max_length=50, blank=True)
    item_unit = models.CharField(max_length=50, blank=True)
    po_number = models.CharField(max_length=100, blank=True)
    responsible_sales_person = models.CharField(max_length=255, blank=True)
    responsible_production_person = models.CharField(max_length=255, blank=True)
    customer = models.ForeignKey(Customer, related_name='manufacturing_orders', on_delete=models.SET_NULL, null=True, blank=True)
    po = models.ForeignKey(PurchaseOrder, related_name='manufacturing_orders', on_delete=models.SET_NULL, null=True, blank=True)
    
    # PO File Storage (Binary)
    po_file_name = models.CharField(max_length=255, blank=True)
    po_file_type = models.CharField(max_length=100, blank=True)
    po_file_content = models.BinaryField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class PMProject(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    task_total = models.IntegerField(default=0)
    # Persist UI color and lifecycle status
    color = models.CharField(max_length=20, blank=True, default='#6366f1')
    status = models.CharField(max_length=20, blank=True, default='active')  # active | done | cancelled
    class Meta:
        db_table = 'PM_project'
    def __str__(self):
        return self.name

class PMTask(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(PMProject, on_delete=models.CASCADE, related_name='tasks', db_column='Project_id')
    # Human-readable task name for display in admin/UI
    name = models.CharField(max_length=200, blank=True, default='')
    task_start_date = models.DateField(null=True, blank=True)
    task_end_date = models.DateField(null=True, blank=True)
    class Meta:
        db_table = 'PM_task'
    def __str__(self):
        # Prefer the explicit name if present; otherwise show a compact range
        return self.name or f"{self.project_id} [{self.task_start_date} -> {self.task_end_date}]"

# Keep PM_project.task_total consistent when PM_task changes (admin/API)
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=PMTask)
def update_task_total_on_save(sender, instance, **kwargs):
    PMProject.objects.filter(pk=instance.project_id).update(
        task_total=PMTask.objects.filter(project_id=instance.project_id).count()
    )

@receiver(post_delete, sender=PMTask)
def update_task_total_on_delete(sender, instance, **kwargs):
    PMProject.objects.filter(pk=instance.project_id).update(
        task_total=PMTask.objects.filter(project_id=instance.project_id).count()
    )


class Product(models.Model):
    code = models.CharField(max_length=100, blank=True, default='')
    name = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or self.code


class ProductVersion(models.Model):
    product = models.ForeignKey(Product, related_name='versions', on_delete=models.CASCADE)
    version_code = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} {self.version_code}"


class ProductType(models.Model):
    version = models.ForeignKey(ProductVersion, related_name='types', on_delete=models.CASCADE)
    type_code = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.type_code


class System(models.Model):
    type = models.ForeignKey(ProductType, related_name='systems', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='systems/', null=True, blank=True)

    def __str__(self):
        return self.name


class Component(models.Model):
    part_number = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50)
    image = models.ImageField(upload_to='components/', null=True, blank=True)

    class Meta:
        db_table = 'bom_component'

    def __str__(self):
        return self.part_number


class PermissionControl(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='permission_control')
    user_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    allow_apps = models.TextField(blank=True, default="")

    def __str__(self):
        return self.user_name


class SystemComponent(models.Model):
    system = models.ForeignKey(System, related_name='system_components', on_delete=models.CASCADE)
    component = models.ForeignKey(Component, related_name='system_components', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('system', 'component')

    def __str__(self):
        return f"{self.system} - {self.component}"


class ComponentEntry(models.Model):
    component_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=0)

    class Meta:
        db_table = 'component'

    def __str__(self):
        return self.component_name

class EmailLog(models.Model):
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    # Optional: link to a deal if relevant
    # deal = models.ForeignKey(Deal, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"To: {self.recipient} - {self.subject}"

class EmailAttachment(models.Model):
    email_log = models.ForeignKey(EmailLog, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='email_attachments/')
    filename = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.filename and self.file:
            self.filename = self.file.name
        super().save(*args, **kwargs)

    def __str__(self):
        return self.filename or "Attachment"

class DealHistory(models.Model):
    deal = models.ForeignKey(Deal, related_name='history', on_delete=models.CASCADE)
    from_stage = models.CharField(max_length=50)
    to_stage = models.CharField(max_length=50)
    changed_at = models.DateTimeField(auto_now_add=True)
    # Optional: changed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.deal.title}: {self.from_stage} -> {self.to_stage}"

class CustomerPurchaseOrder(models.Model):
    po_number = models.CharField(max_length=100, blank=True)
    customer = models.ForeignKey(Customer, related_name='customer_purchase_orders', on_delete=models.SET_NULL, null=True, blank=True)

    
    # PO File Storage (Binary)
    po_file_name = models.CharField(max_length=255, blank=True)
    po_file_type = models.CharField(max_length=100, blank=True)
    po_file_content = models.BinaryField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.po_number} - {self.customer}"

class Inventory(models.Model):
    inventory_product_name = models.CharField(max_length=255, unique=True)
    inventory_stock = models.IntegerField(default=0)
    last_updated_day = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.inventory_product_name

class ProjectManagement(models.Model):
    project_name = models.CharField(max_length=255)
    duration = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Project Management"
        verbose_name_plural = "Project Management"

    def __str__(self):
        return self.project_name

class SubProject(models.Model):
    project = models.ForeignKey(ProjectManagement, related_name='subprojects', on_delete=models.CASCADE)
    subproject_name = models.CharField(max_length=255, verbose_name="Subproject")
    subproject_duration = models.CharField(max_length=100, verbose_name="Subproject duration")

    def __str__(self):
        return self.subproject_name

@receiver(pre_save, sender=ManufacturingOrder)
def mo_pre_save_inventory_check(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = ManufacturingOrder.objects.get(pk=instance.pk)
            instance._old_state = old_instance.state
        except ManufacturingOrder.DoesNotExist:
            instance._old_state = None
    else:
        instance._old_state = None

@receiver(post_save, sender=ManufacturingOrder)
def update_inventory_on_mo_finish(sender, instance, created, **kwargs):
    old_state = getattr(instance, '_old_state', None)
    # Check if transitioning to 'Finished'
    # Note: Using case-insensitive check if needed, but 'Finished' is the standard per context
    if instance.state == 'Finished' and old_state != 'Finished':
        if instance.product_no:
            # Import/Add to Inventory
            # Use get_or_create to handle existence
            inv, _ = Inventory.objects.get_or_create(
                inventory_product_name=instance.product_no,
                defaults={'inventory_stock': 0}
            )
            # Add the quantity from Manufacturing Order
            inv.inventory_stock += int(instance.quantity or 0)
            inv.save()

class Delivery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
    ]

    inventory_product_name = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='deliveries', null=True, blank=True)
    order_amount = models.IntegerField(default=0)
    delivery_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    company_name = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='deliveries', null=True, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    courier = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery {self.tracking_number} - {self.company_name}"

@receiver(pre_save, sender=Delivery)
def delivery_pre_save_status_check(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Delivery.objects.get(pk=instance.pk)
            instance._old_status = old_instance.delivery_status
        except Delivery.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Delivery)
def update_inventory_on_delivery_status_change(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.delivery_status
    
    # Notification for Successful Delivery
    if new_status == 'delivered' and old_status != 'delivered':
        customer_name = instance.company_name.company_name if instance.company_name else "Unknown Customer"
        Notification.objects.create(
            message=f'Delivery: Successful delivery to the "{customer_name}"',
            type='delivery_updates'
        )

    # If no product linked, we cannot update stock
    if not instance.inventory_product_name:
        return

    # Case 1: Transition TO 'delivered' -> Subtract stock
    if new_status == 'delivered' and old_status != 'delivered':
        instance.inventory_product_name.inventory_stock -= int(instance.order_amount or 0)
        instance.inventory_product_name.save()
        
    # Case 2: Transition FROM 'delivered' TO something else (e.g. 'pending') -> Add stock back (revert)
    elif old_status == 'delivered' and new_status != 'delivered':
        instance.inventory_product_name.inventory_stock += int(instance.order_amount or 0)
        instance.inventory_product_name.save()

@receiver(pre_save, sender=Inventory)
def inventory_pre_save_stock_check(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Inventory.objects.get(pk=instance.pk)
            instance._old_stock = old_instance.inventory_stock
        except Inventory.DoesNotExist:
            instance._old_stock = None
    else:
        instance._old_stock = None

@receiver(post_save, sender=Inventory)
def notify_inventory_stock_change(sender, instance, created, **kwargs):
    old_stock = getattr(instance, '_old_stock', None)
    new_stock = instance.inventory_stock
    
    # If created, old_stock is None, we can consider it 0 or just skip if we only want updates
    # User said: stock changes from "old value" to "new value"
    # Let's handle creation as 0 -> new
    
    actual_old = old_stock if old_stock is not None else 0
    
    if actual_old != new_stock:
        Notification.objects.create(
            message=f'Inventory Updates: "{instance.inventory_product_name}" stock changes from "{actual_old}" to "{new_stock}"',
            type='inventory_updates'
        )

# PD Models
# The following models implement the requested PD_* tables with explicit db_table
# names to match the required table naming conventions.

class PDMachine(models.Model):
    # Human-readable name of the machine
    name = models.CharField(max_length=255, blank=True, default="")
    # Optional description of the machine
    description = models.TextField(blank=True, default="")
    # Free-form technical specification details
    specification = models.TextField(blank=True, default="")

    class Meta:
        db_table = "PD_machine"

    def __str__(self):
        return self.name


class PDSystem(models.Model):
    # Name of the system
    name = models.CharField(max_length=255, blank=True, default="")
    # Optional description of the system
    description = models.TextField(blank=True, default="")
    # Technical specification for the system
    specification = models.TextField(blank=True, default="")
    # Total number of products under this system
    product_total = models.IntegerField(default=0)

    class Meta:
        db_table = "PD_system"

    def __str__(self):
        return self.name


class PDWire(models.Model):
    # Name of the wire item
    name = models.CharField(max_length=255, blank=True, default="")
    # Optional description
    description = models.TextField(blank=True, default="")
    # Technical specification details
    specification = models.TextField(blank=True, default="")

    class Meta:
        db_table = "PD_wire"

    def __str__(self):
        return self.name


class PDSparepart(models.Model):
    # Name of the spare part
    name = models.CharField(max_length=255, blank=True, default="")
    # Optional description of the spare part
    description = models.TextField(blank=True, default="")
    # Technical specification for the spare part
    specification = models.TextField(blank=True, default="")

    class Meta:
        db_table = "PD_sparepart"

    def __str__(self):
        return self.name


class PDService(models.Model):
    # Name of the service
    name = models.CharField(max_length=255, blank=True, default="")
    # Optional description of the service
    description = models.TextField(blank=True, default="")
    # Service specification or scope details
    specification = models.TextField(blank=True, default="")

    class Meta:
        db_table = "PD_service"

    def __str__(self):
        return self.name


class PDSystemChildproduct(models.Model):
    # Child product name
    name = models.CharField(max_length=255, blank=True, default="")
    # Link to parent PD_system
    system = models.ForeignKey(PDSystem, related_name="child_products", on_delete=models.CASCADE)
    # Technical specification for the child product
    specification = models.TextField(blank=True, default="")

    class Meta:
        db_table = "PD_system_childproduct"

    def __str__(self):
        return self.name
