
import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from crm.models import UserProfile

username = "admin"
email = "htetyunn06@gmail.com"
password = "admin123"

try:
    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    if created:
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"Created superuser: {username} ({email}) / Password: {password}")
    else:
        print(f"User {username} already exists.")
        # Ensure email matches
        if user.email != email:
            user.email = email
            user.save()
            print(f"Updated email for {username} to {email}")

    # Get or create profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Update account type
    profile.account_type = 'permission_control'
    profile.allowed_apps = 'all' # Grant all access
    profile.save()
    
    print(f"Set account_type to 'permission_control' and allowed_apps to 'all' for {username}")

except Exception as e:
    print(f"Error: {str(e)}")
