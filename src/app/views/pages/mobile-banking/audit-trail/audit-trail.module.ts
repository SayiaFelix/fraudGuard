import {NgModule} from '@angular/core';

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import { ListAuditsComponent } from './list-audits/list-audits.component';
import { AuditTrailRoutingModule } from './audit-trail routing';

@NgModule({
    imports: [
        SharedModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule,
        AuditTrailRoutingModule
    ],
  declarations: [
    ListAuditsComponent,
  ]
  ,
  entryComponents: [
    // AddWorkflowStepComponent,
    // AddCustomerComponent
    // CreateProductComponent
  ],
})
export class AuditTrailModule {
}