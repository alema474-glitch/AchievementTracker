import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GamesaddService {
  private apiUrl = "https://proyectofinaldam-achievementtracker-c89z.onrender.com/api/admin"; // ruta base de admin routes

  constructor(private http: HttpClient) {}

  importGame(appId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/import-game/${appId}`, {});
  }
}
