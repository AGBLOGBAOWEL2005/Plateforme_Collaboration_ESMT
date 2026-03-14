from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, RegisterView, SessionLoginView, MeView

router = DefaultRouter()
router.register('users', UtilisateurViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('session-login/', SessionLoginView.as_view(), name='session-login'),
    path('me/', MeView.as_view(), name='me'),
]
