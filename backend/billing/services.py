from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounting.models import Account, JournalEntry, JournalLine
from inventory.models import StockLevel, StockMovement
from inventory.services import register_stock_movement

from .models import Invoice


TWOPLACES = Decimal('0.01')


def quantize_money(value):
    return Decimal(value).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def recalculate_invoice(invoice):
    subtotal = Decimal('0')
    discount_total = Decimal('0')
    tax_total = Decimal('0')

    for line in invoice.lines.select_related('product'):
        gross = Decimal(line.quantity) * Decimal(line.unit_price)
        taxable_base = gross - Decimal(line.discount)
        tax = taxable_base * (Decimal(line.tax_rate) / Decimal('100'))
        line.line_total = quantize_money(taxable_base + tax)
        line.save(update_fields=['line_total'])
        subtotal += gross
        discount_total += Decimal(line.discount)
        tax_total += tax

    invoice.subtotal = quantize_money(subtotal)
    invoice.discount_total = quantize_money(discount_total)
    invoice.tax_total = quantize_money(tax_total)
    invoice.total = quantize_money(invoice.subtotal - invoice.discount_total + invoice.tax_total)
    invoice.save(update_fields=['subtotal', 'discount_total', 'tax_total', 'total', 'updated_at'])
    return invoice


def get_or_create_account(code, name, account_type):
    account, _ = Account.objects.get_or_create(
        code=code,
        defaults={'name': name, 'account_type': account_type},
    )
    return account


def create_sales_journal_entry(invoice):
    cash = get_or_create_account('1101', 'Caja y bancos', Account.AccountType.ASSET)
    sales = get_or_create_account('4101', 'Ingresos por ventas', Account.AccountType.REVENUE)
    tax_payable = get_or_create_account('2101', 'Impuesto sobre ventas por pagar', Account.AccountType.LIABILITY)

    entry = JournalEntry.objects.create(
        date=invoice.issued_at.date(),
        description=f'Factura {invoice.invoice_number}',
        reference=invoice.invoice_number,
        source='billing',
    )
    JournalLine.objects.bulk_create(
        [
            JournalLine(entry=entry, account=cash, debit=invoice.total, credit=0),
            JournalLine(entry=entry, account=sales, debit=0, credit=invoice.subtotal - invoice.discount_total),
            JournalLine(entry=entry, account=tax_payable, debit=0, credit=invoice.tax_total),
        ]
    )
    return entry


def validate_cai_range(cai_range):
    if not cai_range:
        return
    today = timezone.localdate()
    if not cai_range.is_active:
        raise ValidationError({'cai_range': 'El rango CAI seleccionado no esta activo.'})
    if cai_range.expiration_date < today:
        raise ValidationError({'cai_range': 'El rango CAI seleccionado esta vencido.'})
    if cai_range.current_number > cai_range.end_number:
        raise ValidationError({'cai_range': 'El rango CAI seleccionado ya fue agotado.'})


def validate_invoice_stock(invoice):
    for line in invoice.lines.select_related('product'):
        stock_level = StockLevel.objects.filter(product=line.product, warehouse=invoice.warehouse).first()
        available = stock_level.quantity if stock_level else Decimal('0')
        if available < line.quantity:
            raise ValidationError(
                {
                    'stock': (
                        f'Stock insuficiente para {line.product.name}. '
                        f'Disponible: {available}, solicitado: {line.quantity}.'
                    )
                }
            )


@transaction.atomic
def issue_invoice(invoice):
    invoice = Invoice.objects.select_for_update().prefetch_related('lines__product').get(pk=invoice.pk)
    if invoice.status != Invoice.Status.DRAFT:
        return invoice

    if not invoice.lines.exists():
        raise ValidationError({'lines': 'La factura necesita al menos una linea de producto.'})

    validate_cai_range(invoice.cai_range)
    validate_invoice_stock(invoice)

    cai_range = invoice.cai_range
    if cai_range and not invoice.invoice_number:
        cai_range = type(cai_range).objects.select_for_update().get(pk=cai_range.pk)
        next_number = cai_range.current_number
        invoice.invoice_number = cai_range.format_invoice_number(next_number)
        invoice.cai = cai_range.cai
        invoice.fiscal_deadline = cai_range.expiration_date
        cai_range.current_number = min(next_number + 1, cai_range.end_number)
        cai_range.save(update_fields=['current_number'])
    elif not invoice.invoice_number:
        today = timezone.localdate()
        invoice.invoice_number = f'PR-{today:%Y%m%d}-{invoice.pk:06d}'

    invoice.issued_at = timezone.now()
    invoice.status = Invoice.Status.ISSUED
    invoice.save(update_fields=['invoice_number', 'cai', 'fiscal_deadline', 'issued_at', 'status', 'updated_at'])
    recalculate_invoice(invoice)

    for line in invoice.lines.select_related('product'):
        register_stock_movement(
            product=line.product,
            warehouse=invoice.warehouse,
            movement_type=StockMovement.MovementType.SALE,
            quantity=line.quantity,
            unit_cost=line.product.cost,
            reference=invoice.invoice_number,
            notes='Salida por factura emitida',
        )

    create_sales_journal_entry(invoice)
    return invoice


@transaction.atomic
def cancel_invoice(invoice, reason='Anulacion de factura'):
    invoice = Invoice.objects.select_for_update().prefetch_related('lines__product').get(pk=invoice.pk)
    if invoice.status == Invoice.Status.CANCELLED:
        return invoice
    if invoice.status == Invoice.Status.DRAFT:
        invoice.status = Invoice.Status.CANCELLED
        invoice.notes = f'{invoice.notes}\n{reason}'.strip()
        invoice.save(update_fields=['status', 'notes', 'updated_at'])
        return invoice

    for line in invoice.lines.select_related('product'):
        register_stock_movement(
            product=line.product,
            warehouse=invoice.warehouse,
            movement_type=StockMovement.MovementType.ADJUSTMENT,
            quantity=line.quantity,
            unit_cost=line.product.cost,
            reference=f'ANULA-{invoice.invoice_number}',
            notes=f'Reversa por anulacion. {reason}',
        )

    invoice.status = Invoice.Status.CANCELLED
    invoice.notes = f'{invoice.notes}\n{reason}'.strip()
    invoice.save(update_fields=['status', 'notes', 'updated_at'])

    reversal = JournalEntry.objects.create(
        date=timezone.localdate(),
        description=f'Anulacion factura {invoice.invoice_number}',
        reference=f'ANULA-{invoice.invoice_number}',
        source='billing-cancel',
    )
    cash = get_or_create_account('1101', 'Caja y bancos', Account.AccountType.ASSET)
    sales = get_or_create_account('4101', 'Ingresos por ventas', Account.AccountType.REVENUE)
    tax_payable = get_or_create_account('2101', 'Impuesto sobre ventas por pagar', Account.AccountType.LIABILITY)
    JournalLine.objects.bulk_create(
        [
            JournalLine(entry=reversal, account=sales, debit=invoice.subtotal - invoice.discount_total, credit=0),
            JournalLine(entry=reversal, account=tax_payable, debit=invoice.tax_total, credit=0),
            JournalLine(entry=reversal, account=cash, debit=0, credit=invoice.total),
        ]
    )
    return invoice


def refresh_invoice_payment_status(invoice):
    paid_total = invoice.payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    if invoice.status in [Invoice.Status.ISSUED, Invoice.Status.PAID]:
        invoice.status = Invoice.Status.PAID if paid_total >= invoice.total else Invoice.Status.ISSUED
        invoice.save(update_fields=['status', 'updated_at'])
    return invoice
