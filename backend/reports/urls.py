from django.urls import path

from . import views

urlpatterns = [
    path('reports/sales/', views.sales_summary, name='sales-summary'),
    path('reports/inventory/', views.inventory_summary, name='inventory-summary'),
    path('reports/productivity/', views.productivity_summary, name='productivity-summary'),
    path('reports/income-statement/', views.income_statement, name='income-statement'),
    path('reports/sales-by-product/', views.sales_by_product, name='sales-by-product'),
    path('reports/sales-by-customer/', views.sales_by_customer, name='sales-by-customer'),
    path('reports/inventory-movements/', views.inventory_movements, name='inventory-movements'),
    path('reports/trial-balance/', views.trial_balance, name='trial-balance'),
]
