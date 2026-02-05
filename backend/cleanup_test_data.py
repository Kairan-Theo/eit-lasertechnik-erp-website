
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from crm.models import Quotation

# Delete quotations created by reproduction script (e.g. qo_code="QUO 2025-0001")
deleted_count, _ = Quotation.objects.filter(qo_code="QUO 2025-0001").delete()
print(f"Deleted {deleted_count} test quotations.")
