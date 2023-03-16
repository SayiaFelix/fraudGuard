import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRegisteredAccountsComponent } from './list-registered-accounts.component';

describe('ListRegisteredAccountsComponent', () => {
  let component: ListRegisteredAccountsComponent;
  let fixture: ComponentFixture<ListRegisteredAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListRegisteredAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListRegisteredAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
