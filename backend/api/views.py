from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from .models import Transaction
from .serializers import (
    TransactionSerializer, 
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer
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


class TransactionListCreateView(generics.ListCreateAPIView):
    """List and create transactions (user-specific)"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only transactions for the authenticated user"""
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically assign the transaction to the current user"""
        serializer.save(user=self.request.user)


class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a transaction (user-specific)"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """Return only transactions for the authenticated user"""
        return Transaction.objects.filter(user=self.request.user)