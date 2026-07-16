from django.shortcuts import render
from rest_framework import viewsets

from .models import ProductivityGoal, ProductivityMetric, ProductivityRecord
from .serializers import (
    ProductivityGoalSerializer,
    ProductivityMetricSerializer,
    ProductivityRecordSerializer,
)


class ProductivityMetricViewSet(viewsets.ModelViewSet):
    queryset = ProductivityMetric.objects.all()
    serializer_class = ProductivityMetricSerializer


class ProductivityGoalViewSet(viewsets.ModelViewSet):
    queryset = ProductivityGoal.objects.select_related('metric').all()
    serializer_class = ProductivityGoalSerializer


class ProductivityRecordViewSet(viewsets.ModelViewSet):
    queryset = ProductivityRecord.objects.select_related('metric').all()
    serializer_class = ProductivityRecordSerializer
