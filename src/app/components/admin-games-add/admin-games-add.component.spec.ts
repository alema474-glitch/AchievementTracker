import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGamesAddComponent } from './admin-games-add.component';

describe('AdminGamesAddComponent', () => {
  let component: AdminGamesAddComponent;
  let fixture: ComponentFixture<AdminGamesAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGamesAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGamesAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
