import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProductSubitemComponent } from './add-product-subitem.component';

describe('AddProductSubitemComponent', () => {
  let component: AddProductSubitemComponent;
  let fixture: ComponentFixture<AddProductSubitemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddProductSubitemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddProductSubitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
