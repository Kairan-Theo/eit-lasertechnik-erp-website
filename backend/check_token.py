import os
import sys
import django

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

try:
    token_key = "cec39bea9e2becdc66e577ec1d56e70ea5327548"
    token = Token.objects.get(key=token_key)
    print(f"Token found for user: {token.user.username}, Active: {token.user.is_active}")
except Token.DoesNotExist:
    print("Token NOT found")

# Create token for admin
admin_user = User.objects.get(username='admin')
token, created = Token.objects.get_or_create(user=admin_user)
print(f"Admin Token: {token.key}, Created: {created}")

users = User.objects.all()
for u in users:
    t = Token.objects.filter(user=u).first()
    print(f"User: {u.username}, Active: {u.is_active}, Token: {t.key if t else 'None'}")
