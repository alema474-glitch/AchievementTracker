import { Component, signal, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface OnboardingStep {
  icon:  string;
  title: string;
  desc:  string;
  color: string;
  action?: { label: string; route: string };
}

@Component({
  selector: 'app-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent {
  private router = inject(Router);

  dismissed = output<void>();

  step = signal(0);

  readonly steps: OnboardingStep[] = [
    {
      icon:  'bi-trophy-fill',
      title: '¡Bienvenido a Achievement Tracker!',
      desc:  'Tu hub personal para gestionar logros de Steam, competir con amigos y subir de nivel como jugador.',
      color: '#f5c542',
    },
    {
      icon:  'bi-controller',
      title: 'Importa tus juegos',
      desc:  'Añade los juegos de tu biblioteca de Steam. El sistema importa automáticamente todos sus logros.',
      color: 'var(--accent-soft)',
      action: { label: 'Añadir primer juego', route: '/nav/games/add' }
    },
    {
      icon:  'bi-people-fill',
      title: 'Conecta con amigos',
      desc:  'Busca amigos por username, compara progreso, reta a conseguir logros y sube en el ranking.',
      color: '#a78bfa',
      action: { label: 'Buscar amigos', route: '/nav/friends' }
    },
    {
      icon:  'bi-shield-fill-check',
      title: 'Sube de nivel',
      desc:  'Cada logro conseguido suma XP. Pasa de Novato a Inmortal y consigue insignias exclusivas.',
      color: '#34d399',
      action: { label: 'Ver mi perfil', route: '/nav/profile' }
    },
  ];

  get currentStep() { return this.steps[this.step()]; }
  get isLast()      { return this.step() === this.steps.length - 1; }
  get progress()    { return ((this.step() + 1) / this.steps.length) * 100; }

  next() {
    if (this.isLast) { this.finish(); return; }
    this.step.set(this.step() + 1);
  }

  prev()   { if (this.step() > 0) this.step.set(this.step() - 1); }
  skip()   { this.finish(); }

  goAction(route: string) {
    this.finish();
    this.router.navigate([route]);
  }

  finish() { this.dismissed.emit(); }
}
