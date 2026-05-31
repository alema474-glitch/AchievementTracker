import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private auth = inject(AuthService);
  isLoggedIn = signal(false);

  ngOnInit() {
    this.auth.getUserWithProfile().subscribe(u => this.isLoggedIn.set(!!u));
  }
}
