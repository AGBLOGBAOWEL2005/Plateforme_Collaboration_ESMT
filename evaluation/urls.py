from django.urls import path
from .views import StatsPrimesView

urlpatterns = [
    path('primes/', StatsPrimesView.as_view(), name='stats-primes'),
]
