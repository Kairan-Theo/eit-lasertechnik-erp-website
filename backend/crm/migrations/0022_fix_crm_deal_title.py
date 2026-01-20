from django.db import migrations, connection, models
from django.db.migrations.operations.special import RunSQL
from django.db.migrations.state import StateApps
from django.core.exceptions import FieldDoesNotExist

def ensure_title_column(apps: StateApps, schema_editor):
    Deal = apps.get_model('crm', 'Deal')
    try:
        Deal._meta.get_field('title')
        return
    except FieldDoesNotExist:
        pass
    field = models.CharField(max_length=200, default='')
    field.set_attributes_from_name('title')
    schema_editor.add_field(Deal, field)


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0021_merge_20251223_1514'),
    ]

    operations = [
        migrations.RunPython(ensure_title_column, reverse_code=migrations.RunPython.noop),
    ]
