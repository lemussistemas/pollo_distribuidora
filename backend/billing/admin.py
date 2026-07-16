from django.contrib import admin

from .models import CaiRange, Customer, Invoice, InvoiceLine, Payment


class InvoiceLineInline(admin.TabularInline):
    model = InvoiceLine
    extra = 0


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'rtn', 'customer_type', 'phone', 'is_active')
    search_fields = ('name', 'rtn', 'phone')
    list_filter = ('customer_type', 'is_active')


@admin.register(CaiRange)
class CaiRangeAdmin(admin.ModelAdmin):
    list_display = ('cai', 'start_number', 'end_number', 'current_number', 'expiration_date', 'is_active')
    search_fields = ('cai',)
    list_filter = ('is_active',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'status', 'issued_at', 'total')
    search_fields = ('invoice_number', 'customer__name', 'customer__rtn')
    list_filter = ('status',)
    inlines = [InvoiceLineInline, PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'method', 'paid_at')
    search_fields = ('invoice__invoice_number', 'reference')
    list_filter = ('method',)
