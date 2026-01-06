import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app='crm' AND name='0028_deal_address_deal_contact_deal_created_at_and_more'")
    print("Deleted migration record 0028")