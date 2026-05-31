import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService, AppNotification } from '../../services/notifications.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-notification',
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.scss'
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationsService);
  private router       = inject(Router);

  toast = signal<AppNotification | null>(null);
  private sub?: Subscription;
  private timer?: any;

  ngOnInit() {
    this.sub = this.notifService.newNotification$.subscribe(n => this.show(n));
  }
  ngOnDestroy() { this.sub?.unsubscribe(); clearTimeout(this.timer); }

  show(n: AppNotification) {
    this.toast.set(n);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.toast.set(null), 6000);
  }

  dismiss() { clearTimeout(this.timer); this.toast.set(null); }

  navigate() {
    const n = this.toast();
    if (!n) return;
    this.dismiss();
    if      (n.type === 'message')      this.router.navigate(['/nav/friends/chat', n.fromUid]);
    else if (n.type === 'friend_accept') this.router.navigate(['/nav/friends']);
    else if (n.type === 'challenge')    this.router.navigate(['/nav/challenges']);
  }

  getIcon(type: string): string {
    if (type === 'message')      return 'bi-chat-dots-fill';
    if (type === 'challenge')    return 'bi-lightning-charge-fill';
    return 'bi-person-check-fill';
  }

  getLabel(type: string): string {
    if (type === 'message')      return 'Nuevo mensaje';
    if (type === 'challenge')    return 'Nuevo reto';
    return 'Solicitud aceptada';
  }

  getColor(type: string): string {
    if (type === 'message')   return '#34d399';
    if (type === 'challenge') return '#f5c542';
    return 'var(--accent-soft)';
  }
}
