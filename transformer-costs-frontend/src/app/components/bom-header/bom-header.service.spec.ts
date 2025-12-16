import { TestBed } from '@angular/core/testing';

import { BomHeaderService } from './bom-header.service';

describe('BomHeaderService', () => {
  let service: BomHeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BomHeaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
