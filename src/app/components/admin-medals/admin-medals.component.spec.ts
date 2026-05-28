import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMedalsComponent } from './admin-medals.component';

describe('AdminMedalsComponent', () => {
  let component: AdminMedalsComponent;
  let fixture: ComponentFixture<AdminMedalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMedalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMedalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
