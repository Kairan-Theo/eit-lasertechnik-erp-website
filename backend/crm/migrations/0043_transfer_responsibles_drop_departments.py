from django.db import migrations

def forwards(apps, schema_editor):
    ManufacturingOrder = apps.get_model('crm', 'ManufacturingOrder')
    for mo in ManufacturingOrder.objects.all():
        changed = False
        try:
            # If new fields are empty, backfill from old department fields
            if not getattr(mo, 'responsible_sales_person', '') and getattr(mo, 'sales_department', ''):
                mo.responsible_sales_person = mo.sales_department
                changed = True
            if not getattr(mo, 'responsible_production_person', '') and getattr(mo, 'production_department', ''):
                mo.responsible_production_person = mo.production_department
                changed = True
            if changed:
                mo.save(update_fields=['responsible_sales_person', 'responsible_production_person'])
        except Exception:
            # best-effort migration
            pass

def backwards(apps, schema_editor):
    # No-op: old columns will be removed
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0042_add_responsible_fields'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name='manufacturingorder',
            name='sales_department',
        ),
        migrations.RemoveField(
            model_name='manufacturingorder',
            name='production_department',
        ),
    ]
