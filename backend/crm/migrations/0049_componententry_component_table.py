from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0048_rename_component_table_to_bom_component'),
    ]

    operations = [
        migrations.CreateModel(
            name='ComponentEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('component_name', models.CharField(max_length=255)),
                ('quantity', models.IntegerField(default=0)),
            ],
            options={
                'db_table': 'component',
            },
        ),
    ]

