from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, JournalEntryViewSet

router = DefaultRouter()
router.register('accounts', AccountViewSet)
router.register('journal-entries', JournalEntryViewSet)

urlpatterns = router.urls
