"""
Signals for the API app
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Category, UserProfile

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, created, **kwargs):
    """Ensure every user has a UserProfile (for avatar, etc.)."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def create_default_categories(sender, instance, created, **kwargs):
    """
    Create default categories for new users.
    Fail-safe: registration must succeed even if this fails.
    """
    if not created:
        return
    default_categories = [
            {
                'name': 'Food & Dining',
                'color': '#FF6B6B',
                'icon': 'utensils',
                'description': 'Restaurants, groceries, and food expenses',
                'is_default': True,
            },
            {
                'name': 'Transportation',
                'color': '#4ECDC4',
                'icon': 'car',
                'description': 'Gas, public transport, and vehicle expenses',
                'is_default': True,
            },
            {
                'name': 'Shopping',
                'color': '#95E1D3',
                'icon': 'shopping-bag',
                'description': 'General shopping and retail purchases',
                'is_default': True,
            },
            {
                'name': 'Bills & Utilities',
                'color': '#F38181',
                'icon': 'file-text',
                'description': 'Electricity, water, internet, and other bills',
                'is_default': True,
            },
            {
                'name': 'Entertainment',
                'color': '#AA96DA',
                'icon': 'film',
                'description': 'Movies, games, and entertainment expenses',
                'is_default': True,
            },
            {
                'name': 'Healthcare',
                'color': '#FCBAD3',
                'icon': 'heart',
                'description': 'Medical expenses and healthcare',
                'is_default': True,
            },
            {
                'name': 'Education',
                'color': '#A8E6CF',
                'icon': 'book',
                'description': 'Education and learning expenses',
                'is_default': True,
            },
            {
                'name': 'Salary',
                'color': '#3B82F6',
                'icon': 'dollar-sign',
                'description': 'Salary and primary income',
                'is_default': True,
            },
            {
                'name': 'Freelance',
                'color': '#10B981',
                'icon': 'briefcase',
                'description': 'Freelance and side income',
                'is_default': True,
            },
            {
                'name': 'Investment',
                'color': '#8B5CF6',
                'icon': 'trending-up',
                'description': 'Investment returns and dividends',
                'is_default': True,
            },
        ]
    try:
        for category_data in default_categories:
            Category.objects.create(user=instance, **category_data)
    except Exception as e:
        logger.exception(
            "Failed to create default categories for user %s: %s",
            instance.username,
            e,
        )
        # Do not re-raise: allow registration to succeed without default categories
