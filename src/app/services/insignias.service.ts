import { Injectable } from '@angular/core';
import { Database, ref, objectVal, update, push } from '@angular/fire/database';
import { Observable, map, of, switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';
import { Insignia } from '../models/insignias.module';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class InsigniasService {
  constructor(private db: Database, private auth: AuthService, private toastService: ToastService) { }

  getUid(): string | null {
    return this.auth.getUid();
  }

  // Obtener todas las insignias
  getAllMedals(): Observable<Insignia[]> {
    const medalsRef = ref(this.db, '/medal');
    return objectVal<Record<string, any> | null>(medalsRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.keys(res).map(id => ({
          id,
          titulo: res[id].titulo,
          descripcion: res[id].descripcion,
          imagen: res[id].imagen,
          tipo: res[id].tipo,
          valor: res[id].valor
        }));
      })
    );
  }

  // Obtener insignias del usuario
  getMedalsUser(): Observable<{ medal: Insignia, conseguido: boolean }[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);

    return this.getAllMedals().pipe(
      switchMap(medals => {
        const userRef = ref(this.db, `/medalUser/${uid}`);
        return objectVal<Record<string, any> | null>(userRef).pipe(
          map(userRes => medals.map(m => ({
            medal: m,
            conseguido: userRes ? !!userRes[m.id]?.conseguido : false
          })))
        );
      })
    );
  }

  // Agregar una nueva insignia (ID generado por Firebase)
  async addMedal(titulo: string, descripcion: string, imagen: string, tipo: string, valor: number): Promise<string> {
    const medalsRef = ref(this.db, '/medal');
    const newRef = await push(medalsRef, {
      titulo,
      descripcion,
      imagen,
      tipo,
      valor
    });
    return newRef.key!; // devuelve el ID generado por Firebase
  }

  // Marcar una insignia como conseguida
  async unlockMedal(idMedal: string) {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('Usuario no autenticado');

    const refPath = ref(this.db, `/medalUser/${uid}/${idMedal}`);
    await update(refPath, { conseguido: true, fecha: new Date().toISOString() });
  }

  // Bloquear una insignia (si el usuario ya no cumple el requisito)
  async lockMedal(idMedal: string) {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('Usuario no autenticado');

    const refPath = ref(this.db, `/medalUser/${uid}/${idMedal}`);
    await update(refPath, { conseguido: false, fecha: null });
  }

  // Evaluar y desbloquear/bloquear automáticamente según progreso
  evaluateMedals(totalLogros: number, totalJuegos: number) {
    const uid = this.auth.getUid();
    if (!uid) {
      console.log('Usuario no autenticado, no se pueden evaluar insignias.');
      return;
    }

    this.getMedalsUser().pipe(take(1)).subscribe(medals => {
      medals.forEach(({ medal: m, conseguido }) => {

        let cumpleRequisito = false;

        if (m.tipo === 'cantidad' && totalLogros >= m.valor) {
          cumpleRequisito = true;
        }

        if (m.tipo === 'juego' && totalJuegos >= m.valor) {
          cumpleRequisito = true;
        }

        if (cumpleRequisito && !conseguido) {
          // Cumple el requisito pero no la tiene = desbloquear
          this.unlockMedal(m.id).then(() => {
            this.toastService.mostrar({   // disparar toast
              titulo: m.titulo,
              descripcion: m.descripcion,
              imagen: m.imagen
            });
          }).catch(err => console.error(`Error desbloqueando ${m.id}:`, err));

        } else if (!cumpleRequisito && conseguido) {
          // No cumple el requisito pero la tiene = bloquear
          this.lockMedal(m.id).then(() => {
            console.log(`Insignia ${m.id} bloqueada`);
          }).catch(err => console.error(`Error bloqueando ${m.id}:`, err));
        }
        // Si ambos coinciden no se hace nada
      });
    });
  }

}
