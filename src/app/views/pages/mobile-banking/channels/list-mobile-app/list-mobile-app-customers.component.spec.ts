import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMobileAppCustomersComponent } from './list-mobile-app-customers.component';

describe('StarterComponent', () => {
  let component: ListMobileAppCustomersComponent;
  let fixture: ComponentFixture<ListMobileAppCustomersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListMobileAppCustomersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListMobileAppCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
