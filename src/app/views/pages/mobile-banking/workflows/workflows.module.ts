import {NgModule} from '@angular/core';
import {WorkflowsRoutingModule} from './workflows-routing';


import {ListWorkflowsComponent} from './list-customers/list-workflows.component';

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddWorkflowStepComponent} from "./add-workflow-step/add-workflow-step.component";
import {ViewSingleWorkflowComponent} from "./view-single-workflow/view-single-workflow.component";

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

    // CreateProductComponent
  ]
  ,
  entryComponents: [
    AddWorkflowStepComponent,
    // CreateProductComponent
  ],
})
export class WorkflowsModule {
}

