from django.contrib import admin

from .models import ProductivityGoal, ProductivityMetric, ProductivityRecord


@admin.register(ProductivityMetric)
class ProductivityMetricAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(ProductivityGoal)
class ProductivityGoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'metric', 'target_value', 'starts_on', 'ends_on')
    search_fields = ('name', 'metric__name')
    list_filter = ('metric',)


@admin.register(ProductivityRecord)
class ProductivityRecordAdmin(admin.ModelAdmin):
    list_display = ('recorded_on', 'metric', 'value', 'employee_name')
    search_fields = ('metric__name', 'employee_name')
    list_filter = ('metric',)
