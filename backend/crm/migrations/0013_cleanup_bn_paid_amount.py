from django.db import migrations

def cleanup_bn_paid_amount(apps, schema_editor):
    # Sanitize BillingNote.bn_paid_amount after field type change to DateField.
    # Some legacy rows may still store non-date values (e.g., integer 0),
    # which cause Django admin to fail when parsing as a date.
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        try:
            # For SQLite: typeof() helps detect non-text storage like integer
            # Also clear any text not in ISO YYYY-MM-DD format.
            cursor.execute("""
                UPDATE crm_billingnote
                SET bn_paid_amount = NULL
                WHERE 
                  typeof(bn_paid_amount) != 'text'
                  OR bn_paid_amount IS NOT NULL AND bn_paid_amount NOT LIKE '____-__-__'
            """)
        except Exception:
            # Best-effort cleanup; skip if database dialect doesn't support typeof()
            pass

class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0012_alter_billingnote_bn_paid_amount'),
    ]
    operations = [
        migrations.RunPython(cleanup_bn_paid_amount, migrations.RunPython.noop),
    ]
