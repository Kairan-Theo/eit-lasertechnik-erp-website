import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection
from crm.models import Project

# Check if table exists
table_name = Project._meta.db_table
print(f"Checking for table: {table_name}")

all_tables = connection.introspection.table_names()

if table_name in all_tables:
    print(f"Table '{table_name}' EXISTS in database.")
    count = Project.objects.count()
    print(f"Number of records in Project table: {count}")
    if count > 0:
        print("Sample projects:")
        for p in Project.objects.all()[:5]:
            print(f"- {p.name} (ID: {p.id}, Status: {p.status})")
else:
    print(f"Table '{table_name}' DOES NOT EXIST in database.")
    print("Existing tables:", all_tables)
