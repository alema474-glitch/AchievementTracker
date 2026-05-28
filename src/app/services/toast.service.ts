import { Injectable, signal } from '@angular/core';

export interface ToastInsignia {
  titulo: string;
  descripcion: string;
  imagen: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<ToastInsignia | null>(null);

  mostrar(insignia: ToastInsignia) {
    this.toast.set(insignia);
    this.playSound();
    setTimeout(() => this.toast.set(null), 10000); // desaparece a los 10s
  }

  private playSound() {
    const audio = new Audio('assets/sounds/unlockMedal.mp3');
    audio.volume = 0.5; // 0.0 a 1.0
    audio.play();
  }
}
