from rest_framework.routers import DefaultRouter

from .views import CaiRangeViewSet, CustomerViewSet, InvoiceViewSet, PaymentViewSet

router = DefaultRouter()
router.register('customers', CustomerViewSet)
router.register('cai-ranges', CaiRangeViewSet)
router.register('invoices', InvoiceViewSet)
router.register('payments', PaymentViewSet)

urlpatterns = router.urls
