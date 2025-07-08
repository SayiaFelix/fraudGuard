import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRoleModalComponent } from './delete-role-modal.component';

describe('ChangeProfileModalComponent', () => {
  let component: DeleteRoleModalComponent;
  let fixture: ComponentFixture<DeleteRoleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteRoleModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteRoleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
