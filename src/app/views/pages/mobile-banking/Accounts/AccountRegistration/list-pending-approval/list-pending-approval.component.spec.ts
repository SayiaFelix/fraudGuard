import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPendingApprovalComponent } from './list-pending-approval.component';

describe('ListPendingApprovalComponent', () => {
  let component: ListPendingApprovalComponent;
  let fixture: ComponentFixture<ListPendingApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListPendingApprovalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPendingApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
