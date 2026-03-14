
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collaboration_app.settings')
django.setup()

from utilisateur.models import Utilisateur

def update_default_photos():
    users_without_photo = Utilisateur.objects.filter(photo__isnull=True) | Utilisateur.objects.filter(photo='')
    count = users_without_photo.count()
    for user in users_without_photo:
        user.photo = 'profiles/default.webp'
        user.save()
    print(f"Updated {count} users with default profile picture.")

if __name__ == "__main__":
    update_default_photos()
