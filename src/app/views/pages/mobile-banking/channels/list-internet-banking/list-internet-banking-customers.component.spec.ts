import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListInternetBankingCustomersComponent } from './list-internet-banking-customers.component';

describe('StarterComponent', () => {
  let component: ListInternetBankingCustomersComponent;
  let fixture: ComponentFixture<ListInternetBankingCustomersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListInternetBankingCustomersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListInternetBankingCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
