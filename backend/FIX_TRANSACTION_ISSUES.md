# Fix Transaction Fetch/Add Issues

## Problem
After logging in, you're getting:
- "Failed to fetch transactions" error
- "Failed to add transaction" error

## Root Causes
1. **Migration not completed** - The `user` field migration needs to be applied
2. **Old transactions** - Existing transactions without users may cause issues
3. **API errors not visible** - Need better error logging

## Solution Steps

### Step 1: Complete the Migration

Run these commands in your backend directory:

```bash
# Create the migration (select option 1 when prompted, enter 1 as default)
python manage.py makemigrations

# Apply the migration
python manage.py migrate
```

### Step 2: Clean Up Old Transactions

If you have old transactions without users, delete them:

```bash
python manage.py cleanup_transactions
```

Or manually in Django shell:
```bash
python manage.py shell
```

```python
from api.models import Transaction
# Delete all transactions without a user
Transaction.objects.filter(user__isnull=True).delete()
exit()
```

### Step 3: Verify Backend is Running

Make sure your Django server is running:
```bash
python manage.py runserver
```

Check that it's accessible at `http://localhost:8000`

### Step 4: Check Environment Variables

Make sure your frontend `.env.local` has:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/
```

### Step 5: Test the API Directly

Test the login endpoint:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

Test transactions (replace YOUR_TOKEN with actual token):
```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 6: Check Browser Console

Open browser DevTools (F12) and check:
1. **Console tab** - Look for detailed error messages
2. **Network tab** - Check the API requests:
   - Are they being sent?
   - What's the response status?
   - What's the response body?

### Step 7: Common Issues & Fixes

#### Issue: CORS Error
**Fix**: Make sure `CORS_ALLOW_ALL_ORIGINS = True` in `backend/settings.py` (for development)

#### Issue: 401 Unauthorized
**Fix**: 
- Check token is being sent in headers
- Verify token hasn't expired
- Try logging in again

#### Issue: 400 Bad Request
**Fix**: Check the error response in browser console for specific field errors

#### Issue: 500 Server Error
**Fix**: Check Django server logs for detailed error messages

### Step 8: Debug Mode

The frontend now has better error logging. Check the browser console for:
- `Error fetching transactions` - Full error object
- `Error response:` - API response data
- `Error status:` - HTTP status code

## Quick Test After Fixes

1. **Register a new user** (if needed)
2. **Login** - Should get tokens
3. **Check browser console** - Should see successful API calls
4. **Add a transaction** - Should work now
5. **View transactions** - Should display your transactions

## If Still Not Working

1. **Check Django logs** - Look at the terminal where `runserver` is running
2. **Check browser Network tab** - See the actual API requests/responses
3. **Verify authentication** - Make sure tokens are in localStorage:
   ```javascript
   // In browser console
   localStorage.getItem('access_token')
   localStorage.getItem('refresh_token')
   ```

## Next Steps After Migration

Once everything works, you can make the `user` field required again:

1. Edit `backend/api/models.py`:
   - Remove `null=True, blank=True` from the user field
2. Create migration:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

This ensures all future transactions must have a user.

