from django.contrib import admin

from .models import Deal, ActivitySchedule, UserProfile, Notification

@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ("title", "customer", "amount", "currency", "priority", "stage", "created_at", "expected_close")
    list_filter = ("priority", "stage", "currency")
    search_fields = ("title", "customer", "contact", "email", "phone", "notes")

@admin.register(ActivitySchedule)
class ActivityScheduleAdmin(admin.ModelAdmin):
    list_display = ("deal", "due_at", "text", "created_at")
    list_filter = ("due_at",)
    search_fields = ("deal__title", "text")

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "allowed_apps")
    search_fields = ("user__username", "allowed_apps")

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("message", "type", "is_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("message",)
