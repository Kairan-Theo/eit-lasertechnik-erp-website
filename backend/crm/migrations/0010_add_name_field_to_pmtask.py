from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0009_add_missing_task_dates'),
    ]
    operations = [
        # Add a 'name' column to PM_task to store a human-readable task name.
        migrations.AddField(
            model_name='pmtask',
            name='name',
            field=models.CharField(max_length=200, blank=True, default=''),
        ),
    ]
