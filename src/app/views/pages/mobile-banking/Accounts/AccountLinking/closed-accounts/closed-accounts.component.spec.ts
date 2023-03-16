import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosedAccountsComponent } from './closed-accounts.component';

describe('ClosedAccountsComponent', () => {
  let component: ClosedAccountsComponent;
  let fixture: ComponentFixture<ClosedAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClosedAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClosedAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
