import { Component, inject, signal, effect, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommunicationService, Conversation, Message } from '../../core/services/communication-service';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messagerie.html',
  styleUrl: './messagerie.css'
})
export class Messagerie {
  private readonly communicationService = inject(CommunicationService);
  private readonly authService = inject(AuthService);

  listeConversations = signal<Conversation[]>([]);
  conversationActive = signal<Conversation | null>(null);
  listeMessages = signal<Message[]>([]);
  utilisateurs = signal<any[]>([]); 
  moi = signal<any>(null);
  nouveauMessage = signal('');
  afficherNouveauChatModal = signal(false);
  afficherParticipantsModal = signal(false);
  repondreA = signal<Message | null>(null);
  recherche = signal('');

  conversationsFiltrees = computed(() => {
    const terme = this.recherche().toLowerCase().trim();
    const convs = this.listeConversations();
    if (!terme) return convs;

    return convs.filter(c => {
      // Rechercher dans le titre du projet si c'est une conv de projet
      if (c.type === 'PROJET' && c.project_title?.toLowerCase().includes(terme)) return true;
      
      // Rechercher dans les noms des participants
      const matchParticipant = c.participants_details?.some(p => 
        p.prenom.toLowerCase().includes(terme) || 
        p.nom.toLowerCase().includes(terme) || 
        p.username.toLowerCase().includes(terme)
      );
      if (matchParticipant) return true;

      // Rechercher dans le dernier message
      if (c.last_message?.contenu.toLowerCase().includes(terme)) return true;

      return false;
    });
  });

  baseMedia = 'http://127.0.0.1:8000';
  private intervalleRecuperation: any;

  @ViewChild('scrollContainer') private conteneurDefilement!: ElementRef;

  constructor() {
    effect(() => {
      if (this.listeMessages().length > 0) {
        setTimeout(() => this.defilerVersLeBas(), 100);
      }
    });
  }

  ngOnInit() {
    this.authService.getMe().subscribe(utilisateur => this.moi.set(utilisateur));
    this.chargerConversations();
    this.chargerUtilisateurs();

    this.intervalleRecuperation = setInterval(() => {
      this.chargerConversations();
      const active = this.conversationActive();
      if (active) {
        this.chargerMessages(active.id);
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.intervalleRecuperation) {
      clearInterval(this.intervalleRecuperation);
    }
  }

  chargerConversations() {
    this.communicationService.getConversations().subscribe(convs => {
      this.listeConversations.set(convs);
    });
  }

  chargerUtilisateurs() {
    this.authService.listUsers().subscribe(utilisateurs => {
      this.utilisateurs.set(utilisateurs.filter(u => u.id !== this.moi()?.id));
    });
  }

  demarrerDiscussion(utilisateur: any) {
    const existante = this.listeConversations().find(c => 
      c.type === 'PRIVE' && c.participants.includes(utilisateur.id)
    );

    if (existante) {
      this.selectionnerConversation(existante);
      this.afficherNouveauChatModal.set(false);
    } else {
      this.communicationService.createConversation({
        type: 'PRIVE',
        participants: [this.moi().id, utilisateur.id]
      }).subscribe(conv => {
        this.chargerConversations();
        this.selectionnerConversation(conv);
        this.afficherNouveauChatModal.set(false);
      });
    }
  }

  selectionnerConversation(conv: Conversation) {
    this.conversationActive.set(conv);
    this.chargerMessages(conv.id);
  }

  chargerMessages(convId: number) {
    this.communicationService.getMessages(convId).subscribe(msgs => {
      this.listeMessages.set(msgs);
    });
  }

  envoyer() {
    const contenu = this.nouveauMessage().trim();
    const conv = this.conversationActive();
    if (!contenu || !conv) return;

    const parentId = this.repondreA()?.id;

    this.communicationService.sendMessage(conv.id, contenu, parentId).subscribe(msg => {
      this.listeMessages.update(prev => [...prev, msg]);
      this.nouveauMessage.set('');
      this.repondreA.set(null);
      this.chargerConversations(); 
    });
  }

  definirReponseA(message: Message) {
    this.repondreA.set(message);
  }

  annulerReponse() {
    this.repondreA.set(null);
  }

  reagir(message: Message, emoji: string) {
    this.communicationService.reactToMessage(message.id, emoji).subscribe(() => {
      this.chargerConversations(); 
      const active = this.conversationActive();
      if (active) {
        this.chargerMessages(active.id);
      }
    });
  }

  obtenirAutreParticipant(conv: Conversation) {
    if (!this.moi()) return null;
    if (conv.type === 'PROJET') return null;
    return conv.participants_details?.find(p => p.id !== this.moi().id);
  }

  obtenirTitreConversation(conv: Conversation) {
    if (conv.type === 'PROJET') {
      return conv.project_title || 'Groupe Projet';
    }
    return this.obtenirAutreParticipant(conv)?.username || 'Conversation';
  }

  obtenirAvatarConversation(conv: Conversation) {
    if (conv.type === 'PROJET') {
      return 'https://ui-avatars.com/api/?name=' + (conv.project_title || 'P') + '&background=6366f1&color=fff';
    }
    const autre = this.obtenirAutreParticipant(conv);
    return autre?.photo ? (autre.photo.startsWith('http') ? autre.photo : this.baseMedia + autre.photo) : 'https://i.pravatar.cc/100?u=' + conv.id;
  }

  private defilerVersLeBas(): void {
    try {
      this.conteneurDefilement.nativeElement.scrollTop = this.conteneurDefilement.nativeElement.scrollHeight;
    } catch(err) {}
  }
}
