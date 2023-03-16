import {NgModule} from '@angular/core';
import {ProductsRoutingModule} from './products-routing';


import {ProductsComponent} from './list-products-categories/products.component';
import {ViewProductComponent} from "./view-product/view-product.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddProductComponent} from "./add-product/add-product.component";
import { ListProductsComponent } from './list-products/list-products.component';
import { AddProductSubitemComponent } from './add-product-subitem/add-product-subitem.component';
import {AddProductCategoryComponent} from "./add-product-subitem/add-product-category.component";

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
    AddProductComponent,
    ListProductsComponent,
    AddProductSubitemComponent,
    AddProductCategoryComponent,

  ]
  ,
  entryComponents: [
    AddProductComponent,
    AddProductSubitemComponent,
    AddProductCategoryComponent
  ],
})
export class ProductsModule {
}

