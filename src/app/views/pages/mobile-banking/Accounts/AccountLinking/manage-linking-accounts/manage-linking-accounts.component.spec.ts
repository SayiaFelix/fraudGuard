import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLinkingAccountsComponent } from './manage-linking-accounts.component';

describe('ManageLinkingAccountsComponent', () => {
  let component: ManageLinkingAccountsComponent;
  let fixture: ComponentFixture<ManageLinkingAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageLinkingAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageLinkingAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
