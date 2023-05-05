import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListWorkflowMenuComponent } from './list-workflow-menu.component';

describe('ListWorkflowMenuComponent', () => {
  let component: ListWorkflowMenuComponent;
  let fixture: ComponentFixture<ListWorkflowMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListWorkflowMenuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListWorkflowMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
