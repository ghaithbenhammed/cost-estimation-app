import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BomGestionComponent } from './bom-gestion.component';

describe('BomGestionComponent', () => {
  let component: BomGestionComponent;
  let fixture: ComponentFixture<BomGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BomGestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BomGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
