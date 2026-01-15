from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0047_component_remove_product_component_and_more'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='component',
            table='bom_component',
        ),
    ]

