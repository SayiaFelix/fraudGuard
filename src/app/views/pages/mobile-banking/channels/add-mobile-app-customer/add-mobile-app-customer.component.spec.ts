import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMobileAppCustomerComponent } from './add-mobile-app-customer.component';

describe('AddRoleComponent', () => {
  let component: AddMobileAppCustomerComponent;
  let fixture: ComponentFixture<AddMobileAppCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddMobileAppCustomerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMobileAppCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
