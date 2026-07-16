from django.shortcuts import render
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from rest_framework import decorators, response

from accounting.models import Account, JournalLine
from billing.models import Invoice, InvoiceLine
from inventory.models import StockLevel, StockMovement
from productivity.models import ProductivityRecord


def date_filters(request, field_name):
    filters = {}
    start = request.query_params.get('from')
    end = request.query_params.get('to')
    if start:
        filters[f'{field_name}__gte'] = start
    if end:
        filters[f'{field_name}__lte'] = end
    return filters


@decorators.api_view(['GET'])
def sales_summary(request):
    filters = date_filters(request, 'issued_at__date')
    invoices = Invoice.objects.filter(status__in=[Invoice.Status.ISSUED, Invoice.Status.PAID], **filters)
    totals = invoices.aggregate(
        subtotal=Sum('subtotal'),
        tax_total=Sum('tax_total'),
        discount_total=Sum('discount_total'),
        total=Sum('total'),
    )
    return response.Response(
        {
            'invoice_count': invoices.count(),
            'subtotal': totals['subtotal'] or 0,
            'tax_total': totals['tax_total'] or 0,
            'discount_total': totals['discount_total'] or 0,
            'total': totals['total'] or 0,
        }
    )


@decorators.api_view(['GET'])
def inventory_summary(request):
    stock = StockLevel.objects.select_related('product', 'warehouse')
    low_stock = stock.filter(quantity__lte=F('product__minimum_stock'))
    movement_filters = date_filters(request, 'created_at__date')
    movement_count = StockMovement.objects.filter(**movement_filters).count()
    return response.Response(
        {
            'product_count': stock.values('product').distinct().count(),
            'warehouse_count': stock.values('warehouse').distinct().count(),
            'movement_count': movement_count,
            'low_stock_count': low_stock.count(),
            'low_stock': [
                {
                    'product': item.product.name,
                    'sku': item.product.sku,
                    'warehouse': item.warehouse.name,
                    'quantity': item.quantity,
                    'minimum_stock': item.product.minimum_stock,
                }
                for item in low_stock[:20]
            ],
        }
    )


@decorators.api_view(['GET'])
def productivity_summary(request):
    filters = date_filters(request, 'recorded_on')
    records = ProductivityRecord.objects.filter(**filters).select_related('metric')
    totals = records.values('metric__name', 'metric__unit').annotate(total=Sum('value')).order_by('metric__name')
    return response.Response({'metrics': list(totals)})


@decorators.api_view(['GET'])
def income_statement(request):
    filters = date_filters(request, 'invoice__issued_at__date')
    lines = InvoiceLine.objects.filter(
        invoice__status__in=[Invoice.Status.ISSUED, Invoice.Status.PAID],
        **filters,
    ).select_related('product')
    cost_expression = ExpressionWrapper(
        F('quantity') * F('product__cost'),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    totals = lines.aggregate(
        revenue=Sum('line_total'),
        cost_of_goods_sold=Sum(cost_expression),
    )
    revenue = totals['revenue'] or 0
    cost_of_goods_sold = totals['cost_of_goods_sold'] or 0
    expense_filters = date_filters(request, 'entry__date')
    operating_expenses = (
        JournalLine.objects.filter(account__account_type=Account.AccountType.EXPENSE, **expense_filters)
        .aggregate(total=Sum('debit'))['total']
        or 0
    )
    gross_profit = revenue - cost_of_goods_sold
    return response.Response(
        {
            'revenue': revenue,
            'cost_of_goods_sold': cost_of_goods_sold,
            'gross_profit': gross_profit,
            'operating_expenses': operating_expenses,
            'net_income': gross_profit - operating_expenses,
        }
    )


@decorators.api_view(['GET'])
def sales_by_product(request):
    filters = date_filters(request, 'invoice__issued_at__date')
    rows = (
        InvoiceLine.objects.filter(invoice__status__in=[Invoice.Status.ISSUED, Invoice.Status.PAID], **filters)
        .values('product__sku', 'product__name')
        .annotate(quantity=Sum('quantity'), total=Sum('line_total'))
        .order_by('-total')
    )
    return response.Response({'results': list(rows)})


@decorators.api_view(['GET'])
def sales_by_customer(request):
    filters = date_filters(request, 'issued_at__date')
    rows = (
        Invoice.objects.filter(status__in=[Invoice.Status.ISSUED, Invoice.Status.PAID], **filters)
        .values('customer__name', 'customer__rtn')
        .annotate(invoice_count=Count('id'), total=Sum('total'))
        .order_by('-total')
    )
    return response.Response({'results': list(rows)})


@decorators.api_view(['GET'])
def inventory_movements(request):
    filters = date_filters(request, 'created_at__date')
    rows = (
        StockMovement.objects.filter(**filters)
        .select_related('product', 'warehouse')
        .values('movement_type', 'product__sku', 'product__name', 'warehouse__name')
        .annotate(quantity=Sum('quantity'))
        .order_by('movement_type', 'product__name')
    )
    return response.Response({'results': list(rows)})


@decorators.api_view(['GET'])
def trial_balance(request):
    filters = date_filters(request, 'entry__date')
    rows = (
        JournalLine.objects.filter(**filters)
        .values('account__code', 'account__name', 'account__account_type')
        .annotate(debit=Sum('debit'), credit=Sum('credit'))
        .order_by('account__code')
    )
    return response.Response({'results': list(rows)})
