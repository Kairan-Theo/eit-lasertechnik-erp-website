import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.contrib.auth.models import User
try:
    if User.objects.filter(username='admin').exists():
        print("Admin exists: True")
        u = User.objects.get(username='admin')
        u.set_password('admin')
        u.save()
        print("Admin password reset to 'admin'")
    else:
        User.objects.create_superuser('admin', 'admin@example.com', 'admin')
        print("Admin created with password 'admin'")
except Exception as e:
    print(f"Error: {e}")
