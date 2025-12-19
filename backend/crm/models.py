from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Deal(models.Model):
    PRIORITY_CHOICES = [
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    title = models.CharField(max_length=200)
    customer = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="฿")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='none')
    contact = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expected_close = models.DateField(null=True, blank=True)
    
    # We can store the pipeline stage as a string or a ChoiceField.
    # For flexibility let's use CharField for now, or you can make a Stage model.
    stage = models.CharField(max_length=100, default="Appointment Schedule")

    def __str__(self):
        return self.title

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Comma-separated list of app names: "Manufacturing,Inventory,CRM,Project Management,Admin"
    # "all" means access to everything.
    allowed_apps = models.TextField(default="all", blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Notification(models.Model):
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=50, default='info') # info, signup, alert

    def __str__(self):
        return self.message

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Default to no apps for new users, "all" for superusers
        default_apps = "all" if instance.is_staff else ""
        UserProfile.objects.create(user=instance, allowed_apps=default_apps)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        # Fallback if profile doesn't exist for some reason
        default_apps = "all" if instance.is_staff else ""
        UserProfile.objects.create(user=instance, allowed_apps=default_apps)
