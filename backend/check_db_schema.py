
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crm_deal'")
    columns = cursor.fetchall()
    print("Columns in crm_deal:")
    for col in columns:
        print(col)

    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'crm_stage'")
    stage_table = cursor.fetchall()
    print("\nStage table exists:", bool(stage_table))
