import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-insignia',
  imports: [CommonModule],
  template: `
    @if (toastService.toast()) {
      <div class="toast-insignia">

        <!-- Barra de progreso animada (auto-dismiss visual) -->
        <div class="toast-progress"></div>

        <!-- Icono decorativo superior -->
        <div class="toast-eyebrow">
          <span class="toast-dot"></span>
          <span class="toast-label">Insignia desbloqueada</span>
        </div>

        <!-- Contenido principal -->
        <div class="toast-main">
          <div class="toast-img-wrap">
            <img [src]="toastService.toast()!.imagen" alt="insignia" class="toast-img" />
            <div class="toast-img-glow"></div>
          </div>
          <div class="toast-body">
            <p class="toast-title">{{ toastService.toast()!.titulo }}</p>
            <p class="toast-desc">{{ toastService.toast()!.descripcion }}</p>
          </div>
        </div>

        <!-- Icono de trofeo decorativo -->
        <div class="toast-trophy">🏅</div>

      </div>
    }
  `,
  styles: [`
    .toast-insignia {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      background: rgb(24, 24, 24);
      border: 1px solid rgba(245, 197, 66, 0.25);
      border-radius: 16px;
      padding: 14px 16px 16px;
      min-width: 290px;
      max-width: 340px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow:
        0 0 0 1px rgba(245, 197, 66, 0.08),
        0 20px 40px rgba(0, 0, 0, 0.5),
        0 0 30px rgba(245, 197, 66, 0.08);
      animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;

      /* Subtle top glow */
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 15%; right: 15%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(245, 197, 66, 0.6), transparent);
      }
    }

    /* Progress bar (purely visual, mirrors toast duration) */
    .toast-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px;
      background: linear-gradient(90deg, #f5c542, #fde68a);
      border-radius: 0 0 16px 16px;
      animation: progress 10s linear forwards;
      transform-origin: left;
    }

    /* Eyebrow row */
    .toast-eyebrow {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .toast-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f5c542;
      box-shadow: 0 0 6px rgba(245, 197, 66, 0.8);
      animation: pulse-dot 1.5s ease-in-out infinite;
      flex-shrink: 0;
    }

    .toast-label {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #f5c542;
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    /* Main row */
    .toast-main {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* Image */
    .toast-img-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .toast-img {
      width: 52px;
      height: 52px;
      object-fit: contain;
      border-radius: 12px;
      background: rgb(20, 20, 20);
      border: 1px solid rgba(245, 197, 66, 0.2);
      display: block;
      position: relative;
      z-index: 1;
    }

    .toast-img-glow {
      position: absolute;
      inset: -6px;
      border-radius: 16px;
      background: radial-gradient(circle, rgba(245, 197, 66, 0.2) 0%, transparent 70%);
      filter: blur(6px);
      z-index: 0;
      animation: glow-pulse 2s ease-in-out infinite;
    }

    /* Text */
    .toast-body {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      line-height: 1.2;
      font-family: 'DM Sans', system-ui, sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-desc {
      font-size: 0.74rem;
      color: rgba(255, 255, 255, 0.45);
      margin: 0;
      line-height: 1.4;
      font-family: 'DM Sans', system-ui, sans-serif;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Decorative trophy */
    .toast-trophy {
      position: absolute;
      top: 12px;
      right: 14px;
      font-size: 1rem;
      opacity: 0.5;
    }

    /* Animations */
    @keyframes slideIn {
      from {
        transform: translateX(calc(100% + 24px));
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes progress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.7); }
    }

    @keyframes glow-pulse {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.9); }
    }

    /* Móvil: sube por encima del bottom nav */
    @media (max-width: 991.98px) {
      .toast-insignia {
        bottom: 76px;
        right: 12px;
        left: 12px;
        max-width: unset;
        min-width: unset;
      }
    }
  `]
})
export class ToastInsigniaComponent {
  toastService = inject(ToastService);
}
