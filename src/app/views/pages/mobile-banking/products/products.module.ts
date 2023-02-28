import {NgModule} from '@angular/core';
import {ProductsRoutingModule} from './products-routing';


import {ProductsComponent} from './profiles/products.component';
// import {AddProductComponent} from './profiles/add-product/add-product.component';
// import {ViewProductComponent} from './profiles/view-product/view-product.component';
// import {CreateProductComponent} from './profiles/create-product-subitem/create-product.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";

@NgModule({
  imports: [
    SharedModule,
    ProductsRoutingModule,
    FeatherIconModule,
    NgxDatatableModule
  ],
  declarations: [
    ProductsComponent,
    // AddProductComponent,
    // ViewProductComponent,
    // CreateProductComponent
  ]
  ,
  entryComponents: [
    // AddProductComponent,
    // CreateProductComponent
  ],
})
export class ProductsModule {
}

