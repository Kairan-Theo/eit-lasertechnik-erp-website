from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0037_activityschedule_reminder_sent'),
    ]

    operations = [
        migrations.AddField(
            model_name='activityschedule',
            name='reminder_day_sent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='activityschedule',
            name='reminder_week_sent',
            field=models.BooleanField(default=False),
        ),
    ]
