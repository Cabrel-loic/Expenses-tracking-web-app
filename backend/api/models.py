import uuid
from datetime import datetime
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.utils import timezone


class Category(models.Model):
    """Category model for organizing transactions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='categories',
        help_text="User who owns this category"
    )
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(1), MaxLengthValidator(100)],
        help_text="Category name (e.g., Food, Transportation, Salary)"
    )
    color = models.CharField(
        max_length=7,
        default="#3B82F6",
        help_text="Hex color code for the category (e.g., #3B82F6)"
    )
    icon = models.CharField(
        max_length=50,
        default="tag",
        help_text="Icon identifier (e.g., tag, shopping-cart, home)"
    )
    description = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Optional description for the category"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is a default category for the user"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['-is_default', 'name']
        indexes = [
            models.Index(fields=['user', 'name']),
            models.Index(fields=['user', 'created_at']),
        ]
        unique_together = [['user', 'name']]  # Each user can have unique category names

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    def clean(self):
        """Validate category data"""
        from django.core.exceptions import ValidationError
        
        # Validate color format (hex color)
        if self.color and not self.color.startswith('#'):
            raise ValidationError({'color': 'Color must be a valid hex color code starting with #'})
        
        if len(self.color) != 7:
            raise ValidationError({'color': 'Color must be a 7-character hex code (e.g., #3B82F6)'})


class Transaction(models.Model):
    """Transaction model for income and expenses"""
    
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='transactions',
        null=True,  # Temporarily nullable for migration, enforced at application level
        blank=True,
        help_text="User who owns this transaction"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text="Category this transaction belongs to"
    )
    type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES,
        default='expense',
        help_text="Type of transaction: income or expense"
    )
    text = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(1), MaxLengthValidator(200)],
        help_text="Transaction description"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Transaction amount (always positive, type determines income/expense)"
    )
    date = models.DateField(
        default=timezone.now,
        help_text="Date of the transaction"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.text} - {self.get_type_display()} - {self.amount}"

    def clean(self):
        """Validate transaction data"""
        from django.core.exceptions import ValidationError
        
        # Amount must be positive
        if self.amount and self.amount <= 0:
            raise ValidationError({'amount': 'Amount must be greater than zero'})
        
        # Validate category belongs to user (only if both are set)
        if self.category and self.user and self.category.user != self.user:
            raise ValidationError({
                'category': 'Category does not belong to this user'
            })

    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)