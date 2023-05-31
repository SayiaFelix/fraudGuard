import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveAccountComponent } from './approve-account.component';

describe('AddAccountComponent', () => {
  let component: ApproveAccountComponent;
  let fixture: ComponentFixture<ApproveAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveAccountComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
