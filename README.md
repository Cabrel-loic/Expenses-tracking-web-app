# Full Stack Expense Tracker

A modern, full-stack expense tracking application built with Django REST Framework and Next.js. Track your income and expenses with a beautiful, intuitive interface.

## 🎯 Project Overview

This application provides a comprehensive solution for personal finance management, allowing users to:
- Add and manage transactions (income and expenses)
- View real-time balance, income, and expense summaries
- Monitor expense-to-revenue ratios with visual progress indicators
- Track transaction history with detailed timestamps

## 🏗️ Tech Stack

### Backend
- **Framework**: Django 6.0
- **API**: Django REST Framework
- **Database**: Postgresql
- **Authentication**: JWT (JSON Web Tokens) with djangorestframework-simplejwt
- **CORS**: django-cors-headers for cross-origin requests

### Frontend
- **Framework**: Next.js 16.0.8 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + DaisyUI
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React


## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Quick Start

1. **Clone the repository** (if applicable)
2. **Backend Setup** (see detailed steps below)
3. **Frontend Setup** (see detailed steps below)
4. **Register a new account** at `http://localhost:3000/register`
5. **Login** and start tracking your expenses!

> **Note**: Make sure both backend and frontend servers are running simultaneously.

### Backend Setup

1. Navigate to the backend directory:

cd backend


2. Create and activate a virtual environment:

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate


3. Install dependencies:

pip install -r requirements.txt


4. Run migrations:

python manage.py makemigrations
python manage.py migrate


5. (Optional) Create a superuser for admin access:

python manage.py createsuperuser


6. Start the development server:

python manage.py runserver


The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

cd frontend


2. Install dependencies:

npm install


3. Create a `.env.local` file with atleast the content:

NEXT_PUBLIC_API_URL=http://localhost:8000/


4. Start the development server:

npm run dev


The application will be available at `http://localhost:3000`

## 🔐 Authentication

This application uses **JWT (JSON Web Tokens)** for secure authentication. All transaction endpoints require authentication, and users can only access their own data.

### Authentication Flow

1. **Registration**: Users create an account at `/register`
   - Username, email, and password required
   - Optional first and last name
   - Password validation enforced

2. **Login**: Users authenticate at `/login`
   - Receives access token (60 min) and refresh token (7 days)
   - Tokens stored securely in browser localStorage
   - Automatic token refresh on expiration

3. **Protected Routes**: 
   - Home page (`/`) requires authentication
   - Unauthenticated users redirected to login
   - All API endpoints require valid JWT token

4. **Logout**: Clears tokens and redirects to login

### API Endpoints

#### Authentication Endpoints
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user profile
- `PUT/PATCH /api/auth/me/update/` - Update user profile

#### Protected Transaction Endpoints
- `GET /api/transactions/` - List user's transactions (requires auth)
- `POST /api/transactions/` - Create transaction (requires auth)
- `GET /api/transactions/<id>/` - Get transaction (requires auth)
- `PUT /api/transactions/<id>/` - Update transaction (requires auth)
- `DELETE /api/transactions/<id>/` - Delete transaction (requires auth)

### Security Features

- ✅ JWT token-based authentication
- ✅ Automatic token refresh
- ✅ Password validation
- ✅ User data isolation (users only see their own transactions)
- ✅ Secure token storage
- ✅ CORS protection
- ✅ Protected API endpoints

For detailed authentication setup and API documentation, see:
- `backend/AUTH_SETUP.md` - Backend authentication guide
- `frontend/AUTH_GUIDE.md` - Frontend authentication guide

## 📊 Current Features

✅ **Authentication System**
- User registration with validation
- Secure JWT-based login
- Automatic token refresh
- Protected routes and API endpoints
- User profile management
- Secure logout functionality

✅ **Financial Overview**
- Current balance calculation
- Total income tracking
- Total expenses tracking
- Expense-to-revenue ratio visualization

## 🔍 Competitive Analysis: Top Expense Tracking Applications

