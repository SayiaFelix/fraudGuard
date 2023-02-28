import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ProductsComponent} from './list-products/products.component';
// import {ViewProductComponent} from './list-products/view-product/view-product.component';

const routes: Routes = [

  {
    path: 'list-products',
    component: ProductsComponent
  },

  // {
  //   path: 'product/:id',
  //   component: ViewProductComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {
}
