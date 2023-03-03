import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ListAtmsComponent} from './list-atms/list-atms.component';
// import {ViewProductComponent} from './list-products/view-product/view-product.component';

const routes: Routes = [

  {
    path: 'list-atms',
    component: ListAtmsComponent
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
export class AtmsRoutingModule {
}