### 1. **Mint** (by Intuit)
**Key Strengths:**
- Automatic bank account synchronization
- Comprehensive budgeting tools
- Bill reminders and alerts
- Credit score monitoring
- Investment tracking
- Multi-account aggregation

**Weaknesses:**
- Privacy concerns (data sharing with third parties)
- Ad-heavy interface
- Limited customization
- Can be overwhelming for simple use cases
- Discontinued in 2024 (migrated to Credit Karma)

### 2. **YNAB (You Need A Budget)**
**Key Strengths:**
- Zero-based budgeting methodology
- Excellent educational resources
- Strong mobile apps
- Bank sync capabilities
- Goal tracking
- Debt payoff planning

**Weaknesses:**
- Subscription-based ($14.99/month or $99/year)
- Steep learning curve
- Requires manual categorization
- No investment tracking
- Can be too rigid for some users

### 3. **PocketGuard**
**Key Strengths:**
- Simple "In My Pocket" concept
- Automatic categorization
- Bill negotiation features
- Subscription tracking
- Spending alerts
- Bank account linking

**Weaknesses:**
- Limited budgeting features
- Basic reporting
- Free version has limited features
- Less customizable than competitors

### 4. **Expensify**
**Key Strengths:**
- Excellent receipt scanning (OCR)
- Business expense management
- Mileage tracking
- Tax categorization
- Team collaboration features
- Integration with accounting software

**Weaknesses:**
- More business-focused than personal
- Complex interface
- Pricing can be high for individuals
- Some features require paid plans

### 5. **Goodbudget**
**Key Strengths:**
- Envelope budgeting system
- Free tier available
- Family sharing
- Simple, focused approach
- No bank linking required (privacy-focused)

**Weaknesses:**
- Manual entry only
- Limited automation
- Basic reporting
- Less modern UI

## 🎯 Recommended Updates & Enhancements

### Phase 1: Core Functionality Improvements (High Priority)

#### 1. **Transaction Categories**
**Why:** Essential for meaningful expense analysis and budgeting.

**Implementation:**
- **Backend:**
  ```python
  # Add to models.py
  class Category(models.Model):
      name = models.CharField(max_length=100)
      color = models.CharField(max_length=7, default="#3B82F6")
      icon = models.CharField(max_length=50, default="tag")
      
  class Transaction(models.Model):
      # ... existing fields
      category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
  ```
- **Frontend:**
  - Add category dropdown/selector in transaction form
  - Display category badges in transaction list
  - Filter transactions by category
  - Category-based expense breakdown

**Estimated Time:** 4-6 hours

#### 2. **User Authentication & Multi-User Support** ✅ **COMPLETED**
**Why:** Currently all transactions are shared. Users need personal accounts.

**Implementation:**
- **Backend:** ✅
  - Django authentication enabled
  - User foreign key added to Transaction model
  - JWT authentication implemented with djangorestframework-simplejwt
  - User registration/login endpoints created
- **Frontend:** ✅
  - Login/register pages created
  - Protected routes implemented
  - User profile management added
  - Auth tokens stored securely in localStorage

**Status:** Fully implemented and working

#### 3. **Transaction Types (Income/Expense)**
**Why:** Currently relies on negative numbers. Explicit types are clearer.

**Implementation:**
- **Backend:**
  ```python
  class Transaction(models.Model):
      TRANSACTION_TYPES = [
          ('income', 'Income'),
          ('expense', 'Expense'),
      ]
      type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='expense')
      # Remove negative amount requirement
  ```
- **Frontend:**
  - Add transaction type toggle/selector
  - Update calculations to use type instead of sign
  - Improve form UX

**Estimated Time:** 2-3 hours

### Phase 2: Enhanced Features (Medium Priority)

#### 4. **Date Filtering & Time Periods**
**Why:** Users need to view expenses by day, week, month, year.

**Implementation:**
- **Backend:**
  - Add date range filtering to API
  - Create aggregation endpoints (daily, monthly summaries)
- **Frontend:**
  - Add date picker component
  - Implement period selector (Today, This Week, This Month, Custom)
  - Update dashboard to reflect selected period
  - Add time-based charts

