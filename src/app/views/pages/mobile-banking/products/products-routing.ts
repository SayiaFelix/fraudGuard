import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ProductCategoriesComponent} from './list-products-categories/product-categories.component';
import { ListProductsComponent } from './list-products/list-products.component';
import {ViewProductComponent} from "./view-product/view-product.component";
import {
  ProductCategoriesAsCardsComponent
} from "./list-products-categories-cards/product-categories-as-cards.component";
import {ProductAsCardsComponent} from "./list-products-as-cards/product-as-cards.component";
import {
  ProductCategoriesComponentRedesigned
} from "./list-products-categories-redesigned/product-categories-component-redesigned.component";
// import {ViewProductComponent} from './list-products/view-customer/view-customer.component';

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
    component:ListProductsComponent
  },
  {
    path: 'list-products-as-cards/:id',
    component: ProductAsCardsComponent
  },

  {
    path: 'product/:id',
    component: ViewProductComponent
  },

  {
    path: 'list-categories-redesigned',
    component: ProductCategoriesComponentRedesigned
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {
}
