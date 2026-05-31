import { Injectable, inject } from '@angular/core';

export interface UserLevel {
  level: number;
  title: string;
  xp: number;
  xpForNext: number;
  xpInLevel: number;
  progress: number; // 0-100
  color: string;
}

/**
 * XP thresholds per level. Each logro conseguido = 10 XP.
 * Level  1:      0 –   99  (need 100)
 * Level  2:    100 –   299  (need 200)
 * Level  3:    300 –   599  (need 300)
 * ...  grows by 100 each level
 */
@Injectable({ providedIn: 'root' })
export class UserLevelService {

  private readonly TITLES = [
    'Novato', 'Aprendiz', 'Explorador', 'Veterano', 'Experto',
    'Maestro', 'Campeón', 'Leyenda', 'Mítico', 'Inmortal'
  ];

  private readonly COLORS = [
    '#94a3b8', // grey   - Novato
    '#60a5fa', // blue   - Aprendiz
    '#34d399', // green  - Explorador
    '#a78bfa', // purple - Veterano
    '#f59e0b', // amber  - Experto
    '#f5c542', // gold   - Maestro
    '#fb923c', // orange - Campeón
    '#f43f5e', // rose   - Leyenda
    '#c084fc', // violet - Mítico
    '#e879f9', // fuchsia- Inmortal
  ];

  /** logrosConseguidos → UserLevel */
  compute(logrosConseguidos: number): UserLevel {
    const xp = logrosConseguidos * 10;
    let level = 1;
    let accumulated = 0;

    while (true) {
      const needed = level * 100;
      if (accumulated + needed > xp) break;
      accumulated += needed;
      level++;
      if (level >= 10) break;
    }

    const xpInLevel = xp - accumulated;
    const xpForNext = level < 10 ? level * 100 : Infinity;
    const progress   = level < 10 ? Math.min(100, Math.round((xpInLevel / xpForNext) * 100)) : 100;
    const titleIdx   = Math.min(level - 1, this.TITLES.length - 1);

    return {
      level, xp,
      title:   this.TITLES[titleIdx],
      color:   this.COLORS[titleIdx],
      xpInLevel, xpForNext,
      progress
    };
  }

  /** XP needed to reach a specific level from scratch */
  xpForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) total += i * 100;
    return total;
  }
}
