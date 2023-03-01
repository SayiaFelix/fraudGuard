import {NgModule} from '@angular/core';
import {BranchesRoutingModule} from './branches-routing';


import {ListBranchesComponent} from './list-branches/list-branches.component';
// import {AddProductComponent} from './list-products/add-product/add-product.component';
// import {ViewProductComponent} from './list-products/view-product/view-product.component';
// import {CreateProductComponent} from './list-products/create-product-subitem/create-product.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";


@NgModule({
  imports: [
    SharedModule,
    BranchesRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,

   
  ],
  declarations: [
    ListBranchesComponent,
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
export class BranchesModule {
}