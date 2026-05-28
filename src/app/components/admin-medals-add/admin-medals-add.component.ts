import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InsigniasService } from '../../services/insignias.service';

@Component({
  selector: 'app-admin-medals-add',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-medals-add.component.html',
  styleUrl: './admin-medals-add.component.scss'
})
export class AdminMedalsAddComponent {
  medalForm:FormGroup;
  errorMessage: string = '';

  constructor(formBuilder: FormBuilder, private router: Router, private insigniasService: InsigniasService) {
    this.medalForm = formBuilder.group({
      'title':       ['', [Validators.required]],
      'description': ['', [Validators.required]],
      'image':       ['', [Validators.required]],
      'type':        ['', [Validators.required]],
      'value':       ['', [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]]
    });
  }

  async onSubmit() {
    this.errorMessage = '';
    if (this.medalForm.valid) {
      try {
        const { title, description, image, type, value } = this.medalForm.value;
        await this.insigniasService.addMedal(title, description, image, type, parseInt(value));
        this.router.navigate(['/nav/admin-medals']);
      } catch (error: any) {
        this.errorMessage = 'Error al crear la insignia: ' + error.message;
      }
    }
  }
}
