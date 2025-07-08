import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAsCardsComponent } from './product-as-cards.component';

describe('StarterComponent', () => {
  let component: ProductAsCardsComponent;
  let fixture: ComponentFixture<ProductAsCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductAsCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAsCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