**Estimated Time:** 6-8 hours

#### 5. **Recurring Transactions**
**Why:** Many expenses are monthly (rent, subscriptions, etc.)

**Implementation:**
- **Backend:**
  ```python
  class RecurringTransaction(models.Model):
      FREQUENCY_CHOICES = [
          ('daily', 'Daily'),
          ('weekly', 'Weekly'),
          ('monthly', 'Monthly'),
          ('yearly', 'Yearly'),
      ]
      transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
      frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
      next_date = models.DateField()
      is_active = models.BooleanField(default=True)
  ```
- **Frontend:**
  - Add recurring transaction creation UI
  - Display upcoming recurring transactions
  - Auto-create transactions based on schedule

**Estimated Time:** 8-10 hours

#### 6. **Budget Management**
**Why:** Core feature for expense tracking apps. Helps users control spending.

**Implementation:**
- **Backend:**
  ```python
  class Budget(models.Model):
      user = models.ForeignKey(User, on_delete=models.CASCADE)
      category = models.ForeignKey(Category, on_delete=models.CASCADE)
      amount = models.DecimalField(max_digits=10, decimal_places=2)
      period = models.CharField(max_length=20)  # monthly, weekly, etc.
      start_date = models.DateField()
  ```
- **Frontend:**
  - Budget creation/editing interface
  - Budget vs actual spending visualization
  - Budget alerts/warnings
  - Progress indicators

**Estimated Time:** 10-12 hours

#### 7. **Search & Filtering**
**Why:** As transaction history grows, users need to find specific entries.

**Implementation:**
- **Backend:**
  - Add search endpoint with text search
  - Implement filtering by category, date range, amount range
- **Frontend:**
  - Add search bar
  - Implement filter panel
  - Real-time search results
  - Save filter presets

**Estimated Time:** 4-6 hours

### Phase 3: Advanced Features (Lower Priority)

#### 8. **Data Visualization & Reports**
**Why:** Visual insights help users understand spending patterns.

**Implementation:**
- **Libraries:** Chart.js, Recharts, or D3.js
- **Charts to Add:**
  - Pie chart: Expenses by category
  - Line chart: Spending trends over time
  - Bar chart: Monthly comparison
  - Heatmap: Daily spending patterns
- **Reports:**
  - Monthly spending report
  - Category breakdown
  - Export to PDF/CSV

**Estimated Time:** 12-16 hours

#### 9. **Receipt Scanning (OCR)**
**Why:** Reduces manual entry. Major feature in apps like Expensify.

**Implementation:**
- **Options:**
  - Tesseract.js (client-side)
  - Google Cloud Vision API
  - AWS Textract
- **Features:**
  - Upload receipt image
  - Extract amount, date, merchant
  - Auto-create transaction
  - Store receipt images

**Estimated Time:** 16-20 hours

#### 10. **Export & Import**
**Why:** Users need to backup data and import from other apps.

**Implementation:**
- **Export:**
  - CSV export
  - JSON export
  - PDF reports
- **Import:**
  - CSV import with validation
  - Bulk transaction creation
  - Import from Mint/other apps (if format known)

**Estimated Time:** 6-8 hours

#### 11. **Mobile App (React Native)**
**Why:** Expense tracking is often done on-the-go.

**Implementation:**
- Use React Native or Expo
- Share API with web app
- Native features:
  - Camera for receipts
  - Push notifications
  - Offline support

**Estimated Time:** 40-60 hours

#### 12. **Bank Account Integration (Plaid)**
**Why:** Automatic transaction import is a game-changer.

**Implementation:**
- Integrate Plaid API
- Bank account linking
- Automatic transaction sync
- Transaction categorization
- Security considerations (encryption, OAuth)

**Estimated Time:** 20-30 hours

### Phase 4: Polish & Optimization

#### 13. **Database Migration (PostgreSQL)**
**Why:** SQLite doesn't scale well for production.

**Implementation:**
- Set up PostgreSQL database
- Update Django settings
- Migrate existing data
- Update deployment configuration

**Estimated Time:** 4-6 hours

