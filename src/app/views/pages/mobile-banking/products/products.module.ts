import {NgModule} from '@angular/core';
import {ProductsRoutingModule} from './products-routing';


import {ProductCategoriesComponent} from './list-products-categories/product-categories.component';
import {ViewProductComponent} from "./view-product/view-product.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddProductComponent} from "./add-product/add-product.component";
import { ListProductsComponent } from './list-products/list-products.component';
import {AddProductSubItemComponent} from "./add-product-subitem/add-product-sub-item.component";
import {AddRequirementComponent} from "./add-requirement/add-requirement.component";
import {
  ProductCategoriesAsCardsComponent
} from "./list-products-categories-cards/product-categories-as-cards.component";
import {CarouselModule} from "ngx-owl-carousel-o";

@NgModule({
    imports: [
        SharedModule,
        ProductsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule,
        CarouselModule
    ],
  declarations: [
    ProductCategoriesComponent,
    ProductCategoriesAsCardsComponent,
    ViewProductComponent,
    AddProductComponent,
    ListProductsComponent,
    AddProductSubItemComponent,
    AddRequirementComponent

  ]
  ,
  entryComponents: [
    AddProductComponent,
    AddProductSubItemComponent,
    AddRequirementComponent
  ],
})
export class ProductsModule {
}

