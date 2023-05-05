import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewInternetBankingComponent } from './view-internet-banking.component';

describe('ViewInternetBankingComponent', () => {
  let component: ViewInternetBankingComponent;
  let fixture: ComponentFixture<ViewInternetBankingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewInternetBankingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewInternetBankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
