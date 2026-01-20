from django.core.management.base import BaseCommand
from crm.models import Deal, ActivitySchedule, Customer
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Seeds the database with sample Gantt chart data (Deals and ActivitySchedules)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Gantt data...')
        
        base_date = timezone.now()
        
        deals_data = [
            {
                "title": "Website Redesign",
                "customer": "Tech Corp",
                "tasks": [
                    {"activity_name": "Design Mockups", "days_start": 0, "days_duration": 5, "assignee": "Alice"},
                    {"activity_name": "Frontend Development", "days_start": 6, "days_duration": 10, "assignee": "Bob"},
                    {"activity_name": "Backend Integration", "days_start": 10, "days_duration": 8, "assignee": "Charlie"},
                    {"activity_name": "Testing", "days_start": 20, "days_duration": 5, "assignee": "Alice"},
                ]
            },
            {
                "title": "ERP Implementation",
                "customer": "Logistics Ltd",
                "tasks": [
                    {"activity_name": "Requirements Gathering", "days_start": -5, "days_duration": 5, "assignee": "David"},
                    {"activity_name": "Database Setup", "days_start": 1, "days_duration": 3, "assignee": "Eve"},
                    {"activity_name": "Module Configuration", "days_start": 5, "days_duration": 15, "assignee": "Frank"},
                    {"activity_name": "User Training", "days_start": 25, "days_duration": 5, "assignee": "David"},
                ]
            },
            {
                "title": "Marketing Campaign",
                "customer": "Retail Inc",
                "tasks": [
                    {"activity_name": "Market Research", "days_start": -10, "days_duration": 7, "assignee": "Grace"},
                    {"activity_name": "Content Creation", "days_start": 0, "days_duration": 10, "assignee": "Heidi"},
                    {"activity_name": "Social Media Launch", "days_start": 12, "days_duration": 5, "assignee": "Ivan"},
                ]
            }
        ]

        for deal_info in deals_data:
            # Create or get customer
            customer, _ = Customer.objects.get_or_create(company_name=deal_info["customer"])

            # Check if deal exists to avoid duplicates if run multiple times
            deal, created = Deal.objects.get_or_create(
                title=deal_info["title"],
                defaults={
                    "customer": customer,
                    "stage": "Project Management",
                    "amount": random.randint(10000, 50000)
                }
            )
            
            if created:
                self.stdout.write(f'Created Deal "{deal.title}"')
            else:
                self.stdout.write(f'Deal "{deal.title}" already exists. Skipping creation to avoid duplicates.')
                continue # Skip adding tasks if deal already exists to avoid double tasks

            # Add tasks
            for task_info in deal_info["tasks"]:
                start = base_date + timedelta(days=task_info["days_start"])
                end = start + timedelta(days=task_info["days_duration"])
                
                ActivitySchedule.objects.create(
                    deal=deal,
                    activity_name=task_info["activity_name"],
                    start_at=start,
                    due_at=end,
                    salesperson=task_info["assignee"]
                )
                self.stdout.write(f'  - Added task: {task_info["activity_name"]}')
                
        self.stdout.write(self.style.SUCCESS('Successfully seeded Gantt data'))
