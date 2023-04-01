import {NgModule} from '@angular/core';
import {WorkflowsRoutingModule} from './workflows-routing';


import {ListWorkflowsComponent} from './list-workflows/list-workflows.component';

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddWorkflowStepComponent} from "./add-workflow-step/add-workflow-step.component";
import {ViewSingleWorkflowComponent} from "./view-single-workflow/view-single-workflow.component";
import { AddCustomerComponent } from './add-customer/add-customer.component';
import {MyTasksComponent} from "./my-tasks/my-tasks.component";
import {AllTasksComponent} from "./all-tasks/all-tasks.component";
import {ViewSingleTaskComponent} from "./view-single-task/view-single-task.component";
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
    ViewSingleWorkflowComponent,
    AddWorkflowStepComponent,
    AddCustomerComponent,
    MyTasksComponent,
    AllTasksComponent,
    ViewSingleTaskComponent
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

