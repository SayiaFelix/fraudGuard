import {NgModule} from '@angular/core';
import {ProductsRoutingModule} from './products-routing';


import {ProductsComponent} from './list-products/products.component';
import {ViewProductComponent} from "./view-product/view-product.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";

@NgModule({
    imports: [
        SharedModule,
        ProductsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule
    ],
  declarations: [
    ProductsComponent,
    ViewProductComponent,
    // AddProductComponent,
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

