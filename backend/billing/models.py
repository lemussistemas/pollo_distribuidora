from django.db import models

from catalog.models import Product
from inventory.models import Warehouse


class Customer(models.Model):
    class CustomerType(models.TextChoices):
        RETAIL = 'retail', 'Minorista'
        WHOLESALE = 'wholesale', 'Mayorista'

    name = models.CharField(max_length=180)
    rtn = models.CharField(max_length=20, blank=True)
    customer_type = models.CharField(
        max_length=20,
        choices=CustomerType.choices,
        default=CustomerType.RETAIL,
    )
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CaiRange(models.Model):
    cai = models.CharField(max_length=80)
    establishment = models.CharField(max_length=3, default='000')
    emission_point = models.CharField(max_length=3, default='000')
    document_type = models.CharField(max_length=2, default='01')
    start_number = models.PositiveIntegerField()
    end_number = models.PositiveIntegerField()
    current_number = models.PositiveIntegerField()
    authorization_date = models.DateField()
    expiration_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'CAI {self.cai} ({self.start_number}-{self.end_number})'

    def format_invoice_number(self, sequence):
        return (
            f'{self.establishment}-'
            f'{self.emission_point}-'
            f'{self.document_type}-'
            f'{sequence:08d}'
        )


class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Borrador'
        ISSUED = 'issued', 'Emitida'
        PAID = 'paid', 'Pagada'
        CANCELLED = 'cancelled', 'Anulada'

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='invoices')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='invoices')
    cai_range = models.ForeignKey(
        CaiRange,
        on_delete=models.PROTECT,
        related_name='invoices',
        null=True,
        blank=True,
    )
    invoice_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    cai = models.CharField(max_length=80, blank=True)
    fiscal_deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    issued_at = models.DateTimeField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.invoice_number or f'Factura #{self.pk}'


class InvoiceLine(models.Model):
    class PriceType(models.TextChoices):
        RETAIL = 'retail', 'Minorista'
        WHOLESALE = 'wholesale', 'Mayorista'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='invoice_lines')
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    price_type = models.CharField(max_length=20, choices=PriceType.choices)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.product} x {self.quantity}'


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'cash', 'Efectivo'
        CARD = 'card', 'Tarjeta'
        TRANSFER = 'transfer', 'Transferencia'
        CREDIT = 'credit', 'Credito'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=Method.choices)
    reference = models.CharField(max_length=120, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.invoice} - {self.amount}'
