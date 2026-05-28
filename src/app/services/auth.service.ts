import { inject, Injectable } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { Database, get, ref, update, set } from '@angular/fire/database';
import { Observable, switchMap, of } from 'rxjs';
import { UserRole } from '../models/user.module';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  auth = inject(Auth)
  constructor(private database: Database,) { }

  register(email: string, passwd: string) {
    return createUserWithEmailAndPassword(this.auth, email, passwd);
  }

  login(email: string, passwd: string) {
    return signInWithEmailAndPassword(this.auth, email, passwd);
  }

  logout() {
    signOut(this.auth)
  }

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider())
  }

  getUserAuthenticated(): Observable<User | null> {
    return authState(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  getUid(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  async saveUser(
    email: string,
    firstName: string = "",
    lastName: string = "",
    username: string = "",
    role: UserRole = 'USER',
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user?.uid) {
      throw new Error("No hay usuario autenticado");
    }

    const personRef = ref(this.database, `/users/${user.uid}`);
    const personLibraryRef = ref(this.database, `/library/${user.uid}`);

    const personData = {
      uid: user.uid,
      email: email,
      username: username,
      firstName: firstName,
      lastName: lastName,
      role: role
    };

    await update(personRef, personData);

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    await update(personLibraryRef, { createdAt: formattedDate, games: {} });
  }

  // Método para obtener el perfil del usuario desde Realtime Database
  async getUserProfile(): Promise<any> {
    const user = this.auth.currentUser;
    if (!user) {
      return null;
    }

    const userRef = ref(this.database, `/users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return { uid: user.uid, ...snapshot.val() };
    }
    return null;
  }

  // Método para obtener solo el username
  async getUsername(): Promise<string | null> {
    const userProfile = await this.getUserProfile();
    return userProfile?.username || null;
  }

  // Método para obtener el usuario autenticado con su perfil (incluyendo role)
  getUserWithProfile(): Observable<any | null> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          return this.getUserProfileAsObservable(user.uid);
        }
        return of(null);
      })
    );
  }

  // Método auxiliar para obtener el perfil como observable
  private getUserProfileAsObservable(uid: string): Observable<any | null> {
    const userRef = ref(this.database, `/users/${uid}`);
    return new Observable(subscriber => {
      get(userRef).then(snapshot => {
        if (snapshot.exists()) {
          subscriber.next({ uid, ...snapshot.val() });
        } else {
          subscriber.next(null);
        }
        subscriber.complete();
      }).catch(error => {
        subscriber.error(error);
      });
    });
  }
}
