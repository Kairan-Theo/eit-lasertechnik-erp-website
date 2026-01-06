import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from crm.models import UserProfile

def give_jennie_access():
    username = 'jennie'
    email = 'jennie@example.com'
    password = 'password123'

    try:
        user = User.objects.get(username__iexact=username)
        created = False
        print(f"User '{username}' found.")
    except User.DoesNotExist:
        print(f"User '{username}' not found. Creating...")
        user = User.objects.create_user(username=username, email=email, password=password)
        created = True

    # Grant superuser and staff status
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"User '{username}' is now staff and superuser.")

    # Update UserProfile
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    profile.allowed_apps = 'all'
    profile.save()
    print(f"User '{username}' profile updated with allowed_apps='all'.")

    if created:
        print(f"Created user: {username} / {password}")
    else:
        print(f"Updated existing user: {username}")

if __name__ == '__main__':
    give_jennie_access()
