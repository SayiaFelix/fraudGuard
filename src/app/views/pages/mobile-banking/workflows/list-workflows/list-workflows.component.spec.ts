import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListWorkflowsComponent } from './list-workflows.component';

describe('StarterComponent', () => {
  let component: ListWorkflowsComponent;
  let fixture: ComponentFixture<ListWorkflowsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListWorkflowsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListWorkflowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
