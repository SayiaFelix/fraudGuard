import {NgModule} from '@angular/core';
import {WorkflowsRoutingModule} from './workflows-routing';


import {ListWorkflowsComponent} from './list-customers/list-workflows.component';

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddCustomerComponent} from "./add-customer/add-customer.component";

@NgModule({
    imports: [
        SharedModule,
        WorkflowsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule
    ],
  declarations: [
    ListWorkflowsComponent,
    AddCustomerComponent,

    // CreateProductComponent
  ]
  ,
  entryComponents: [
    AddCustomerComponent,
    // CreateProductComponent
  ],
})
export class WorkflowsModule {
}

