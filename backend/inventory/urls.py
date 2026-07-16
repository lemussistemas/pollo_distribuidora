from rest_framework.routers import DefaultRouter

from .views import StockLevelViewSet, StockMovementViewSet, WarehouseViewSet

router = DefaultRouter()
router.register('warehouses', WarehouseViewSet)
router.register('stock-levels', StockLevelViewSet)
router.register('stock-movements', StockMovementViewSet)

urlpatterns = router.urls
