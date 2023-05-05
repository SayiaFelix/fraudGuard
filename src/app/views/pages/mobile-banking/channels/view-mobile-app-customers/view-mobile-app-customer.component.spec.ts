import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMobileAppCustomerComponent } from './view-mobile-app-customer.component';

describe('ViewProfileComponent', () => {
  let component: ViewMobileAppCustomerComponent;
  let fixture: ComponentFixture<ViewMobileAppCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewMobileAppCustomerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMobileAppCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
