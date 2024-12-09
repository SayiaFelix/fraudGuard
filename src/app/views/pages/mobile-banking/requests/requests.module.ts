import {NgModule,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {RequestsRoutingModule} from './requests-routing';


import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {ListRequestsComponent} from "./list-requests/list-requests.component";
import {NgSelectModule} from "@ng-select/ng-select";
import { Ng2TelInputModule } from 'ng2-tel-input';

@NgModule({
  imports: [
    SharedModule,
    Ng2TelInputModule,
    RequestsRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,
    TranslateModule,
    NgSelectModule
  ],
  declarations: [
    ListRequestsComponent,
  ]
  ,
  entryComponents: [
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RequestsModule {
}

