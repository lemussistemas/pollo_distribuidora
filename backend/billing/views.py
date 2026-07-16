from django.shortcuts import render
from rest_framework import decorators, response, status, viewsets
from rest_framework.exceptions import ValidationError

from .models import CaiRange, Customer, Invoice, Payment
from .serializers import CaiRangeSerializer, CustomerSerializer, InvoiceSerializer, PaymentSerializer
from .services import cancel_invoice, issue_invoice, refresh_invoice_payment_status


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ['name', 'rtn', 'phone']


class CaiRangeViewSet(viewsets.ModelViewSet):
    queryset = CaiRange.objects.all()
    serializer_class = CaiRangeSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('customer', 'warehouse', 'cai_range').prefetch_related(
        'lines__product',
        'payments',
    )
    serializer_class = InvoiceSerializer

    def perform_destroy(self, instance):
        if instance.status != Invoice.Status.DRAFT:
            raise ValidationError('Solo se pueden eliminar facturas en borrador.')
        instance.delete()

    @decorators.action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        invoice = issue_invoice(self.get_object())
        serializer = self.get_serializer(invoice)
        return response.Response(serializer.data, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invoice = cancel_invoice(self.get_object(), request.data.get('reason', 'Anulacion manual'))
        serializer = self.get_serializer(invoice)
        return response.Response(serializer.data, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        invoice = self.get_object()
        payment = Payment.objects.create(
            invoice=invoice,
            amount=request.data.get('amount', invoice.total),
            method=request.data.get('method', Payment.Method.CASH),
            reference=request.data.get('reference', ''),
        )
        refresh_invoice_payment_status(invoice)
        serializer = PaymentSerializer(payment)
        return response.Response(serializer.data, status=status.HTTP_201_CREATED)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice').all()
    serializer_class = PaymentSerializer
