from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Transaction, Category
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        label="Confirm Password"
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user data"""
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        return data


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories"""
    user = UserSerializer(read_only=True)
    transaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'user', 'name', 'color', 'icon', 'description', 
            'is_default', 'created_at', 'updated_at', 'transaction_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'transaction_count']

    def get_transaction_count(self, obj):
        """Get the number of transactions in this category"""
        return obj.transactions.count()

    def validate_name(self, value):
        """Validate category name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Category name cannot be empty")
        return value.strip()

    def validate_color(self, value):
        """Validate hex color format"""
        if value and not value.startswith('#'):
            raise serializers.ValidationError("Color must be a valid hex color code starting with #")
        if value and len(value) != 7:
            raise serializers.ValidationError("Color must be a 7-character hex code (e.g., #3B82F6)")
        return value

    def create(self, validated_data):
        """Create category and assign to current user"""
        # User is set in perform_create, but this ensures it's handled correctly
        return super().create(validated_data)


class CategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for category lists"""
    transaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'icon', 'is_default', 'transaction_count']
        read_only_fields = ['id', 'transaction_count']

    def get_transaction_count(self, obj):
        """Get the number of transactions in this category"""
        return obj.transactions.count()


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions"""
    user = UserSerializer(read_only=True)
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'category', 'category_id', 'type', 'text', 
            'amount', 'date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def validate_category_id(self, value):
        """Validate that category belongs to the user"""
        if value:
            request = self.context.get('request')
            if request and request.user:
                try:
                    category = Category.objects.get(id=value, user=request.user)
                    return value
                except Category.DoesNotExist:
                    raise serializers.ValidationError(
                        "Category not found or does not belong to you"
                    )
        return value

    def validate(self, attrs):
        """Additional validation"""
        # Ensure type is valid
        if 'type' in attrs and attrs['type'] not in ['income', 'expense']:
            raise serializers.ValidationError({
                'type': 'Type must be either "income" or "expense"'
            })
        return attrs

    def create(self, validated_data):
        """Create transaction with proper category handling"""
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update transaction with proper category handling"""
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            if category_id:
                validated_data['category'] = Category.objects.get(id=category_id)
            else:
                validated_data['category'] = None
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Custom representation to handle category properly"""
        representation = super().to_representation(instance)
        # Remove category_id from read representation
        representation.pop('category_id', None)
        return representation