from django.db import models

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
