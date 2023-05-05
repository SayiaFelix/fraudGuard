import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewLinkedAccountsComponent } from './new-linked-accounts.component';

describe('NewLinkedAccountsComponent', () => {
  let component: NewLinkedAccountsComponent;
  let fixture: ComponentFixture<NewLinkedAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewLinkedAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewLinkedAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
