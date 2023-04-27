import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonsForFailureComponent } from './reasons-for-failure.component';

describe('StarterComponent', () => {
  let component: ReasonsForFailureComponent;
  let fixture: ComponentFixture<ReasonsForFailureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReasonsForFailureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReasonsForFailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
