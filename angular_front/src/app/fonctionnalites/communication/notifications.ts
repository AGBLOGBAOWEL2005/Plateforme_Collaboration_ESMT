import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService, Notification } from '../../core/services/communication-service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications {
  private readonly communicationService = inject(CommunicationService);
  listeNotifications = signal<Notification[]>([]);
  recherche = signal('');

  notificationsFiltrees = computed(() => {
    const terme = this.recherche().toLowerCase().trim();
    if (!terme) return this.listeNotifications();
    return this.listeNotifications().filter(n => 
      n.notification.toLowerCase().includes(terme)
    );
  });

  ngOnInit() {
    this.recupererNotifications();
  }

  recupererNotifications() {
    this.communicationService.getNotifications().subscribe(notifs => {
      this.listeNotifications.set(notifs.sort((a, b) => new Date(b.date_notification).getTime() - new Date(a.date_notification).getTime()));
    });
  }

  marquerCommeLu(n: Notification) {
    if (n.lu) return;
    this.communicationService.markNotificationAsRead(n.id).subscribe(() => {
      this.recupererNotifications();
    });
  }

  supprimerNotification(id: number) {
    if (confirm('Voulez-vous supprimer cette notification ?')) {
      this.communicationService.deleteNotification(id).subscribe(() => {
        this.recupererNotifications();
      });
    }
  }
}
