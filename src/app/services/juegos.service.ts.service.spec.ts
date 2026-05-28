import { TestBed } from '@angular/core/testing';

import { JuegosServiceTsService } from './juegos.service.ts.service';

describe('JuegosServiceTsService', () => {
  let service: JuegosServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JuegosServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
