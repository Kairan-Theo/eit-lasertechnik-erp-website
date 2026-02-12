# Generated manually to resolve migration conflict between 0003_receipt and 0003_pd tables
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0003_receipt'),
        ('crm', '0003_pdmachine_pdservice_pdsparepart_pdsystem_pdwire_and_more'),
    ]

    operations = []
