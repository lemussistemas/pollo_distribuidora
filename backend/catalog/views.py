from django.shortcuts import render
from rest_framework import viewsets

from .models import Category, Product, Unit
from .serializers import CategorySerializer, ProductSerializer, UnitSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ['name']


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    search_fields = ['name', 'abbreviation']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'unit').all()
    serializer_class = ProductSerializer
    search_fields = ['sku', 'name']
    filterset_fields = ['category', 'is_active']
