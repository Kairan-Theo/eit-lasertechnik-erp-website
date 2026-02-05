from django.contrib import admin
from django import forms
from .models import Deal, ActivitySchedule, UserProfile, Notification, Quotation, QuotationItem, Invoice, PurchaseOrder, Customer, Contact, Project, Task, SupportTicket, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EIT, BillingNote, CustomerPurchaseOrder, Stage, Inventory, PermissionControl
from .models import Deal, ActivitySchedule, UserProfile, Notification, Quotation, QuotationItem, Invoice, PurchaseOrder, Customer, Contact, Project, Task, SupportTicket, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EIT, BillingNote, CustomerPurchaseOrder, Stage, Inventory, Delivery

APPS_CHOICES = [
    ("Manufacturing", "Manufacturing"),
    ("Inventory", "Inventory"),
    ("CRM", "CRM"),
    ("Project Management", "Project Management"),
    ("Admin", "Admin"),
]

class UserProfileForm(forms.ModelForm):
    allowed_apps_list = forms.MultipleChoiceField(
        choices=APPS_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Allowed Pages/Apps",
        help_text="Select which pages/apps this user can access. Selecting all stores 'all'. Leaving empty stores no access.",
    )

    class Meta:
        model = UserProfile
        fields = ["user", "profile_picture", "allowed_apps", "allowed_apps_list"]
        widgets = {
            "allowed_apps": forms.TextInput(attrs={"readonly": "readonly"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        initial = []
        if self.instance and self.instance.allowed_apps:
            if self.instance.allowed_apps == "all":
                initial = [c[0] for c in APPS_CHOICES]
            else:
                initial = [a.strip() for a in self.instance.allowed_apps.split(",") if a.strip()]
        self.fields["allowed_apps_list"].initial = initial

    def save(self, commit=True):
        instance = super().save(commit=False)
        selected = self.cleaned_data.get("allowed_apps_list", [])
        if not selected:
            instance.allowed_apps = ""
        elif len(selected) == len(APPS_CHOICES):
            instance.allowed_apps = "all"
        else:
            instance.allowed_apps = ",".join(selected)
        if commit:
            instance.save()
        return instance

@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ("customer", "amount", "priority", "stage")
    list_filter = ("priority", "stage")
    search_fields = ("customer__company_name",)

@admin.register(ActivitySchedule)
class ActivityScheduleAdmin(admin.ModelAdmin):
    list_display = ("deal", "due_at", "activity_name", "salesperson", "customer", "created_at")
    list_filter = ("due_at",)
    search_fields = ("deal__customer__company_name", "activity_name", "salesperson", "customer")

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    form = UserProfileForm
    list_display = ("user", "allowed_apps")
    search_fields = ("user__username", "allowed_apps")
    fields = ("user", "profile_picture", "allowed_apps_list", "allowed_apps")
    readonly_fields = ("allowed_apps",)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("message", "type", "is_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("message",)

@admin.register(EIT)
class EITAdmin(admin.ModelAdmin):
    list_display = ("organization_name", "eit_mobile", "eit_telephone")

class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 1

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ("qo_code", "created_by", "updated_at")
    search_fields = ("qo_code", "customer__company_name", "customer__email")
    inlines = [QuotationItemInline]

@admin.register(BillingNote)
class BillingNoteAdmin(admin.ModelAdmin):
    list_display = ("bn_code", "bn_created_date", "bn_total", "updated_at")
    search_fields = ("bn_code", "customer__company_name")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "created_by", "updated_at")
    search_fields = ("number", "customer__name", "customer__email")

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("number", "created_by", "updated_at")
    search_fields = ("number", "customer__name", "customer__email")

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("company_name", "tax_id", "created_at", "updated_at")
    search_fields = ("company_name", "tax_id")
    ordering = ("company_name",)

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("contact_person", "customer", "email", "phone")
    search_fields = ("contact_person", "customer__company_name", "email", "phone")
    list_filter = ("customer",)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "customer", "status", "priority", "start_date", "end_date", "updated_at")
    list_filter = ("status", "priority")
    search_fields = ("name", "customer__company_name", "description")
    ordering = ("-updated_at", "name")

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "assignee", "status", "priority", "due_date", "updated_at")
    list_filter = ("status", "priority", "assignee")
    search_fields = ("title", "project__name", "assignee", "description")
    ordering = ("-updated_at", "due_date")

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("ticket_id", "title", "customer", "status", "priority", "assigned_to", "updated_at")
    list_filter = ("status", "priority", "assigned_to")
    search_fields = ("ticket_id", "title", "customer__company_name", "description")
    ordering = ("-updated_at",)


@admin.register(ManufacturingOrder)
class ManufacturingOrderAdmin(admin.ModelAdmin):
    list_display = ("job_order_code", "customer", "product", "quantity", "component_status", "state", "start_date", "complete_date")
    search_fields = ("job_order_code", "product", "product_no", "customer__company_name", "po_number")
    list_filter = ("component_status", "state", "start_date", "complete_date")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "description", "created_at", "updated_at")
    search_fields = ("name", "code", "description")


@admin.register(ProductVersion)
class ProductVersionAdmin(admin.ModelAdmin):
    list_display = ("product", "version_code", "description", "created_at")
    search_fields = ("product__name", "version_code")


@admin.register(ProductType)
class ProductTypeAdmin(admin.ModelAdmin):
    list_display = ("version", "type_code", "description")
    search_fields = ("version__product__name", "type_code")


@admin.register(System)
class SystemAdmin(admin.ModelAdmin):
    list_display = ("name", "type")
    search_fields = ("name", "type__type_code", "type__version__product__name")


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ("part_number", "name", "unit")
    search_fields = ("part_number", "name")


@admin.register(SystemComponent)
class SystemComponentAdmin(admin.ModelAdmin):
    list_display = ("system", "component", "quantity")
    search_fields = ("system__name", "component__part_number", "component__name")


@admin.register(ComponentEntry)
class ComponentEntryAdmin(admin.ModelAdmin):
    list_display = ("component_name", "quantity")
    search_fields = ("component_name",)

@admin.register(CustomerPurchaseOrder)
class CustomerPurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("po_number", "customer", "created_at", "updated_at")
    search_fields = ("po_number", "customer__company_name")
    list_filter = ("created_at", "updated_at")

@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "created_at")
    search_fields = ("name",)
    ordering = ("order", "created_at")

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("tracking_number", "company_name", "delivery_status", "order_amount", "courier", "created_at")
    search_fields = ("tracking_number", "company_name__company_name", "courier")
    list_filter = ("delivery_status", "created_at")
    ordering = ("-created_at",)

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("inventory_product_name", "inventory_stock", "last_updated_day")
    search_fields = ("inventory_product_name",)
    list_filter = ("last_updated_day",)

@admin.register(PermissionControl)
class PermissionControlAdmin(admin.ModelAdmin):
    list_display = ("user_name", "email", "allow_apps")
    search_fields = ("user_name", "email")
