import os
import django
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from crm.models import UserProfile, PermissionControl

print("--- Checking Users ---")
users = User.objects.all().order_by('id')
print(f"Total Users: {users.count()}")

for user in users:
    print(f"\nUser ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Is Staff: {user.is_staff}")
    
    if hasattr(user, 'profile'):
        print(f"Profile Allowed Apps: '{user.profile.allowed_apps}'")
    else:
        print("Profile: None")
        
    if hasattr(user, 'permission_control'):
        print(f"PermissionControl Allowed Apps: '{user.permission_control.allow_apps}'")
    else:
        print("PermissionControl: None")
