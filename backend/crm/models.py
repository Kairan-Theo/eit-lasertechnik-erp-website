from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Customer(models.Model):
    company_name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name

class Quotation(models.Model):
    number = models.CharField(max_length=100, unique=True)
    customer = models.JSONField(default=dict, blank=True)
    items = models.JSONField(default=list, blank=True)
    details = models.JSONField(default=dict, blank=True)
    totals = models.JSONField(default=dict, blank=True)
    doc_type = models.CharField(max_length=50, default="Quotation")
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="quotations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quotation {self.number}"

class Invoice(models.Model):
    number = models.CharField(max_length=100, unique=True)
    customer = models.JSONField(default=dict, blank=True)
    items = models.JSONField(default=list, blank=True)
    details = models.JSONField(default=dict, blank=True)
    totals = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.number}"

class PurchaseOrder(models.Model):
    number = models.CharField(max_length=100, unique=True)
    customer = models.JSONField(default=dict, blank=True)
    extra_fields = models.JSONField(default=dict, blank=True)
    items = models.JSONField(default=list, blank=True)
    totals = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="purchase_orders")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PO {self.number}"

class Deal(models.Model):
    PRIORITY_CHOICES = [
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    title = models.CharField(max_length=200)
    customer = models.ForeignKey('Customer', null=True, blank=True, on_delete=models.SET_NULL, related_name='deals')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="฿")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='none')
    contact = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    items = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expected_close = models.DateField(null=True, blank=True)
    
    # We can store the pipeline stage as a string or a ChoiceField.
    # For flexibility let's use CharField for now, or you can make a Stage model.
    stage = models.CharField(max_length=100, default="Appointment Schedule")

    def __str__(self):
        return self.title

class ActivitySchedule(models.Model):
    deal = models.ForeignKey(Deal, related_name='activity_schedules', on_delete=models.CASCADE)
    start_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    text = models.TextField(blank=True)
    assignee = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.deal.title} - {self.text}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Comma-separated list of app names: "Manufacturing,Inventory,CRM,Project Management,Admin"
    # "all" means access to everything.
    allowed_apps = models.TextField(default="all", blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Notification(models.Model):
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=50, default='info') # info, signup, alert

    def __str__(self):
        return self.message

class Contact(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

class Stage(models.Model):
    stage_name = models.CharField(max_length=50)
    stage_order = models.IntegerField()
    def __str__(self):
        return self.stage_name
    class Meta:
        ordering = ['stage_order', 'stage_name']

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
