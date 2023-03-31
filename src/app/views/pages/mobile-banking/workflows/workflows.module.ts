import {NgModule} from '@angular/core';
import {WorkflowsRoutingModule} from './workflows-routing';


import {ListWorkflowsComponent} from './list-customers/list-workflows.component';

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddWorkflowStepComponent} from "./add-workflow-step/add-workflow-step.component";
import {ViewSingleWorkflowComponent} from "./view-single-workflow/view-single-workflow.component";
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { ListWorkflowMenuComponent } from './list-workflow-menu/list-workflow-menu.component';
import { NgSelectModule } from '@ng-select/ng-select';
@NgModule({
    imports: [
        SharedModule,
        WorkflowsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule,
        NgSelectModule
    ],
  declarations: [
    ListWorkflowsComponent,
    ViewSingleWorkflowComponent,
    AddWorkflowStepComponent,
    AddCustomerComponent,
    ListWorkflowMenuComponent,
  
    // CreateProductComponent
  ]
  ,
  entryComponents: [
    AddWorkflowStepComponent,
    AddCustomerComponent
    // CreateProductComponent
  ],
})
export class WorkflowsModule {
}

