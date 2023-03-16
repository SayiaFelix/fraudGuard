import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockedAccountsComponent } from './blocked-accounts.component';

describe('BlockedAccountsComponent', () => {
  let component: BlockedAccountsComponent;
  let fixture: ComponentFixture<BlockedAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlockedAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlockedAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
