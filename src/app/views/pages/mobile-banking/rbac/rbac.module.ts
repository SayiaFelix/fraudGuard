import {NgModule} from '@angular/core';
import {RbacRoutingModule} from './rbac-routing';


import {ListUsersComponent} from './Users/list-users/list-users.component';
// import {AddProductComponent} from './list-products/add-product/add-product.component';
// import {ViewProductComponent} from './list-products/view-product/view-product.component';
// import {CreateProductComponent} from './list-products/create-product-subitem/create-product.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import { ViewUserComponent } from './Users/view-user/view-user.component';


@NgModule({
  imports: [
    SharedModule,
    RbacRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,

   
  ],
  declarations: [
    ListUsersComponent,
    ViewUserComponent,
    // AddBranchComponent,
    // ViewBranchComponent,
    // CreateBranchComponent
  ]
  ,
  entryComponents: [
    // AddBranchComponent,
    // CreateBranchComponent
  ],
})
export class RbacModule {
}