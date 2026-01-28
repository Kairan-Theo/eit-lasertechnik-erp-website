from django.core.management.base import BaseCommand
from crm.utils import check_and_send_reminders, check_task_reminders

class Command(BaseCommand):
    help = 'Checks for upcoming activity schedules and tasks, sending notifications 24 hours in advance'

    def handle(self, *args, **options):
        activity_count = check_and_send_reminders()
        task_count = check_task_reminders()
        self.stdout.write(self.style.SUCCESS(f'Sent {activity_count} activity reminders and {task_count} task reminders.'))