#### 14. **API Documentation (Swagger/OpenAPI)**
**Why:** Makes API easier to use and maintain.

**Implementation:**
- Install drf-spectacular or drf-yasg
- Add API documentation endpoint
- Document all endpoints
- Add request/response examples

**Estimated Time:** 3-4 hours

#### 15. **Testing**
**Why:** Ensures reliability and prevents regressions.

**Implementation:**
- **Backend:**
  - Unit tests for models
  - API endpoint tests
  - Integration tests
- **Frontend:**
  - Component tests (React Testing Library)
  - E2E tests (Playwright/Cypress)
- **CI/CD:**
  - GitHub Actions
  - Automated testing on PR

**Estimated Time:** 16-24 hours

#### 16. **Performance Optimization**
**Why:** Improves user experience, especially with large datasets.

**Implementation:**
- **Backend:**
  - Database query optimization
  - Pagination for transaction lists
  - Caching (Redis)
  - API response compression
- **Frontend:**
  - Code splitting
  - Lazy loading
  - Image optimization
  - Memoization

**Estimated Time:** 8-12 hours

#### 17. **Security Enhancements**
**Why:** Financial data requires strong security.

**Implementation:**
- HTTPS enforcement
- Rate limiting
- Input validation & sanitization
- SQL injection prevention (Django ORM handles this)
- XSS prevention
- CSRF protection
- Secure password storage (bcrypt)
- Two-factor authentication (optional)

**Estimated Time:** 6-8 hours

## 📋 Implementation Roadmap

### Week 1-2: Foundation
1. ✅ User authentication (COMPLETED)
2. Transaction types
3. Categories

### Week 3-4: Core Features
4. Date filtering
5. Search & filtering
6. Budget management

### Week 5-6: Enhanced UX
7. Data visualization
8. Recurring transactions
9. Export/Import

### Week 7-8: Advanced Features
10. Receipt scanning (optional)
11. Database migration
12. Testing & optimization

## 🛠️ Development Best Practices

### Code Organization
- Follow Django and Next.js conventions
- Separate concerns (models, views, components)
- Use TypeScript strictly
- Implement proper error handling

### Version Control
- Use feature branches
- Write meaningful commit messages
- Create pull requests for review
- Keep main branch stable

### Documentation
- Comment complex logic
- Update README with new features
- Document API endpoints
- Maintain changelog

## 🚀 Deployment Considerations

### Backend
- Use PostgreSQL in production
- Set up environment variables
- Configure CORS properly
- Use Gunicorn or uWSGI
- Set up Nginx reverse proxy
- Enable HTTPS

### Frontend
- Build optimized production bundle
- Set up environment variables
- Configure API URLs
- Enable caching
- Use CDN for static assets

### Hosting Options
- **Backend:** Heroku, Railway, DigitalOcean, AWS
- **Frontend:** Vercel, Netlify, AWS Amplify

## 📝 Environment Variables

### Backend

For development, the default settings work out of the box. For production, create a `.env` file:

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgresql://user:password@localhost/dbname
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

**JWT Configuration** (already set in `settings.py`):
- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Token rotation: Enabled

### Frontend

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by applications like Mint, YNAB, and PocketGuard
- Built with Django and Next.js
- UI components from DaisyUI
- JWT authentication powered by djangorestframework-simplejwt
- Icons provided by Lucide React

## 📚 Additional Documentation

- **Backend Authentication**: See `backend/AUTH_SETUP.md` for detailed API documentation
- **Frontend Authentication**: See `frontend/AUTH_GUIDE.md` for frontend implementation details
- **Migration Guide**: See `backend/MIGRATION_GUIDE.md` for database migration instructions
- **Troubleshooting**: See `backend/FIX_TRANSACTION_ISSUES.md` for common issues and solutions

## 📧 Contact

For questions, suggestions, or contributions, please open an issue or contact me at kemloungloiccabrel@gmail.com or whatsapp at +237674658654.



**Note:** This README is a living document. Update it as the project evolves and new features are added.

"# Expenses-tracking-web-app" 
