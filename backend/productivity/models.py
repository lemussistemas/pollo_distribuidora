from django.db import models


class ProductivityMetric(models.Model):
    name = models.CharField(max_length=120, unique=True)
    unit = models.CharField(max_length=40, default='unidad')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductivityGoal(models.Model):
    metric = models.ForeignKey(ProductivityMetric, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=140)
    target_value = models.DecimalField(max_digits=12, decimal_places=2)
    starts_on = models.DateField()
    ends_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-starts_on']

    def __str__(self):
        return f'{self.name} - {self.target_value} {self.metric.unit}'


class ProductivityRecord(models.Model):
    metric = models.ForeignKey(ProductivityMetric, on_delete=models.PROTECT, related_name='records')
    recorded_on = models.DateField()
    value = models.DecimalField(max_digits=12, decimal_places=2)
    employee_name = models.CharField(max_length=140, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_on', '-created_at']

    def __str__(self):
        return f'{self.recorded_on} - {self.metric}: {self.value}'
