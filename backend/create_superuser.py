import os
import django
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def create_or_update_superuser(username, email, password):
    try:
        user, created = User.objects.get_or_create(username=username, defaults={'email': email})
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.email = email  # Ensure email is set
        user.save()
        action = "Created" if created else "Updated"
        print(f"{action} superuser: {username} ({email})")
        print(f"Password: {password}")
    except Exception as e:
        print(f"Error handling user {username}: {e}")

print("--- Setting up Superusers ---")

# 1. Update the main user 'htetyunn06' to be a superuser
create_or_update_superuser('htetyunn06', 'htetyunn06@gmail.com', 'admin123')

# 2. Create a standard 'admin' superuser
create_or_update_superuser('admin', 'admin@eit.com', 'admin123')

print("\nDone. You can log in to Django Admin with either account.")
