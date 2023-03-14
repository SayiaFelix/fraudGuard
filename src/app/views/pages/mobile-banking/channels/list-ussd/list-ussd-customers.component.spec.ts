import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListUssdCustomersComponent } from './list-ussd-customers.component';

describe('StarterComponent', () => {
  let component: ListUssdCustomersComponent;
  let fixture: ComponentFixture<ListUssdCustomersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListUssdCustomersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListUssdCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
