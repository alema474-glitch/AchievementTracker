import { TestBed } from '@angular/core/testing';

import { InsigniasService } from './insignias.service';

describe('InsigniasService', () => {
  let service: InsigniasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InsigniasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
