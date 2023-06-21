import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstTimeLoginComponent } from './first-time-login.component';

describe('LoginComponent', () => {
  let component: FirstTimeLoginComponent;
  let fixture: ComponentFixture<FirstTimeLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirstTimeLoginComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirstTimeLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
