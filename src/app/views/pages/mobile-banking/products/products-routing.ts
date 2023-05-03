import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ProductCategoriesComponent} from './list-products-categories/product-categories.component';
import { ListProductsComponent } from './list-products/list-products.component';
import {ViewProductComponent} from "./view-product/view-product.component";
import {
  ProductCategoriesAsCardsComponent
} from "./list-products-categories-cards/product-categories-as-cards.component";
import {ProductAsCardsComponent} from "./list-products-as-cards/product-as-cards.component";
import { ViewCategoriesComponent } from './view-categories/view-categories.component';
import { ListAllProductsAsCardsComponent } from './list-all-products-as-cards/list-all-products-as-cards.component';
import {
  ProductSubCategoriesAsCardsComponent
} from "./list-products-subcategories-cards/product-sub-categories-as-cards.component";

const routes: Routes = [

  {
    path: 'list-categories',
    component: ProductCategoriesComponent
  },
  {
    path: 'list-categories-as-cards',
    component: ProductCategoriesAsCardsComponent
  },
  {
    path:'list-products/:id',
    component:ViewCategoriesComponent
  },

  {
    path:'list-products',
    component:ListProductsComponent
  },
  {
    path: 'list-products-as-cards/:id',
    component: ProductAsCardsComponent
  },
  {
    path: 'list-all-products-as-cards',
    component: ListAllProductsAsCardsComponent
  },
  {
    path: 'list-categories-cards-subcategories/:id',
    component: ProductSubCategoriesAsCardsComponent
  },

  {
    path: 'product/:categoryId/:id',
    component: ViewProductComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {
}
