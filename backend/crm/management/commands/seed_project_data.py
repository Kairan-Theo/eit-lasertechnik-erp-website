from django.core.management.base import BaseCommand
from crm.models import Project, Task, Customer
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Seeds the database with sample Project and Task data for Gantt chart'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Project data...')
        
        base_date = timezone.now().date()
        
        projects_data = [
            {
                "name": "Website Redesign",
                "customer_name": "Tech Corp",
                "status": "in_progress",
                "tasks": [
                    {"title": "Design Mockups", "days_start": 0, "days_duration": 5, "assignee": "Alice"},
                    {"title": "Frontend Development", "days_start": 6, "days_duration": 10, "assignee": "Bob"},
                    {"title": "Backend Integration", "days_start": 10, "days_duration": 8, "assignee": "Charlie"},
                    {"title": "Testing", "days_start": 20, "days_duration": 5, "assignee": "Alice"},
                ]
            },
            {
                "name": "ERP Implementation",
                "customer_name": "Logistics Ltd",
                "status": "planned",
                "tasks": [
                    {"title": "Requirements Gathering", "days_start": -5, "days_duration": 5, "assignee": "David"},
                    {"title": "Database Setup", "days_start": 1, "days_duration": 3, "assignee": "Eve"},
                    {"title": "Module Configuration", "days_start": 5, "days_duration": 15, "assignee": "Frank"},
                    {"title": "User Training", "days_start": 25, "days_duration": 5, "assignee": "David"},
                ]
            },
            {
                "name": "Marketing Campaign",
                "customer_name": "Retail Inc",
                "status": "completed",
                "tasks": [
                    {"title": "Market Research", "days_start": -10, "days_duration": 7, "assignee": "Grace"},
                    {"title": "Content Creation", "days_start": 0, "days_duration": 10, "assignee": "Heidi"},
                    {"title": "Social Media Launch", "days_start": 12, "days_duration": 5, "assignee": "Ivan"},
                ]
            }
        ]

        for proj_info in projects_data:
            # Create or get customer
            customer, _ = Customer.objects.get_or_create(
                company_name=proj_info["customer_name"],
                defaults={
                    'contact_name': '',
                    'email': '',
                    'phone': '',
                    'industry': '',
                    'address': ''
                }
            )

            # Check if project exists
            project, created = Project.objects.get_or_create(
                name=proj_info["name"],
                defaults={
                    "customer": customer,
                    "status": proj_info["status"],
                    "start_date": base_date, # Approximation
                    "end_date": base_date + timedelta(days=30), # Approximation
                    "priority": "medium"
                }
            )
            
            if created:
                self.stdout.write(f'Created Project "{project.name}"')
            else:
                self.stdout.write(f'Project "{project.name}" already exists. Skipping creation.')
                continue

            # Add tasks
            for task_info in proj_info["tasks"]:
                start = base_date + timedelta(days=task_info["days_start"])
                end = start + timedelta(days=task_info["days_duration"])
                
                Task.objects.create(
                    project=project,
                    title=task_info["title"],
                    start_date=start,
                    due_date=end,
                    assignee=task_info["assignee"],
                    status="todo"
                )
                self.stdout.write(f'  - Added task: {task_info["title"]}')
                
        self.stdout.write(self.style.SUCCESS('Successfully seeded Project and Task data'))
