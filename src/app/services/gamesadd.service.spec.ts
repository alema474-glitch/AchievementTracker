import { TestBed } from '@angular/core/testing';

import { GamesaddService } from './gamesadd.service';

describe('GamesaddService', () => {
  let service: GamesaddService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GamesaddService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
