from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0022_fix_crm_deal_title'),
    ]

    operations = [
        migrations.RunPython(
            code=lambda apps, schema_editor: (
                None if schema_editor.connection.vendor != 'postgresql' else [
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS customer_id integer REFERENCES crm_customer(id) ON DELETE SET NULL;
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0;
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS currency varchar(10) NOT NULL DEFAULT '฿';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS priority varchar(10) NOT NULL DEFAULT 'none';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS contact varchar(200) NOT NULL DEFAULT '';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS email varchar(254) NOT NULL DEFAULT '';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS phone varchar(50) NOT NULL DEFAULT '';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS tax_id varchar(50) NOT NULL DEFAULT '';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW();
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS expected_close date NULL;
                    """),
                    schema_editor.execute("""
                        ALTER TABLE crm_deal
                        ADD COLUMN IF NOT EXISTS stage varchar(100) NOT NULL DEFAULT 'Appointment Schedule';
                    """),
                ]
            ),
            reverse_code=migrations.RunPython.noop
        ),
    ]
