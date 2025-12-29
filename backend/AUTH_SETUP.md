# JWT Authentication Setup Guide

## ✅ What Has Been Implemented

### 1. **User Registration**
- Endpoint: `POST /api/auth/register/`
- Fields: `username`, `email`, `password`, `password2`, `first_name`, `last_name`
- Returns: User data on successful registration

### 2. **User Login (JWT Token)**
- Endpoint: `POST /api/auth/login/`
- Fields: `username`, `password`
- Returns: `access` token, `refresh` token, and `user` data

### 3. **Token Refresh**
- Endpoint: `POST /api/auth/token/refresh/`
- Fields: `refresh` (refresh token)
- Returns: New `access` token

### 4. **User Profile**
- Get Profile: `GET /api/auth/me/`
- Update Profile: `PUT/PATCH /api/auth/me/update/`
- Requires: Authentication (Bearer token)

### 5. **Protected Transaction Endpoints**
- All transaction endpoints now require authentication
- Transactions are automatically filtered by the authenticated user
- Users can only see and manage their own transactions

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create and Run Migrations

```bash
# Create migration for the Transaction model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### 3. Create a Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 4. Start the Development Server

```bash
python manage.py runserver
```

## 📡 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Refresh Token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Get User Profile
```http
GET /api/auth/me/
Authorization: Bearer <access_token>
```

#### Update User Profile
```http
PUT /api/auth/me/update/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com"
}
```

### Transaction Endpoints (Protected)

#### List/Create Transactions
```http
GET /api/transactions/
Authorization: Bearer <access_token>

POST /api/transactions/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Grocery Shopping",
  "amount": -50.00
}
```

#### Get/Update/Delete Transaction
```http
GET /api/transactions/<uuid>/
PUT /api/transactions/<uuid>/
DELETE /api/transactions/<uuid>/
Authorization: Bearer <access_token>
```

## 🔒 Security Features

1. **Password Validation**: Uses Django's built-in password validators
2. **JWT Tokens**: Secure token-based authentication
3. **Token Rotation**: Refresh tokens are rotated on use
4. **User Isolation**: Users can only access their own transactions
5. **HTTPS Ready**: Configured for production use

## 📝 Notes

- Access tokens expire after 60 minutes
- Refresh tokens expire after 7 days
- All transaction endpoints require authentication
- The `user` field is automatically set when creating transactions
- Users can only view/edit/delete their own transactions

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password2": "testpass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### Get Transactions (with token)
```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

