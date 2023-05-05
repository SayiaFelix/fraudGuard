import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAllProductsAsCardsComponent } from './list-all-products-as-cards.component';

describe('ListAllProductsAsCardsComponent', () => {
  let component: ListAllProductsAsCardsComponent;
  let fixture: ComponentFixture<ListAllProductsAsCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListAllProductsAsCardsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAllProductsAsCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
