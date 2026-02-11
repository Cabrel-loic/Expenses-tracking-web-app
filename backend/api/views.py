from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict
from .models import Transaction, Category
from .serializers import (
    TransactionSerializer, 
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    CategorySerializer,
    CategoryListSerializer
)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with user data"""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_user_profile(request):
    """Update current user profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change password for the authenticated user."""
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError
    current = request.data.get('current_password')
    new_password = request.data.get('new_password')
    new_password2 = request.data.get('new_password_confirm')
    if not current:
        return Response({'current_password': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
    if not request.user.check_password(current):
        return Response({'current_password': ['Current password is incorrect.']}, status=status.HTTP_400_BAD_REQUEST)
    if not new_password:
        return Response({'new_password': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
    if new_password != new_password2:
        return Response({'new_password_confirm': ['Passwords do not match.']}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_password(new_password, request.user)
    except ValidationError as e:
        return Response({'new_password': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(new_password)
    request.user.save()
    return Response({'message': 'Password updated successfully.'})


# ==================== Category Views ====================

class CategoryListCreateView(generics.ListCreateAPIView):
    """List and create categories (user-specific)"""
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only categories for the authenticated user, optimized with select_related"""
        return Category.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        """Automatically assign the category to the current user"""
        serializer.save(user=self.request.user)

    def get_serializer_class(self):
        """Use lightweight serializer for list view"""
        if self.request.method == 'GET':
            return CategoryListSerializer
        return CategorySerializer


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a category (user-specific)"""
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """Return only categories for the authenticated user"""
        return Category.objects.filter(user=self.request.user).select_related('user')

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of categories that have transactions"""
        instance = self.get_object()
        transaction_count = instance.transactions.count()
        
        if transaction_count > 0:
            return Response(
                {
                    'error': f'Cannot delete category with {transaction_count} transaction(s). '
                             'Please reassign or delete transactions first.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


# ==================== Transaction Views ====================

class TransactionListCreateView(generics.ListCreateAPIView):
    """List and create transactions (user-specific) with filtering and search"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text', 'category__name']
    ordering_fields = ['date', 'created_at', 'amount', 'type']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        """Return filtered transactions for the authenticated user with optimized queries"""
        queryset = Transaction.objects.filter(
            user=self.request.user
        ).select_related('category', 'user').order_by('-date', '-created_at')

        # Filter by type (income/expense)
        transaction_type = self.request.query_params.get('type', None)
        if transaction_type in ['income', 'expense']:
            queryset = queryset.filter(type=transaction_type)

        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            try:
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                pass  # Invalid UUID format

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass  # Invalid date format

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass  # Invalid date format

        # Filter by amount range
        min_amount = self.request.query_params.get('min_amount', None)
        max_amount = self.request.query_params.get('max_amount', None)
        
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=float(min_amount))
            except ValueError:
                pass

        if max_amount:
            try:
                queryset = queryset.filter(amount__lte=float(max_amount))
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        """Automatically assign the transaction to the current user"""
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """Enhanced list view with summary statistics"""
        response = super().list(request, *args, **kwargs)
        
        # Get filtered queryset for statistics (before pagination)
        queryset = self.filter_queryset(self.get_queryset())
        
        # Calculate summary statistics
        total_income = queryset.filter(type='income').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_expense = queryset.filter(type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        balance = total_income - total_expense
        
        # Add summary to response (preserve pagination structure if present)
        if isinstance(response.data, dict) and 'results' in response.data:
            # Paginated response
            response.data['summary'] = {
                'total_income': float(total_income),
                'total_expense': float(total_expense),
                'balance': float(balance),
                'total_count': queryset.count(),
                'income_count': queryset.filter(type='income').count(),
                'expense_count': queryset.filter(type='expense').count(),
            }
        else:
            # Non-paginated response (if pagination is disabled)
            response.data = {
                'results': response.data,
                'summary': {
                    'total_income': float(total_income),
                    'total_expense': float(total_expense),
                    'balance': float(balance),
                    'total_count': queryset.count(),
                    'income_count': queryset.filter(type='income').count(),
                    'expense_count': queryset.filter(type='expense').count(),
                }
            }
        
        return response


class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a transaction (user-specific)"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """Return only transactions for the authenticated user with optimized queries"""
        return Transaction.objects.filter(
            user=self.request.user
        ).select_related('category', 'user')


# ==================== Analytics View ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_summary(request):
    """
    Return aggregated analytics for the authenticated user.
    Query params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD).
    Default: last 12 months.
    """
    today = timezone.now().date()
    end_date = today
    start_date = today - timedelta(days=365)

    start_param = request.query_params.get('start_date')
    end_param = request.query_params.get('end_date')
    if start_param:
        try:
            start_date = datetime.strptime(start_param, '%Y-%m-%d').date()
        except ValueError:
            pass
    if end_param:
        try:
            end_date = datetime.strptime(end_param, '%Y-%m-%d').date()
        except ValueError:
            pass

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    base_qs = Transaction.objects.filter(
        user=request.user,
        date__gte=start_date,
        date__lte=end_date,
    ).select_related('category')

    total_income = base_qs.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
    total_expense = base_qs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0
    balance = total_income - total_expense
    transaction_count = base_qs.count()
    income_count = base_qs.filter(type='income').count()
    expense_count = base_qs.filter(type='expense').count()

    expenses_by_category = (
        base_qs.filter(type='expense', category__isnull=False)
        .values('category__id', 'category__name', 'category__color')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )
    expenses_by_category = [
        {
            'category_id': str(x['category__id']),
            'category_name': x['category__name'] or 'Uncategorized',
            'color': x['category__color'] or '#6b7280',
            'total': float(x['total']),
            'count': x['count'],
        }
        for x in expenses_by_category
    ]

    income_by_category = (
        base_qs.filter(type='income', category__isnull=False)
        .values('category__id', 'category__name', 'category__color')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )
    income_by_category = [
        {
            'category_id': str(x['category__id']),
            'category_name': x['category__name'] or 'Uncategorized',
            'color': x['category__color'] or '#6b7280',
            'total': float(x['total']),
            'count': x['count'],
        }
        for x in income_by_category
    ]

    by_month_qs = (
        Transaction.objects.filter(user=request.user, date__gte=start_date, date__lte=end_date)
        .annotate(month=TruncMonth('date'))
        .values('month', 'type')
        .annotate(total=Sum('amount'))
    )
    by_month_map = defaultdict(lambda: {'income': 0, 'expense': 0})
    for row in by_month_qs:
        month_key = row['month'].strftime('%Y-%m') if row['month'] else None
        if month_key:
            by_month_map[month_key][row['type']] = float(row['total'] or 0)
    months_sorted = sorted(by_month_map.keys())
    by_month = [
        {'month': m, 'income': by_month_map[m]['income'], 'expense': by_month_map[m]['expense']}
        for m in months_sorted
    ]

    return Response({
        'period': {'start_date': start_date.isoformat(), 'end_date': end_date.isoformat()},
        'summary': {
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'balance': float(balance),
            'transaction_count': transaction_count,
            'income_count': income_count,
            'expense_count': expense_count,
        },
        'expenses_by_category': expenses_by_category,
        'income_by_category': income_by_category,
        'by_month': by_month,
    })