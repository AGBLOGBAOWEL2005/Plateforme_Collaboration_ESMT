from rest_framework.routers import DefaultRouter
from .views import ProjetViewSet, TacheViewSet, DocumentProjetViewSet

router = DefaultRouter()
router.register(r'projets', ProjetViewSet, basename='projet')
router.register(r'taches', TacheViewSet, basename='tache')
router.register(r'documents', DocumentProjetViewSet, basename='document')

urlpatterns = router.urls