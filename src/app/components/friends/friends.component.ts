import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FriendsService, Friend, FriendRequest } from '../../services/friends.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-friends',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss'
})
export class FriendsComponent implements OnInit {
  private friendsService = inject(FriendsService);

  activeTab = signal<'friends' | 'search' | 'requests'>('friends');
  friends = signal<Friend[]>([]);
  requests = signal<FriendRequest[]>([]);
  searchResults = signal<any[]>([]);
  searchQuery = signal('');
  loadingFriends = signal(true);
  loadingSearch = signal(false);
  sendingTo = signal<string>('');
  sentTo = signal<Set<string>>(new Set());

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        this.loadingSearch.set(true);
        return this.friendsService.searchUsers(q);
      }),
      takeUntilDestroyed()
    ).subscribe(results => {
      this.searchResults.set(results);
      this.loadingSearch.set(false);
    });
  }

  ngOnInit() {
    this.friendsService.getFriends().subscribe(f => {
      this.friends.set(f);
      this.loadingFriends.set(false);
    });
    this.friendsService.getIncomingRequests().subscribe(r => this.requests.set(r));
  }

  onSearch(q: string) {
    this.searchQuery.set(q);
    if (q.length >= 2) this.searchSubject.next(q);
    else this.searchResults.set([]);
  }

  async sendRequest(uid: string, username: string) {
    this.sendingTo.set(uid);
    try {
      await this.friendsService.sendFriendRequest(uid, username);
      const s = new Set(this.sentTo());
      s.add(uid);
      this.sentTo.set(s);
    } finally {
      this.sendingTo.set('');
    }
  }

  async acceptRequest(fromUid: string) {
    await this.friendsService.acceptRequest(fromUid);
  }

  async rejectRequest(fromUid: string) {
    await this.friendsService.rejectRequest(fromUid);
  }

  async removeFriend(uid: string) {
    await this.friendsService.removeFriend(uid);
  }

  isFriend(uid: string): boolean {
    return this.friends().some(f => f.uid === uid);
  }

  requestCount() {
    return this.requests().length;
  }
}
