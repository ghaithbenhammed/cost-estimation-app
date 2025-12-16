import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturationBomComponent } from './facturation-bom.component';

describe('FacturationBomComponent', () => {
  let component: FacturationBomComponent;
  let fixture: ComponentFixture<FacturationBomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturationBomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturationBomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
