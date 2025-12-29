from django.core.management.base import BaseCommand
from api.models import Transaction


class Command(BaseCommand):
    help = 'Delete all transactions without a user (orphaned transactions)'

    def handle(self, *args, **options):
        count = Transaction.objects.filter(user__isnull=True).count()
        if count > 0:
            Transaction.objects.filter(user__isnull=True).delete()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} orphaned transaction(s)')
            )
        else:
            self.stdout.write(self.style.SUCCESS('No orphaned transactions found'))

