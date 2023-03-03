import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { ListUsersComponent } from './Users/list-users/list-users.component';
import { ViewUserComponent } from './Users/view-user/view-user.component';


// import {ViewProductComponent} from './list-products/view-product/view-product.component';

const routes: Routes = [

  {
    path: 'list-users',
    component: ListUsersComponent
  },

  {
    path: 'users/:id',
    component: ViewUserComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RbacRoutingModule {
}