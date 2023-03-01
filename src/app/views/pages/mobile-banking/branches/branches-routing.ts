import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ListBranchesComponent} from './list-branches/list-branches.component';
// import {ViewProductComponent} from './list-products/view-product/view-product.component';

const routes: Routes = [

  {
    path: 'list-branches',
    component: ListBranchesComponent
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
export class BranchesRoutingModule {
}