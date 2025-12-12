import uuid
from datetime import datetime
from django.db import models


class Transaction(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    text = models.CharField(max_length = 200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at: datetime = models.DateTimeField(auto_now_add = True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.text} - {self.amount}"