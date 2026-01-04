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
            with open("debug_thread.log", "a") as f:
                f.write(f"[{time.ctime()}] Thread started\n")
            
            try:
                from crm.utils import check_and_send_reminders
            except Exception as e:
                with open("debug_thread.log", "a") as f:
                    f.write(f"[{time.ctime()}] Import failed: {e}\n")
                return

            print("Starting reminder check loop...")
            while True:
                try:
                    with open("debug_thread.log", "a") as f:
                        f.write(f"[{time.ctime()}] Checking reminders...\n")
                    
                    count = check_and_send_reminders()
                    
                    if count > 0:
                        msg = f"Sent {count} reminders."
                        print(msg)
                        with open("debug_thread.log", "a") as f:
                            f.write(f"[{time.ctime()}] {msg}\n")
                except Exception as e:
                    print(f"Error in reminder loop: {e}")
                    with open("debug_thread.log", "a") as f:
                        f.write(f"[{time.ctime()}] Error: {e}\n")
                
                # Check every minute
                time.sleep(60)

        thread = threading.Thread(target=reminder_loop, daemon=True)
        thread.start()
