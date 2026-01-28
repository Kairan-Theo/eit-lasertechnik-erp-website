from django.apps import AppConfig
import threading
import time
import os
import sys

class CrmConfig(AppConfig):
    name = 'crm'

    def ready(self):
        print(f"CrmConfig ready. RUN_MAIN={os.environ.get('RUN_MAIN')}")
        # Prevent starting the thread twice when using runserver with auto-reload
        # RUN_MAIN is set by Django's reloader
        if os.environ.get('RUN_MAIN') == 'true':
            self.start_reminder_thread()

    def start_reminder_thread(self):
        def reminder_loop():
            # Wait a bit for the server to fully start
            time.sleep(5)
            # Log startup
            # print(f"[{time.ctime()}] Reminder thread started")
            
            try:
                from crm.utils import check_and_send_reminders
            except Exception as e:
                print(f"[{time.ctime()}] Reminder thread import failed: {e}")
                return

            print("Starting reminder check loop...")
            while True:
                try:
                    # print(f"[{time.ctime()}] Checking reminders...")
                    
                    count = check_and_send_reminders()
                    
                    if count > 0:
                        msg = f"Sent {count} reminders."
                        print(msg)
                except Exception as e:
                    print(f"Error in reminder loop: {e}")
                
                # Check every minute
                time.sleep(60)

        thread = threading.Thread(target=reminder_loop, daemon=True)
        thread.start()
