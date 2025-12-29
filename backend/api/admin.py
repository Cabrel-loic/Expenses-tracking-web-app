from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'text', 'amount', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['text', 'user__username']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'created_at'
