"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from crm.views import DealViewSet, ActivityScheduleViewSet, ProjectViewSet, TaskViewSet, CustomerViewSet, signup, login, google_login, get_users, update_user_permissions, get_notifications, mark_notification_read, delete_notification, clear_notifications, my_allowed_apps, update_profile, set_user_password, get_crm_analytics, ManufacturingOrderViewSet, ProductViewSet, ProductVersionViewSet, ProductTypeViewSet, SystemViewSet, ComponentViewSet, SystemComponentViewSet, ComponentEntryViewSet, list_boms, import_bom, delete_bom, send_email_api, EmailLogViewSet, DealHistoryViewSet, check_tracking_status, QuotationViewSet, BillingNoteViewSet, get_default_eit, EITViewSet, CustomerPurchaseOrderViewSet, PurchaseOrderViewSet, InvoiceViewSet, ReceiptViewSet, TaxInvoiceViewSet, StageViewSet, InventoryViewSet, DeliveryViewSet, sync_users_permissions, delete_user, ProjectManagementViewSet, SubProjectViewSet, upload_item_image, PDMachineViewSet, PDSystemViewSet, PDWireViewSet, PDSparepartViewSet, PDServiceViewSet, PDSystemChildproductViewSet, PMProjectViewSet, PMTaskViewSet, verify_email
from crm.pdf_views import generate_quotation_pdf, generate_quotation_pdf_with_cover, generate_billing_note_pdf, generate_invoice_pdf

router = DefaultRouter()
router.register(r'project_management', ProjectManagementViewSet)
router.register(r'subprojects', SubProjectViewSet)
router.register(r'pd_machines', PDMachineViewSet, basename='pd_machines')
router.register(r'pd_systems', PDSystemViewSet, basename='pd_systems')
router.register(r'pd_wires', PDWireViewSet, basename='pd_wires')
router.register(r'pd_spareparts', PDSparepartViewSet, basename='pd_spareparts')
router.register(r'pd_services', PDServiceViewSet, basename='pd_services')
router.register(r'pd_system_childproducts', PDSystemChildproductViewSet, basename='pd_system_childproducts')
router.register(r'inventory', InventoryViewSet)
router.register(r'delivery', DeliveryViewSet)
router.register(r'eits', EITViewSet)
router.register(r'deals', DealViewSet)
router.register(r'quotations', QuotationViewSet)
router.register(r'billing_notes', BillingNoteViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'activity_schedules', ActivityScheduleViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'pm_projects', PMProjectViewSet, basename='pm_projects')
router.register(r'pm_tasks', PMTaskViewSet, basename='pm_tasks')
router.register(r'manufacturing_orders', ManufacturingOrderViewSet)
router.register(r'product', ProductViewSet)  # legacy
router.register(r'products', ProductViewSet, basename='products')
router.register(r'product_versions', ProductVersionViewSet)
router.register(r'product_types', ProductTypeViewSet)
router.register(r'systems', SystemViewSet)
router.register(r'components', ComponentViewSet)
router.register(r'system_components', SystemComponentViewSet)
router.register(r'component_entries', ComponentEntryViewSet, basename='component_entries')
router.register(r'email_logs', EmailLogViewSet)
router.register(r'deal_history', DealHistoryViewSet)
router.register(r'customer_purchase_orders', CustomerPurchaseOrderViewSet)
router.register(r'purchase_orders', PurchaseOrderViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'receipts', ReceiptViewSet)
router.register(r'tax_invoices', TaxInvoiceViewSet)
router.register(r'stages', StageViewSet)

def health(request):
    return JsonResponse({"status": "ok"})

def root_view(request):
    return JsonResponse({
        "status": "running",
        "message": "EIT Lasertechnik Backend API is running.",
        "endpoints": {
            "admin": "/admin/",
            "api": "/api/",
            "health": "/health/"
        }
    })

def db_settings_view(request):
    return JsonResponse(connection.settings_dict)
urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    path('health/', health),
    path('api/', include(router.urls)),
    path('api/bom/', list_boms),
    path('api/bom/import/', import_bom),
    path('api/bom/<int:pk>/', delete_bom),
    path('api/tracking/check/', check_tracking_status),
    path('api/eit/default/', get_default_eit),
    path('api/send-email/', send_email_api),
    path('api/upload-item-image/', upload_item_image),
    path('api/crm/analytics/', get_crm_analytics),
    path('api/generate-quotation-pdf/', generate_quotation_pdf),
    path('api/generate-billing-note-pdf/', generate_billing_note_pdf),
    path('api/generate-invoice-pdf/', generate_invoice_pdf),
    # Quotation PDF with cover page (media/ใบปะหน้า.pdf)
    path('api/generate-quotation-pdf-with-cover/', generate_quotation_pdf_with_cover),
    path('api/auth/signup/', signup),
    path('api/auth/verify-email/', verify_email),
    path('api/auth/login/', login),
    path('api/auth/google/', google_login),
    path('api/users/', get_users),
    path('api/users/permissions/', update_user_permissions),
    path('api/users/<int:pk>/delete/', delete_user),
    path('api/users/sync/', sync_users_permissions),
    path('api/users/password/', set_user_password),
    path('api/notifications/', get_notifications),
    path('api/notifications/read/', mark_notification_read),
    path('api/notifications/<int:pk>/', delete_notification),
    # Comment: Endpoint to clear all notifications from DB
    path('api/notifications/clear_all/', clear_notifications),
    path('api/auth/me/allowed-apps/', my_allowed_apps),
    path('api/auth/profile/update/', update_profile),
    path('api/debug/db/', db_settings_view),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
