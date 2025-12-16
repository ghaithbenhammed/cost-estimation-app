import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCoutComponent } from './dashboard-cout.component';

describe('DashboardCoutComponent', () => {
  let component: DashboardCoutComponent;
  let fixture: ComponentFixture<DashboardCoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
