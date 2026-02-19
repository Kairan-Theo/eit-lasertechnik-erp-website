from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0016_quotationitem_specification_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="deal",
            name="extra_contacts",
            field=models.JSONField(default=list, blank=True),
        ),
    ]

