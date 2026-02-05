import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from crm.models import UserProfile, PermissionControl

emails = ['eit@eitlaser.com', 'shwinpyonethu0106@gmail.com', 'htetyunn06@gmail.com']

for e in emails:
    username = e.split('@')[0]
    user, _ = User.objects.get_or_create(username=username, defaults={'email': e, 'is_staff': True})
    if user.email != e or not user.is_staff:
        user.email = e
        user.is_staff = True
        user.save()
    if hasattr(user, 'profile'):
        p = user.profile
        p.allowed_apps = 'all'
        p.account_type = 'permission_control'
        p.save()
    else:
        UserProfile.objects.create(user=user, allowed_apps='all', account_type='permission_control')
    if hasattr(user, 'permission_control'):
        pc = user.permission_control
        pc.allow_apps = 'all'
        pc.save()
    else:
        PermissionControl.objects.create(
            user=user,
            user_name=user.first_name or user.username,
            email=e,
            password='',
            allow_apps='all'
        )
    print(f"Seeded {e}")
