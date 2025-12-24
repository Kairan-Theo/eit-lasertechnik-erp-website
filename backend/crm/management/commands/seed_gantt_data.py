from django.core.management.base import BaseCommand
from crm.models import Deal, ActivitySchedule
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
                    {"text": "Design Mockups", "days_start": 0, "days_duration": 5, "assignee": "Alice"},
                    {"text": "Frontend Development", "days_start": 6, "days_duration": 10, "assignee": "Bob"},
                    {"text": "Backend Integration", "days_start": 10, "days_duration": 8, "assignee": "Charlie"},
                    {"text": "Testing", "days_start": 20, "days_duration": 5, "assignee": "Alice"},
                ]
            },
            {
                "title": "ERP Implementation",
                "customer": "Logistics Ltd",
                "tasks": [
                    {"text": "Requirements Gathering", "days_start": -5, "days_duration": 5, "assignee": "David"},
                    {"text": "Database Setup", "days_start": 1, "days_duration": 3, "assignee": "Eve"},
                    {"text": "Module Configuration", "days_start": 5, "days_duration": 15, "assignee": "Frank"},
                    {"text": "User Training", "days_start": 25, "days_duration": 5, "assignee": "David"},
                ]
            },
            {
                "title": "Marketing Campaign",
                "customer": "Retail Inc",
                "tasks": [
                    {"text": "Market Research", "days_start": -10, "days_duration": 7, "assignee": "Grace"},
                    {"text": "Content Creation", "days_start": 0, "days_duration": 10, "assignee": "Heidi"},
                    {"text": "Social Media Launch", "days_start": 12, "days_duration": 5, "assignee": "Ivan"},
                ]
            }
        ]

        for deal_info in deals_data:
            # Check if deal exists to avoid duplicates if run multiple times
            deal, created = Deal.objects.get_or_create(
                title=deal_info["title"],
                defaults={
                    "customer": deal_info["customer"],
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
                    text=task_info["text"],
                    start_at=start,
                    due_at=end,
                    assignee=task_info["assignee"]
                )
                self.stdout.write(f'  - Added task: {task_info["text"]}')
                
        self.stdout.write(self.style.SUCCESS('Successfully seeded Gantt data'))
