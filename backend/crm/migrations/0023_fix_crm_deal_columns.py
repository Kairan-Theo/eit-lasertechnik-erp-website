from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('crm', '0022_fix_crm_deal_title'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS customer_id integer REFERENCES crm_customer(id) ON DELETE SET NULL;
            """,
            reverse_sql="""
            -- No reverse operation; column required by model
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0;
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS currency varchar(10) NOT NULL DEFAULT '฿';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS priority varchar(10) NOT NULL DEFAULT 'none';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS contact varchar(200) NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS email varchar(254) NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS phone varchar(50) NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS tax_id varchar(50) NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW();
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS expected_close date NULL;
            """,
            reverse_sql="""
            """,
        ),
        migrations.RunSQL(
            sql="""
            ALTER TABLE crm_deal
            ADD COLUMN IF NOT EXISTS stage varchar(100) NOT NULL DEFAULT 'Appointment Schedule';
            """,
            reverse_sql="""
            """,
        ),
    ]
