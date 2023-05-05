import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRequirementComponent } from './add-requirement.component';

describe('AddRoleComponent', () => {
  let component: AddRequirementComponent;
  let fixture: ComponentFixture<AddRequirementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRequirementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
