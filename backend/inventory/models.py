from django.db import models

from catalog.models import Product


class Warehouse(models.Model):
    name = models.CharField(max_length=120, unique=True)
    location = models.CharField(max_length=180, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class StockLevel(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_levels')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_levels')
    quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['product__name', 'warehouse__name']
        constraints = [
            models.UniqueConstraint(fields=['product', 'warehouse'], name='unique_product_warehouse_stock'),
        ]

    def __str__(self):
        return f'{self.product} @ {self.warehouse}: {self.quantity}'


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        PURCHASE = 'purchase', 'Compra'
        SALE = 'sale', 'Venta'
        ADJUSTMENT = 'adjustment', 'Ajuste'
        TRANSFER_IN = 'transfer_in', 'Transferencia entrada'
        TRANSFER_OUT = 'transfer_out', 'Transferencia salida'

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='stock_movements')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reference = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_movement_type_display()} - {self.product} ({self.quantity})'
