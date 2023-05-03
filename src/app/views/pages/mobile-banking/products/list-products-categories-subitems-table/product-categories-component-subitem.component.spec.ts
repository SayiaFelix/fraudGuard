import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCategoriesComponentSubItem } from './product-categories-component-subitem.component';

// import { ProductCategoriesComponentSubItem } from './product-categories-component-redesigned.component';

describe('StarterComponent', () => {
  let component: ProductCategoriesComponentSubItem;
  let fixture: ComponentFixture<ProductCategoriesComponentSubItem>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductCategoriesComponentSubItem ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCategoriesComponentSubItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
