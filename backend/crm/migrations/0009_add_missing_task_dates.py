from django.db import migrations

def add_missing_task_dates(apps, schema_editor):
    # Ensure crm_task has start_date and due_date columns to match the Task model.
    # Some previous manual edits may have removed/renamed these fields, causing admin errors.
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        # Inspect current columns using SQLite PRAGMA (works for SQLite; harmless for others)
        cursor.execute("PRAGMA table_info(crm_task)")
        columns = [row[1] for row in cursor.fetchall()]
        # Add missing columns defensively; ALTER TABLE ADD COLUMN is lightweight in SQLite.
        if 'start_date' not in columns:
            cursor.execute("ALTER TABLE crm_task ADD COLUMN start_date DATE NULL")
        if 'due_date' not in columns:
            cursor.execute("ALTER TABLE crm_task ADD COLUMN due_date DATE NULL")

class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0008_pmproject_pmtask'),
    ]
    operations = [
        migrations.RunPython(add_missing_task_dates, migrations.RunPython.noop),
    ]
