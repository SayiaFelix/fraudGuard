import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccReasonsForFailureComponent } from './acc-reasons-for-failure.component';

describe('StarterComponent', () => {
  let component: AccReasonsForFailureComponent;
  let fixture: ComponentFixture<AccReasonsForFailureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccReasonsForFailureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccReasonsForFailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
