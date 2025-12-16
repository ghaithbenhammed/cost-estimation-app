import { TestBed } from '@angular/core/testing';

import { SacemIndustriesService } from './sacem-industries.service';

describe('SacemIndustriesService', () => {
  let service: SacemIndustriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SacemIndustriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
