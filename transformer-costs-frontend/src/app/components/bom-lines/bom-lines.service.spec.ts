import { TestBed } from '@angular/core/testing';

import { BomLinesService } from './bom-lines.service';

describe('BomLinesService', () => {
  let service: BomLinesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BomLinesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
