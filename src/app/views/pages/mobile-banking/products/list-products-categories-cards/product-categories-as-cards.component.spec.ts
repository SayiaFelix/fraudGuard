import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCategoriesAsCardsComponent } from './product-categories-as-cards.component';

describe('StarterComponent', () => {
  let component: ProductCategoriesAsCardsComponent;
  let fixture: ComponentFixture<ProductCategoriesAsCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductCategoriesAsCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCategoriesAsCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
