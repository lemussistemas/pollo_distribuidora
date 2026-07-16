from django.shortcuts import render
from rest_framework import decorators, response, status, viewsets

from .models import CaiRange, Customer, Invoice, Payment
from .serializers import CaiRangeSerializer, CustomerSerializer, InvoiceSerializer, PaymentSerializer
from .services import issue_invoice


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

    @decorators.action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        invoice = issue_invoice(self.get_object())
        serializer = self.get_serializer(invoice)
        return response.Response(serializer.data, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice').all()
    serializer_class = PaymentSerializer
