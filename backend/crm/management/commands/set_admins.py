from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from crm.models import UserProfile

class Command(BaseCommand):
    help = 'Sets specified users as admins with full permissions'

    def handle(self, *args, **kwargs):
        emails = ['htetyunn06@gmail.com', 'eit@eitlaser.com']
        
        for email in emails:
            try:
                # Get or Create User
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={'username': email}
                )
                
                if created:
                    user.set_unusable_password()
                    self.stdout.write(f'Created new user: {email}')
                else:
                    self.stdout.write(f'Found existing user: {email}')
                
                # Update Admin Flags
                user.is_staff = True
                user.is_superuser = True
                user.save()
                
                # Update Profile
                profile, p_created = UserProfile.objects.get_or_create(user=user)
                profile.allowed_apps = "all"
                profile.save()
                
                self.stdout.write(self.style.SUCCESS(f'Successfully promoted {email} to Admin with full access.'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing {email}: {str(e)}'))
