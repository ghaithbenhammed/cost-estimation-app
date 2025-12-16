import { TestBed } from '@angular/core/testing';

import { CustomerCardService } from './customer-card.service';

describe('CustomerCardService', () => {
  let service: CustomerCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
