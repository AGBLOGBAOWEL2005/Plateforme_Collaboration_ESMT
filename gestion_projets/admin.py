from django.contrib import admin
from .models import Projet, Tache, DocumentProjet

# Register your models here.

admin.site.register(Projet)
admin.site.register(Tache)
admin.site.register(DocumentProjet)

