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
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from crm.views import DealViewSet, ActivityScheduleViewSet, signup, login, get_users, update_user_permissions, get_notifications, mark_notification_read, my_allowed_apps, update_profile

router = DefaultRouter()
router.register(r'deals', DealViewSet)
router.register(r'activity_schedules', ActivityScheduleViewSet)

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

urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    path('health/', health),
    path('api/', include(router.urls)),
    path('api/auth/signup/', signup),
    path('api/auth/login/', login),
    path('api/users/', get_users),
    path('api/users/permissions/', update_user_permissions),
    path('api/notifications/', get_notifications),
    path('api/notifications/read/', mark_notification_read),
    path('api/auth/me/allowed-apps/', my_allowed_apps),
    path('api/auth/profile/update/', update_profile),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
