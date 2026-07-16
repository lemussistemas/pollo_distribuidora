from rest_framework.routers import DefaultRouter

from .views import ProductivityGoalViewSet, ProductivityMetricViewSet, ProductivityRecordViewSet

router = DefaultRouter()
router.register('productivity-metrics', ProductivityMetricViewSet)
router.register('productivity-goals', ProductivityGoalViewSet)
router.register('productivity-records', ProductivityRecordViewSet)

urlpatterns = router.urls
