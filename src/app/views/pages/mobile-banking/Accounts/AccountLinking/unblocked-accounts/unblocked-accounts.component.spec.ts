import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnblockedAccountsComponent } from './unblocked-accounts.component';

describe('UnblockedAccountsComponent', () => {
  let component: UnblockedAccountsComponent;
  let fixture: ComponentFixture<UnblockedAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnblockedAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnblockedAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
