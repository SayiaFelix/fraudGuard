import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppChannelDashboardComponent } from './app-channel-dashboard.component';

describe('StarterComponent', () => {
  let component: AppChannelDashboardComponent;
  let fixture: ComponentFixture<AppChannelDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppChannelDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppChannelDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
