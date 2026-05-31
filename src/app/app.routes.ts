import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { GamesComponent } from './components/games/games.component';
import { MedalsComponent } from './components/medals/medals.component';
import { DetailsComponent } from './components/games/details/details.component';
import { AddComponent } from './components/games/add/add.component';
import { AdminGamesComponent } from './components/admin-games/admin-games.component';
import { AdminMedalsComponent } from './components/admin-medals/admin-medals.component';
import { AdminGamesAddComponent } from './components/admin-games-add/admin-games-add.component';
import { roleGuard } from './guards/role.guard';
import { AdminMedalsAddComponent } from './components/admin-medals-add/admin-medals-add.component';
import { CompleteProfileComponent } from './components/auth/complete-profile/complete-profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FriendsComponent } from './components/friends/friends.component';
import { FriendProfileComponent } from './components/friends/friend-profile/friend-profile.component';
import { CompareComponent } from './components/friends/compare/compare.component';
import { RankingComponent } from './components/friends/ranking/ranking.component';
import { ChatComponent } from './components/friends/chat/chat.component';
import { FeedComponent } from './components/feed/feed.component';
import { ChallengesComponent } from './components/challenges/challenges.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent },
  {
    path: 'nav', component: NavbarComponent, children: [
      { path: 'home',    component: HomeComponent,   canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'games',   component: GamesComponent,  canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'games/details/:id', component: DetailsComponent, canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'games/add', component: AddComponent,  canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'medals',  component: MedalsComponent, canActivate: [roleGuard], data: { roles: ['USER'] } },

      // ── Profile ─────────────────────────────────────────────────────────────
      { path: 'profile',      component: ProfileComponent,    canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'profile/edit', component: ProfileEditComponent, canActivate: [roleGuard], data: { roles: ['USER'] } },

      // ── Social ───────────────────────────────────────────────────────────────
      { path: 'friends',                  component: FriendsComponent,       canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'friends/profile/:uid',     component: FriendProfileComponent, canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'friends/compare/:uid',     component: CompareComponent,       canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'friends/ranking',          component: RankingComponent,       canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'friends/chat/:uid',        component: ChatComponent,          canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'feed',                     component: FeedComponent,          canActivate: [roleGuard], data: { roles: ['USER'] } },
      { path: 'challenges',               component: ChallengesComponent,    canActivate: [roleGuard], data: { roles: ['USER'] } },

      // ── Admin ────────────────────────────────────────────────────────────────
      { path: 'admin-games',     component: AdminGamesComponent,    canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin-medals',    component: AdminMedalsComponent,   canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin-games-add', component: AdminGamesAddComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin-medal-add', component: AdminMedalsAddComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
    ]
  },
  { path: 'login',            component: LoginComponent },
  { path: 'signin',           component: SigninComponent },
  { path: 'complete-profile', component: CompleteProfileComponent },
];
