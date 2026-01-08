from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0039_manufacturingorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='manufacturingorder',
            name='item_description',
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name='manufacturingorder',
            name='item_quantity',
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name='manufacturingorder',
            name='item_unit',
            field=models.CharField(max_length=50, blank=True),
        ),
    ]
