from django.db import models


class CompanyProfile(models.Model):
    name = models.CharField(max_length=180, default='Distribuidora Pollo Rey')
    rtn = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=240, default='Olanchito, Yoro, Honduras')
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    default_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    currency = models.CharField(max_length=10, default='HNL')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
