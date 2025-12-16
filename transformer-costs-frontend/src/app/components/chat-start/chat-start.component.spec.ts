import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatStartComponent } from './chat-start.component';

describe('ChatStartComponent', () => {
  let component: ChatStartComponent;
  let fixture: ComponentFixture<ChatStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatStartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
