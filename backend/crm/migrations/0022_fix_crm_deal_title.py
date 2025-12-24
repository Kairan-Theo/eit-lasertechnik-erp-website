from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0021_merge_20251223_1514'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS title varchar(200) NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            -- No reverse operation; column required by model
            """,
        ),
    ]
