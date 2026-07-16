from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounting.models import Account, JournalEntry, JournalLine
from billing.models import CaiRange, Customer
from catalog.models import Category, Product, Unit
from core.models import CompanyProfile
from inventory.models import StockLevel, Warehouse
from productivity.models import ProductivityGoal, ProductivityMetric, ProductivityRecord


class Command(BaseCommand):
    help = 'Crea datos demo confiables para presentar el ERP Pollo Rey.'

    def handle(self, *args, **options):
        User = get_user_model()
        user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@pollorey.local', 'first_name': 'Administrador', 'is_staff': True, 'is_superuser': True},
        )
        user.set_password('PolloRey2026')
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()

        CompanyProfile.objects.update_or_create(
            pk=1,
            defaults={
                'name': 'Distribuidora Pollo Rey',
                'rtn': '08011990123456',
                'address': 'Olanchito, Yoro, Honduras',
                'phone': '9999-0000',
                'email': 'ventas@pollorey.local',
                'default_tax_rate': 15,
                'currency': 'HNL',
            },
        )

        unit, _ = Unit.objects.get_or_create(name='Libra', defaults={'abbreviation': 'lb'})
        category, _ = Category.objects.get_or_create(name='Pollo fresco', defaults={'description': 'Productos avicolas para venta diaria'})
        warehouse, _ = Warehouse.objects.get_or_create(name='Bodega Olanchito', defaults={'location': 'Olanchito, Yoro'})
        Customer.objects.get_or_create(
            name='Pulperia El Centro',
            defaults={'rtn': '08011990123456', 'customer_type': 'retail', 'phone': '9999-0000', 'address': 'Olanchito, Yoro'},
        )
        CaiRange.objects.get_or_create(
            cai='DEMO-CAI-POLLO-REY',
            defaults={
                'establishment': '000',
                'emission_point': '001',
                'document_type': '01',
                'start_number': 1,
                'end_number': 99999999,
                'current_number': 1,
                'authorization_date': date.today(),
                'expiration_date': date.today() + timedelta(days=365),
                'is_active': True,
            },
        )

        products = [
            {'sku': 'PR-001', 'name': 'Pollo entero fresco', 'cost': '45.00', 'retail_price': '72.00', 'wholesale_price': '65.00', 'minimum_stock': '25.000'},
            {'sku': 'PR-002', 'name': 'Pechuga de pollo', 'cost': '58.00', 'retail_price': '92.00', 'wholesale_price': '84.00', 'minimum_stock': '20.000'},
            {'sku': 'PR-003', 'name': 'Muslo de pollo', 'cost': '38.00', 'retail_price': '62.00', 'wholesale_price': '56.00', 'minimum_stock': '20.000'},
            {'sku': 'PR-004', 'name': 'Alitas de pollo', 'cost': '35.00', 'retail_price': '58.00', 'wholesale_price': '52.00', 'minimum_stock': '15.000'},
        ]
        for item in products:
            product, _ = Product.objects.get_or_create(sku=item['sku'], defaults={**item, 'category': category, 'unit': unit})
            StockLevel.objects.update_or_create(product=product, warehouse=warehouse, defaults={'quantity': '150.000'})

        accounts_data = [
            ('1101', 'Caja y bancos', 'asset'),
            ('1201', 'Inventario de pollo', 'asset'),
            ('2101', 'Impuesto sobre ventas por pagar', 'liability'),
            ('3101', 'Capital propietario', 'equity'),
            ('4101', 'Ingresos por ventas', 'revenue'),
            ('5101', 'Costo de ventas', 'cost'),
            ('6101', 'Gastos operativos', 'expense'),
        ]
        accounts = {}
        for code, name, account_type in accounts_data:
            account, _ = Account.objects.get_or_create(code=code, defaults={'name': name, 'account_type': account_type})
            accounts[code] = account
        entry, created = JournalEntry.objects.get_or_create(
            reference='APERTURA-OLANCHITO',
            defaults={'date': date.today(), 'description': 'Apertura contable Distribuidora Pollo Rey', 'source': 'demo'},
        )
        if created:
            JournalLine.objects.bulk_create(
                [
                    JournalLine(entry=entry, account=accounts['1101'], debit='25000.00', credit='0.00', memo='Capital inicial'),
                    JournalLine(entry=entry, account=accounts['3101'], debit='0.00', credit='25000.00', memo='Aporte inicial'),
                ]
            )

        metrics = {}
        for name, unit_name in [('Libras despachadas', 'lb'), ('Pedidos preparados', 'pedidos'), ('Clientes atendidos', 'clientes')]:
            metric, _ = ProductivityMetric.objects.get_or_create(name=name, defaults={'unit': unit_name})
            metrics[name] = metric
        ProductivityGoal.objects.get_or_create(
            metric=metrics['Libras despachadas'],
            name='Meta semanal de despacho',
            starts_on=date.today(),
            ends_on=date.today() + timedelta(days=6),
            defaults={'target_value': '1200.00'},
        )
        ProductivityRecord.objects.get_or_create(
            metric=metrics['Libras despachadas'],
            recorded_on=date.today(),
            value='420.00',
            employee_name='Carlos Mejia',
            notes='Ruta centro',
        )

        self.stdout.write(self.style.SUCCESS('Demo lista: usuario admin / PolloRey2026 y datos comerciales creados.'))
