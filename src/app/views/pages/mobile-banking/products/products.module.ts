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
import {ProductAsCardsComponent} from "./list-products-as-cards/product-as-cards.component";
import {PerfectScrollbarModule} from "ngx-perfect-scrollbar";
import {
  ProductCategoriesComponentSubItem
} from "./list-products-categories-subitems-table/product-categories-component-subitem.component";
import { ViewCategoriesComponent } from './view-categories/view-categories.component';
import { ListAllProductsAsCardsComponent } from './list-all-products-as-cards/list-all-products-as-cards.component';
import {
  ProductSubCategoriesAsCardsComponent
} from "./list-products-subcategories-cards/product-sub-categories-as-cards.component";
import { AddBenefitComponent } from './add-benefit/add-benefit.component';
import {NgxPaginationModule} from "ngx-pagination";


@NgModule({
    imports: [
        SharedModule,
        ProductsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule,
        CarouselModule,
        PerfectScrollbarModule,
        NgxPaginationModule
    ],
  declarations: [
    ProductCategoriesComponent,
    ProductCategoriesAsCardsComponent,
    ProductAsCardsComponent,
    ViewProductComponent,
    ViewCategoriesComponent,
    AddProductComponent,
    ListProductsComponent,
    AddProductSubItemComponent,
    AddRequirementComponent,
    ProductCategoriesComponentSubItem,
    ListAllProductsAsCardsComponent,
    ProductSubCategoriesAsCardsComponent,
    AddBenefitComponent
    
  ]
  ,
  entryComponents: [
    AddProductComponent,
    AddProductSubItemComponent,
    AddRequirementComponent,
    AddBenefitComponent
  ],
})
export class ProductsModule {
}

