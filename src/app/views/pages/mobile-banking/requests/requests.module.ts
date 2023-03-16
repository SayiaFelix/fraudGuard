import {NgModule} from '@angular/core';
import {RequestsRoutingModule} from './requests-routing';


import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {ListRequestsComponent} from "./list-requests/list-requests.component";
import {NgSelectModule} from "@ng-select/ng-select";

@NgModule({
  imports: [
    SharedModule,
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
})
export class RequestsModule {
}

