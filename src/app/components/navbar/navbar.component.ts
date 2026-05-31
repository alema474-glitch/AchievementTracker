import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FriendsService } from '../../services/friends.service';
import { NotificationsService } from '../../services/notifications.service';
import { Database, get, ref } from '@angular/fire/database';
import { ToastInsigniaComponent } from "../toast-insignia/toast-insignia.component";
import { ToastNotificationComponent } from "../toast-notification/toast-notification.component";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterOutlet, RouterLinkWithHref, CommonModule, ToastInsigniaComponent, ToastNotificationComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit, OnDestroy {
  userAuth: any | null = null;
  userUid: string = '';
  username: string = '';
  createdAt: Date | null = null;
  pendingRequests: number = 0;
  routeAnimating = signal(false);
  private _animTimer: any;

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private db: Database,
    private friendsService: FriendsService,
    public notifService: NotificationsService
  ) {}

  ngOnInit(): void {
    // Route transition for child outlet only
    const sRoute = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        this.routeAnimating.set(false);
      }
      if (ev instanceof NavigationEnd || ev instanceof NavigationCancel || ev instanceof NavigationError) {
        clearTimeout(this._animTimer);
        this.routeAnimating.set(true);
        this._animTimer = setTimeout(() => this.routeAnimating.set(false), 400);
      }
    });
    this.subs.push(sRoute);

    const s1 = this.auth.getUserWithProfile().subscribe((user: any | null) => {
      this.userAuth = user;
      if (user) {
        this.userUid = user.uid;
        this.username = user.username || 'Usuario';
        this.loadLibraryData();
        this.watchPendingRequests();
        this.notifService.init();
      }
    });
    this.subs.push(s1);
  }

  ngOnDestroy(): void {
    clearTimeout(this._animTimer);
    this.subs.forEach(s => s.unsubscribe());
    this.notifService.destroy();
  }

  private watchPendingRequests() {
    const s = this.friendsService.getIncomingRequests().subscribe(reqs => {
      this.pendingRequests = reqs.length;
    });
    this.subs.push(s);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/welcome']);
  }

  async loadLibraryData() {
    const libraryRef = ref(this.db, 'library/' + this.userUid);
    const snapshot = await get(libraryRef);
    if (snapshot.exists()) {
      const data: any = snapshot.val();
      if (data.createdAt) this.createdAt = new Date(data.createdAt);
    }
  }

  markAllRead() { this.notifService.markAllRead(); }
}
