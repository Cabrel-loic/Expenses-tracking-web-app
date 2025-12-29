# Migration Guide for User Field

## Step 1: Create Migration

Since we made the `user` field nullable temporarily, you can now create the migration:

```bash
python manage.py makemigrations
```

When prompted, select option **1** and provide a default value. You can use `1` (assuming you have a superuser with ID 1), or we'll delete old transactions.

## Step 2: Apply Migration

```bash
python manage.py migrate
```

## Step 3: Clean Up Old Transactions (Optional)

If you have old transactions without users, you can delete them using Django shell:

```bash
python manage.py shell
```

Then run:
```python
from api.models import Transaction
# Delete all transactions without a user
Transaction.objects.filter(user__isnull=True).delete()
# Or assign them to a specific user (replace 1 with your user ID)
# from django.contrib.auth.models import User
# user = User.objects.get(id=1)
# Transaction.objects.filter(user__isnull=True).update(user=user)
```

## Step 4: Make User Field Required Again (Optional)

After cleaning up, you can make the field required again:

1. Edit `backend/api/models.py`:
   - Change `null=True, blank=True` to remove those parameters
   - So it becomes: `user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')`

2. Create and apply migration:
```bash
python manage.py makemigrations
python manage.py migrate
```

## Quick Fix: Delete All Old Transactions

If you're in development and don't need old data:

```bash
python manage.py shell
```

```python
from api.models import Transaction
Transaction.objects.all().delete()
exit()
```

Then make the field required and migrate again.

