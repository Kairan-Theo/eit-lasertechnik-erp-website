from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0040_add_item_fields_manufacturingorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='manufacturingorder',
            name='po_number',
            field=models.CharField(max_length=100, blank=True),
        ),
    ]
