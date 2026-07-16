from django.contrib import admin

from .models import StockLevel, StockMovement, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'is_active')
    search_fields = ('name', 'location')
    list_filter = ('is_active',)


@admin.register(StockLevel)
class StockLevelAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'quantity', 'updated_at')
    search_fields = ('product__name', 'product__sku', 'warehouse__name')
    list_filter = ('warehouse',)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'movement_type', 'quantity', 'reference', 'created_at')
    search_fields = ('product__name', 'product__sku', 'reference')
    list_filter = ('movement_type', 'warehouse')
