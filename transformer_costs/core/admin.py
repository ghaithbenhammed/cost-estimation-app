from django.contrib import admin
from .models import TemporaryCustomer, CustomerRequest,SavedBom, SavedBomLine

@admin.register(TemporaryCustomer)
class TemporaryCustomerAdmin(admin.ModelAdmin):
    list_display = ('No', 'Name', 'County', 'Customer_Status', 'Last_Date_Modified', 'is_approved')
    search_fields = ('No', 'Name')
    list_filter = ('Customer_Status', 'is_approved')
    ordering = ('-Last_Date_Modified',)

@admin.register(CustomerRequest)
class CustomerRequestAdmin(admin.ModelAdmin):
    list_display = ('customer', 'request_type', 'power', 'primary_voltage', 'secondary_voltage', 'frequency', 'status', 'created_at','validated_at', 'description_text', 'description_file')
    search_fields = ('customer__No', 'customer__Name', 'request_type')
    list_filter = ('status', 'created_at', 'validated_at')
    ordering = ('-created_at',)

admin.site.register(SavedBom)
admin.site.register(SavedBomLine)