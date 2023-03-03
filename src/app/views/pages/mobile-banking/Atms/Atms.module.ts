import {NgModule} from '@angular/core';
// import {AddProductComponent} from './list-products/add-product/add-product.component';
// import {ViewProductComponent} from './list-products/view-product/view-product.component';
// import {CreateProductComponent} from './list-products/create-product-subitem/create-product.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import { ListAtmsComponent } from './list-atms/list-atms.component';
import { AtmsRoutingModule } from './Atms-routing';


@NgModule({
  imports: [
    SharedModule,
    AtmsRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,

   
  ],
  declarations: [
    ListAtmsComponent,
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
export class AtmsModule {
}