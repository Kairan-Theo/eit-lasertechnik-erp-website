
import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from crm.models import UserProfile

email = "htetyunn06@gmail.com"

try:
    user = User.objects.get(email=email)
    print(f"Found user: {user.username} ({user.email})")
    
    # Get or create profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Update account type
    old_type = profile.account_type
    profile.account_type = 'permission_control'
    profile.save()
    
    print(f"Updated account type for {email} from '{old_type}' to 'permission_control'")
    
    # Verify
    profile.refresh_from_db()
    print(f"Verification: account_type is now '{profile.account_type}'")

except User.DoesNotExist:
    print(f"User with email {email} not found.")
except Exception as e:
    print(f"Error: {str(e)}")
