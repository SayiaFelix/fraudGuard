import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCategoriesComponentRedesigned } from './product-categories-component-redesigned.component';

describe('StarterComponent', () => {
  let component: ProductCategoriesComponentRedesigned;
  let fixture: ComponentFixture<ProductCategoriesComponentRedesigned>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductCategoriesComponentRedesigned ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCategoriesComponentRedesigned);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
