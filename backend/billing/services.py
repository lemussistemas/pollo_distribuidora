from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone

from accounting.models import Account, JournalEntry, JournalLine
from inventory.models import StockMovement
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


@transaction.atomic
def issue_invoice(invoice):
    invoice = Invoice.objects.select_for_update().prefetch_related('lines__product').get(pk=invoice.pk)
    if invoice.status != Invoice.Status.DRAFT:
        return invoice

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
