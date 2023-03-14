import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMobileBankingCustomersComponent } from './list-mobile-banking-customers.component';

describe('StarterComponent', () => {
  let component: ListMobileBankingCustomersComponent;
  let fixture: ComponentFixture<ListMobileBankingCustomersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListMobileBankingCustomersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListMobileBankingCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
