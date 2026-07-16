from django.contrib import admin

from .models import CompanyProfile


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'rtn', 'phone', 'currency', 'default_tax_rate')
