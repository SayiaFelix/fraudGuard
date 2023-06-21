import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';


import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandingComponent } from './landing.component';

describe('LoginComponent', () => {
  let landingComponent: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LandingComponent ],
      imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingComponent);
         // Create instance of login component
    landingComponent = fixture.componentInstance;
    fixture.detectChanges();
  });
  it(`should have a login form 'form'`, waitForAsync(() => {
    expect(landingComponent).toContain('form');
  }));
});
