from django.urls import path

from . import views

urlpatterns = [
    path('reports/sales/', views.sales_summary, name='sales-summary'),
    path('reports/inventory/', views.inventory_summary, name='inventory-summary'),
    path('reports/productivity/', views.productivity_summary, name='productivity-summary'),
    path('reports/income-statement/', views.income_statement, name='income-statement'),
]
