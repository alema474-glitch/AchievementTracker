import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastInsigniaComponent } from './toast-insignia.component';

describe('ToastInsigniaComponent', () => {
  let component: ToastInsigniaComponent;
  let fixture: ComponentFixture<ToastInsigniaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastInsigniaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToastInsigniaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
