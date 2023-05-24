import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFailedApprovalComponent } from './list-failed-approval.component';

describe('ListPendingApprovalComponent', () => {
  let component: ListFailedApprovalComponent;
  let fixture: ComponentFixture<ListFailedApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListFailedApprovalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListFailedApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
