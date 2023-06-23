import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewStandardsComponent} from './view-standards.component';
describe('ViewStandardsComponent', () => {
  let component: ViewStandardsComponent;
  let fixture: ComponentFixture<ViewStandardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewStandardsComponent ],
      imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewStandardsComponent);
         // Create instance of login component
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it(`should have a login form 'form'`, waitForAsync(() => {
    expect(component).toContain('form');
  }));
});
