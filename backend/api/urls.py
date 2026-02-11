from django.contrib import admin
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.get_user_profile, name='user_profile'),
    path('auth/me/update/', views.update_user_profile, name='update_user_profile'),
    
    # Category endpoints (require authentication)
    path('categories/', views.CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<uuid:id>/', views.CategoryRetrieveUpdateDestroyView.as_view(), name='category_detail'),
    
    # Transaction endpoints (require authentication)
    path('transactions/', views.TransactionListCreateView.as_view(), name='transaction_list_create'),
    path('transactions/<uuid:id>/', views.TransactionRetrieveUpdateDestroyView.as_view(), name='transaction_detail'),

    # Analytics (require authentication)
    path('analytics/summary/', views.analytics_summary, name='analytics_summary'),
]