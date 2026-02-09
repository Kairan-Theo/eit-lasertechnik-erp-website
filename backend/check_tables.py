import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

tables = connection.introspection.table_names()
print(f"Total tables: {len(tables)}")

if 'crm_project' in tables:
    print("✅ Project Management table EXISTS (crm_project)")
else:
    print("❌ Project Management table does NOT exist")

if 'crm_task' in tables:
    print("✅ Task Management table EXISTS (crm_task)")
else:
    print("❌ Task Management table does NOT exist")
