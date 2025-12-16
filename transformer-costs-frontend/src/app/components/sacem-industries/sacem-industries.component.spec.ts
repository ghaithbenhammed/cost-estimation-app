import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SacemIndustriesComponent } from './sacem-industries.component';

describe('SacemIndustriesComponent', () => {
  let component: SacemIndustriesComponent;
  let fixture: ComponentFixture<SacemIndustriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SacemIndustriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SacemIndustriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
