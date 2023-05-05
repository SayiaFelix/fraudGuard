import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWorkflowStepComponent } from './add-workflow-step.component';

describe('AddRoleComponent', () => {
  let component: AddWorkflowStepComponent;
  let fixture: ComponentFixture<AddWorkflowStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddWorkflowStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWorkflowStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
