import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ProductsComponent} from './list-products-categories/products.component';
import { ListProductsComponent } from './list-products/list-products.component';
import {ViewProductComponent} from "./view-product/view-product.component";
// import {ViewProductComponent} from './list-products/view-customer/view-customer.component';

const routes: Routes = [

  {
    path: 'list-customers',
    component: ProductsComponent
  },
  {
    path:'list-products/:id',
    component:ListProductsComponent

  },

  {
    path: 'product/:id',
    component: ViewProductComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {
}
