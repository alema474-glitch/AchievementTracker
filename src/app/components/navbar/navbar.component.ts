import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, Router } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FriendsService } from '../../services/friends.service';
import { Database, get, ref } from '@angular/fire/database';
import { ToastInsigniaComponent } from "../toast-insignia/toast-insignia.component";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterOutlet, RouterLinkWithHref, CommonModule, ToastInsigniaComponent],
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

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private db: Database,
    private friendsService: FriendsService
  ) {}

  ngOnInit(): void {
    const s1 = this.auth.getUserWithProfile().subscribe((user: any | null) => {
      this.userAuth = user;
      if (user) {
        this.userUid = user.uid;
        this.username = user.username || 'Usuario';
        this.loadLibraryData();
        this.watchPendingRequests();
      }
    });
    this.subs.push(s1);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
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

  navigateToProfileEdit() {
    this.router.navigate(['/nav/profile/edit']);
    // close offcanvas
    const el = document.getElementById('offcanvasPerfil');
    if (el) {
      const bsOffcanvas = (window as any)?.bootstrap?.Offcanvas?.getInstance?.(el);
      bsOffcanvas?.hide();
    }
  }

  async loadLibraryData() {
    const libraryRef = ref(this.db, 'library/' + this.userUid);
    const snapshot = await get(libraryRef);
    if (snapshot.exists()) {
      const data: any = snapshot.val();
      if (data.createdAt) {
        this.createdAt = new Date(data.createdAt);
      }
    }
  }
}
