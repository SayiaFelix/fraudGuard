import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IbChannelDashboardComponent } from './ib-channel-dashboard.component';

describe('StarterComponent', () => {
  let component: IbChannelDashboardComponent;
  let fixture: ComponentFixture<IbChannelDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IbChannelDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IbChannelDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
