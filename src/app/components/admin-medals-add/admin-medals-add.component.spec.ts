import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMedalsAddComponent } from './admin-medals-add.component';

describe('AdminMedalsAddComponent', () => {
  let component: AdminMedalsAddComponent;
  let fixture: ComponentFixture<AdminMedalsAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMedalsAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMedalsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
