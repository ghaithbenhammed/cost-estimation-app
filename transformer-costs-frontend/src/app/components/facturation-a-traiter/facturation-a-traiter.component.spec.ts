import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturationATraiterComponent } from './facturation-a-traiter.component';

describe('FacturationATraiterComponent', () => {
  let component: FacturationATraiterComponent;
  let fixture: ComponentFixture<FacturationATraiterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturationATraiterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturationATraiterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
