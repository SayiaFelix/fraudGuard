import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSubCategoriesAsCardsComponent } from './product-sub-categories-as-cards.component';

describe('StarterComponent', () => {
  let component: ProductSubCategoriesAsCardsComponent;
  let fixture: ComponentFixture<ProductSubCategoriesAsCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductSubCategoriesAsCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSubCategoriesAsCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
