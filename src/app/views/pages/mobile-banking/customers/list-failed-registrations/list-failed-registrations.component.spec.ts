import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFailedRegistrationsComponent } from './list-failed-registrations.component';

describe('StarterComponent', () => {
  let component: ListFailedRegistrationsComponent;
  let fixture: ComponentFixture<ListFailedRegistrationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListFailedRegistrationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFailedRegistrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
