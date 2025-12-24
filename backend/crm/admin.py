from django.contrib import admin
from django import forms
from .models import Deal, ActivitySchedule, UserProfile, Notification, Quotation, Invoice, PurchaseOrder, Customer, Contact, Stage, Project, Task, SupportTicket

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
    list_display = ("title", "customer", "amount", "currency", "priority", "stage", "created_at", "expected_close")
    list_filter = ("priority", "stage", "currency")
    search_fields = ("title", "customer__company_name", "contact", "email", "phone", "notes")

@admin.register(ActivitySchedule)
class ActivityScheduleAdmin(admin.ModelAdmin):
    list_display = ("deal", "due_at", "text", "created_at")
    list_filter = ("due_at",)
    search_fields = ("deal__title", "text")

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

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ("number", "created_by", "updated_at")
    search_fields = ("number", "customer__name", "customer__email")

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

@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ("stage_name", "stage_order")
    search_fields = ("stage_name",)
    ordering = ("stage_order", "stage_name")

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
