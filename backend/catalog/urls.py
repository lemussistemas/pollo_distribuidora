from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet, UnitViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('units', UnitViewSet)
router.register('products', ProductViewSet)

urlpatterns = router.urls
