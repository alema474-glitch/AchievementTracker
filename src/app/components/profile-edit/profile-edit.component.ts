import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Database, ref, update } from '@angular/fire/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  private auth = inject(AuthService);
  private db = inject(Database);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  success = signal(false);
  error = signal('');

  form = {
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    photoURL: ''
  };

  originalUsername = '';

  readonly AVATAR_PRESETS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=gamer1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=player2',
    'https://api.dicebear.com/7.x/bottts/svg?seed=hero3',
    'https://api.dicebear.com/7.x/bottts/svg?seed=knight4',
    'https://api.dicebear.com/7.x/bottts/svg?seed=wizard5',
    'https://api.dicebear.com/7.x/bottts/svg?seed=archer6',
    'https://api.dicebear.com/7.x/bottts/svg?seed=mage7',
    'https://api.dicebear.com/7.x/bottts/svg?seed=ranger8',
  ];

  async ngOnInit() {
    const profile = await this.auth.getUserProfile();
    if (profile) {
      this.form.username = profile.username || '';
      this.form.firstName = profile.firstName || '';
      this.form.lastName = profile.lastName || '';
      this.form.bio = profile.bio || '';
      this.form.photoURL = profile.photoURL || '';
      this.originalUsername = profile.username || '';
    }
    this.loading.set(false);
  }

  selectAvatar(url: string) {
    this.form.photoURL = url;
  }

  async save() {
    const uid = this.auth.getUid();
    if (!uid) return;
    if (!this.form.username.trim()) {
      this.error.set('El username es obligatorio');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      const userRef = ref(this.db, `/users/${uid}`);
      await update(userRef, {
        username: this.form.username.trim(),
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        bio: this.form.bio.trim(),
        photoURL: this.form.photoURL
      });
      this.success.set(true);
      setTimeout(() => this.success.set(false), 3000);
    } catch (e: any) {
      this.error.set('Error al guardar: ' + e.message);
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/nav/home']);
  }
}
