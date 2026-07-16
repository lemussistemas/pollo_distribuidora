from django.shortcuts import render
from rest_framework import viewsets

from .models import StockLevel, StockMovement, Warehouse
from .serializers import StockLevelSerializer, StockMovementSerializer, WarehouseSerializer
from .services import register_stock_movement


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class StockLevelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLevel.objects.select_related('product', 'warehouse').all()
    serializer_class = StockLevelSerializer


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('product', 'warehouse').all()
    serializer_class = StockMovementSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data
        serializer.instance = register_stock_movement(
            product=data['product'],
            warehouse=data['warehouse'],
            movement_type=data['movement_type'],
            quantity=data['quantity'],
            unit_cost=data.get('unit_cost', 0),
            reference=data.get('reference', ''),
            notes=data.get('notes', ''),
        )
