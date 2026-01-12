from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0041_add_po_number_to_manufacturingorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='manufacturingorder',
            name='responsible_sales_person',
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name='manufacturingorder',
            name='responsible_production_person',
            field=models.CharField(max_length=255, blank=True),
        ),
    ]
