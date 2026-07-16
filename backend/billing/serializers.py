from rest_framework import serializers

from .models import CaiRange, Customer, Invoice, InvoiceLine, Payment
from .services import recalculate_invoice, refresh_invoice_payment_status


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class CaiRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaiRange
        fields = '__all__'


class InvoiceLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = InvoiceLine
        fields = '__all__'
        read_only_fields = ('invoice', 'line_total')


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

    def create(self, validated_data):
        payment = Payment.objects.create(**validated_data)
        refresh_invoice_payment_status(payment.invoice)
        return payment


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    lines = InvoiceLineSerializer(many=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = (
            'invoice_number',
            'cai',
            'fiscal_deadline',
            'issued_at',
            'subtotal',
            'discount_total',
            'tax_total',
            'total',
        )

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        invoice = Invoice.objects.create(**validated_data)
        for line_data in lines_data:
            InvoiceLine.objects.create(invoice=invoice, **line_data)
        recalculate_invoice(invoice)
        return invoice

    def update(self, instance, validated_data):
        if instance.status != Invoice.Status.DRAFT:
            raise serializers.ValidationError('Solo se pueden editar facturas en borrador.')
        lines_data = validated_data.pop('lines', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for line_data in lines_data:
                InvoiceLine.objects.create(invoice=instance, **line_data)
        recalculate_invoice(instance)
        return instance
