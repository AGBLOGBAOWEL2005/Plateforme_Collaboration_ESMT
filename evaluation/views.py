from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from utilisateur.models import Utilisateur
from gestion_projets.models import Tache
from .serializers import EvaluationEnseignantSerializer
from django.db.models import Q, F
from datetime import datetime

class StatsPrimesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        periode = request.query_params.get('periode', 'trimestre')
        trimestre = request.query_params.get('trimestre', None)
        annee = request.query_params.get('annee', timezone.now().year)

        # Filtrer par date
        maintenant = timezone.now()
        date_debut = None
        date_fin = None

        if periode == 'trimestre':
            # T1: Jan-Mar, T2: Avr-Juin, T3: Juil-Sep, T4: Oct-Déc
            if trimestre == 'T1':
                date_debut = datetime(int(annee), 1, 1)
                date_fin = datetime(int(annee), 3, 31, 23, 59, 59)
            elif trimestre == 'T2':
                date_debut = datetime(int(annee), 4, 1)
                date_fin = datetime(int(annee), 6, 30, 23, 59, 59)
            elif trimestre == 'T3':
                date_debut = datetime(int(annee), 7, 1)
                date_fin = datetime(int(annee), 9, 30, 23, 59, 59)
            elif trimestre == 'T4':
                date_debut = datetime(int(annee), 10, 1)
                date_fin = datetime(int(annee), 12, 31, 23, 59, 59)
            else:
                # Par défaut le trimestre actuel
                mois_actuel = maintenant.month
                if 1 <= mois_actuel <= 3:
                    date_debut = datetime(int(annee), 1, 1)
                    date_fin = datetime(int(annee), 3, 31, 23, 59, 59)
                elif 4 <= mois_actuel <= 6:
                    date_debut = datetime(int(annee), 4, 1)
                    date_fin = datetime(int(annee), 6, 30, 23, 59, 59)
                elif 7 <= mois_actuel <= 9:
                    date_debut = datetime(int(annee), 7, 1)
                    date_fin = datetime(int(annee), 9, 30, 23, 59, 59)
                else:
                    date_debut = datetime(int(annee), 10, 1)
                    date_fin = datetime(int(annee), 12, 31, 23, 59, 59)
        else: # annee
            date_debut = datetime(int(annee), 1, 1)
            date_fin = datetime(int(annee), 12, 31, 23, 59, 59)

        # S'assurer que les dates sont conscientes du fuseau horaire
        date_debut = timezone.make_aware(date_debut)
        date_fin = timezone.make_aware(date_fin)

        # Récupérer les enseignants
        enseignants = Utilisateur.objects.filter(role='PROFESSEUR')
        stats = []

        for e in enseignants:
            # Tâches assignées dans cette période
            taches_enseignant = Tache.objects.filter(
                assigned_to=e,
                date_limite__range=(date_debut, date_fin)
            )

            total = taches_enseignant.count()
            # Tâches finies dans les délais : TERMINE et (date_fin_reelle <= date_limite)
            # On suppose que date_fin_reelle est enregistrée lors du passage à TERMINE
            dans_delai = taches_enseignant.filter(
                statut='TERMINE',
                date_fin_reelle__lte=F('date_limite')
            ).count()

            pourcentage = 0
            if total > 0:
                pourcentage = int((dans_delai / total) * 100)

            prime = 0
            commentaire = "Aucune prime"
            if total > 0:
                if pourcentage == 100:
                    prime = 100000
                    commentaire = "Prime Excellence (100%)"
                elif pourcentage >= 90:
                    prime = 30000
                    commentaire = "Prime Performance (90%)"

            stats.append({
                'id': e.id,
                'prenom': e.prenom,
                'nom': e.nom,
                'username': e.username,
                'photo': e.photo if e.photo else None,
                'total_taches': total,
                'dans_delai': dans_delai,
                'pourcentage': pourcentage,
                'prime': prime,
                'commentaire': commentaire
            })

        return Response(stats)
