import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendSmsComponent } from './send-sms.component';

describe('StarterComponent', () => {
  let component: SendSmsComponent;
  let fixture: ComponentFixture<SendSmsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendSmsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendSmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
