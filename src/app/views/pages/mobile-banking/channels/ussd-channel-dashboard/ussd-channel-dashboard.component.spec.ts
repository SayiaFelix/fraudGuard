import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UssdChannelDashboardComponent } from './ussd-channel-dashboard.component';

describe('StarterComponent', () => {
  let component: UssdChannelDashboardComponent;
  let fixture: ComponentFixture<UssdChannelDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UssdChannelDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UssdChannelDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
