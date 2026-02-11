from django.contrib import admin
from .models import Transaction, Category, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'avatar']
    search_fields = ['user__username']
    raw_id_fields = ['user']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'icon', 'is_default', 'transaction_count', 'created_at']
    list_filter = ['is_default', 'created_at', 'user']
    search_fields = ['name', 'user__username', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    list_editable = ['is_default']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'description')
        }),
        ('Display', {
            'fields': ('color', 'icon', 'is_default')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def transaction_count(self, obj):
        """Display number of transactions in this category"""
        return obj.transactions.count()
    transaction_count.short_description = 'Transactions'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['text', 'user', 'category', 'type', 'amount', 'date', 'created_at']
    list_filter = ['type', 'date', 'created_at', 'user', 'category']
    search_fields = ['text', 'user__username', 'category__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    list_editable = ['type']
    
    fieldsets = (
        ('Transaction Information', {
            'fields': ('user', 'category', 'type', 'text', 'amount', 'date')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'category')
