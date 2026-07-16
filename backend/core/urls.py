from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('company-profile', views.CompanyProfileViewSet)

urlpatterns = [
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/me/', views.me_view, name='auth-me'),
] + router.urls
