import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BomLinesComponent } from './bom-lines.component';

describe('BomLinesComponent', () => {
  let component: BomLinesComponent;
  let fixture: ComponentFixture<BomLinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BomLinesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BomLinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
