from rest_framework import serializers

from .models import ProductivityGoal, ProductivityMetric, ProductivityRecord


class ProductivityMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductivityMetric
        fields = '__all__'


class ProductivityGoalSerializer(serializers.ModelSerializer):
    metric_name = serializers.CharField(source='metric.name', read_only=True)

    class Meta:
        model = ProductivityGoal
        fields = '__all__'


class ProductivityRecordSerializer(serializers.ModelSerializer):
    metric_name = serializers.CharField(source='metric.name', read_only=True)
    metric_unit = serializers.CharField(source='metric.unit', read_only=True)

    class Meta:
        model = ProductivityRecord
        fields = '__all__'
