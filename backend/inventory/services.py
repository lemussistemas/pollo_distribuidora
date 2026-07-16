from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import StockLevel, StockMovement


OUTBOUND_TYPES = {
    StockMovement.MovementType.SALE,
    StockMovement.MovementType.TRANSFER_OUT,
}


@transaction.atomic
def register_stock_movement(*, product, warehouse, movement_type, quantity, unit_cost=0, reference='', notes=''):
    movement = StockMovement.objects.create(
        product=product,
        warehouse=warehouse,
        movement_type=movement_type,
        quantity=quantity,
        unit_cost=unit_cost,
        reference=reference,
        notes=notes,
    )
    stock_level, _ = StockLevel.objects.select_for_update().get_or_create(
        product=product,
        warehouse=warehouse,
        defaults={'quantity': 0},
    )
    signed_quantity = -quantity if movement_type in OUTBOUND_TYPES else quantity
    if stock_level.quantity + signed_quantity < 0:
        raise ValidationError(
            {
                'quantity': (
                    f'Stock insuficiente para {product.name} en {warehouse.name}. '
                    f'Disponible: {stock_level.quantity}, solicitado: {quantity}.'
                )
            }
        )
    stock_level.quantity += signed_quantity
    stock_level.save(update_fields=['quantity', 'updated_at'])
    return movement
