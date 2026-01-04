from crm.models import ActivitySchedule, Notification
from django.utils import timezone
from datetime import timedelta

def check_and_send_reminders():
    now = timezone.now()
    in_24h = now + timedelta(hours=24)
    in_7d = now + timedelta(days=7)

    qs = ActivitySchedule.objects.exclude(due_at=None)
    count = 0

    for activity in qs:
        due = activity.due_at
        customer_name = activity.customer or "Unknown Customer"

        if due > now:
            if not activity.reminder_week_sent and due <= in_7d and due > in_24h:
                msg = f"Reminder: Activity '{activity.activity_name}' for {customer_name} is due in 7 days on {due.strftime('%Y-%m-%d %H:%M')}."
                Notification.objects.create(message=msg, type="alert")
                activity.reminder_week_sent = True
                activity.save()
                count += 1

            if not activity.reminder_day_sent and due <= in_24h:
                msg = f"Reminder: Activity '{activity.activity_name}' for {customer_name} is due in 24 hours on {due.strftime('%Y-%m-%d %H:%M')}."
                Notification.objects.create(message=msg, type="alert")
                activity.reminder_day_sent = True
                activity.save()
                count += 1
        else:
            if not activity.reminder_day_sent and (now - due) <= timedelta(hours=24):
                msg = f"Reminder: Activity '{activity.activity_name}' for {customer_name} was due on {due.strftime('%Y-%m-%d %H:%M')}."
                Notification.objects.create(message=msg, type="alert")
                activity.reminder_day_sent = True
                activity.save()
                count += 1

    return count
