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

    def validate(self, attrs):
        starts_on = attrs.get('starts_on', getattr(self.instance, 'starts_on', None))
        ends_on = attrs.get('ends_on', getattr(self.instance, 'ends_on', None))
        if starts_on and ends_on and ends_on < starts_on:
            raise serializers.ValidationError('La fecha final de la meta debe ser mayor o igual a la fecha inicial.')
        return attrs


class ProductivityRecordSerializer(serializers.ModelSerializer):
    metric_name = serializers.CharField(source='metric.name', read_only=True)
    metric_unit = serializers.CharField(source='metric.unit', read_only=True)

    class Meta:
        model = ProductivityRecord
        fields = '__all__'
