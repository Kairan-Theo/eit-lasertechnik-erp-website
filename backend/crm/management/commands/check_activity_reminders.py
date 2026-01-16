from django.core.management.base import BaseCommand
from crm.utils import check_and_send_reminders

class Command(BaseCommand):
    help = 'Checks for upcoming activity schedules and sends notifications 24 hours in advance'

    def handle(self, *args, **options):
        count = check_and_send_reminders()
        self.stdout.write(self.style.SUCCESS(f'Sent {count} reminders.'))
