from django.core.management.base import BaseCommand
from crm.models import EIT
from django.core.files import File
import os

class Command(BaseCommand):
    help = 'Populates the EIT table with default organizations and header images'

    def handle(self, *args, **kwargs):
        # List of organizations to populate
        # Added comments to explain the data structure as requested
        organizations = [
            {
                "name": "EIT Lasertechnik Co.,Ltd.",
                "defaults": {
                    "eit_mobile": "000-000-0000",
                    "eit_telephone": "02-052-9544",
                    "eit_fax": "02-052-9544",
                    "address": "1/120 ซอยรามคําแหง 184 \n แขวงมีนบุรี เขตมีนบุรี \n กรุงเทพมหานคร 10510"
                },
                "image_path": r"D:\EIT_ERT_s\eit-lasertechnik-erp-website\public\EIT header.png"
            },
            {
                "name": "Einstein Industrietechnik Corporation Co.,LTD",
                "defaults": {
                    "eit_mobile": "000-000-0000",
                    "eit_telephone": "02-052-9544",
                    "eit_fax": "02-052-9544",
                    "address": "1/120 ซอยรามคําแหง 184 \n แขวงมีนบุรี เขตมีนบุรี \n กรุงเทพมหานคร 10510"
                },
                "image_path": r"D:\EIT_ERT_s\eit-lasertechnik-erp-website\public\Einstein header.png"
            }
        ]

        # Iterate over the organizations and create them if they don't exist
        for org_data in organizations:
            # First try to get the object
            obj, created = EIT.objects.get_or_create(
                organization_name=org_data["name"],
                defaults=org_data["defaults"]
            )
            
            # Update fields even if it exists to ensure defaults are correct
            if not created:
                for key, value in org_data["defaults"].items():
                    setattr(obj, key, value)
            
            # Handle image
            image_path = org_data.get("image_path")
            if image_path and os.path.exists(image_path):
                # Check if header_image is already set or we want to force update
                # We'll update it to ensure it matches the requested file
                try:
                    with open(image_path, 'rb') as f:
                        filename = os.path.basename(image_path)
                        # Save the file to the model. save=False to avoid double save call
                        obj.header_image.save(filename, File(f), save=False)
                        self.stdout.write(self.style.SUCCESS(f'Set image for {org_data["name"]}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Failed to save image for {org_data["name"]}: {e}'))
            else:
                 self.stdout.write(self.style.WARNING(f'Image not found for {org_data["name"]} at {image_path}'))

            obj.save()

            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created EIT organization: {org_data["name"]}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'EIT organization updated: {org_data["name"]}'))
