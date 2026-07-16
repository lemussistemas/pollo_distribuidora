from django.shortcuts import render
from django.db.models import Sum
from rest_framework import decorators, response, viewsets

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

    @decorators.action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        goal = self.get_object()
        total = (
            ProductivityRecord.objects.filter(
                metric=goal.metric,
                recorded_on__gte=goal.starts_on,
                recorded_on__lte=goal.ends_on,
            ).aggregate(total=Sum('value'))['total']
            or 0
        )
        percent = 0 if not goal.target_value else min((total / goal.target_value) * 100, 100)
        return response.Response(
            {
                'goal': goal.name,
                'metric': goal.metric.name,
                'target_value': goal.target_value,
                'current_value': total,
                'percent': percent,
            }
        )


class ProductivityRecordViewSet(viewsets.ModelViewSet):
    queryset = ProductivityRecord.objects.select_related('metric').all()
    serializer_class = ProductivityRecordSerializer
