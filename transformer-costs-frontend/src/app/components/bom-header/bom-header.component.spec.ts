import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BomHeaderComponent } from './bom-header.component';

describe('BomHeaderComponent', () => {
  let component: BomHeaderComponent;
  let fixture: ComponentFixture<BomHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BomHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BomHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
