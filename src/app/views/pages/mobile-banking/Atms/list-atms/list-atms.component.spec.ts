import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAtmsComponent } from './list-atms.component';

describe('ListAtmsComponent', () => {
  let component: ListAtmsComponent;
  let fixture: ComponentFixture<ListAtmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListAtmsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAtmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
