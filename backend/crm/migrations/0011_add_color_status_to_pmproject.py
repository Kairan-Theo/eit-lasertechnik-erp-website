from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0010_add_name_field_to_pmtask'),
    ]
    operations = [
        # Add 'color' and 'status' fields to PM_project to persist UI color and lifecycle state
        migrations.AddField(
            model_name='pmproject',
            name='color',
            field=models.CharField(max_length=20, blank=True, default='#6366f1'),
        ),
        migrations.AddField(
            model_name='pmproject',
            name='status',
            field=models.CharField(max_length=20, blank=True, default='active'),
        ),
    ]
