import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAtmsComponent } from './add-atms.component';

describe('AddProfileComponent', () => {
  let component: AddAtmsComponent;
  let fixture: ComponentFixture<AddAtmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAtmsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAtmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
