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
    if (n.type === 'message') this.router.navigate(['/nav/friends/chat', n.fromUid]);
    else if (n.type === 'friend_accept') this.router.navigate(['/nav/friends']);
  }

  getIcon(type: string): string {
    return type === 'message' ? 'bi-chat-dots-fill' : 'bi-person-check-fill';
  }
  getLabel(type: string): string {
    return type === 'message' ? 'Nuevo mensaje' : 'Solicitud aceptada';
  }
  getColor(type: string): string {
    return type === 'message' ? '#34d399' : 'var(--accent-soft)';
  }
}
